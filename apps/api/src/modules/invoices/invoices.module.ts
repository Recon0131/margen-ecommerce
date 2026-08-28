import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { IdentityModule } from '../identity/identity.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [PrismaModule, IdentityModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
