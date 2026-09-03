'use client';

import { useCart } from '../../lib/cart-context';
import { useAuth } from '../../lib/auth-context';
import { Button, EmptyState, Input, StatusMessage } from '@margen/ui';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCartQuote, createCart } from '../../lib/api-client';
import { formatPrice } from '../../lib/product-types';

type Quote = {
  id: string;
  lines: { sku: string; productName: string; quantity: number; unitPriceMinor: string }[];
  subtotalMinor: string;
  totalMinor: string;
};

function lineTotalMinor(line: { unitPriceMinor: string; quantity: number }): string {
  return (BigInt(line.unitPriceMinor) * BigInt(line.quantity)).toString();
}

export default function CarritoPage() {
  const { lines, setQuantity, removeLine } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (lines.length === 0) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    createCart(lines)
      .then(async (cart) => {
        try {
          if (cancelled) return;
          const q = await getCartQuote(cart.id);
          if (!cancelled) setQuote(q);
        } catch (e: any) {
          if (!cancelled) setError(e.message ?? 'Error al cargar el carrito');
        } finally {
          if (!cancelled) setLoading(false);
        }
      })
      .catch((e: any) => {
        if (!cancelled) {
          setError(e.message ?? 'Error al cargar el carrito');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [lines]);

  if (lines.length === 0) {
    return (
      <div className="page">
        <div className="container">
          <EmptyState
            title="Tu carrito está vacío"
            description="Explora el catálogo y añade accesorios que te gusten."
            actionLabel="Ir al catálogo"
            actionHref="/catalogo"
          />
        </div>
      </div>
    );
  }

  const itemRows = quote?.lines ?? [];

  return (
    <div className="page">
      <div className="container">
        <h1 style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-6)' }}>Carrito</h1>

        {error && <StatusMessage variant="error">{error}</StatusMessage>}
        {loading && !quote && <p className="text-muted">Calculando precios…</p>}

        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Cantidad</th>
              <th>Subtotal</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {itemRows.map((line) => (
              <tr key={line.sku}>
                <td>{line.productName}</td>
                <td>{formatPrice(line.unitPriceMinor)}</td>
                <td>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={line.quantity}
                    onChange={(e) => setQuantity(line.sku, Number(e.target.value))}
                    aria-label={`Cantidad de ${line.productName}`}
                    style={{ width: 72, padding: 'var(--space-2)' }}
                  />
                </td>
                <td>{formatPrice(lineTotalMinor(line))}</td>
                <td>
                  <button
                    onClick={() => removeLine(line.sku)}
                    className="btn btn-ghost btn-sm"
                    aria-label={`Eliminar ${line.productName}`}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="row-between" style={{ marginTop: 'var(--space-6)', flexWrap: 'wrap' }}>
          <div>
            <span className="text-muted" style={{ marginRight: 'var(--space-2)' }}>
              Total:
            </span>
            <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-accent)' }}>
              {quote ? formatPrice(quote.totalMinor) : '—'}
            </span>
          </div>
          <a href="/checkout" style={{ maxWidth: 260, width: '100%' }}>
            <Button fullWidth>Proceder al pago</Button>
          </a>
        </div>
      </div>
    </div>
  );
}
