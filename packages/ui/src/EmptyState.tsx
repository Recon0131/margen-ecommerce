import React from 'react';
import { Button } from './Button';

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
};

export function EmptyState({ title, description, actionLabel, actionHref, icon }: EmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-16) var(--space-4)' }}>
      {icon && (
        <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>{icon}</div>
      )}
      <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-2)' }}>{title}</h2>
      {description && (
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)', maxWidth: '420px', marginInline: 'auto' }}>
          {description}
        </p>
      )}
      {actionLabel && actionHref && (
        <a href={actionHref}>
          <Button>{actionLabel}</Button>
        </a>
      )}
    </div>
  );
}
