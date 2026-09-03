import React from 'react';

type ForProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function Container({ children, className, style }: ForProps) {
  return (
    <div className={`container ${className ?? ''}`.trim()} style={style}>
      {children}
    </div>
  );
}

type SectionHeadingProps = {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
};

export function SectionHeading({ title, subtitle, align = 'left' }: SectionHeadingProps) {
  return (
    <div className={align === 'center' ? 'text-center' : undefined}>
      <h2 className="section-title">{title}</h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </div>
  );
}
