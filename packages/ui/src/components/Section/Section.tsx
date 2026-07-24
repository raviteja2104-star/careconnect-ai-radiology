import React from 'react';
import { Typography } from '../Typography/Typography';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function Section({ title, description, action, children, className = '', ...props }: SectionProps) {
  return (
    <section className={`py-6 border-b border-slate-200 dark:border-slate-800 last:border-b-0 ${className}`} {...props}>
      {(title || description || action) && (
        <div className="flex items-start justify-between mb-6">
          <div>
            {title && <Typography variant="h3">{title}</Typography>}
            {description && <Typography variant="p" className="text-slate-500 mt-1">{description}</Typography>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </section>
  );
}
