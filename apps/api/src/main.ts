import 'reflect-metadata';
import { AppConfig, loadConfig, ValidationError } from '@margen/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BigIntSerializerInterceptor } from './interceptors/bigint-serializer.interceptor';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { SecurityHeadersMiddleware } from './security/security-headers.middleware';
import { CorrelationIdMiddleware } from './security/correlation-id.middleware';
import { RateLimitGuard } from './security/rate-limit.guard';

async function bootstrap(): Promise<void> {
  let config: AppConfig | undefined;
  if (process.env.NODE_ENV === 'test') {
    config = undefined;
  } else {
    try {
      config = loadConfig(process.env);
    } catch (error) {
      if (error instanceof ValidationError) {
        console.error(error.message);
        process.exit(1);
      }
      throw error;
    }
  }

  const port = Number(process.env.PORT ?? 3001);
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  app.use(new SecurityHeadersMiddleware().use);
  app.use(new CorrelationIdMiddleware().use);
  app.useGlobalInterceptors(new BigIntSerializerInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalGuards(new RateLimitGuard());
  if (config) {
    app.enableCors({
      origin: config.corsOrigins,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      credentials: true,
      maxAge: 86400,
    });
  } else if (process.env.CORS_ORIGINS) {
    const origins = process.env.CORS_ORIGINS.split(',').map((v) => v.trim()).filter(Boolean);
    if (origins.length) {
      app.enableCors({
        origin: origins,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
        credentials: true,
        maxAge: 86400,
      });
    }
  }
  await app.listen(port);
}

void bootstrap();
