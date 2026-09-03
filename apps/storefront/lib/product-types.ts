export type ProductSummary = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  priceMinor: string;
  currency: 'PEN';
  categorySlug?: string;
  thumbnail?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
};

export type ProductDetail = ProductSummary & {
  description: string;
  images: { url: string; alt: string }[];
  createdAt: string;
  updatedAt: string;
};

export type CategorySummary = {
  id: string;
  slug: string;
  name: string;
  active: boolean;
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  source: string;
};

export type ProductQuery = {
  page?: number;
  limit?: number;
  category?: string;
  q?: string;
};

function formatPrice(minorUnits: string): string {
  const cents = parseInt(minorUnits, 10);
  const soles = Math.floor(cents / 100);
  const centavos = cents % 100;
  return `S/ ${soles.toLocaleString('es-PE')}.${centavos.toString().padStart(2, '0')}`;
}

export { formatPrice };
