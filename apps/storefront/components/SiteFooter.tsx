import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: 'var(--border)',
        background: 'var(--color-bg-subtle)',
        marginTop: 'var(--space-20)',
      }}
    >
      <div className="container" style={{ paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-8)',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-lg)',
                fontWeight: 800,
                color: 'var(--color-text)',
                marginBottom: 'var(--space-3)',
              }}
            >
              Margen
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', maxWidth: 280 }}>
              Accesorios tecnológicos en Perú. Envío rápido, pago seguro y atención cercana.
            </p>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-3)' }}>
              Tienda
            </div>
            <ul style={{ listStyle: 'none' }}>
              <li className="mb-2">
                <Link href="/catalogo" className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
                  Catálogo
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/carrito" className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
                  Carrito
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: 'var(--space-3)' }}>
              Cuenta
            </div>
            <ul style={{ listStyle: 'none' }}>
              <li className="mb-2">
                <Link href="/login" className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
                  Ingresar
                </Link>
              </li>
              <li className="mb-2">
                <Link href="/registro" className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>
                  Crear cuenta
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div
          style={{
            marginTop: 'var(--space-10)',
            paddingTop: 'var(--space-6)',
            borderTop: 'var(--border)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-faint)',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          <span>© {new Date().getFullYear()} Margen. Todos los derechos reservados.</span>
          <span>Lima, Perú · Soles (PEN)</span>
        </div>
      </div>
    </footer>
  );
}
