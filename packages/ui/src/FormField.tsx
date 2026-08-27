import React from 'react';

type FormFieldProps = {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '4px',
  fontSize: '0.875rem',
  fontWeight: 500,
  color: 'var(--color-text)',
};

const errorStyle: React.CSSProperties = {
  marginTop: '4px',
  fontSize: '0.8125rem',
  color: 'var(--color-error)',
};

export function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label htmlFor={htmlFor} style={labelStyle}>
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" style={errorStyle}>
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: '1rem',
  fontFamily: 'var(--font-sans)',
  color: 'var(--color-text)',
  background: 'var(--color-bg-surface)',
  border: 'var(--border)',
  borderRadius: 'var(--radius-sm)',
  outline: 'none',
  transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
};

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        ...inputBase,
        ...(props.style ?? {}),
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-accent)';
        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(74, 98, 116, 0.15)';
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.boxShadow = 'none';
        props.onBlur?.(e);
      }}
    />
  );
}
