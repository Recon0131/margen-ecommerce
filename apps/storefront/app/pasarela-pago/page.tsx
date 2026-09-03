'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Button, FormField, Input, StatusMessage } from '@margen/ui';

export default function PaymentGatewayPage() {
  const params = useSearchParams();
  const orderId = params.get('orderId') ?? '';

  const [paid, setPaid] = useState(false);
  const [number, setNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const handleNumber = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 16);
    setNumber(digits.replace(/(\d{4})/g, '$1 ').trim());
  };
  const handleExpiry = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return setExpiry(digits);
    setExpiry(digits.slice(0, 2) + '/' + digits.slice(2));
  };
  const handleCvv = (raw: string) => {
    setCvv(raw.replace(/\D/g, '').slice(0, 4));
  };

  const displayNumber = number || '•••• •••• •••• ••••';
  const displayExpiry = expiry || 'MM/AA';

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 520 }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-4)' }}>Pasarela de pago</h1>

        {paid ? (
          <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <StatusMessage variant="success">Pago procesado correctamente</StatusMessage>
            <p className="text-muted mt-4 mb-6">Gracias por tu compra.</p>
            <Link href="/" className="btn btn-primary btn-md">
              Volver al inicio
            </Link>
          </div>
        ) : (
          <div className="card" style={{ padding: 'var(--space-8)' }}>
            <p className="text-muted" style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              {orderId ? (
                <>
                  Pedido: <strong>{orderId.slice(0, 8)}</strong>
                </>
              ) : (
                'No hay pedido en curso.'
              )}
            </p>

            <div
              style={{
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--color-accent) 0%, #2f4250 100%)',
                color: '#fff',
                padding: 'var(--space-6) var(--space-6) var(--space-7)',
                boxShadow: 'var(--shadow-md)',
                marginBottom: 'var(--space-8)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '-30px',
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-60px',
                  left: '40px',
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                }}
              />
              <div style={{ position: 'relative' }}>
                <p
                  style={{
                    letterSpacing: '0.25em',
                    fontSize: 'var(--text-lg)',
                    fontVariantNumeric: 'tabular-nums',
                    marginBottom: 'var(--space-5)',
                  }}
                >
                  {displayNumber}
                </p>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: 'var(--text-xs)',
                        opacity: 0.75,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: 'var(--space-1)',
                      }}
                    >
                      Vencimiento
                    </p>
                    <p style={{ fontVariantNumeric: 'tabular-nums' }}>{displayExpiry}</p>
                  </div>
                  <span
                    style={{
                      fontSize: 'var(--text-xl)',
                      fontWeight: 700,
                      fontStyle: 'italic',
                      letterSpacing: '0.05em',
                      opacity: 0.9,
                    }}
                  >
                    Margen
                  </span>
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setPaid(true);
              }}
            >
              <FormField label="Número de tarjeta" htmlFor="card-number">
                <Input
                  id="card-number"
                  value={number}
                  onChange={(e) => handleNumber(e.target.value)}
                  placeholder="4242 4242 4242 4242"
                  inputMode="numeric"
                  autoComplete="off"
                />
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <FormField label="Vencimiento" htmlFor="card-expiry">
                  <Input
                    id="card-expiry"
                    value={expiry}
                    onChange={(e) => handleExpiry(e.target.value)}
                    placeholder="MM/AA"
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </FormField>
                <FormField label="CVV" htmlFor="card-cvv">
                  <Input
                    id="card-cvv"
                    value={cvv}
                    onChange={(e) => handleCvv(e.target.value)}
                    placeholder="123"
                    inputMode="numeric"
                    type="password"
                    autoComplete="off"
                  />
                </FormField>
              </div>

              <p className="text-muted" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-6)' }}>
                Esta es una pasarela de pago de prueba. En producción se redirigiría a Mercado Pago.
              </p>

              <Button type="submit" fullWidth>
                Pagar
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
