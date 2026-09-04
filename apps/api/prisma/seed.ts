import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const category = await prisma.category.upsert({
    where: { slug: 'accesorios' },
    update: {},
    create: { slug: 'accesorios', name: 'Accesorios', active: true },
  });

  const product = await prisma.product.upsert({
    where: { slug: 'usb-c-hub-01' },
    update: {},
    create: {
      slug: 'usb-c-hub-01',
      sku: 'HUB-01',
      name: 'USB-C Hub 7-en-1',
      description: 'Hub USB-C con HDMI, USB-A 3.0 x3, SD, microSD y Power Delivery 100W.',
      priceMinor: 10990n,
      currency: 'PEN',
      status: 'PUBLISHED',
      categoryId: category.id,
    },
  });

  await prisma.inventoryItem.upsert({
    where: { sku: 'HUB-01' },
    update: {},
    create: { sku: 'HUB-01', onHand: 50, reserved: 0, version: 0 },
  });

  console.log(`Seeded: product ${product.slug} (${product.sku})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
