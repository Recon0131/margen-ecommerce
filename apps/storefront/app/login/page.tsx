'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, FormField, Input, StatusMessage } from '@margen/ui';
import { loginCustomer, getMe } from '../../lib/api-client';
import { useAuth } from '../../lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
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
      setUser({ id: result.userId, email });
      setSuccess('Sesión iniciada');
      void getMe()
        .then((me) => {
          if (me) setUser(me);
        })
        .catch(() => {});
      window.setTimeout(() => router.push('/'), 350);
    } catch (err: any) {
      setError(err.message ?? 'Credenciales inválidas');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 440 }}>
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <span className="badge badge-accent mb-2">Cuenta Margen</span>
            <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>Iniciar sesión</h1>
            <p className="text-muted" style={{ marginBottom: 0 }}>
              Accede a tu cuenta para un pago más rápido.
            </p>
          </div>

          {error && <StatusMessage variant="error">{error}</StatusMessage>}
          {success && <StatusMessage variant="success">{success}</StatusMessage>}

          <form onSubmit={handleSubmit}>
            <FormField label="Correo electrónico" htmlFor="email">
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </FormField>

            <FormField label="Contraseña" htmlFor="password">
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </FormField>

            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? 'Ingresando…' : 'Iniciar sesión'}
            </Button>
          </form>

          <p style={{ marginTop: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            ¿No tienes cuenta?{' '}
            <a href="/registro" style={{ color: 'var(--color-accent)', fontWeight: 500 }}>
              Regístrate
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
