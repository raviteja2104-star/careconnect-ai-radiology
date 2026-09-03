'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, LifeBuoy, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: { label: string; onClick: () => void };
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center', className)}
        >
            {Icon && (
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-7 w-7" aria-hidden />
                </div>
            )}
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {description && <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>}
            {action && (
                <Button className="mt-5" size="sm" onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </motion.div>
    );
}

export interface ErrorStateProps {
    title?: string;
    description?: string;
    onRetry?: () => void;
    className?: string;
}

export function ErrorState({
    title = 'Something went wrong',
    description = "We couldn't load this section. Your data is safe — try again in a moment.",
    onRetry,
    className,
}: ErrorStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-danger/30 bg-danger-soft px-6 py-12 text-center', className)} role="alert">
            <h3 className="text-base font-semibold text-danger">{title}</h3>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
            <div className="mt-5 flex items-center gap-3">
                {onRetry && (
                    <Button variant="outline" size="sm" onClick={onRetry}>
                        <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Retry
                    </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => (window.location.href = '/support')}>
                    <LifeBuoy className="h-3.5 w-3.5" aria-hidden /> Contact support
                </Button>
            </div>
        </div>
    );
}
