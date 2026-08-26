import { PrismaClient } from '@prisma/client';

describe('Prisma schema seed', () => {
  const prisma = new PrismaClient();

  afterAll(async () => prisma.$disconnect());

  it('persists the deterministic demo USB-C hub catalogue item', async () => {
    await expect(prisma.product.findUnique({ where: { slug: 'usb-c-hub-01' } })).resolves.toMatchObject({
      sku: 'HUB-01',
      currency: 'PEN',
      priceMinor: 10990n,
    });
  });
});
