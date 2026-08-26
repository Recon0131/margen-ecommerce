import { Injectable } from '@nestjs/common';
import { validateUpstreamUrl } from './dummyjson.mapper';

const UPSTREAM_BASE = 'https://dummyjson.com';
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

export type UpstreamListParams = {
  limit: number;
  skip: number;
  category?: string;
  query?: string;
};

function buildUpstreamUrl(path: string, params: Record<string, string | number | undefined>): string {
  const url = new URL(path, UPSTREAM_BASE);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }
  validateUpstreamUrl(url.toString());
  return url.toString();
}

@Injectable()
export class DummyJsonClient {
  async fetchProducts(params: UpstreamListParams): Promise<unknown> {
    const url = buildUpstreamUrl('/products', {
      limit: params.limit,
      skip: params.skip,
      category: params.category,
      q: params.query,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Upstream returned ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_BYTES) {
        throw new Error('Response too large');
      }

      const text = await response.text();
      if (text.length > MAX_RESPONSE_BYTES) {
        throw new Error('Response too large');
      }

      return JSON.parse(text);
    } finally {
      clearTimeout(timeout);
    }
  }

  async fetchCategories(): Promise<unknown> {
    const url = buildUpstreamUrl('/products/category-list', {});

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Upstream returned ${response.status}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }
}
