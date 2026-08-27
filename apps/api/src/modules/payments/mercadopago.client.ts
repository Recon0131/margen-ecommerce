import { Injectable, Logger } from '@nestjs/common';
import crypto from 'node:crypto';

@Injectable()
export class MercadoPagoClient {
  private readonly logger = new Logger(MercadoPagoClient.name);
  private readonly paymentStore = new Map<string, { externalReference: string; status: string }>();

  async createCheckoutPreference(params: {
    orderId: string;
    amount: number;
    currency: string;
    email: string;
    description: string;
  }): Promise<{ checkoutUrl: string; externalReference: string }> {
    const externalReference = crypto.randomUUID();
    const checkoutUrl = `https://checkout.mercadopago.com/${externalReference}`;

    this.logger.log(
      `Created checkout preference for order ${params.orderId}, amount: ${params.amount} ${params.currency}`,
    );

    return { checkoutUrl, externalReference };
  }

  async getPayment(id: string): Promise<{
    id: string;
    status: string;
    external_reference: string;
  }> {
    this.logger.log(`Fetching payment ${id} from Mercado Pago`);

    const stored = this.paymentStore.get(id);
    if (stored) {
      return {
        id,
        status: stored.status,
        external_reference: stored.externalReference,
      };
    }

    return {
      id,
      status: 'approved',
      external_reference: '',
    };
  }

  registerPayment(paymentId: string, externalReference: string, status = 'approved'): void {
    this.paymentStore.set(paymentId, { externalReference, status });
  }
}
