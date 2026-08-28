'use client';

import { useCart } from '../../lib/cart-context';
import { Button, FormField, StatusMessage } from '@margen/ui';
import { useState } from 'react';
import { createCart, getCartQuote, createOrder } from '../../lib/api-client';

export default function CheckoutPage() {
  const { lines, clear } = useCart();
  const [recipient, setRecipient] = useState('');
  const [line1, setLine1] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [invoiceType, setInvoiceType] = useState<'BOLETA' | 'FACTURA'>('BOLETA');
  const [customerDoc, setCustomerDoc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orderId: string } | null>(null);

  if (lines.length === 0 && !success) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>No hay productos para pagar</h1>
        <a href="/catalogo">Ir al catálogo</a>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const cart = await createCart(lines);
      const quote = await getCartQuote(cart.id);
      const order = await createOrder({
        cartId: cart.id,
        lines,
        shippingAddress: { recipient, line1, district, city, country: 'PE' },
        idempotencyKey: crypto.randomUUID(),
        invoiceType,
      });
      setSuccess({ orderId: order.id });
      clear();
    } catch (err: any) {
      setError(err.message ?? 'Error al crear la orden');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center', padding: '48px 0' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '16px' }}>¡Pedido creado!</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          Tu pedido se ha registrado. Se te redirigirá a la pasarela de pago.
        </p>
        <StatusMessage variant="success">Orden #{success.orderId.slice(0, 8)}</StatusMessage>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '560px', margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '24px' }}>Finalizar compra</h1>

      {error && <StatusMessage variant="error">{error}</StatusMessage>}

      <form onSubmit={handleSubmit}>
        <FormField label="Nombre / Razón social" htmlFor="recipient">
          <input id="recipient" required value={recipient} onChange={(e) => setRecipient(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: 'var(--border)', background: 'var(--color-bg)' }} />
        </FormField>

        <FormField label="Dirección" htmlFor="line1">
          <input id="line1" required value={line1} onChange={(e) => setLine1(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: 'var(--border)', background: 'var(--color-bg)' }} />
        </FormField>

        <FormField label="Distrito" htmlFor="district">
          <input id="district" required value={district} onChange={(e) => setDistrict(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: 'var(--border)', background: 'var(--color-bg)' }} />
        </FormField>

        <FormField label="Ciudad" htmlFor="city">
          <input id="city" required value={city} onChange={(e) => setCity(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: 'var(--border)', background: 'var(--color-bg)' }} />
        </FormField>

        <div style={{ display: 'flex', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="radio" checked={invoiceType === 'BOLETA'} onChange={() => setInvoiceType('BOLETA')} />
            Boleta (DNI)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="radio" checked={invoiceType === 'FACTURA'} onChange={() => setInvoiceType('FACTURA')} />
            Factura (RUC)
          </label>
        </div>

        <FormField label={invoiceType === 'BOLETA' ? 'DNI' : 'RUC'} htmlFor="customerDoc">
          <input
            id="customerDoc"
            required
            value={customerDoc}
            onChange={(e) => setCustomerDoc(e.target.value)}
            pattern={invoiceType === 'BOLETA' ? '\\d{8}' : '\\d{11}'}
            maxLength={invoiceType === 'BOLETA' ? 8 : 11}
            style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: 'var(--border)', background: 'var(--color-bg)' }}
            inputMode="numeric"
          />
        </FormField>

        <div style={{ marginTop: '24px' }}>
          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? 'Creando pedido…' : 'Crear pedido'}
          </Button>
        </div>
      </form>
    </div>
  );
}
