import React from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items, className = '', ...props }: BreadcrumbProps) {
  return (
    <nav className={`flex items-center text-sm text-slate-500 dark:text-slate-400 ${className}`} {...props}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.href ? (
            <a href={item.href} className="hover:text-indigo-600 transition-colors">
              {item.label}
            </a>
          ) : (
            <span className="text-slate-900 dark:text-slate-200">{item.label}</span>
          )}
          {index < items.length - 1 && <span className="mx-2">/</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}
