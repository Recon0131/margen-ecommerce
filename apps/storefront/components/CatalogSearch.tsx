'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  defaultQuery?: string;
};

export function CatalogSearch({ defaultQuery = '' }: Props) {
  const [value, setValue] = useState(defaultQuery);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set('q', value.trim());
    startTransition(() => {
      router.push(`/catalogo?${params.toString()}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} role="search" aria-label="Buscar productos" className="mb-6">
      <div style={{ display: 'flex', gap: 'var(--space-2)', maxWidth: 520 }}>
        <input
          type="search"
          role="searchbox"
          aria-label="Buscar productos"
          placeholder="Buscar accesorios..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input"
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Buscando...' : 'Buscar'}
        </button>
      </div>
    </form>
  );
}
