import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CartService } from '../cart/cart.service';
import { InventoryService } from '../inventory/inventory.service';
import { calculateTotals } from '@margen/domain';
import { InputJsonValue } from '@prisma/client/runtime/library';
import type { CreateOrder } from '@margen/contracts';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cartService: CartService,
    private readonly inventoryService: InventoryService,
  ) {}

  async createOrder(input: CreateOrder) {
    const { cartId, lines, shippingAddress, idempotencyKey, invoiceType } = input;

    const existing = await this.prisma.order.findUnique({ where: { idempotencyKey } });
    if (existing) {
      return { id: existing.id, publicId: existing.publicId, status: existing.status, totalMinor: existing.totalMinor };
    }

    const cart = await this.prisma.cart.findUnique({ where: { id: cartId } });
    if (!cart) {
      throw new NotFoundException({ code: 'CART_NOT_FOUND', message: 'Cart not found' });
    }
    if (cart.status !== 'ACTIVE') {
      throw new BadRequestException({ code: 'CART_NOT_ACTIVE', message: 'Cart is no longer active' });
    }

    const quote = await this.cartService.quoteCart(cartId);
    const productMap = new Map(quote.lines.map((l) => [l.sku, l]));

    const orderLines = lines.map((line) => {
      const quoted = productMap.get(line.sku);
      if (!quoted) {
        throw new BadRequestException({ code: 'SKU_NOT_IN_CART', message: `SKU ${line.sku} not found in cart` });
      }
      return {
        sku: line.sku,
        productName: quoted.productName,
        quantity: line.quantity,
        unitAmountMinor: quoted.unitPriceMinor,
        discountAmountMinor: 0n,
        taxAmountMinor: 0n,
        snapshot: { sku: line.sku, name: quoted.productName, priceMinor: quoted.unitPriceMinor },
      };
    });

    const totals = calculateTotals(
      orderLines.map((l) => ({
        unitAmountMinor: l.unitAmountMinor,
        quantity: l.quantity,
      })),
      { rateBps: 0 },
    );

    const publicId = crypto.randomUUID();

    const order = await this.prisma.order.create({
      data: {
        publicId,
        status: 'CREATED',
        currency: 'PEN',
        subtotalMinor: totals.subtotalMinor,
        discountMinor: totals.discountMinor,
        taxMinor: totals.taxMinor,
        totalMinor: totals.totalMinor,
        taxRateBps: 0,
        shippingAddress: shippingAddress as unknown as InputJsonValue,
        idempotencyKey,
      },
    });

    await this.prisma.orderLine.createMany({
      data: orderLines.map((l) => ({
        orderId: order.id,
        sku: l.sku,
        productName: l.productName,
        quantity: l.quantity,
        unitAmountMinor: l.unitAmountMinor,
        discountAmountMinor: l.discountAmountMinor,
        taxAmountMinor: l.taxAmountMinor,
        snapshot: l.snapshot as unknown as InputJsonValue,
      })),
    });

    await this.prisma.cart.update({ where: { id: cartId }, data: { status: 'CONVERTED' } });

    const reservation = await this.inventoryService.reserveStock({
      orderId: order.id,
      lines: lines.map((l) => ({ sku: l.sku, quantity: l.quantity })),
    });

    if (reservation.status === 'insufficient_stock') {
      throw new BadRequestException({ code: 'INSUFFICIENT_STOCK', message: 'Insufficient stock for one or more items', details: reservation.details });
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'PENDING_PAYMENT' },
    });

    this.logger.log(`Order ${order.id} created (${invoiceType}) from cart ${cartId}, total: ${totals.totalMinor}`);

    return { id: updated.id, publicId: updated.publicId, status: 'pending_payment' as const, totalMinor: updated.totalMinor };
  }

  async getOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { lines: true },
    });
    if (!order) {
      throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });
    }
    return order;
  }
}
