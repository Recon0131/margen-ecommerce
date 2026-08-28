import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { BigIntSerializerInterceptor } from '../src/interceptors/bigint-serializer.interceptor';
import { PrismaService } from '../src/database/prisma.service';

const SKU = 'HUB-01';

describe('Concurrency load (no oversell)', () => {
  let app: INestApplication;
  let server: any;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    app.useGlobalInterceptors(new BigIntSerializerInterceptor());
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.inventoryMovement.deleteMany();
    await prisma.stockReservation.deleteMany();
    await prisma.paymentAttempt.deleteMany();
    await prisma.orderLine.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartLine.deleteMany();
    await prisma.cart.deleteMany();
    // Deterministic budget: clear reservations so available = onHand.
    await prisma.inventoryItem.update({ where: { sku: SKU }, data: { reserved: 0 } });
  });

  it('serves only the available stock under concurrent purchases', async () => {
    const item = await prisma.inventoryItem.findUnique({ where: { sku: SKU } });
    expect(item).not.toBeNull();

    const available = item!.onHand;
    expect(available).toBeGreaterThan(0);

    const attempts = available + 5;
    const jobs: Promise<request.Response>[] = [];
    for (let i = 0; i < attempts; i++) {
      const createCart = await request(server)
        .post('/v1/cart')
        .send({ lines: [{ sku: SKU, quantity: 1 }] });
      const cartId = createCart.body.id;
      jobs.push(
        request(server)
          .post('/v1/orders')
          .send({
            cartId,
            lines: [{ sku: SKU, quantity: 1 }],
            shippingAddress: { recipient: 'Load', line1: 'Av. Test 123', district: 'Miraflores', city: 'Lima', country: 'PE' },
            idempotencyKey: crypto.randomUUID(),
            invoiceType: 'BOLETA',
          }),
      );
    }

    const results = await Promise.all(jobs);
    const succeeded = results.filter((r) => r.status === 201).length;
    expect(succeeded).toBeLessThanOrEqual(available);

    const after = await prisma.inventoryItem.findUnique({ where: { sku: SKU } });
    expect(after!.reserved).toBeLessThanOrEqual(after!.onHand);
    expect(after!.reserved).toBeLessThanOrEqual(available);
  });
});
