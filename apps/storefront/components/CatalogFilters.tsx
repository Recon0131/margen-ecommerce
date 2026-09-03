'use client';

import type { CategorySummary } from '../lib/product-types';

type CatalogFiltersProps = {
  categories: CategorySummary[];
  activeCategory?: string;
  query?: string;
};

export function CatalogFilters({ categories, activeCategory }: CatalogFiltersProps) {
  return (
    <div
      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-4) 0' }}
      role="navigation"
      aria-label="Filtros de categoría"
    >
      <a
        href="/catalogo"
        className={`chip ${activeCategory ? '' : 'is-active'}`}
        aria-current={!activeCategory ? 'page' : undefined}
      >
        Todos
      </a>
      {categories.map((cat) => (
        <a
          key={cat.id}
          href={`/catalogo?category=${encodeURIComponent(cat.slug)}`}
          className={`chip ${activeCategory === cat.slug ? 'is-active' : ''}`}
          aria-current={activeCategory === cat.slug ? 'page' : undefined}
        >
          {cat.name}
        </a>
      ))}
    </div>
  );
}
