import 'reflect-metadata';
import { AppConfig, loadConfig, ValidationError } from '@margen/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BigIntSerializerInterceptor } from './interceptors/bigint-serializer.interceptor';

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

  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new BigIntSerializerInterceptor());
  if (config) app.enableCors({ origin: config.corsOrigins });
  await app.listen(Number(process.env.PORT ?? 3001));
}

void bootstrap();
