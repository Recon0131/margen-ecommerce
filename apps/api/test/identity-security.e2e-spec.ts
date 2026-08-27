import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { BigIntSerializerInterceptor } from '../src/interceptors/bigint-serializer.interceptor';
import { PrismaService } from '../src/database/prisma.service';

describe('Identity security', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    app.useGlobalInterceptors(new BigIntSerializerInterceptor());
    await app.init();

    await prisma.session.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({ where: { email: { in: ['test@example.com', 'weak@example.com'] } } });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/auth/register', () => {
    it('registers a new customer with valid data', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email: 'test@example.com', password: 'SecurePass123!' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe('test@example.com');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('rejects duplicate email', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email: 'test@example.com', password: 'SecurePass123!' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('rejects weak password', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email: 'weak@example.com', password: '123' });
      expect(res.status).toBe(400);
    });

    it('rejects invalid email', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email: 'not-an-email', password: 'SecurePass123!' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /v1/auth/login', () => {
    it('authenticates with valid credentials and returns session cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'test@example.com', password: 'SecurePass123!' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('userId');
      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.startsWith('margen_session='))).toBe(true);
    });

    it('rejects wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'test@example.com', password: 'WrongPassword!' });
      expect(res.status).toBe(401);
    });

    it('rejects non-existent email with same error shape (no user enumeration)', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'SecurePass123!' });
      expect(res.status).toBe(401);
    });
  });

  describe('Session security', () => {
    it('returns 401 when accessing protected route without session', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns current user when authenticated', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'test@example.com', password: 'SecurePass123!' });
      const cookie = loginRes.headers['set-cookie'][0];

      const meRes = await request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Cookie', cookie);
      expect(meRes.status).toBe(200);
      expect(meRes.body.email).toBe('test@example.com');
    });

    it('invalidates session on logout', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'test@example.com', password: 'SecurePass123!' });
      const cookie = loginRes.headers['set-cookie'][0];

      await request(app.getHttpServer())
        .post('/v1/auth/logout')
        .set('Cookie', cookie);

      const meRes = await request(app.getHttpServer())
        .get('/v1/auth/me')
        .set('Cookie', cookie);
      expect(meRes.status).toBe(401);
    });
  });
});
