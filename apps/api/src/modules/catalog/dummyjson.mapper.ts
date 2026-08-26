import { z } from 'zod';

const UPSTREAM_HOSTS = ['dummyjson.com'] as const;
const ALLOWED_PROTOCOLS = ['https:'] as const;

export function validateUpstreamUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('UPSTREAM_NOT_ALLOWED');
  }
  if (!ALLOWED_PROTOCOLS.includes(parsed.protocol as (typeof ALLOWED_PROTOCOLS)[number])) {
    throw new Error('UPSTREAM_NOT_ALLOWED');
  }
  if (!UPSTREAM_HOSTS.includes(parsed.hostname as (typeof UPSTREAM_HOSTS)[number])) {
    throw new Error('UPSTREAM_NOT_ALLOWED');
  }
  const privatePatterns = /^(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|::1)$/i;
  if (privatePatterns.test(parsed.hostname)) {
    throw new Error('UPSTREAM_NOT_ALLOWED');
  }
}

const upstreamProductSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  price: z.number().positive(),
  description: z.string().max(5000).default(''),
  category: z.string().max(100).default('general'),
  stock: z.number().int().nonnegative().default(0),
  images: z.array(z.string().url()).default([]),
  thumbnail: z.string().url().optional(),
});

export type UpstreamProduct = z.infer<typeof upstreamProductSchema>;

export function parseUpstreamProduct(input: unknown): UpstreamProduct {
  return upstreamProductSchema.parse(input);
}

const ALLOWED_UPSTREAM_IMAGE_HOSTS = ['cdn.dummyjson.com', 'dummyjson.com'] as const;

function sanitizeImageUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return null;
    if (!ALLOWED_UPSTREAM_IMAGE_HOSTS.includes(parsed.hostname as (typeof ALLOWED_UPSTREAM_IMAGE_HOSTS)[number])) return null;
    return url;
  } catch {
    return null;
  }
}

export type InternalProduct = {
  upstreamId: number;
  name: string;
  slug: string;
  sku: string;
  description: string;
  priceMinor: bigint;
  currency: 'PEN';
  categorySlug: string;
  images: { url: string; alt: string }[];
  stock: number;
};

function generateSku(upstreamId: number): string {
  return `DJ-${String(upstreamId).padStart(4, '0')}`;
}

const PEN_MINOR_UNITS_PER_UPSTREAM_UNIT = 100n;

export function mapDummyJsonProduct(input: unknown): InternalProduct {
  const raw = parseUpstreamProduct(input);

  const images: { url: string; alt: string }[] = [];
  for (const img of raw.images) {
    const sanitized = sanitizeImageUrl(img);
    if (sanitized) {
      images.push({ url: sanitized, alt: raw.title });
    }
  }
  if (raw.thumbnail) {
    const sanitized = sanitizeImageUrl(raw.thumbnail);
    if (sanitized && !images.some((i) => i.url === sanitized)) {
      images.push({ url: sanitized, alt: raw.title });
    }
  }

  return {
    upstreamId: raw.id,
    name: raw.title,
    slug: raw.slug,
    sku: generateSku(raw.id),
    description: raw.description,
    priceMinor: BigInt(Math.round(raw.price * Number(PEN_MINOR_UNITS_PER_UPSTREAM_UNIT))),
    currency: 'PEN',
    categorySlug: raw.category,
    images,
    stock: raw.stock,
  };
}
