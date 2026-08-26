import { z } from 'zod';
import { CartLineSchema } from './cart';
const address = z.object({ recipient: z.string().trim().min(1).max(120), line1: z.string().trim().min(1).max(160), line2: z.string().trim().max(160).optional(), district: z.string().trim().min(1).max(100), city: z.string().trim().min(1).max(100), country: z.literal('PE') }).strict();
export const CreateOrderSchema = z.object({ cartId: z.string().uuid(), lines: z.array(CartLineSchema).min(1).max(50), shippingAddress: address, idempotencyKey: z.string().uuid(), invoiceType: z.enum(['BOLETA', 'FACTURA']) }).strict();
export type CreateOrder = z.infer<typeof CreateOrderSchema>;
