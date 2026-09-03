'use client';

import { useCart } from '../../lib/cart-context';
import { Button, FormField, Input, StatusMessage } from '@margen/ui';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (success?.orderId) {
      window.location.assign(`/pasarela-pago?orderId=${success.orderId}`);
    }
  }, [success]);

  if (lines.length === 0 && !success) {
    return (
      <div className="page">
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)' }}>No hay productos para pagar</h1>
          <p className="text-muted mt-2 mb-4">Añade productos al carrito antes de continuar.</p>
          <a href="/catalogo" className="btn btn-primary btn-md">
            Ir al catálogo
          </a>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const cart = await createCart(lines);
      await getCartQuote(cart.id);
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
      <div className="page">
        <div className="container" style={{ maxWidth: 520, textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-4)' }}>¡Pedido creado!</h1>
          <p className="text-muted mb-6">
            Tu pedido se ha registrado. Se te redirigirá a la pasarela de pago.
          </p>
          <StatusMessage variant="success">Orden #{success.orderId.slice(0, 8)}</StatusMessage>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 620 }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-6)' }}>Finalizar compra</h1>

        {error && <StatusMessage variant="error">{error}</StatusMessage>}

        <form className="card" style={{ padding: 'var(--space-8)' }} onSubmit={handleSubmit}>
          <FormField label="Nombre / Razón social" htmlFor="recipient">
            <Input id="recipient" required value={recipient} onChange={(e) => setRecipient(e.target.value)} />
          </FormField>

          <FormField label="Dirección" htmlFor="line1">
            <Input id="line1" required value={line1} onChange={(e) => setLine1(e.target.value)} />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <FormField label="Distrito" htmlFor="district">
              <Input id="district" required value={district} onChange={(e) => setDistrict(e.target.value)} />
            </FormField>
            <FormField label="Ciudad" htmlFor="city">
              <Input id="city" required value={city} onChange={(e) => setCity(e.target.value)} />
            </FormField>
          </div>

          <div className="row" style={{ gap: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
              <input type="radio" checked={invoiceType === 'BOLETA'} onChange={() => setInvoiceType('BOLETA')} />
              Boleta (DNI)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
              <input type="radio" checked={invoiceType === 'FACTURA'} onChange={() => setInvoiceType('FACTURA')} />
              Factura (RUC)
            </label>
          </div>

          <FormField label={invoiceType === 'BOLETA' ? 'DNI' : 'RUC'} htmlFor="customerDoc">
            <Input
              id="customerDoc"
              required
              value={customerDoc}
              onChange={(e) => setCustomerDoc(e.target.value)}
              pattern={invoiceType === 'BOLETA' ? '\\d{8}' : '\\d{11}'}
              maxLength={invoiceType === 'BOLETA' ? 8 : 11}
              inputMode="numeric"
            />
          </FormField>

          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? 'Creando pedido…' : 'Crear pedido'}
          </Button>
        </form>
      </div>
    </div>
  );
}
