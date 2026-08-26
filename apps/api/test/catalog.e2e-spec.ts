import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { BigIntSerializerInterceptor } from '../src/interceptors/bigint-serializer.interceptor';

describe('GET /v1/catalog', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new BigIntSerializerInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns paginated products from the catalog', async () => {
    const response = await request(app.getHttpServer()).get('/v1/catalog/products');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.items)).toBe(true);
  });

  it('returns 400 for invalid query parameters', async () => {
    const response = await request(app.getHttpServer()).get('/v1/catalog/products?page=-1');
    expect(response.status).toBe(400);
  });

  it('returns categories', async () => {
    const response = await request(app.getHttpServer()).get('/v1/catalog/categories');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
