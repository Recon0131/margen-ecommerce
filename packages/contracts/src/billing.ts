import { z } from 'zod';
export const InvoiceRequestSchema = z.object({ orderId: z.string().uuid(), documentType: z.enum(['BOLETA', 'FACTURA']), taxId: z.string().trim().regex(/^\d{8}(?:\d{3})?$/).optional() }).strict().superRefine((value, context) => { if (value.documentType === 'FACTURA' && !value.taxId) context.addIssue({ code: z.ZodIssueCode.custom, message: 'taxId is required for FACTURA', path: ['taxId'] }); });
export type InvoiceRequest = z.infer<typeof InvoiceRequestSchema>;

export const InvoiceCreateSchema = z.object({
  orderId: z.string().uuid(),
  type: z.enum(['BOLETA', 'FACTURA']),
  customerDoc: z.string().regex(/^\d{8}$|^\d{11}$/),
  customerName: z.string().trim().min(1).max(120),
}).strict();

export type InvoiceCreateInput = z.infer<typeof InvoiceCreateSchema>;
