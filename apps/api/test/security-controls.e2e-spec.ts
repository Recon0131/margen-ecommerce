import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { BigIntSerializerInterceptor } from '../src/interceptors/bigint-serializer.interceptor';
import { GlobalExceptionFilter } from '../src/filters/global-exception.filter';
import { SecurityHeadersMiddleware } from '../src/security/security-headers.middleware';
import { CorrelationIdMiddleware } from '../src/security/correlation-id.middleware';
import { RateLimitGuard } from '../src/security/rate-limit.guard';
import { validateUpstreamUrl } from '../src/modules/catalog/dummyjson.mapper';

describe('Security controls', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(new SecurityHeadersMiddleware().use);
    app.use(new CorrelationIdMiddleware().use);
    app.useGlobalInterceptors(new BigIntSerializerInterceptor());
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalGuards(new RateLimitGuard());
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('security headers', () => {
    it('adds security headers to every response', async () => {
      const response = await request(server).get('/health');
      expect(response.status).toBe(200);
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['referrer-policy']).toBe('no-referrer');
      const csp = String(response.headers['content-security-policy'] ?? '');
      expect(csp).toContain("default-src 'self'");
      expect(response.headers['permissions-policy']).toBeDefined();
    });

    it('exposes a correlation id header', async () => {
      const response = await request(server).get('/health');
      expect(response.headers['x-request-id']).toBeDefined();
      expect(String(response.headers['x-request-id']).length).toBeGreaterThan(0);
    });
  });

  describe('error response shape', () => {
    it('returns { code, message, correlationId } for validation errors', async () => {
      const response = await request(server).get('/v1/catalog/products?page=not-a-number');
      expect(response.status).toBe(400);
      expect(response.body.message).toBeDefined();
      expect(response.body.correlationId).toBeDefined();
      expect(String(response.body.correlationId).length).toBeGreaterThan(0);
    });
  });

  describe('rate limiting', () => {
    it('returns 429 after the login rate limit is exceeded', async () => {
      const valid = { email: 'nobody@example.com', password: 'doesnotmatter123' };
      const limit = 5;
      for (let i = 0; i < limit; i++) {
        const r = await request(server).post('/v1/auth/login').send(valid);
        expect([200, 400, 401]).toContain(r.status);
      }
      const blocked = await request(server).post('/v1/auth/login').send(valid);
      expect(blocked.status).toBe(429);
      expect(blocked.headers['retry-after']).toBeDefined();
    });

    it('does not rate-limit the health endpoint', async () => {
      for (let i = 0; i < 30; i++) {
        const r = await request(server).get('/health');
        expect(r.status).toBe(200);
      }
    });
  });

  describe('SSRF allowlist', () => {
    it('rejects an upstream URL outside the allowlist', () => {
      expect(() => validateUpstreamUrl('http://127.0.0.1:8080/internal')).toThrow('UPSTREAM_NOT_ALLOWED');
      expect(() => validateUpstreamUrl('https://evil.example.com/products')).toThrow('UPSTREAM_NOT_ALLOWED');
      expect(() => validateUpstreamUrl('ftp://dummyjson.com/x')).toThrow('UPSTREAM_NOT_ALLOWED');
    });

    it('accepts the trusted upstream host', () => {
      expect(() => validateUpstreamUrl('https://dummyjson.com/products')).not.toThrow();
    });
  });
});
