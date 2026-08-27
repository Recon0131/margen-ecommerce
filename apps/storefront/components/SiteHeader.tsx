'use client';

import React from 'react';

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 24px',
  borderBottom: 'var(--border)',
  background: 'var(--color-bg-surface)',
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

const logoStyle: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: '1.5rem',
  fontWeight: 700,
  color: 'var(--color-text)',
  textDecoration: 'none',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '24px',
};

const linkStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  textDecoration: 'none',
  fontSize: '0.9375rem',
  transition: 'color var(--transition-fast)',
};

export function SiteHeader() {
  return (
    <header style={headerStyle}>
      <a href="/" style={logoStyle}>
        Margen
      </a>
      <nav style={navStyle} aria-label="Principal">
        <a href="/catalogo" style={linkStyle}>
          Catálogo
        </a>
      </nav>
    </header>
  );
}
