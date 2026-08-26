import { z } from 'zod';
export const InvoiceRequestSchema = z.object({ orderId: z.string().uuid(), documentType: z.enum(['BOLETA', 'FACTURA']), taxId: z.string().trim().regex(/^\d{8}(?:\d{3})?$/).optional() }).strict().superRefine((value, context) => { if (value.documentType === 'FACTURA' && !value.taxId) context.addIssue({ code: z.ZodIssueCode.custom, message: 'taxId is required for FACTURA', path: ['taxId'] }); });
export type InvoiceRequest = z.infer<typeof InvoiceRequestSchema>;
