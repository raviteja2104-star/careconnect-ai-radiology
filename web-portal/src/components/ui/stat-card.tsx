'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatCardProps {
    label: string;
    value: string | number;
    sub?: string;
    icon?: LucideIcon;
    trend?: 'up' | 'down' | 'neutral';
    /** Whether the trend direction is good news (green) or bad (red). */
    trendPositive?: boolean;
    tone?: 'brand' | 'teal' | 'violet' | 'amber' | 'rose' | 'emerald';
    delay?: number;
    className?: string;
    onClick?: () => void;
}

const toneTile: Record<NonNullable<StatCardProps['tone']>, string> = {
    brand: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
};

export function StatCard({
    label, value, sub, icon: Icon, trend, trendPositive = true, tone = 'brand', delay = 0, className, onClick,
}: StatCardProps) {
    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
    const good = trend === 'neutral' ? null : trendPositive;
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -2 }}
            onClick={onClick}
            className={cn(
                'group rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-float',
                onClick && 'cursor-pointer',
                className
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground truncate">{label}</p>
                    <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>
                </div>
                {Icon && (
                    <span className={cn('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105', toneTile[tone])}>
                        <Icon className="h-5 w-5" aria-hidden />
                    </span>
                )}
            </div>
            {(sub || trend) && (
                <div className="mt-3 flex items-center gap-1.5 text-xs">
                    {trend && (
                        <TrendIcon
                            className={cn(
                                'h-3.5 w-3.5',
                                good === null ? 'text-muted-foreground' : good ? 'text-success' : 'text-danger'
                            )}
                            aria-hidden
                        />
                    )}
                    {sub && <span className="text-muted-foreground truncate">{sub}</span>}
                </div>
            )}
        </motion.div>
    );
}

/** Responsive grid wrapper for a KPI row. */
export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4', className)}>
            {children}
        </div>
    );
}
