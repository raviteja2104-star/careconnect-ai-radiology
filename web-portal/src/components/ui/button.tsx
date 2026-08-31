'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glass' | 'link';
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
    primary:
        'gradient-brand text-white shadow-soft hover:shadow-float hover:brightness-105 active:brightness-95',
    secondary:
        'bg-muted text-foreground hover:bg-border/70 active:bg-border',
    outline:
        'border border-border bg-card text-foreground hover:bg-muted/60 active:bg-muted',
    ghost:
        'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
    danger:
        'bg-danger text-white shadow-soft hover:brightness-110 active:brightness-95',
    glass:
        'glass-card text-foreground hover:shadow-float',
    link:
        'text-primary underline-offset-4 hover:underline p-0 h-auto',
};

const sizeClasses: Record<Size, string> = {
    sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
    md: 'h-10 px-4 text-sm gap-2 rounded-xl',
    lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
    icon: 'h-10 w-10 rounded-xl',
    'icon-sm': 'h-8 w-8 rounded-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
        <button
            ref={ref}
            disabled={disabled || loading}
            className={cn(
                'inline-flex items-center justify-center font-semibold whitespace-nowrap select-none',
                'transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
                variantClasses[variant],
                sizeClasses[size],
                className
            )}
            {...props}
        >
            {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
            {children}
        </button>
    )
);
Button.displayName = 'Button';
