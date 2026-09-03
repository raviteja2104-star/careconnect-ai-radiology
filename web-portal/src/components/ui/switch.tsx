'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SwitchProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
    label?: string;
    className?: string;
}

export function Switch({ checked, onCheckedChange, disabled, label, className }: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
                checked ? 'gradient-brand' : 'bg-muted border border-border',
                disabled && 'opacity-50 cursor-not-allowed',
                className
            )}
        >
            <motion.span
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className={cn(
                    'inline-block h-4.5 w-4.5 rounded-full bg-white shadow-sm',
                    checked ? 'ml-[calc(100%-1.375rem)]' : 'ml-0.5'
                )}
            />
        </button>
    );
}
