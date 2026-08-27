import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MercadoPagoClient } from './mercadopago.client';
import { BullMQService } from './bullmq.service';
import { AuditService } from '../audit/audit.service';
import crypto from 'node:crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mpClient: MercadoPagoClient,
    private readonly bullmq: BullMQService,
    private readonly audit: AuditService,
  ) {}

  async createCheckout(orderId: string): Promise<{ checkoutUrl: string; externalReference: string }> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });
    }

    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException({
        code: 'ORDER_NOT_PAYABLE',
        message: `Order is not in PENDING_PAYMENT state (current: ${order.status})`,
      });
    }

    const existingAttempt = await this.prisma.paymentAttempt.findFirst({
      where: { orderId },
    });

    if (existingAttempt?.externalReference) {
      return {
        checkoutUrl: `https://checkout.mercadopago.com/${existingAttempt.externalReference}`,
        externalReference: existingAttempt.externalReference,
      };
    }

    const result = await this.mpClient.createCheckoutPreference({
      orderId,
      amount: Number(order.totalMinor),
      currency: order.currency,
      email: 'customer@example.com',
      description: `Order ${order.publicId}`,
    });

    const idempotencyKey = crypto.randomUUID();

    await this.prisma.paymentAttempt.create({
      data: {
        orderId,
        provider: 'mercadopago',
        externalReference: result.externalReference,
        amountMinor: order.totalMinor,
        currency: order.currency,
        status: 'PENDING',
        idempotencyKey,
      },
    });

    await this.audit.record({
      action: 'CHECKOUT_CREATED',
      resourceType: 'Order',
      resourceId: orderId,
      outcome: 'SUCCESS',
      correlationId: idempotencyKey,
    });

    return result;
  }

  async handleWebhook(
    payload: { type: string; data: { id: string } },
    signatureHeader?: string,
  ): Promise<void> {
    if (payload.type !== 'payment') {
      this.logger.log(`Ignoring webhook event type: ${payload.type}`);
      return;
    }

    if (!signatureHeader) {
      this.logger.warn(`Webhook missing x-signature header for payment ${payload.data.id}`);
    }

    const payment = await this.mpClient.getPayment(payload.data.id);

    const attempt = await this.prisma.paymentAttempt.findFirst({
      where: { externalReference: payment.external_reference },
    });

    if (!attempt) {
      this.logger.warn(`No PaymentAttempt found for external reference ${payment.external_reference}`);
      return;
    }

    const newStatus = payment.status === 'approved' ? 'APPROVED' : 'REJECTED';

    await this.prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: { status: newStatus },
    });

    if (newStatus === 'APPROVED') {
      await this.prisma.order.update({
        where: { id: attempt.orderId },
        data: { status: 'PAID' },
      });

      void this.enqueueFulfillment(attempt.orderId);
    } else {
      await this.prisma.order.update({
        where: { id: attempt.orderId },
        data: { status: 'CANCELLED' },
      });
    }

    await this.audit.record({
      action: `PAYMENT_${newStatus}`,
      resourceType: 'Order',
      resourceId: attempt.orderId,
      outcome: newStatus === 'APPROVED' ? 'SUCCESS' : 'FAILURE',
      correlationId: attempt.idempotencyKey,
    });
  }

  private async enqueueFulfillment(orderId: string): Promise<void> {
    try {
      await this.bullmq.getPaymentQueue().add('fulfill-order', { orderId });
    } catch (err) {
      this.logger.error(`Failed to enqueue fulfillment for order ${orderId}`, err);
    }
  }

  async getPaymentStatus(orderId: string): Promise<{ status: string; paymentAttemptId?: string }> {
    const attempt = await this.prisma.paymentAttempt.findFirst({
      where: { orderId },
    });

    if (!attempt) {
      throw new NotFoundException({ code: 'NO_PAYMENT_FOUND', message: 'No payment attempt found for this order' });
    }

    return {
      status: attempt.status.toLowerCase(),
      paymentAttemptId: attempt.id,
    };
  }
}
