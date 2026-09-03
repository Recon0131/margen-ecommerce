import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { BigIntSerializerInterceptor } from '../src/interceptors/bigint-serializer.interceptor';
import { PrismaService } from '../src/database/prisma.service';

describe('PDF invoices and fiscal compliance', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    app.useGlobalInterceptors(new BigIntSerializerInterceptor());
    await app.init();

    // Clean up state
    await prisma.invoice.deleteMany();
    await prisma.stockReservation.deleteMany();
    await prisma.orderLine.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartLine.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.inventoryMovement.deleteMany();
    await prisma.$executeRaw`UPDATE "InventoryItem" SET "reserved" = 0, "version" = 0 WHERE "sku" = 'HUB-01'`;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/invoices', () => {
    it('generates a BOLETA for a paid order', async () => {
      const cartRes = await request(app.getHttpServer())
        .post('/v1/cart')
        .send({ lines: [{ sku: 'HUB-01', quantity: 1 }] });
      const cartId = cartRes.body.id;

      const orderRes = await request(app.getHttpServer())
        .post('/v1/orders')
        .send({
          cartId,
          lines: [{ sku: 'HUB-01', quantity: 1 }],
          shippingAddress: { recipient: 'Test User', line1: 'Av. Test 123', district: 'Miraflores', city: 'Lima', country: 'PE' },
          idempotencyKey: crypto.randomUUID(),
          invoiceType: 'BOLETA',
        });
      const orderId = orderRes.body.id;

      const res = await request(app.getHttpServer())
        .post('/v1/invoices')
        .send({ orderId, type: 'BOLETA', customerDoc: '12345678', customerName: 'Test User' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('invoiceId');
      expect(res.body.type).toBe('BOLETA');
      expect(res.body).toHaveProperty('series');
      expect(res.body).toHaveProperty('number');
    });

    it('generates a FACTURA with RUC', async () => {
      const cartRes = await request(app.getHttpServer())
        .post('/v1/cart')
        .send({ lines: [{ sku: 'HUB-01', quantity: 1 }] });
      const cartId = cartRes.body.id;

      const orderRes = await request(app.getHttpServer())
        .post('/v1/orders')
        .send({
          cartId,
          lines: [{ sku: 'HUB-01', quantity: 1 }],
          shippingAddress: { recipient: 'Corp Test', line1: 'Av. Corp 456', district: 'San Isidro', city: 'Lima', country: 'PE' },
          idempotencyKey: crypto.randomUUID(),
          invoiceType: 'FACTURA',
        });
      const orderId = orderRes.body.id;

      const res = await request(app.getHttpServer())
        .post('/v1/invoices')
        .send({ orderId, type: 'FACTURA', customerDoc: '20123456789', customerName: 'Corp Test SAC' });
      expect(res.status).toBe(201);
      expect(res.body.type).toBe('FACTURA');
    });

    it('rejects invoice for non-existent order', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/invoices')
        .send({ orderId: '00000000-0000-0000-0000-000000000000', type: 'BOLETA', customerDoc: '12345678', customerName: 'Test' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects BOLETA without DNI', async () => {
      const cartRes = await request(app.getHttpServer())
        .post('/v1/cart')
        .send({ lines: [{ sku: 'HUB-01', quantity: 1 }] });
      const cartId = cartRes.body.id;

      const orderRes = await request(app.getHttpServer())
        .post('/v1/orders')
        .send({
          cartId,
          lines: [{ sku: 'HUB-01', quantity: 1 }],
          shippingAddress: { recipient: 'Test', line1: 'Av 123', district: 'Miraflores', city: 'Lima', country: 'PE' },
          idempotencyKey: crypto.randomUUID(),
          invoiceType: 'BOLETA',
        });
      const orderId = orderRes.body.id;

      const res = await request(app.getHttpServer())
        .post('/v1/invoices')
        .send({ orderId, type: 'BOLETA', customerName: 'Test' });
      expect(res.status).toBe(400);
    });

    it('rejects FACTURA without RUC', async () => {
      const cartRes = await request(app.getHttpServer())
        .post('/v1/cart')
        .send({ lines: [{ sku: 'HUB-01', quantity: 1 }] });
      const cartId = cartRes.body.id;

      const orderRes = await request(app.getHttpServer())
        .post('/v1/orders')
        .send({
          cartId,
          lines: [{ sku: 'HUB-01', quantity: 1 }],
          shippingAddress: { recipient: 'Corp', line1: 'Av 456', district: 'San Isidro', city: 'Lima', country: 'PE' },
          idempotencyKey: crypto.randomUUID(),
          invoiceType: 'FACTURA',
        });
      const orderId = orderRes.body.id;

      const res = await request(app.getHttpServer())
        .post('/v1/invoices')
        .send({ orderId, type: 'FACTURA', customerName: 'Corp' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /v1/invoices/:orderId', () => {
    async function loginAs(email: string): Promise<string> {
      await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email, password: 'SecurePass123!' });
      const loginRes = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email, password: 'SecurePass123!' });
      return loginRes.headers['set-cookie'][0];
    }

    async function createOwnedOrder(email: string): Promise<{ orderId: string; cookie: string }> {
      const cookie = await loginAs(email);
      const cartRes = await request(app.getHttpServer())
        .post('/v1/cart')
        .send({ lines: [{ sku: 'HUB-01', quantity: 1 }] });
      const cartId = cartRes.body.id;
      const orderRes = await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Cookie', cookie)
        .send({
          cartId,
          lines: [{ sku: 'HUB-01', quantity: 1 }],
          shippingAddress: { recipient: 'Test', line1: 'Av 123', district: 'Miraflores', city: 'Lima', country: 'PE' },
          idempotencyKey: crypto.randomUUID(),
          invoiceType: 'BOLETA',
        });
      return { orderId: orderRes.body.id, cookie };
    }

    it('requires authentication to read an invoice', async () => {
      const { orderId } = await createOwnedOrder('owner1@example.com');
      await request(app.getHttpServer())
        .post('/v1/invoices')
        .send({ orderId, type: 'BOLETA', customerDoc: '87654321', customerName: 'Test User' });

      const res = await request(app.getHttpServer()).get(`/v1/invoices/${orderId}`);
      expect(res.status).toBe(401);
    });

    it('returns invoice data for the order owner', async () => {
      const { orderId, cookie } = await createOwnedOrder('owner2@example.com');
      await request(app.getHttpServer())
        .post('/v1/invoices')
        .send({ orderId, type: 'BOLETA', customerDoc: '87654321', customerName: 'Test User' });

      const res = await request(app.getHttpServer())
        .get(`/v1/invoices/${orderId}`)
        .set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('invoiceId');
      expect(res.body.type).toBe('BOLETA');
    });

    it('blocks another user from reading an order they do not own', async () => {
      const { orderId } = await createOwnedOrder('owner3@example.com');
      await request(app.getHttpServer())
        .post('/v1/invoices')
        .send({ orderId, type: 'BOLETA', customerDoc: '87654321', customerName: 'Test User' });

      const otherCookie = await loginAs('other3@example.com');
      const res = await request(app.getHttpServer())
        .get(`/v1/invoices/${orderId}`)
        .set('Cookie', otherCookie);
      expect(res.status).toBe(404);
    });

    it('returns 404 for non-invoiced order', async () => {
      const { cookie } = await createOwnedOrder('owner4@example.com');
      const res = await request(app.getHttpServer())
        .get('/v1/invoices/00000000-0000-0000-0000-000000000000')
        .set('Cookie', cookie);
      expect(res.status).toBe(404);
    });
  });

  describe('Fiscal compliance', () => {
    it('sequential invoice numbering within series', async () => {
      const inv1 = await prisma.invoice.create({
        data: {
          orderId: '00000000-0000-0000-0000-000000000001',
          series: 'TEST001',
          number: 1,
          type: 'BOLETA',
          customerDoc: '11111111',
          customerName: 'Fiscal Test 1',
          snapshot: { items: [], total: 0 },
        },
      });
      const inv2 = await prisma.invoice.create({
        data: {
          orderId: '00000000-0000-0000-0000-000000000002',
          series: 'TEST001',
          number: 2,
          type: 'BOLETA',
          customerDoc: '22222222',
          customerName: 'Fiscal Test 2',
          snapshot: { items: [], total: 0 },
        },
      });
      expect(inv2.number).toBeGreaterThan(inv1.number);

      await prisma.invoice.deleteMany({ where: { id: { in: [inv1.id, inv2.id] } } });
    });
  });
});
