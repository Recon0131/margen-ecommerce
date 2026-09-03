import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { Page, ProductSummary, ProductDetail, CategorySummary } from './catalog.schemas';

type ProductImage = { url: string; alt: string };

export function toProductImages(value: Prisma.JsonValue): ProductImage[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is ProductImage =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as Record<string, unknown>).url === 'string' &&
      typeof (item as Record<string, unknown>).alt === 'string',
  );
}

@Injectable()
export class CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: { page: number; limit: number; category?: string; query?: string }): Promise<Page<ProductSummary>> {
    const { page, limit, category, query } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { status: 'PUBLISHED' };

    if (category) {
      const cat = await this.prisma.category.findUnique({ where: { slug: category } });
      if (!cat) {
        return { items: [], total: 0, page, limit, source: 'database' };
      }
      where.categoryId = cat.id;
    }

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { category: { select: { slug: true } } },
      }),
      this.prisma.product.count({ where }),
    ]);

    const items: ProductSummary[] = products.map((p) => ({
      id: p.id,
      slug: p.slug,
      sku: p.sku,
      name: p.name,
      priceMinor: p.priceMinor,
      currency: p.currency as 'PEN',
      categorySlug: p.category?.slug,
      thumbnail: p.thumbnail ?? undefined,
      status: p.status,
    }));

    return { items, total, page, limit, source: 'database' };
  }

  async findBySlug(slug: string): Promise<ProductDetail | null> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: { select: { slug: true } } },
    });

    if (!product) return null;

    return {
      id: product.id,
      slug: product.slug,
      sku: product.sku,
      name: product.name,
      description: product.description,
      priceMinor: product.priceMinor,
      currency: product.currency as 'PEN',
      categorySlug: product.category?.slug,
      thumbnail: product.thumbnail ?? undefined,
      images: toProductImages(product.images),
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  async findBySkus(skus: string[]): Promise<{ id: string; sku: string; name: string; priceMinor: bigint; currency: string; status: string }[]> {
    if (skus.length === 0) return [];
    return this.prisma.product.findMany({
      where: { sku: { in: skus } },
      select: { id: true, sku: true, name: true, priceMinor: true, currency: true, status: true },
    });
  }

  async listCategories(): Promise<CategorySummary[]> {
    const categories = await this.prisma.category.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });

    return categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      active: c.active,
    }));
  }
}
