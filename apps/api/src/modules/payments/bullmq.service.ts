import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';

@Injectable()
export class BullMQService implements OnModuleDestroy {
  private readonly logger = new Logger(BullMQService.name);
  private paymentQueue: Queue | null = null;
  private paymentWorker: Worker | null = null;

  private getConnection() {
    return {
      host: process.env.REDIS_HOST ?? '127.0.0.1',
      port: Number(process.env.REDIS_PORT ?? 6379),
    };
  }

  getPaymentQueue(): Queue {
    if (!this.paymentQueue) {
      this.paymentQueue = new Queue('payments', { connection: this.getConnection() });
    }
    return this.paymentQueue;
  }

  async close(): Promise<void> {
    try {
      if (this.paymentWorker) {
        await this.paymentWorker.close();
      }
    } catch {
      // ignore close errors
    }
    this.paymentWorker = null;

    try {
      if (this.paymentQueue) {
        await this.paymentQueue.close();
      }
    } catch {
      // ignore close errors
    }
    this.paymentQueue = null;
  }

  async onModuleDestroy(): Promise<void> {
    await this.close();
  }
}
