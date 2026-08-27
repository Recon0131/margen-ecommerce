import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MercadoPagoClient } from './mercadopago.client';
import { BullMQService } from './bullmq.service';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, MercadoPagoClient, BullMQService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
