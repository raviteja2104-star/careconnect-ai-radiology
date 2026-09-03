'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const fieldBase =
    'w-full rounded-xl border border-input bg-card text-sm text-foreground placeholder:text-subtle-foreground ' +
    'transition-all duration-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, icon, error, ...props }, ref) => {
        if (icon) {
            return (
                <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle-foreground [&>svg]:w-4 [&>svg]:h-4">
                        {icon}
                    </span>
                    <input
                        ref={ref}
                        className={cn(fieldBase, 'h-10 pl-10 pr-3.5', error && 'border-danger focus:border-danger focus:ring-danger/20', className)}
                        {...props}
                    />
                </div>
            );
        }
        return (
            <input
                ref={ref}
                className={cn(fieldBase, 'h-10 px-3.5', error && 'border-danger focus:border-danger focus:ring-danger/20', className)}
                {...props}
            />
        );
    }
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
    HTMLTextAreaElement,
    React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }
>(({ className, error, ...props }, ref) => (
    <textarea
        ref={ref}
        className={cn(fieldBase, 'min-h-24 p-3.5 resize-y', error && 'border-danger focus:border-danger focus:ring-danger/20', className)}
        {...props}
    />
));
Textarea.displayName = 'Textarea';

export const Select = React.forwardRef<
    HTMLSelectElement,
    React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }
>(({ className, error, children, ...props }, ref) => (
    <select
        ref={ref}
        className={cn(fieldBase, 'h-10 px-3 appearance-none cursor-pointer', error && 'border-danger', className)}
        {...props}
    >
        {children}
    </select>
));
Select.displayName = 'Select';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
    return (
        <label
            className={cn('block text-sm font-medium text-foreground mb-1.5', className)}
            {...props}
        />
    );
}

export function FieldHint({ error, children, className }: { error?: boolean; children: React.ReactNode; className?: string }) {
    return (
        <p className={cn('mt-1.5 text-xs', error ? 'text-danger' : 'text-muted-foreground', className)}>
            {children}
        </p>
    );
}
