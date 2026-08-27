import 'reflect-metadata';
import { AppConfig, loadConfig, ValidationError } from '@margen/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BigIntSerializerInterceptor } from './interceptors/bigint-serializer.interceptor';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

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
  app.useGlobalInterceptors(new BigIntSerializerInterceptor());
  if (config) app.enableCors({ origin: config.corsOrigins });
  await app.listen(port);
}

void bootstrap();
