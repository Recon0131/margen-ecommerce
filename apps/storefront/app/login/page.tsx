'use client';

import { useState } from 'react';
import { Button, FormField, StatusMessage } from '@margen/ui';
import { loginCustomer } from '../../lib/api-client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const result = await loginCustomer({ email, password });
      setSuccess(`Sesión iniciada. Tu ID: ${result.userId.slice(0, 8)}`);
    } catch (err: any) {
      setError(err.message ?? 'Credenciales inválidas');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '24px' }}>Iniciar sesión</h1>

      {error && <StatusMessage variant="error">{error}</StatusMessage>}
      {success && <StatusMessage variant="success">{success}</StatusMessage>}

      <form onSubmit={handleSubmit}>
        <FormField label="Correo electrónico" htmlFor="email">
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: 'var(--border)', background: 'var(--color-bg)' }} />
        </FormField>

        <FormField label="Contraseña" htmlFor="password">
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: 'var(--border)', background: 'var(--color-bg)' }} />
        </FormField>

        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? 'Ingresando…' : 'Iniciar sesión'}
        </Button>
      </form>

      <p style={{ marginTop: '16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        ¿No tienes cuenta? <a href="/registro">Regístrate</a>
      </p>
    </div>
  );
}
