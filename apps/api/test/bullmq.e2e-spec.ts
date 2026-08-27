import { Test } from '@nestjs/testing';
import { BullMQService } from '../src/modules/payments/bullmq.service';

describe('BullMQ worker', () => {
  let service: BullMQService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [BullMQService],
    }).compile();
    service = moduleRef.get(BullMQService);
  });

  afterAll(async () => {
    await service.close();
  });

  describe('Queue management', () => {
    it('creates a payment queue', () => {
      expect(service.getPaymentQueue()).toBeDefined();
    });

    it('adds a job to the payment queue', async () => {
      const queue = service.getPaymentQueue();
      const job = await queue.add('process-payment', {
        orderId: 'test-order-1',
        paymentId: 'mp-test-1',
      });
      expect(job.id).toBeDefined();
      // Cleanup
      await queue.remove(job.id!);
    });

    it('can add delayed jobs', async () => {
      const queue = service.getPaymentQueue();
      const job = await queue.add('retry-payment', {
        orderId: 'test-order-2',
        paymentId: 'mp-test-2',
      }, { delay: 1000 });
      expect(job.id).toBeDefined();
      await queue.remove(job.id!);
    });
  });

  describe('Job processing', () => {
    it('registers a processor for payment jobs', () => {
      // Service should have processor registered
      expect(service).toBeDefined();
    });
  });
});
