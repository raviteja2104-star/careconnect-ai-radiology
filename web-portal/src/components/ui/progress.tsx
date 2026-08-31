'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ProgressProps {
    value: number; // 0–100
    tone?: 'brand' | 'success' | 'warning' | 'danger' | 'gradient';
    size?: 'sm' | 'md';
    label?: string;
    showValue?: boolean;
    className?: string;
}

const toneClasses = {
    brand: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    gradient: 'gradient-brand',
};

export function Progress({ value, tone = 'brand', size = 'md', label, showValue, className }: ProgressProps) {
    const clamped = Math.max(0, Math.min(100, value));
    return (
        <div className={className}>
            {(label || showValue) && (
                <div className="mb-1.5 flex items-center justify-between text-xs">
                    {label && <span className="font-medium text-muted-foreground">{label}</span>}
                    {showValue && <span className="font-semibold text-foreground tabular-nums">{Math.round(clamped)}%</span>}
                </div>
            )}
            <div
                role="progressbar"
                aria-valuenow={Math.round(clamped)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={label}
                className={cn('w-full overflow-hidden rounded-full bg-muted', size === 'sm' ? 'h-1.5' : 'h-2.5')}
            >
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${clamped}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className={cn('h-full rounded-full', toneClasses[tone])}
                />
            </div>
        </div>
    );
}

/** Circular progress ring, e.g. for capacity/vitals widgets. */
export function ProgressRing({
    value, size = 64, strokeWidth = 6, tone = 'brand', children, className,
}: {
    value: number; size?: number; strokeWidth?: number;
    tone?: 'brand' | 'success' | 'warning' | 'danger'; children?: React.ReactNode; className?: string;
}) {
    const clamped = Math.max(0, Math.min(100, value));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeColor = { brand: 'var(--primary)', success: 'var(--success)', warning: 'var(--warning)', danger: 'var(--danger)' }[tone];
    return (
        <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--muted)" strokeWidth={strokeWidth} />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={radius} fill="none"
                    stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - (clamped / 100) * circumference }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground tabular-nums">
                {children ?? `${Math.round(clamped)}%`}
            </div>
        </div>
    );
}
