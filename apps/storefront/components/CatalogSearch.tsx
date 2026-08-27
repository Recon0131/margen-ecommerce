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
    <form onSubmit={handleSubmit} role="search" aria-label="Buscar productos" style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', gap: '8px', maxWidth: '480px' }}>
        <input
          type="search"
          role="searchbox"
          aria-label="Buscar productos"
          placeholder="Buscar accesorios..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: '1rem',
            fontFamily: 'var(--font-sans)',
            color: 'var(--color-text)',
            background: 'var(--color-bg-surface)',
            border: 'var(--border)',
            borderRadius: 'var(--radius-sm)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: '8px 16px',
            fontSize: '0.9375rem',
            fontFamily: 'var(--font-sans)',
            fontWeight: 500,
            background: 'var(--color-accent)',
            color: 'var(--color-text-inverse)',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius-sm)',
            cursor: isPending ? 'not-allowed' : 'pointer',
            opacity: isPending ? 0.6 : 1,
          }}
        >
          {isPending ? 'Buscando...' : 'Buscar'}
        </button>
      </div>
    </form>
  );
}
