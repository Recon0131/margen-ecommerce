import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { PrismaService } from '../src/database/prisma.service';
import { CatalogModule } from '../src/modules/catalog/catalog.module';
import { CatalogSync } from '../src/modules/catalog/catalog.sync';

const FAKE_DEMO_SKUS = ['TEC-60', 'MOU-PRO', 'SOP-LAP', 'PAR-10W', 'CAR-15W', 'DIS-1TB', 'PEN-64G'];

async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(CatalogModule, { logger: ['error', 'warn'] });
  try {
    const prisma = app.get(PrismaService);

    const purged = await prisma.product.deleteMany({
      where: { sku: { in: FAKE_DEMO_SKUS } },
    });
    if (purged.count > 0) {
      console.log(`Purged ${purged.count} hand-crafted demo products`);
      await prisma.category.deleteMany({
        where: { products: { none: {} }, slug: { in: ['electronica', 'almacenamiento'] } },
      });
    }

    await app.get(CatalogSync).syncDummyJsonCatalog();
  } finally {
    await app.close();
  }
}

run()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  });
