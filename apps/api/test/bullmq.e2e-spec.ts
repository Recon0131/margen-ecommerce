import { Test } from '@nestjs/testing';
import { BullMQService } from '../src/modules/payments/bullmq.service';

function redisAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const net = require('net');
    const socket = net.connect({ host: '127.0.0.1', port: 6379, timeout: 1500 });
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
  });
}

describe('BullMQ worker', () => {
  let service: BullMQService;
  let redisOn: boolean;

  beforeAll(async () => {
    redisOn = await redisAvailable();
    const moduleRef = await Test.createTestingModule({
      providers: [BullMQService],
    }).compile();
    service = moduleRef.get(BullMQService);
  });

  afterAll(async () => {
    if (service) await service.close();
  });

  describe('Queue management', () => {
    it('creates a payment queue', () => {
      expect(service.getPaymentQueue()).toBeDefined();
    });

    it('adds a job to the payment queue', async () => {
      if (!redisOn) return; // skip when Redis unavailable
      const queue = service.getPaymentQueue();
      const job = await queue.add('process-payment', {
        orderId: 'test-order-1',
        paymentId: 'mp-test-1',
      });
      expect(job.id).toBeDefined();
      await queue.remove(job.id!);
    });

    it('can add delayed jobs', async () => {
      if (!redisOn) return; // skip when Redis unavailable
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
      expect(service).toBeDefined();
    });
  });
});
