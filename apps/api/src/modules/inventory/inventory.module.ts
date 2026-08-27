import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './inventory.repository';

@Module({
  imports: [PrismaModule],
  providers: [InventoryService, InventoryRepository],
  exports: [InventoryService],
})
export class InventoryModule {}
