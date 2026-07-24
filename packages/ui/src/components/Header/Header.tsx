import React from 'react';

export interface HeaderProps extends React.HTMLAttributes<HTMLHeaderElement> {
  children: React.ReactNode;
}

export function Header({ children, className = '', ...props }: HeaderProps) {
  return (
    <header className={`h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 ${className}`} {...props}>
      {children}
    </header>
  );
}
