import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { CartProvider } from '../lib/cart-context';
import { AuthProvider } from '../lib/auth-context';

export const metadata: Metadata = {
  title: 'Margen — Comercio local, con confianza',
  description: 'Accesorios tecnológicos en Perú. Envío rápido, pago seguro.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AuthProvider>
          <CartProvider>
            <SiteHeader />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</main>
            <SiteFooter />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
