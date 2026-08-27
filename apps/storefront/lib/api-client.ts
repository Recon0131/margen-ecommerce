import type { Page, ProductSummary, ProductDetail, CategorySummary, ProductQuery } from './product-types';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001';

export async function getProducts(query: ProductQuery = {}): Promise<Page<ProductSummary>> {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.category) params.set('category', query.category);
  if (query.q) params.set('query', query.q);

  const url = `${API_BASE}/v1/catalog/products?${params.toString()}`;
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const url = `${API_BASE}/v1/catalog/products/${encodeURIComponent(slug)}`;
  const res = await fetch(url, { cache: 'no-store' });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  return res.json();
}

export async function getCategories(): Promise<CategorySummary[]> {
  const url = `${API_BASE}/v1/catalog/categories`;
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) throw new Error(`API error: ${res.status}`);

  return res.json();
}
