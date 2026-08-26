import { Controller, Get, Module } from '@nestjs/common';
import { PrismaModule } from './database/prisma.module';
import { CatalogModule } from './modules/catalog/catalog.module';

@Controller()
class HealthController {
  @Get('health')
  health(): { status: 'ok'; version: string } {
    return { status: 'ok', version: process.env.APP_VERSION ?? '0.1.0' };
  }
}

@Module({
  imports: [PrismaModule, CatalogModule],
  controllers: [HealthController],
})
export class AppModule {}
