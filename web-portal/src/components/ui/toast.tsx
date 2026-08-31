'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
    id: number;
    tone: ToastTone;
    title: string;
    description?: string;
}

interface ToastContextValue {
    toast: (tone: ToastTone, title: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const toneConfig: Record<ToastTone, { icon: typeof Info; classes: string }> = {
    success: { icon: CheckCircle2, classes: 'text-success' },
    warning: { icon: AlertTriangle, classes: 'text-warning' },
    error: { icon: XCircle, classes: 'text-danger' },
    info: { icon: Info, classes: 'text-info' },
};

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = React.useState<ToastItem[]>([]);
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    const dismiss = React.useCallback((id: number) => {
        setItems((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = React.useCallback((tone: ToastTone, title: string, description?: string) => {
        const id = nextId++;
        setItems((prev) => [...prev.slice(-4), { id, tone, title, description }]);
        setTimeout(() => dismiss(id), 5000);
    }, [dismiss]);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            {mounted &&
                createPortal(
                    <div className="fixed bottom-6 right-6 z-[200] flex w-full max-w-sm flex-col gap-2" role="region" aria-label="Notifications">
                        <AnimatePresence>
                            {items.map((t) => {
                                const { icon: Icon, classes } = toneConfig[t.tone];
                                return (
                                    <motion.div
                                        key={t.id}
                                        layout
                                        initial={{ opacity: 0, x: 40, scale: 0.96 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: 40, scale: 0.96 }}
                                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                        className="glass-card flex items-start gap-3 rounded-2xl p-4 shadow-float"
                                        role="status"
                                    >
                                        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', classes)} aria-hidden />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-foreground">{t.title}</p>
                                            {t.description && <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>}
                                        </div>
                                        <button
                                            onClick={() => dismiss(t.id)}
                                            aria-label="Dismiss notification"
                                            className="rounded-md p-1 text-subtle-foreground transition-colors hover:bg-muted hover:text-foreground"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>,
                    document.body
                )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = React.useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}
