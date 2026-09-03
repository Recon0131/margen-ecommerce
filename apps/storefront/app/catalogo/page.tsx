import Link from 'next/link';
import { getProducts, getCategories } from '../../lib/api-client';
import { ProductCard } from '../../components/ProductCard';
import { CatalogFilters } from '../../components/CatalogFilters';
import { CatalogSearch } from '../../components/CatalogSearch';
import { StatusMessage } from '@margen/ui';
import type { Page, ProductSummary, CategorySummary } from '../../lib/product-types';

type Props = {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
};

const PAGE_SIZE = 24;

export default async function CatalogoPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q ?? '';
  const category = params.category ?? '';
  const page = Math.max(1, Number(params.page ?? 1));

  let products: Page<ProductSummary> = { items: [], total: 0, page, limit: PAGE_SIZE, source: '' };
  let categories: CategorySummary[] = [];
  let error: string | null = null;

  try {
    const [productsResult, categoriesResult] = await Promise.all([
      getProducts({ page, limit: PAGE_SIZE, category: category || undefined, q: query || undefined }),
      getCategories(),
    ]);
    products = productsResult;
    categories = categoriesResult;
  } catch {
    error = 'No se pudo conectar con el servidor. Intenta de nuevo.';
  }

  const totalPages = Math.max(1, Math.ceil(products.total / PAGE_SIZE));

  function buildHref(p: number) {
    const sp = new URLSearchParams();
    if (query) sp.set('q', query);
    if (category) sp.set('category', category);
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return qs ? `/catalogo?${qs}` : '/catalogo';
  }

  return (
    <div className="page">
      <div className="container">
        <nav className="breadcrumb" aria-label="Ruta">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">/</span>
          <span>Catálogo</span>
        </nav>

        <div className="row-between" style={{ alignItems: 'flex-end', marginBottom: 'var(--space-2)' }}>
          <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 0 }}>Catálogo</h1>
          {!error && (
            <span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
              {products.total} producto{products.total === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <p className="text-muted mb-6">Accesorios tecnológicos seleccionados y con garantía.</p>

        <CatalogSearch defaultQuery={query} />
        <CatalogFilters categories={categories} activeCategory={category} query={query} />

        {error && <StatusMessage variant="error">{error}</StatusMessage>}

        {!error && products.items.length === 0 && (
          <StatusMessage variant="info">
            No se encontraron productos{query ? ` para "${query}"` : ''}. Intenta con otros términos.
          </StatusMessage>
        )}

        {!error && products.items.length > 0 && (
          <div className="catalog-grid" data-testid="product-grid">
            {products.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!error && totalPages > 1 && (
          <nav
            aria-label="Paginación"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-10)' }}
          >
            <Link
              href={buildHref(page - 1)}
              className={`btn btn-secondary btn-sm ${page <= 1 ? 'btn-disabled' : ''}`}
              aria-disabled={page <= 1}
              style={page <= 1 ? { pointerEvents: 'none', opacity: 0.5 } : undefined}
            >
              ← Anterior
            </Link>
            <span className="badge badge-muted" style={{ fontSize: 'var(--text-sm)' }}>
              Página {page} de {totalPages}
            </span>
            <Link
              href={buildHref(page + 1)}
              className={`btn btn-secondary btn-sm ${page >= totalPages ? 'btn-disabled' : ''}`}
              aria-disabled={page >= totalPages}
              style={page >= totalPages ? { pointerEvents: 'none', opacity: 0.5 } : undefined}
            >
              Siguiente →
            </Link>
          </nav>
        )}
      </div>
    </div>
  );
}
