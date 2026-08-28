import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '../components/SiteHeader';
import { CartProvider } from '../lib/cart-context';

export const metadata: Metadata = {
  title: 'Margen — Comercio local, con confianza',
  description: 'Accesorios tecnológicos en Perú. Envío rápido, pago seguro.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <CartProvider>
          <SiteHeader />
          <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}
