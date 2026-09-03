import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CatalogService } from '../catalog/catalog.service';
import { calculateTotals } from '@margen/domain';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogService,
  ) {}

  private async findCartWithLines(cartId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { id: cartId } });
    if (!cart) return null;
    const lines = await this.prisma.cartLine.findMany({ where: { cartId } });
    return { ...cart, lines };
  }

  private async findUserActiveCart(userId: string) {
    return this.prisma.cart.findFirst({
      where: { userId, status: 'ACTIVE' },
    });
  }

  async createCart(userId: string, input: { lines: { sku: string; quantity: number }[] }) {
    const cart = await this.findUserActiveCart(userId) ?? await this.prisma.cart.create({
      data: {
        userId,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await this.upsertLines(cart.id, input.lines);

    return this.findCartWithLines(cart.id);
  }

  async updateCart(userId: string, cartId: string, input: { lines: { sku: string; quantity: number }[] }) {
    const cart = await this.prisma.cart.findUnique({ where: { id: cartId } });

    if (!cart) {
      throw new NotFoundException({ code: 'CART_NOT_FOUND', message: 'Cart not found' });
    }

    if (cart.userId !== userId) {
      throw new NotFoundException({ code: 'CART_NOT_FOUND', message: 'Cart not found' });
    }

    if (cart.status !== 'ACTIVE') {
      throw new BadRequestException({ code: 'CART_NOT_ACTIVE', message: 'Cart is not active' });
    }

    await this.upsertLines(cartId, input.lines);

    return this.findCartWithLines(cartId);
  }

  async getUserCart(userId: string) {
    const cart = await this.findUserActiveCart(userId);
    if (!cart) return { id: null, lines: [] };
    return this.findCartWithLines(cart.id);
  }

  async getCart(userId: string, cartId: string) {
    const cart = await this.findCartWithLines(cartId);
    if (!cart) return null;
    if (cart.userId !== userId) {
      throw new NotFoundException({ code: 'CART_NOT_FOUND', message: 'Cart not found' });
    }
    return cart;
  }

  async quoteCart(userId: string, cartId: string) {
    const cart = await this.getCart(userId, cartId);

    if (!cart) {
      throw new NotFoundException({ code: 'CART_NOT_FOUND', message: 'Cart not found' });
    }

    const skus = cart.lines.map((l) => l.sku);
    const products = await this.catalog.findProductsBySkus(skus);
    const productMap = new Map(products.map((p) => [p.sku, p]));

    const pricedLines = cart.lines.map((line) => {
      const product = productMap.get(line.sku);
      const unitPriceMinor = product?.priceMinor ?? 0n;
      return {
        sku: line.sku,
        quantity: line.quantity,
        unitPriceMinor: unitPriceMinor.toString(),
        productName: product?.name ?? '',
        lineTotalMinor: (unitPriceMinor * BigInt(line.quantity)).toString(),
      };
    });

    const totals = calculateTotals(
      pricedLines.map((l) => ({
        unitAmountMinor: BigInt(l.unitPriceMinor),
        quantity: l.quantity,
      })),
      { rateBps: 0 },
    );

    return {
      id: cart.id,
      lines: pricedLines,
      subtotalMinor: totals.totalMinor.toString(),
      totalMinor: totals.totalMinor.toString(),
      currency: totals.currency,
    };
  }

  private async upsertLines(cartId: string, lines: { sku: string; quantity: number }[]) {
    const skus = lines.map((l) => l.sku);
    const products = await this.catalog.findProductsBySkus(skus);

    if (products.length !== skus.length) {
      throw new BadRequestException({ code: 'INVALID_SKU', message: 'One or more SKUs do not exist' });
    }

    const unpublished = products.filter((p) => p.status !== 'PUBLISHED');
    if (unpublished.length > 0) {
      throw new BadRequestException({ code: 'PRODUCT_NOT_AVAILABLE', message: 'One or more products are not available' });
    }

    await this.prisma.cartLine.deleteMany({ where: { cartId } });

    await this.prisma.cartLine.createMany({
      data: lines.map((l) => ({
        cartId,
        sku: l.sku,
        quantity: l.quantity,
      })),
    });
  }
}

// ZZZ_MARKER