'use client';

import { useCart } from '../lib/cart-context';
import { useAuth } from '../lib/auth-context';
import { Button } from '@margen/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AddToCart({ sku, name }: { sku: string; name: string }) {
  const { addLine } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (!user) {
      router.push('/login');
      return;
    }
    addLine(sku, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Button onClick={handleAdd} fullWidth>
      {added ? '✓ Añadido al carrito' : `Añadir al carrito — ${name}`}
    </Button>
  );
}
