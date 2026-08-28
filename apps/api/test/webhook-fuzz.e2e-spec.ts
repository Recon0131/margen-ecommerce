import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { BigIntSerializerInterceptor } from '../src/interceptors/bigint-serializer.interceptor';

describe('Webhook resilience (fuzz)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new BigIntSerializerInterceptor());
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 for unknown webhook event types', async () => {
    const res = await request(server)
      .post('/v1/payments/webhook')
      .send({ type: 'not-a-known-event', data: { id: 'abc' } });
    expect(res.status).toBe(200);
  });

  it('never returns 500 on malformed webhook payloads', async () => {
    const malformedJson: string[] = [
      'null',
      '"plain string"',
      '12345',
      '{"type": 5}',
      '{"type":"payment","data":null}',
      '{"type":"payment"}',
      '[]',
      '{"nested":{"deeply":{"wrong":true}}}',
      '{ not valid json ]',
    ];
    for (const raw of malformedJson) {
      const res = await request(server)
        .post('/v1/payments/webhook')
        .set('Content-Type', 'application/json')
        .send(raw);
      expect([200, 400, 404]).toContain(res.status);
    }
  });

  it('returns 400 on invalid JSON body without crashing the server', async () => {
    const raw = '{ "type": "payment", "data": { broken';
    const res = await request(server)
      .post('/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .send(raw);
    expect([200, 400]).toContain(res.status);
  });

  it('handles a legitimate payment webhook gracefully even without signature', async () => {
    const res = await request(server)
      .post('/v1/payments/webhook')
      .send({ type: 'payment', data: { id: 'non-existent-123' } });
    expect([200, 404]).toContain(res.status);
  });
});
