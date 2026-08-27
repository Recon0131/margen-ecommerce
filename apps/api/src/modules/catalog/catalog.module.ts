import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CatalogRepository } from './catalog.repository';
import { DummyJsonClient } from './dummyjson.client';
import { CatalogSync } from './catalog.sync';

@Module({
  imports: [PrismaModule],
  controllers: [CatalogController],
  providers: [CatalogService, CatalogRepository, DummyJsonClient, CatalogSync],
  exports: [CatalogService],
})
export class CatalogModule {}
