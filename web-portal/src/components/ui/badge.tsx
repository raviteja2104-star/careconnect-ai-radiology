import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    tone?: Tone;
    dot?: boolean;
    pulse?: boolean;
}

const toneClasses: Record<Tone, string> = {
    neutral: 'bg-muted text-muted-foreground',
    brand: 'bg-primary/10 text-primary dark:bg-primary/15',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    info: 'bg-info-soft text-info',
    outline: 'border border-border text-muted-foreground bg-transparent',
};

const dotClasses: Record<Tone, string> = {
    neutral: 'bg-muted-foreground',
    brand: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    outline: 'bg-muted-foreground',
};

export function Badge({ className, tone = 'neutral', dot, pulse, children, ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
                toneClasses[tone],
                className
            )}
            {...props}
        >
            {dot && (
                <span className={cn('h-1.5 w-1.5 rounded-full', dotClasses[tone], pulse && 'animate-pulse-soft')} aria-hidden />
            )}
            {children}
        </span>
    );
}
