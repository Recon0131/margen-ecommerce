import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../src/database/prisma.service';
import { CatalogSync } from '../src/modules/catalog/catalog.sync';
import { DummyJsonClient } from '../src/modules/catalog/dummyjson.client';

const FAKE_DEMO_SKUS = ['TEC-60', 'MOU-PRO', 'SOP-LAP', 'PAR-10W', 'CAR-15W', 'DIS-1TB', 'PEN-64G'];

async function run(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const purged = await prisma.product.deleteMany({
      where: { sku: { in: FAKE_DEMO_SKUS } },
    });
    if (purged.count > 0) {
      console.log(`Purged ${purged.count} hand-crafted demo products`);
      await prisma.category.deleteMany({
        where: { products: { none: {} }, slug: { in: ['electronica', 'almacenamiento'] } },
      });
    }

    const sync = new CatalogSync(prisma as unknown as PrismaService, new DummyJsonClient());
    const result = await sync.syncDummyJsonCatalog();
    console.log(`SYNC_RESULT ${JSON.stringify(result)}`);
  } finally {
    await prisma.$disconnect();
  }
}

run()
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  });