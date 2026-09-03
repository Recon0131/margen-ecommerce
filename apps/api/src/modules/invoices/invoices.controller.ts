import { Controller, Get, Post, Param, Body, Req, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { InvoiceCreateSchema } from '@margen/contracts';
import { sanitizeText } from '../../security/sanitize';
import { SessionGuard } from '../identity/session.guard';
import { InvoicesService } from './invoices.service';

@Controller('v1/invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  async generateInvoice(@Body() body: unknown) {
    const parsed = InvoiceCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Invalid invoice data', details: parsed.error.issues });
    }
    const customerName = sanitizeText(parsed.data.customerName, 120);
    return this.invoicesService.generateInvoice({
      orderId: parsed.data.orderId,
      type: parsed.data.type,
      customerDoc: parsed.data.customerDoc,
      customerName,
    });
  }

  @Get(':orderId')
  @UseGuards(SessionGuard)
  async getInvoice(@Req() req: any, @Param('orderId') orderId: string) {
    if (!orderId) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'orderId is required' });
    }
    return this.invoicesService.getInvoice(req.userId, orderId);
  }
}
