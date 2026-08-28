'use client';

import { useState } from 'react';
import { Button, FormField, StatusMessage } from '@margen/ui';
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
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '24px' }}>Crear cuenta</h1>

      {error && <StatusMessage variant="error">{error}</StatusMessage>}
      {success && <StatusMessage variant="success">{success}</StatusMessage>}

      <form onSubmit={handleSubmit}>
        <FormField label="Correo electrónico" htmlFor="email">
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: 'var(--border)', background: 'var(--color-bg)' }} />
        </FormField>

        <FormField label="Contraseña" htmlFor="password">
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: 'var(--border)', background: 'var(--color-bg)' }} />
        </FormField>

        <FormField label="Confirmar contraseña" htmlFor="confirm">
          <input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: 'var(--border)', background: 'var(--color-bg)' }} />
        </FormField>

        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>

      <p style={{ marginTop: '16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
      </p>
    </div>
  );
}
