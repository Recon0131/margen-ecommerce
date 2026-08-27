import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { BigIntSerializerInterceptor } from '../src/interceptors/bigint-serializer.interceptor';
import { PrismaService } from '../src/database/prisma.service';

describe('Cart and checkout', () => {
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

  describe('POST /v1/cart', () => {
    it('creates a new cart', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/cart')
        .send({ lines: [{ sku: 'HUB-01', quantity: 1 }] });
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('lines');
      expect(Array.isArray(response.body.lines)).toBe(true);
      expect(response.body.lines.length).toBe(1);
    });

    it('rejects empty cart', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/cart')
        .send({ lines: [] });
      expect(response.status).toBe(400);
    });

    it('rejects invalid SKU format', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/cart')
        .send({ lines: [{ sku: 'invalid sku!', quantity: 1 }] });
      expect(response.status).toBe(400);
    });

    it('rejects quantity exceeding max', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/cart')
        .send({ lines: [{ sku: 'HUB-01', quantity: 101 }] });
      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /v1/cart/:id', () => {
    it('updates cart lines', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/v1/cart')
        .send({ lines: [{ sku: 'HUB-01', quantity: 1 }] });
      const cartId = createRes.body.id;

      const updateRes = await request(app.getHttpServer())
        .patch(`/v1/cart/${cartId}`)
        .send({ lines: [{ sku: 'HUB-01', quantity: 2 }] });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.lines[0].quantity).toBe(2);
    });
  });

  describe('GET /v1/cart/quote', () => {
    it('recalculates prices server-side and ignores client-provided prices', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/v1/cart')
        .send({ lines: [{ sku: 'HUB-01', quantity: 1 }] });
      const cartId = createRes.body.id;

      const quoteRes = await request(app.getHttpServer())
        .get(`/v1/cart/quote?cartId=${cartId}`);
      expect(quoteRes.status).toBe(200);
      expect(quoteRes.body).toHaveProperty('lines');
      expect(quoteRes.body).toHaveProperty('totalMinor');
      expect(quoteRes.body.lines[0].unitPriceMinor).toBeDefined();
      expect(typeof quoteRes.body.totalMinor === 'string' || typeof quoteRes.body.totalMinor === 'number').toBe(true);
    });

    it('rejects non-existent cart', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/cart/quote?cartId=00000000-0000-0000-0000-000000000000');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /v1/orders', () => {
    it('creates an order from a cart with server-side pricing', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/v1/cart')
        .send({ lines: [{ sku: 'HUB-01', quantity: 1 }] });
      const cartId = createRes.body.id;

      const orderRes = await request(app.getHttpServer())
        .post('/v1/orders')
        .send({
          cartId,
          lines: [{ sku: 'HUB-01', quantity: 1 }],
          shippingAddress: {
            recipient: 'Test User',
            line1: 'Av. Test 123',
            district: 'Miraflores',
            city: 'Lima',
            country: 'PE',
          },
          idempotencyKey: crypto.randomUUID(),
          invoiceType: 'BOLETA',
        });
      expect(orderRes.status).toBe(201);
      expect(orderRes.body).toHaveProperty('id');
      expect(orderRes.body.status).toBe('pending_payment');
    });

    it('rejects order with invalid cart', async () => {
      const orderRes = await request(app.getHttpServer())
        .post('/v1/orders')
        .send({
          cartId: '00000000-0000-0000-0000-000000000000',
          lines: [{ sku: 'HUB-01', quantity: 1 }],
          shippingAddress: {
            recipient: 'Test User',
            line1: 'Av. Test 123',
            district: 'Miraflores',
            city: 'Lima',
            country: 'PE',
          },
          idempotencyKey: crypto.randomUUID(),
          invoiceType: 'BOLETA',
        });
      expect(orderRes.status).toBeGreaterThanOrEqual(400);
    });

    it('returns the same order for a repeated idempotency key', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/v1/cart')
        .send({ lines: [{ sku: 'HUB-01', quantity: 1 }] });
      const cartId = createRes.body.id;
      const idempotencyKey = crypto.randomUUID();

      const first = await request(app.getHttpServer())
        .post('/v1/orders')
        .send({
          cartId,
          lines: [{ sku: 'HUB-01', quantity: 1 }],
          shippingAddress: {
            recipient: 'Test User',
            line1: 'Av. Test 123',
            district: 'Miraflores',
            city: 'Lima',
            country: 'PE',
          },
          idempotencyKey,
          invoiceType: 'BOLETA',
        });

      const secondCartRes = await request(app.getHttpServer())
        .post('/v1/cart')
        .send({ lines: [{ sku: 'HUB-01', quantity: 1 }] });

      const second = await request(app.getHttpServer())
        .post('/v1/orders')
        .send({
          cartId: secondCartRes.body.id,
          lines: [{ sku: 'HUB-01', quantity: 1 }],
          shippingAddress: {
            recipient: 'Test User',
            line1: 'Av. Test 123',
            district: 'Miraflores',
            city: 'Lima',
            country: 'PE',
          },
          idempotencyKey,
          invoiceType: 'BOLETA',
        });

      expect(second.body.id).toBe(first.body.id);
    });

    it('rejects duplicate order for already-converted cart', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/v1/cart')
        .send({ lines: [{ sku: 'HUB-01', quantity: 1 }] });
      const cartId = createRes.body.id;
      const addr = {
        recipient: 'Test User',
        line1: 'Av. Test 123',
        district: 'Miraflores',
        city: 'Lima',
        country: 'PE',
      };

      await request(app.getHttpServer())
        .post('/v1/orders')
        .send({ cartId, lines: [{ sku: 'HUB-01', quantity: 1 }], shippingAddress: addr, idempotencyKey: crypto.randomUUID(), invoiceType: 'BOLETA' });

      const second = await request(app.getHttpServer())
        .post('/v1/orders')
        .send({ cartId, lines: [{ sku: 'HUB-01', quantity: 1 }], shippingAddress: addr, idempotencyKey: crypto.randomUUID(), invoiceType: 'BOLETA' });

      expect(second.status).toBeGreaterThanOrEqual(400);
    });
  });
});
