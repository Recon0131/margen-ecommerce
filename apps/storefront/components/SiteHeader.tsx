'use client';

import React from 'react';
import { CartButton } from './CartButton';
import { useAuth } from '../lib/auth-context';

export function SiteHeader() {
  const { user, loading, logout } = useAuth();
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'color-mix(in srgb, var(--color-bg-surface) 85%, transparent)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: 'var(--border)',
      }}
    >
      <div
        className="container"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}
      >
        <a
          href="/"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-xl)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--color-text)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--color-accent)',
              display: 'inline-block',
            }}
            aria-hidden="true"
          />
          Margen
        </a>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }} aria-label="Principal">
          <a href="/catalogo" className="btn btn-ghost btn-sm">
            Catálogo
          </a>
          {loading ? (
            <span className="btn btn-ghost btn-sm btn-disabled" aria-hidden="true">
              ···
            </span>
          ) : user ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => void logout()}>
              Cerrar sesión
            </button>
          ) : (
            <a href="/login" className="btn btn-ghost btn-sm">
              Ingresar
            </a>
          )}
          <CartButton />
        </nav>
      </div>
    </header>
  );
}
