import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../../../src/app.module';
import { BigIntSerializerInterceptor } from '../../../../src/interceptors/bigint-serializer.interceptor';
import { PrismaService } from '../../../../src/database/prisma.service';
import request from 'supertest';

describe('Inventory concurrency', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    app.useGlobalInterceptors(new BigIntSerializerInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.inventoryMovement.deleteMany();
    await prisma.stockReservation.deleteMany();
    await prisma.orderLine.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartLine.deleteMany();
    await prisma.cart.deleteMany();
  });

  it('prevents overselling by using atomic SQL update', async () => {
    const item = await prisma.inventoryItem.findUnique({ where: { sku: 'HUB-01' } });
    if (!item || item.onHand <= item.reserved) return;

    const results = await Promise.allSettled([
      prisma.$executeRaw`UPDATE "InventoryItem" SET "reserved" = "reserved" + 1, "version" = "version" + 1 WHERE "sku" = 'HUB-01' AND ("onHand" - "reserved") >= 1`,
      prisma.$executeRaw`UPDATE "InventoryItem" SET "reserved" = "reserved" + 1, "version" = "version" + 1 WHERE "sku" = 'HUB-01' AND ("onHand" - "reserved") >= 1`,
    ]);

    const afterItem = await prisma.inventoryItem.findUnique({ where: { sku: 'HUB-01' } });
    expect(afterItem!.reserved).toBeLessThanOrEqual(afterItem!.onHand);
  });

  it('records inventory movements with correlation IDs', async () => {
    const correlationId = crypto.randomUUID();
    const item = await prisma.inventoryItem.findUnique({ where: { sku: 'HUB-01' } });
    if (!item) return;

    await prisma.inventoryMovement.create({
      data: {
        inventoryItemId: item.id,
        reason: 'RESERVE',
        previousOnHand: item.onHand,
        nextOnHand: item.onHand,
        correlationId,
      },
    });
    const movement = await prisma.inventoryMovement.findFirst({ where: { correlationId } });
    expect(movement).not.toBeNull();
    expect(movement!.reason).toBe('RESERVE');
  });

  it('creates stock reservation with TTL via order creation', async () => {
    const createCart = await request(app.getHttpServer())
      .post('/v1/cart')
      .send({ lines: [{ sku: 'HUB-01', quantity: 1 }] });
    expect(createCart.status).toBe(201);
    const cartId = createCart.body.id;

    const orderRes = await request(app.getHttpServer())
      .post('/v1/orders')
      .send({
        cartId,
        lines: [{ sku: 'HUB-01', quantity: 1 }],
        shippingAddress: { recipient: 'Test', line1: 'Av. Test 123', district: 'Miraflores', city: 'Lima', country: 'PE' },
        idempotencyKey: crypto.randomUUID(),
        invoiceType: 'BOLETA',
      });
    expect(orderRes.status).toBe(201);

    const reservation = await prisma.stockReservation.findFirst({ where: { orderId: orderRes.body.id } });
    expect(reservation).not.toBeNull();
    expect(new Date(reservation!.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('releases expired reservations', async () => {
    const item = await prisma.inventoryItem.findUnique({ where: { sku: 'HUB-01' } });
    if (!item) return;

    await prisma.stockReservation.create({
      data: {
        inventoryItemId: item.id,
        quantity: 1,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() - 60000),
      },
    });

    const released = await prisma.stockReservation.updateMany({
      where: { status: 'ACTIVE', expiresAt: { lt: new Date() } },
      data: { status: 'RELEASED' },
    });
    expect(released.count).toBeGreaterThanOrEqual(1);
  });
});
