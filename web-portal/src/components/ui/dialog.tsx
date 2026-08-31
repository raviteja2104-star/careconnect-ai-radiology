'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DialogProps {
    open: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    description?: React.ReactNode;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeClasses = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export function Dialog({ open, onClose, title, description, children, footer, size = 'md', className }: DialogProps) {
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
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
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 8 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                            'relative w-full rounded-2xl border border-border bg-card shadow-pop max-h-[88vh] flex flex-col',
                            sizeClasses[size],
                            className
                        )}
                    >
                        {(title || description) && (
                            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
                                <div>
                                    {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
                                    {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
                                </div>
                                <button
                                    onClick={onClose}
                                    aria-label="Close dialog"
                                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <X className="h-4.5 w-4.5" />
                                </button>
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">{children}</div>
                        {footer && <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">{footer}</div>}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
