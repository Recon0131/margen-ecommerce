'use client';

import React from 'react';
import type { ProductSummary } from '../lib/product-types';
import { formatPrice } from '../lib/product-types';

type ProductCardProps = {
  product: ProductSummary;
};

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--color-bg-surface)',
  border: 'var(--border)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
  transition: 'box-shadow var(--transition-fast), border-color var(--transition-fast)',
  textDecoration: 'none',
  color: 'inherit',
};

const imageContainerStyle: React.CSSProperties = {
  width: '100%',
  aspectRatio: '4 / 3',
  background: 'var(--color-bg-muted)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
};

const bodyStyle: React.CSSProperties = {
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  flex: 1,
};

const nameStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '1.0625rem',
  fontWeight: 600,
  lineHeight: 1.3,
  color: 'var(--color-text)',
};

const priceStyle: React.CSSProperties = {
  fontSize: '1.125rem',
  fontWeight: 600,
  color: 'var(--color-accent)',
  marginTop: 'auto',
};

const skuStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--color-text-muted)',
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <a
      href={`/producto/${product.slug}`}
      data-testid="product-card"
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.borderColor = 'var(--color-border-strong)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--color-border)';
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-accent)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={imageContainerStyle}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          {product.sku}
        </span>
      </div>
      <div style={bodyStyle}>
        <h3 style={nameStyle}>{product.name}</h3>
        <span style={skuStyle}>{product.sku}</span>
        <span style={priceStyle}>{formatPrice(product.priceMinor)}</span>
      </div>
    </a>
  );
}
