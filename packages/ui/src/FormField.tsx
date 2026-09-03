import React from 'react';

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
};

export function FormField({ label, htmlFor, error, hint, children, className }: FormFieldProps) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }} className={className}>
      <label
        htmlFor={htmlFor}
        style={{
          display: 'block',
          marginBottom: 'var(--space-2)',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          color: 'var(--color-text)',
        }}
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <p style={{ marginTop: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
          {hint}
        </p>
      )}
      {error && (
        <p role="alert" style={{ marginTop: 'var(--space-1)', fontSize: 'var(--text-sm)', color: 'var(--color-error)' }}>
          {error}
        </p>
      )}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input {...rest} className={`input ${className ?? ''}`.trim()} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return <select {...rest} className={`select ${className ?? ''}`.trim()} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea {...rest} className={`input ${className ?? ''}`.trim()} />;
}
