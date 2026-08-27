import { getProducts, getCategories } from '../../lib/api-client';
import { ProductCard } from '../../components/ProductCard';
import { CatalogFilters } from '../../components/CatalogFilters';
import { CatalogSearch } from '../../components/CatalogSearch';
import { StatusMessage } from '@margen/ui';
import type { Page, ProductSummary, CategorySummary } from '../../lib/product-types';

type Props = {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
};

export default async function CatalogoPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q ?? '';
  const category = params.category ?? '';
  const page = Number(params.page ?? 1);

  let products: Page<ProductSummary> = { items: [], total: 0, page: 1, limit: 24, source: '' };
  let categories: CategorySummary[] = [];
  let error: string | null = null;

  try {
    const [productsResult, categoriesResult] = await Promise.all([
      getProducts({ page, limit: 24, category: category || undefined, q: query || undefined }),
      getCategories(),
    ]);
    products = productsResult;
    categories = categoriesResult;
  } catch (err) {
    error = 'No se pudo conectar con el servidor. Intenta de nuevo.';
  }

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '8px' }}>
        Catálogo
      </h1>
      <CatalogSearch defaultQuery={query} />
      <CatalogFilters categories={categories} activeCategory={category} query={query} />

      {error && <StatusMessage variant="error">{error}</StatusMessage>}

      {!error && products.items.length === 0 && (
        <StatusMessage variant="info">
          No se encontraron productos{query ? ` para "${query}"` : ''}. Intenta con otros términos.
        </StatusMessage>
      )}

      <div className="catalog-grid" data-testid="product-grid">
        {products.items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  );
}
