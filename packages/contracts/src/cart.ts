import { z } from 'zod';
const sku = z.string().trim().min(1).max(64).regex(/^[A-Z0-9][A-Z0-9-]*$/);
export const CartLineSchema = z.object({ sku, quantity: z.number().int().finite().min(1).max(100) }).strict();
export const UpdateCartSchema = z.object({ lines: z.array(CartLineSchema).min(1).max(50) }).strict();
export type CartLine = z.infer<typeof CartLineSchema>;
