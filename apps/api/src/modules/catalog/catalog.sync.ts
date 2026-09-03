import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DummyJsonClient } from './dummyjson.client';
import { mapDummyJsonProduct, validateUpstreamUrl } from './dummyjson.mapper';

@Injectable()
export class CatalogSync {
  private readonly logger = new Logger(CatalogSync.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly upstream: DummyJsonClient,
  ) {}

  async syncDummyJsonCatalog(): Promise<{ imported: number; rejected: number }> {
    let imported = 0;
    let rejected = 0;
    const PAGE_SIZE = 30;
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const raw = await this.upstream.fetchProducts({ limit: PAGE_SIZE, skip });
        const data = raw as { products?: unknown[]; total?: number };
        const products = data.products ?? [];
        const total = data.total ?? 0;

        for (const item of products) {
          try {
            const mapped = mapDummyJsonProduct(item);
            await this.upsertProduct(mapped);
            imported++;
          } catch (err) {
            rejected++;
            this.logger.warn(`Rejected upstream product: ${(err as Error).message}`);
          }
        }

        skip += PAGE_SIZE;
        hasMore = skip < total;
      } catch (err) {
        this.logger.error(`Upstream sync failed at skip=${skip}: ${(err as Error).message}`);
        break;
      }
    }

    this.logger.log(`Sync complete: ${imported} imported, ${rejected} rejected`);
    return { imported, rejected };
  }

  private async upsertProduct(product: ReturnType<typeof mapDummyJsonProduct>): Promise<void> {
    const category = await this.prisma.category.upsert({
      where: { slug: product.categorySlug },
      update: {},
      create: { slug: product.categorySlug, name: product.categorySlug, active: true },
    });

    const images = product.images;
    const thumbnail = images[0]?.url ?? null;

    await this.prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        priceMinor: product.priceMinor,
        sku: product.sku,
        categoryId: category.id,
        status: 'PUBLISHED',
        thumbnail,
        images: images,
      },
      create: {
        slug: product.slug,
        sku: product.sku,
        name: product.name,
        description: product.description,
        priceMinor: product.priceMinor,
        currency: 'PEN',
        status: 'PUBLISHED',
        categoryId: category.id,
        thumbnail,
        images: images,
      },
    });
  }
}
