import React from 'react';

type StatusVariant = 'info' | 'error' | 'success';

type StatusMessageProps = {
  variant?: StatusVariant;
  children: React.ReactNode;
};

const variantClass: Record<StatusVariant, string> = {
  info: 'alert-info',
  error: 'alert-error',
  success: 'alert-success',
};

export function StatusMessage({ variant = 'info', children }: StatusMessageProps) {
  return (
    <div role="status" className={`alert ${variantClass[variant]}`}>
      {children}
    </div>
  );
}
