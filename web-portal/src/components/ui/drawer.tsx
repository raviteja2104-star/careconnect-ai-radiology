'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DrawerProps {
    open: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    description?: React.ReactNode;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    side?: 'right' | 'left';
    width?: string;
    className?: string;
}

export function Drawer({
    open, onClose, title, description, children, footer, side = 'right', width = 'max-w-md', className,
}: DrawerProps) {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    React.useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100]">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
                        onClick={onClose}
                        aria-hidden
                    />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        initial={{ x: side === 'right' ? '100%' : '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: side === 'right' ? '100%' : '-100%' }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                            'absolute top-0 h-full w-full bg-card border-border shadow-pop flex flex-col',
                            side === 'right' ? 'right-0 border-l rounded-l-3xl' : 'left-0 border-r rounded-r-3xl',
                            width,
                            className
                        )}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
                            <div>
                                {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
                                {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
                            </div>
                            <button
                                onClick={onClose}
                                aria-label="Close panel"
                                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X className="h-4.5 w-4.5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">{children}</div>
                        {footer && <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">{footer}</div>}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
