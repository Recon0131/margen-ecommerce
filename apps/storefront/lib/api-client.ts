import type { Page, ProductSummary, ProductDetail, CategorySummary, ProductQuery } from './product-types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL ?? 'http://localhost:3001';

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

export type CartLine = { sku: string; quantity: number };
export type Cart = {
  id: string;
  lines: CartLine[];
  createdAt: string;
  updatedAt: string;
};

async function jsonRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `API error: ${res.status}`);
  }
  return res.json();
}

export async function jsonRequestWithCookies<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    cache: 'no-store',
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `API error: ${res.status}`);
  }
  return res.json();
}

function cartPayload(lines: CartLine[]): { sku: string; quantity: number }[] {
  return lines.map((l) => ({ sku: l.sku, quantity: l.quantity }));
}

export async function createCart(lines: CartLine[]): Promise<Cart> {
  return jsonRequestWithCookies<Cart>('/v1/cart', { method: 'POST', body: JSON.stringify({ lines: cartPayload(lines) }) });
}

export async function updateCart(id: string, lines: CartLine[]): Promise<Cart> {
  return jsonRequestWithCookies<Cart>(`/v1/cart/${id}`, { method: 'PATCH', body: JSON.stringify({ lines: cartPayload(lines) }) });
}

export async function getCartQuote(cartId: string): Promise<{
  id: string;
  lines: { sku: string; productName: string; quantity: number; unitPriceMinor: string; lineTotalMinor: string }[];
  subtotalMinor: string;
  totalMinor: string;
}> {
  return jsonRequestWithCookies(`/v1/cart/quote?cartId=${encodeURIComponent(cartId)}`);
}

export async function getUserCart(): Promise<Cart> {
  return jsonRequestWithCookies<Cart>('/v1/cart');
}

export async function createOrder(input: {
  cartId: string;
  lines: CartLine[];
  shippingAddress: {
    recipient: string;
    line1: string;
    district: string;
    city: string;
    country: 'PE';
  };
  idempotencyKey: string;
  invoiceType: 'BOLETA' | 'FACTURA';
}): Promise<{ id: string; publicId: string; status: string; totalMinor: string }> {
  const body = JSON.stringify({ ...input, lines: cartPayload(input.lines) });
  return jsonRequestWithCookies('/v1/orders', { method: 'POST', body });
}

export async function getOrderPayments(orderId: string): Promise<{ status: string }> {
  return jsonRequestWithCookies(`/v1/payments/${encodeURIComponent(orderId)}`);
}

export async function createCheckout(orderId: string): Promise<{ checkoutUrl: string; externalReference: string }> {
  return jsonRequestWithCookies('/v1/payments/checkout', { method: 'POST', body: JSON.stringify({ orderId }) });
}

export async function generateInvoice(input: {
  orderId: string;
  type: 'BOLETA' | 'FACTURA';
  customerDoc: string;
  customerName: string;
}): Promise<{ invoiceId: string; type: string; series: string; number: number }> {
  return jsonRequestWithCookies('/v1/invoices', { method: 'POST', body: JSON.stringify(input) });
}

export async function registerCustomer(input: {
  email: string;
  password: string;
}): Promise<{ id: string; email: string }> {
  return jsonRequestWithCookies('/v1/auth/register', { method: 'POST', body: JSON.stringify(input) });
}

export async function loginCustomer(input: {
  email: string;
  password: string;
}): Promise<{ userId: string }> {
  return jsonRequestWithCookies('/v1/auth/login', { method: 'POST', body: JSON.stringify(input) });
}

export async function getMe(): Promise<{ id: string; email: string } | null> {
  const res = await fetch(`${API_BASE}/v1/auth/me`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    credentials: 'include',
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function logoutCustomer(): Promise<{ ok: boolean }> {
  return jsonRequestWithCookies('/v1/auth/logout', { method: 'POST' });
}
