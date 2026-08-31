'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimelineItemProps {
    icon?: LucideIcon;
    tone?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
    title: React.ReactNode;
    meta?: React.ReactNode;
    children?: React.ReactNode;
    isLast?: boolean;
    index?: number;
}

const toneClasses = {
    brand: 'bg-primary/10 text-primary border-primary/30',
    success: 'bg-success-soft text-success border-success/30',
    warning: 'bg-warning-soft text-warning border-warning/30',
    danger: 'bg-danger-soft text-danger border-danger/30',
    neutral: 'bg-muted text-muted-foreground border-border',
};

export function Timeline({ children, className }: { children: React.ReactNode; className?: string }) {
    const items = React.Children.toArray(children);
    return (
        <ol className={cn('relative', className)}>
            {items.map((child, i) =>
                React.isValidElement<TimelineItemProps>(child)
                    ? React.cloneElement(child, { isLast: i === items.length - 1, index: i })
                    : child
            )}
        </ol>
    );
}

export function TimelineItem({ icon: Icon, tone = 'neutral', title, meta, children, isLast, index = 0 }: TimelineItemProps) {
    return (
        <motion.li
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="relative flex gap-4 pb-6 last:pb-0"
        >
            {!isLast && <span className="absolute left-[17px] top-9 bottom-0 w-px bg-border" aria-hidden />}
            <span className={cn('relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border', toneClasses[tone])}>
                {Icon ? <Icon className="h-4 w-4" aria-hidden /> : <span className="h-2 w-2 rounded-full bg-current" />}
            </span>
            <div className="min-w-0 flex-1 pt-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    {meta && <span className="text-xs text-subtle-foreground whitespace-nowrap">{meta}</span>}
                </div>
                {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
            </div>
        </motion.li>
    );
}
