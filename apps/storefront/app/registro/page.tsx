'use client';

import { useState } from 'react';
import { Button, FormField, Input, StatusMessage } from '@margen/ui';
import { registerCustomer } from '../../lib/api-client';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setSubmitting(true);
    try {
      const result = await registerCustomer({ email, password });
      setSuccess(`Cuenta creada para ${result.email}. Puedes iniciar sesión.`);
    } catch (err: any) {
      setError(err.message ?? 'Error al crear la cuenta');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 440 }}>
        <div className="card" style={{ padding: 'var(--space-8)' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <span className="badge badge-accent mb-2">Nueva cuenta</span>
            <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>Crear cuenta</h1>
            <p className="text-muted" style={{ marginBottom: 0 }}>
              Únete a Margen para comprar más rápido.
            </p>
          </div>

          {error && <StatusMessage variant="error">{error}</StatusMessage>}
          {success && <StatusMessage variant="success">{success}</StatusMessage>}

          <form onSubmit={handleSubmit}>
            <FormField label="Correo electrónico" htmlFor="email">
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </FormField>

            <FormField label="Contraseña" htmlFor="password" hint="Mínimo 8 caracteres.">
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </FormField>

            <FormField label="Confirmar contraseña" htmlFor="confirm">
              <Input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </FormField>

            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>
          </form>

          <p style={{ marginTop: 'var(--space-6)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            ¿Ya tienes cuenta?{' '}
            <a href="/login" style={{ color: 'var(--color-accent)', fontWeight: 500 }}>
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
