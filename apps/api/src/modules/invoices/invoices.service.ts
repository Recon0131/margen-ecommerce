import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InputJsonValue } from '@prisma/client/runtime/library';

const BOLETA_SERIES = 'B001';
const FACTURA_SERIES = 'F001';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async generateInvoice(params: {
    orderId: string;
    type: 'BOLETA' | 'FACTURA';
    customerDoc: string;
    customerName: string;
  }): Promise<{ invoiceId: string; type: string; series: string; number: number }> {
    const { orderId, type, customerDoc, customerName } = params;

    if (type === 'BOLETA') {
      if (!/^\d{8}$/.test(customerDoc)) {
        throw new BadRequestException({ code: 'INVALID_DNI', message: 'BOLETA requires an 8-digit DNI' });
      }
    } else if (type === 'FACTURA') {
      if (!/^\d{11}$/.test(customerDoc)) {
        throw new BadRequestException({ code: 'INVALID_RUC', message: 'FACTURA requires an 11-digit RUC' });
      }
    } else {
      throw new BadRequestException({ code: 'INVALID_TYPE', message: 'Invoice type must be BOLETA or FACTURA' });
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { lines: true },
    });
    if (!order) {
      throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });
    }

    const series = type === 'FACTURA' ? FACTURA_SERIES : BOLETA_SERIES;

    const last = await this.prisma.invoice.findFirst({
      where: { series },
      orderBy: { number: 'desc' },
    });
    const number = (last?.number ?? 0) + 1;

    const snapshot = {
      orderId,
      type,
      customerDoc,
      customerName,
      lines: order.lines.map((l) => ({
        sku: l.sku,
        productName: l.productName,
        quantity: l.quantity,
        unitAmountMinor: l.unitAmountMinor.toString(),
      })),
      subtotalMinor: order.subtotalMinor.toString(),
      discountMinor: order.discountMinor.toString(),
      taxMinor: order.taxMinor.toString(),
      totalMinor: order.totalMinor.toString(),
      currency: order.currency,
      issuedAt: new Date().toISOString(),
    };

    const invoice = await this.prisma.invoice.create({
      data: {
        orderId,
        series,
        number,
        type,
        status: 'EMITTED',
        customerDoc,
        customerName,
        snapshot: snapshot as unknown as InputJsonValue,
      },
    });

    this.logger.log(`Invoice ${series}-${number} generated for order ${orderId}`);
    return { invoiceId: invoice.id, type: invoice.type, series: invoice.series, number: invoice.number };
  }

  async getInvoice(userId: string, orderId: string): Promise<{ invoiceId: string; type: string; series: string; number: number }> {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId } });
    if (!order) {
      throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });
    }
    const invoice = await this.prisma.invoice.findFirst({ where: { orderId } });
    if (!invoice) {
      throw new NotFoundException({ code: 'INVOICE_NOT_FOUND', message: 'No invoice found for this order' });
    }
    return { invoiceId: invoice.id, type: invoice.type, series: invoice.series, number: invoice.number };
  }
}
