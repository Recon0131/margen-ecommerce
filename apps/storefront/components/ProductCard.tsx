'use client';

import type { ProductSummary } from '../lib/product-types';
import { formatPrice } from '../lib/product-types';

type ProductCardProps = {
  product: ProductSummary;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <a
      href={`/producto/${product.slug}`}
      data-testid="product-card"
      className="product-card"
    >
      <div className="product-card-image">
        {product.thumbnail ? (
          <img src={product.thumbnail} alt={product.name} loading="lazy" />
        ) : (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--text-sm)',
            }}
          >
            {product.sku}
          </span>
        )}
      </div>
      <div className="product-card-body">
        <span className="product-card-sku">{product.sku}</span>
        <h3 className="product-card-name">{product.name}</h3>
        <span className="product-card-price">{formatPrice(product.priceMinor)}</span>
      </div>
    </a>
  );
}
