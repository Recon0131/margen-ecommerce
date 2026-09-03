import Link from 'next/link';
import { getProductBySlug } from '../../../lib/api-client';
import { formatPrice } from '../../../lib/product-types';
import { Badge, StatusMessage } from '@margen/ui';
import { AddToCart } from '../../../components/AddToCart';
import { ProductGallery } from '../../../components/ProductGallery';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  let product;
  try {
    product = await getProductBySlug(slug);
  } catch {
    return (
      <div className="page">
        <div className="container">
          <StatusMessage variant="error">No se pudo cargar el producto. Intenta de nuevo.</StatusMessage>
        </div>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  return (
    <div className="page">
      <div className="container">
        <nav className="breadcrumb" aria-label="Ruta">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">/</span>
          <Link href="/catalogo">Catálogo</Link>
          <span aria-hidden="true">/</span>
          <span>{product.name}</span>
        </nav>

        <div className="product-detail-layout">
          <ProductGallery images={product.images} fallback={product.sku} />

          <div>
            <div className="row" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <Badge variant="muted">{product.sku}</Badge>
              {product.categorySlug && <Badge variant="accent">{product.categorySlug}</Badge>}
            </div>

            <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-4)' }}>{product.name}</h1>

            <p
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 800,
                color: 'var(--color-accent)',
                marginBottom: 'var(--space-6)',
              }}
            >
              {formatPrice(product.priceMinor)}
            </p>

            <div
              className="card"
              style={{ padding: 'var(--space-5)', maxWidth: 380 }}
            >
              <ul style={{ listStyle: 'none', marginBottom: 'var(--space-4)' }}>
                <li className="row" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  <span style={{ color: 'var(--color-success)' }}>✓</span> Envío a todo el Perú
                </li>
                <li className="row" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  <span style={{ color: 'var(--color-success)' }}>✓</span> Garantía de 7 días
                </li>
                <li className="row" style={{ gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  <span style={{ color: 'var(--color-success)' }}>✓</span> Stock disponible
                </li>
              </ul>
              <AddToCart sku={product.sku} name={product.name} />
            </div>

            {product.description && (
              <div style={{ marginTop: 'var(--space-8)', maxWidth: 560 }}>
                <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>Descripción</h2>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 'var(--leading-relaxed)' }}>
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
