import { z } from 'zod';

export const ProductSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  sku: z.string(),
  name: z.string(),
  priceMinor: z.bigint(),
  currency: z.literal('PEN'),
  categorySlug: z.string().optional(),
  thumbnail: z.string().url().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
});

export type ProductSummary = z.infer<typeof ProductSummarySchema>;

export const ProductDetailSchema = ProductSummarySchema.extend({
  description: z.string(),
  images: z.array(z.object({ url: z.string().url(), alt: z.string() })),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProductDetail = z.infer<typeof ProductDetailSchema>;

export const CategorySummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  active: z.boolean(),
});

export type CategorySummary = z.infer<typeof CategorySummarySchema>;

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  source: 'database';
};
