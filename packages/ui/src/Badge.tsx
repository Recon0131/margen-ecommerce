import React from 'react';

type BadgeVariant = 'accent' | 'muted' | 'gold';

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  title?: string;
};

const variantClass: Record<BadgeVariant, string> = {
  accent: 'badge-accent',
  muted: 'badge-muted',
  gold: 'badge-gold',
};

export function Badge({ children, variant = 'muted', title }: BadgeProps) {
  return (
    <span className={`badge ${variantClass[variant]}`} title={title}>
      {children}
    </span>
  );
}
