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

  async createCart(input: { lines: { sku: string; quantity: number }[] }) {
    const skus = input.lines.map((l) => l.sku);
    const products = await this.catalog.findProductsBySkus(skus);

    if (products.length !== skus.length) {
      throw new BadRequestException({ code: 'INVALID_SKU', message: 'One or more SKUs do not exist' });
    }

    const unpublished = products.filter((p) => p.status !== 'PUBLISHED');
    if (unpublished.length > 0) {
      throw new BadRequestException({ code: 'PRODUCT_NOT_AVAILABLE', message: 'One or more products are not available' });
    }

    const cart = await this.prisma.cart.create({
      data: {
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await this.prisma.cartLine.createMany({
      data: input.lines.map((l) => ({
        cartId: cart.id,
        sku: l.sku,
        quantity: l.quantity,
      })),
    });

    return this.findCartWithLines(cart.id);
  }

  async updateCart(cartId: string, input: { lines: { sku: string; quantity: number }[] }) {
    const cart = await this.prisma.cart.findUnique({ where: { id: cartId } });

    if (!cart) {
      throw new NotFoundException({ code: 'CART_NOT_FOUND', message: 'Cart not found' });
    }

    if (cart.status !== 'ACTIVE') {
      throw new BadRequestException({ code: 'CART_NOT_ACTIVE', message: 'Cart is not active' });
    }

    const skus = input.lines.map((l) => l.sku);
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
      data: input.lines.map((l) => ({
        cartId,
        sku: l.sku,
        quantity: l.quantity,
      })),
    });

    return this.findCartWithLines(cartId);
  }

  async getCart(cartId: string) {
    return this.findCartWithLines(cartId);
  }

  async quoteCart(cartId: string) {
    const cart = await this.findCartWithLines(cartId);

    if (!cart) {
      throw new NotFoundException({ code: 'CART_NOT_FOUND', message: 'Cart not found' });
    }

    const skus = cart.lines.map((l) => l.sku);
    const products = await this.catalog.findProductsBySkus(skus);
    const productMap = new Map(products.map((p) => [p.sku, p]));

    const pricedLines = cart.lines.map((line) => {
      const product = productMap.get(line.sku);
      return {
        sku: line.sku,
        quantity: line.quantity,
        unitPriceMinor: product?.priceMinor ?? 0n,
        productName: product?.name ?? '',
      };
    });

    const totals = calculateTotals(
      pricedLines.map((l) => ({
        unitAmountMinor: l.unitPriceMinor,
        quantity: l.quantity,
      })),
      { rateBps: 0 },
    );

    return {
      lines: pricedLines,
      totalMinor: totals.totalMinor,
      currency: totals.currency,
    };
  }
}
