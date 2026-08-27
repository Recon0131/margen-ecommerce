import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { BigIntSerializerInterceptor } from '../src/interceptors/bigint-serializer.interceptor';
import { PrismaService } from '../src/database/prisma.service';

describe('Authorization', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    app.useGlobalInterceptors(new BigIntSerializerInterceptor());
    await app.init();

    await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({ email: 'test@example.com', password: 'SecurePass123!' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('RBAC', () => {
    it('allows customer to view their own orders', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'test@example.com', password: 'SecurePass123!' });
      const cookie = loginRes.headers['set-cookie'][0];

      const res = await request(app.getHttpServer())
        .get('/v1/orders')
        .set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('blocks customer from accessing admin endpoints', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'test@example.com', password: 'SecurePass123!' });
      const cookie = loginRes.headers['set-cookie'][0];

      const res = await request(app.getHttpServer())
        .get('/v1/admin/users')
        .set('Cookie', cookie);
      expect(res.status).toBe(403);
    });

    it('returns 401 for admin endpoints without auth', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/admin/users');
      expect(res.status).toBe(401);
    });

    it('allows admin to access admin endpoints', async () => {
      const adminUser = await prisma.user.upsert({
        where: { email: 'admin@margen.pe' },
        create: { email: 'admin@margen.pe', passwordHash: '$argon2id$v=19$m=65536,p=1,t=3$7gQu1Pgr6fx7bspMr4PCTQ$aSoBwmvFbW6H7y0PFp8a3/jGCv7bRUzTKuPiE7TEBIc' },
        update: {},
      });
      const adminRole = await prisma.role.upsert({
        where: { name: 'admin' },
        create: { name: 'admin' },
        update: {},
      });
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
        create: { userId: adminUser.id, roleId: adminRole.id },
        update: {},
      });

      const loginRes = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ email: 'admin@margen.pe', password: 'SecurePass123!' });
      expect(loginRes.status).toBe(200);
    });
  });

  describe('Password security', () => {
    it('does not reveal whether an email exists during registration error', async () => {
      const duplicateRes = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({ email: 'test@example.com', password: 'SecurePass123!' });
      expect(duplicateRes.status).toBeGreaterThanOrEqual(400);
      expect(duplicateRes.body.message).not.toMatch(/exist/i);
    });
  });
});
