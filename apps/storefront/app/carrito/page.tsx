'use client';

import { useCart } from '../../lib/cart-context';
import { Button, StatusMessage } from '@margen/ui';
import { useEffect, useState } from 'react';
import { getCartQuote, createCart } from '../../lib/api-client';
import { formatPrice } from '../../lib/product-types';

export default function CarritoPage() {
  const { lines, setQuantity, removeLine } = useCart();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lines.length === 0) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    createCart(lines).then(async (cart) => {
      try {
        if (cancelled) return;
        const q = await getCartQuote(cart.id);
        if (!cancelled) setQuote(q);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Error al cargar el carrito');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }).catch((e: any) => {
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
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '12px' }}>Tu carrito está vacío</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>Explora el catálogo y añade productos.</p>
        <a href="/catalogo">
          <Button>Ir al catálogo</Button>
        </a>
      </div>
    );
  }

  const itemRows = (quote?.lines ?? lines.map((l) => ({ sku: l.sku, productName: l.sku, quantity: l.quantity, unitPriceMinor: '0', lineTotalMinor: '0' })));

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '24px' }}>Carrito</h1>

      {error && <StatusMessage variant="error">{error}</StatusMessage>}
      {loading && !quote && <p style={{ color: 'var(--color-text-muted)' }}>Calculando precios…</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: 'var(--border)', color: 'var(--color-text-muted)' }}>
            <th style={{ padding: '8px' }}>Producto</th>
            <th style={{ padding: '8px' }}>Precio</th>
            <th style={{ padding: '8px' }}>Cantidad</th>
            <th style={{ padding: '8px' }}>Subtotal</th>
            <th style={{ padding: '8px' }}></th>
          </tr>
        </thead>
        <tbody>
          {itemRows.map((line: any) => (
            <tr key={line.sku} style={{ borderBottom: 'var(--border)' }}>
              <td style={{ padding: '12px 8px' }}>{line.productName}</td>
              <td style={{ padding: '12px 8px' }}>{formatPrice(line.unitPriceMinor)}</td>
              <td style={{ padding: '12px 8px' }}>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={line.quantity}
                  onChange={(e) => setQuantity(line.sku, Number(e.target.value))}
                  style={{ width: '64px', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: 'var(--border)', background: 'var(--color-bg)' }}
                  aria-label={`Cantidad de ${line.productName}`}
                />
              </td>
              <td style={{ padding: '12px 8px' }}>{formatPrice(line.lineTotalMinor)}</td>
              <td style={{ padding: '12px 8px' }}>
                <button
                  onClick={() => removeLine(line.sku)}
                  style={{ color: 'var(--color-danger, #c0392b)', background: 'none', border: 'none', cursor: 'pointer' }}
                  aria-label={`Eliminar ${line.productName}`}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', alignItems: 'center' }}>
        <div>
          <span style={{ color: 'var(--color-text-muted)', marginRight: '8px' }}>Total:</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-accent)' }}>
            {quote ? formatPrice(quote.totalMinor) : '—'}
          </span>
        </div>
        <a href="/checkout">
          <Button fullWidth>Proceder al pago</Button>
        </a>
      </div>
    </div>
  );
}
