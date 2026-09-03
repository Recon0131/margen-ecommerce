'use client';

import { useCart } from '../lib/cart-context';
import { useAuth } from '../lib/auth-context';

export function CartButton() {
  const { totalQuantity } = useCart();
  const { user } = useAuth();
  if (!user) return null;
  return (
    <a href="/carrito" className="btn btn-ghost btn-sm" aria-label={`Carrito de compras, ${totalQuantity} artículos`}>
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      Carrito
      {totalQuantity > 0 && (
        <span className="badge badge-accent" data-testid="cart-badge">
          {totalQuantity}
        </span>
      )}
    </a>
  );
}