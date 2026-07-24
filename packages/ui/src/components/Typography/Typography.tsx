import React from 'react';

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'small';
  as?: React.ElementType;
}

export function Typography({
  children,
  variant = 'p',
  as,
  className = '',
  ...props
}: TypographyProps) {
  const Component = as || variant;
  
  const variants = {
    h1: 'text-3xl font-bold tracking-tight text-slate-900 dark:text-white',
    h2: 'text-2xl font-bold tracking-tight text-slate-900 dark:text-white',
    h3: 'text-xl font-semibold tracking-tight text-slate-900 dark:text-white',
    h4: 'text-lg font-semibold text-slate-900 dark:text-white',
    p: 'text-base text-slate-700 dark:text-slate-300 leading-relaxed',
    small: 'text-sm text-slate-500 dark:text-slate-400'
  };

  return (
    <Component className={`${variants[variant]} ${className}`} {...props}>
      {children}
    </Component>
  );
}
