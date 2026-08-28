import { Controller, Get, Post, Param, Body, NotFoundException, BadRequestException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';

@Controller('v1/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  async generateInvoice(@Body() body: { orderId: string; type: 'BOLETA' | 'FACTURA'; customerDoc: string; customerName: string }) {
    if (!body.orderId || !body.type || !body.customerDoc || !body.customerName) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'orderId, type, customerDoc, and customerName are required' });
    }
    return this.invoicesService.generateInvoice(body);
  }

  @Get(':orderId')
  async getInvoice(@Param('orderId') orderId: string) {
    if (!orderId) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'orderId is required' });
    }
    return this.invoicesService.getInvoice(orderId);
  }
}
