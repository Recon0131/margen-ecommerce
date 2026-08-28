import { getProductBySlug } from '../../../lib/api-client';
import { formatPrice } from '../../../lib/product-types';
import { StatusMessage } from '@margen/ui';
import { AddToCart } from '../../../components/AddToCart';
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
      <StatusMessage variant="error">
        No se pudo cargar el producto. Intenta de nuevo.
      </StatusMessage>
    );
  }

  if (!product) {
    notFound();
  }

  return (
    <>
      <nav style={{ marginBottom: '24px', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
        <a href="/catalogo">Catálogo</a>
        <span style={{ margin: '0 8px' }}>/</span>
        <span>{product.name}</span>
      </nav>

      <div className="product-detail-layout">
        <div
          style={{
            width: '100%',
            aspectRatio: '1',
            background: 'var(--color-bg-muted)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'var(--border)',
          }}
        >
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].alt}
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
            />
          ) : (
            <span style={{ color: 'var(--color-text-muted)' }}>{product.sku}</span>
          )}
        </div>

        <div>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '2rem',
              marginBottom: '8px',
              lineHeight: 1.2,
            }}
          >
            {product.name}
          </h1>

          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            SKU: {product.sku}
          </p>

          <p
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--color-accent)',
              marginBottom: '24px',
            }}
          >
            {formatPrice(product.priceMinor)}
          </p>

          {product.description && (
            <div style={{ marginBottom: '24px', lineHeight: 1.7, color: 'var(--color-text)' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '8px' }}>
                Descripción
              </h2>
              <p>{product.description}</p>
            </div>
          )}

          {product.categorySlug && (
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Categoría: {product.categorySlug}
            </p>
          )}

          <div style={{ marginTop: '24px' }}>
            <AddToCart sku={product.sku} name={product.name} />
          </div>
        </div>
      </div>
    </>
  );
}
