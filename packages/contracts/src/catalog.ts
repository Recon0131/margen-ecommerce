import { z } from 'zod';

const slug = z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const allowedImageUrl = z.string().url().refine((value) => { const url = new URL(value); return url.protocol === 'https:' && ['dummyjson.com', 'cdn.margen.local'].includes(url.hostname); }, 'URL host is not allowed');
export const ProductQuerySchema = z.object({ query: z.string().trim().min(1).max(120).optional(), category: slug.optional(), page: z.coerce.number().int().min(1).max(10_000).default(1), limit: z.coerce.number().int().min(1).max(100).default(24) }).strict();
export const ProductImageSchema = z.object({ url: allowedImageUrl, alt: z.string().trim().min(1).max(160) }).strict();
export type ProductQuery = z.infer<typeof ProductQuerySchema>;
