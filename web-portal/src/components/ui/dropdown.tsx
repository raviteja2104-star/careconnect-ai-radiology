'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DropdownProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    align?: 'left' | 'right';
    className?: string;
    menuClassName?: string;
}

/** Lightweight click-toggle dropdown with outside-click + Escape dismissal. */
export function Dropdown({ trigger, children, align = 'right', className, menuClassName }: DropdownProps) {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <div ref={ref} className={cn('relative inline-block', className)}>
            <div onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
                {trigger}
            </div>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                        role="menu"
                        onClick={() => setOpen(false)}
                        className={cn(
                            'absolute z-50 mt-2 min-w-52 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 shadow-pop',
                            align === 'right' ? 'right-0' : 'left-0',
                            menuClassName
                        )}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function DropdownItem({
    icon, danger, className, children, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode; danger?: boolean }) {
    return (
        <button
            role="menuitem"
            className={cn(
                'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors',
                danger
                    ? 'text-danger hover:bg-danger-soft'
                    : 'text-foreground hover:bg-muted',
                className
            )}
            {...props}
        >
            {icon && <span className="text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
            {children}
        </button>
    );
}

export function DropdownSeparator() {
    return <div className="my-1.5 h-px bg-border" role="separator" />;
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
    return <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-subtle-foreground">{children}</p>;
}
