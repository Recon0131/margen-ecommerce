import React from 'react';

type StatusVariant = 'info' | 'error' | 'success';

type StatusMessageProps = {
  variant?: StatusVariant;
  children: React.ReactNode;
};

const variantStyles: Record<StatusVariant, React.CSSProperties> = {
  info: {
    background: 'var(--color-bg-muted)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  },
  error: {
    background: 'var(--color-error-bg)',
    color: 'var(--color-error)',
    border: '1px solid var(--color-error)',
  },
  success: {
    background: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    border: '1px solid var(--color-success)',
  },
};

export function StatusMessage({ variant = 'info', children }: StatusMessageProps) {
  return (
    <div
      role="status"
      style={{
        padding: '12px 16px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.9375rem',
        lineHeight: 1.5,
        ...variantStyles[variant],
      }}
    >
      {children}
    </div>
  );
}
