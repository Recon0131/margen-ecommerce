import { z } from 'zod';
export const PaymentWebhookSchema = z.object({ id: z.string().trim().min(1).max(128), type: z.enum(['payment']), data: z.object({ id: z.string().trim().min(1).max(128) }).strict(), action: z.string().trim().min(1).max(128).optional() }).strict();
export type PaymentWebhook = z.infer<typeof PaymentWebhookSchema>;

export const CheckoutRequestSchema = z.object({ orderId: z.string().uuid() }).strict();
export type CheckoutRequest = z.infer<typeof CheckoutRequestSchema>;
