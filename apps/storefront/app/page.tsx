import Link from 'next/link';
import { getProducts, getCategories } from '../lib/api-client';
import { ProductCard } from '../components/ProductCard';
import { StatusMessage } from '@margen/ui';
import type { Page, ProductSummary, CategorySummary } from '../lib/product-types';

const CATEGORY_LABELS: Record<string, string> = {
  smartphones: 'Smartphones',
  laptops: 'Laptops',
  tablets: 'Tablets',
  'mobile-accessories': 'Accesorios móviles',
  accesorios: 'Accesorios',
  beauty: 'Belleza',
  fragrances: 'Perfumes',
  furniture: 'Muebles',
  groceries: 'Alimentos',
  'home-decoration': 'Hogar y decoración',
  'kitchen-accessories': 'Cocina',
  'mens-shoes': 'Calzado',
  'womens-shoes': 'Calzado',
  'mens-watches': 'Relojes',
  'womens-watches': 'Relojes',
  sunglasses: 'Lentes de sol',
  'sports-accessories': 'Deportes',
  'skin-care': 'Cuidado de la piel',
  motorcycle: 'Motos',
  vehicle: 'Vehículos',
};

const TRUST_ITEMS = [
  { title: 'Envío rápido', desc: 'Lima y principales ciudades en 24–48h' },
  { title: 'Pago seguro', desc: 'Visa, Mastercard, Yape y transferencia' },
  { title: 'Garantía real', desc: 'Cambio sin costo dentro de los 7 días' },
  { title: 'Atención local', desc: 'Soporte en español por WhatsApp y chat' },
];

export default async function HomePage() {
  let featured: Page<ProductSummary> = { items: [], total: 0, page: 1, limit: 8, source: '' };
  let categories: CategorySummary[] = [];
  let error: string | null = null;

  try {
    const [featuredResult, categoriesResult] = await Promise.all([
      getProducts({ page: 1, limit: 8 }),
      getCategories(),
    ]);
    featured = featuredResult;
    categories = categoriesResult;
  } catch {
    error = 'No se pudieron cargar los productos. Intenta de nuevo más tarde.';
  }

  const activeCategories = categories.filter((c) => c.active);

  const TECH_SLUGS = ['smartphones', 'laptops', 'tablets', 'mobile-accessories', 'accesorios'];
  const headline: { slug: string; label: string }[] = [];
  const seen = new Set<string>();
  for (const slug of [...TECH_SLUGS, ...activeCategories.map((c) => c.slug)]) {
    const cat = activeCategories.find((c) => c.slug === slug);
    if (!cat || seen.has(cat.id)) continue;
    seen.add(cat.id);
    headline.push({ slug: cat.slug, label: CATEGORY_LABELS[cat.slug] ?? cat.name });
    if (headline.length >= 3) break;
  }

  const subtitle = headline.length
    ? `${headline.map((h) => h.label).join(', ')}${
        activeCategories.length > headline.length ? ' y más' : ''
      } en soles, con envío rápido en Perú y una tienda que habla tu idioma.`
    : 'Compra en soles, con envío rápido en Perú y una tienda que habla tu idioma.';

  const primaryCategory = headline[0];

  return (
    <div>
      {/* Hero */}
      <section
        style={{
          background: 'radial-gradient(1200px 600px at 80% -20%, var(--color-accent-subtle), transparent 60%), var(--color-bg)',
          borderBottom: 'var(--border)',
        }}
      >
        <div className="container" style={{ paddingTop: 'var(--space-20)', paddingBottom: 'var(--space-20)' }}>
          <div style={{ maxWidth: 640 }}>
            <span className="badge badge-accent">
              Nuevo catálogo{featured.total ? ` · ${featured.total} productos` : ''}
            </span>
            <h1
              style={{
                fontSize: 'var(--text-4xl)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                marginTop: 'var(--space-4)',
                marginBottom: 'var(--space-6)',
              }}
            >
              Encuentra todo, con confianza local.
            </h1>
            <p style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-8)' }}>
              {subtitle}
            </p>
            <div className="row" style={{ gap: 'var(--space-4)' }}>
              <Link href="/catalogo" className="btn btn-primary btn-lg">
                Explorar catálogo
              </Link>
              {primaryCategory && (
                <Link
                  href={`/catalogo?category=${encodeURIComponent(primaryCategory.slug)}`}
                  className="btn btn-secondary btn-lg"
                >
                  Ver {primaryCategory.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="container page">
        <div className="row-between" style={{ marginBottom: 'var(--space-6)' }}>
          <div>
            <h2 className="section-title">Destacados</h2>
            <p className="text-muted" style={{ marginBottom: 0 }}>
              Lo más vendido de la semana
            </p>
          </div>
          <Link href="/catalogo" className="btn btn-ghost btn-md">
            Ver todo →
          </Link>
        </div>

        {error ? (
          <StatusMessage variant="error">{error}</StatusMessage>
        ) : featured.items.length === 0 ? (
          <StatusMessage variant="info">Aún no hay productos publicados.</StatusMessage>
        ) : (
          <div className="catalog-grid" data-testid="product-grid">
            {featured.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Categories */}
      {activeCategories.length > 0 && (
        <section className="container" style={{ paddingBottom: 'var(--space-16)' }}>
          <h2 className="section-title text-center">Compra por categoría</h2>
          <p className="section-subtitle text-center">Encuentra justo lo que necesitas</p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {activeCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/catalogo?category=${encodeURIComponent(cat.slug)}`}
                className="card category-tile"
                style={{
                  padding: 'var(--space-6)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-accent-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    marginBottom: 'var(--space-3)',
                  }}
                  aria-hidden="true"
                >
                  →
                </div>
                <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{cat.name}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trust band */}
      <section style={{ background: 'var(--color-bg-subtle)', borderTop: 'var(--border)', borderBottom: 'var(--border)' }}>
        <div className="container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'var(--space-8)',
            }}
          >
            {TRUST_ITEMS.map((item) => (
              <div key={item.title}>
                <div style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>
                  {item.title}
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
