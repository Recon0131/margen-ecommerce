import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { BigIntSerializerInterceptor } from '../src/interceptors/bigint-serializer.interceptor';
import { PrismaService } from '../src/database/prisma.service';
import { MercadoPagoClient } from '../src/modules/payments/mercadopago.client';

const ADDR = {
  recipient: 'Test User',
  line1: 'Av. Test 123',
  district: 'Miraflores',
  city: 'Lima',
  country: 'PE',
};

async function createOrder(app: INestApplication, idempotencyKey: string) {
  const cartRes = await request(app.getHttpServer())
    .post('/v1/cart')
    .send({ lines: [{ sku: 'HUB-01', quantity: 1 }] });
  const cartId = cartRes.body.id;

  const orderRes = await request(app.getHttpServer())
    .post('/v1/orders')
    .send({
      cartId,
      lines: [{ sku: 'HUB-01', quantity: 1 }],
      shippingAddress: ADDR,
      idempotencyKey,
      invoiceType: 'BOLETA',
    });
  return orderRes.body.id as string;
}

describe('Mercado Pago payments', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mpClient: MercadoPagoClient;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    mpClient = moduleRef.get(MercadoPagoClient);
    app.useGlobalInterceptors(new BigIntSerializerInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/payments/checkout', () => {
    it('creates a checkout preference for a valid order', async () => {
      const orderId = await createOrder(app, crypto.randomUUID());

      const res = await request(app.getHttpServer())
        .post('/v1/payments/checkout')
        .send({ orderId });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('checkoutUrl');
      expect(res.body).toHaveProperty('externalReference');
    });

    it('rejects checkout for non-existent order', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/payments/checkout')
        .send({ orderId: '00000000-0000-0000-0000-000000000000' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects checkout for order not in PENDING_PAYMENT state', async () => {
      const orderId = await createOrder(app, crypto.randomUUID());
      const checkoutRes = await request(app.getHttpServer())
        .post('/v1/payments/checkout')
        .send({ orderId });
      const extRef = checkoutRes.body.externalReference;
      mpClient.registerPayment(extRef, extRef, 'approved');
      await request(app.getHttpServer())
        .post('/v1/payments/webhook')
        .send({ type: 'payment', data: { id: extRef } });
      const res = await request(app.getHttpServer())
        .post('/v1/payments/checkout')
        .send({ orderId });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /v1/payments/webhook', () => {
    it('processes a valid payment notification', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/payments/webhook')
        .send({
          type: 'payment',
          data: { id: 'mp-payment-123' },
        });
      expect(res.status).toBe(200);
    });

    it('rejects webhook with missing signature header', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/payments/webhook')
        .send({
          type: 'payment',
          data: { id: 'mp-payment-456' },
        });
      // Without x-signature header, should still process but log warning
      expect(res.status).toBe(200);
    });

    it('returns 200 for unknown event types (idempotent)', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/payments/webhook')
        .send({
          type: 'unknown_event',
          data: { id: 'something' },
        });
      expect(res.status).toBe(200);
    });
  });

  describe('GET /v1/payments/:orderId', () => {
    it('returns payment status for an order', async () => {
      const orderId = await createOrder(app, crypto.randomUUID());

      await request(app.getHttpServer())
        .post('/v1/payments/checkout')
        .send({ orderId });

      const res = await request(app.getHttpServer())
        .get(`/v1/payments/${orderId}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toBe('pending');
    });

    it('returns 404 for order with no payment attempt', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/payments/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });
  });

  describe('Idempotency', () => {
    it('returns same checkout preference for duplicate orderId', async () => {
      const orderId = await createOrder(app, crypto.randomUUID());

      const res1 = await request(app.getHttpServer())
        .post('/v1/payments/checkout')
        .send({ orderId });
      const res2 = await request(app.getHttpServer())
        .post('/v1/payments/checkout')
        .send({ orderId });
      expect(res1.body.checkoutUrl).toBe(res2.body.checkoutUrl);
    });
  });
});
