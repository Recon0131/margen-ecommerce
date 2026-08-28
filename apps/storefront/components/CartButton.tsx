'use client';

import { useCart } from '../lib/cart-context';

export function CartButton() {
  const { totalQuantity } = useCart();
  return (
    <a
      href="/carrito"
      style={{
        color: 'var(--color-text-muted)',
        textDecoration: 'none',
        fontSize: '0.9375rem',
        transition: 'color var(--transition-fast)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
      aria-label={`Carrito de compras, ${totalQuantity} artículos`}
    >
      Carrito
      {totalQuantity > 0 && (
        <span
          style={{
            background: 'var(--color-accent)',
            color: '#fff',
            borderRadius: '999px',
            fontSize: '0.75rem',
            minWidth: '18px',
            height: '18px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
          }}
          data-testid="cart-badge"
        >
          {totalQuantity}
        </span>
      )}
    </a>
  );
}
