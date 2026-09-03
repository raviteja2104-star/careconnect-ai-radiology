'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<Size, string> = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
};

const statusClasses = {
    online: 'bg-success',
    busy: 'bg-danger',
    away: 'bg-warning',
    offline: 'bg-subtle-foreground',
};

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string | null;
    name: string;
    size?: Size;
    status?: keyof typeof statusClasses;
}

function initials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]!.toUpperCase())
        .join('');
}

/** Deterministic soft background per name so lists stay stable across renders. */
const palettes = [
    'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
    'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
];
function paletteFor(name: string) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
    return palettes[Math.abs(h) % palettes.length];
}

export function Avatar({ src, name, size = 'md', status, className, ...props }: AvatarProps) {
    const [failed, setFailed] = React.useState(false);
    return (
        <div className={cn('relative inline-flex shrink-0', className)} {...props}>
            {src && !failed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={src}
                    alt={name}
                    onError={() => setFailed(true)}
                    className={cn('rounded-full object-cover ring-2 ring-card', sizeClasses[size])}
                />
            ) : (
                <span
                    aria-label={name}
                    className={cn(
                        'inline-flex items-center justify-center rounded-full font-semibold ring-2 ring-card',
                        sizeClasses[size],
                        paletteFor(name)
                    )}
                >
                    {initials(name)}
                </span>
            )}
            {status && (
                <span
                    className={cn(
                        'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-card',
                        statusClasses[status]
                    )}
                    aria-label={status}
                />
            )}
        </div>
    );
}

export function AvatarGroup({ children, max = 4, className }: { children: React.ReactNode; max?: number; className?: string }) {
    const items = React.Children.toArray(children);
    const visible = items.slice(0, max);
    const overflow = items.length - visible.length;
    return (
        <div className={cn('flex -space-x-2', className)}>
            {visible}
            {overflow > 0 && (
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground ring-2 ring-card">
                    +{overflow}
                </span>
            )}
        </div>
    );
}
