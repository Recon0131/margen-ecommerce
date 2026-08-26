import 'reflect-metadata';
import { loadConfig, ValidationError } from '@margen/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
async function bootstrap(): Promise<void> { if (process.env.NODE_ENV !== 'test') { try { loadConfig(process.env); } catch (error) { if (error instanceof ValidationError) { console.error(error.message); process.exit(1); } throw error; } } const app = await NestFactory.create(AppModule); app.enableCors({origin: process.env.CORS_ORIGINS?.split(',').map((v)=>v.trim()).filter(Boolean) ?? true}); await app.listen(Number(process.env.PORT ?? 3001)); }
void bootstrap();
