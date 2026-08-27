'use client';

import React from 'react';
import type { CategorySummary } from '../lib/product-types';

type CatalogFiltersProps = {
  categories: CategorySummary[];
  activeCategory?: string;
  query?: string;
};

const barStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '12px',
  padding: '16px 0',
};

const chipBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 14px',
  fontSize: '0.875rem',
  fontFamily: 'var(--font-sans)',
  borderRadius: 'var(--radius-lg)',
  border: 'var(--border)',
  background: 'var(--color-bg-surface)',
  color: 'var(--color-text-muted)',
  textDecoration: 'none',
  transition: 'background var(--transition-fast), color var(--transition-fast)',
};

const chipActive: React.CSSProperties = {
  background: 'var(--color-accent)',
  color: 'var(--color-text-inverse)',
  borderColor: 'var(--color-accent)',
};

export function CatalogFilters({ categories, activeCategory }: CatalogFiltersProps) {
  return (
    <div style={barStyle} role="navigation" aria-label="Filtros de categoría">
      <a
        href="/catalogo"
        style={{
          ...chipBase,
          ...(activeCategory ? {} : chipActive),
        }}
        aria-current={!activeCategory ? 'page' : undefined}
      >
        Todos
      </a>
      {categories.map((cat) => (
        <a
          key={cat.id}
          href={`/catalogo?category=${encodeURIComponent(cat.slug)}`}
          style={{
            ...chipBase,
            ...(activeCategory === cat.slug ? chipActive : {}),
          }}
          aria-current={activeCategory === cat.slug ? 'page' : undefined}
        >
          {cat.name}
        </a>
      ))}
    </div>
  );
}
