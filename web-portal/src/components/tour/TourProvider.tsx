'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TOURS, tourById, type Tour } from '@/lib/tours';
import { useSession } from '@/components/providers/SessionProvider';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface TourContextValue {
    startTour: (id: string) => void;
    openCatalog: () => void;
    active: boolean;
}

const TourContext = React.createContext<TourContextValue | null>(null);

interface SpotRect { top: number; left: number; width: number; height: number }

const PAD = 8;

export function TourProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { session, switchRole } = useSession();
    const [mounted, setMounted] = React.useState(false);
    const [catalogOpen, setCatalogOpen] = React.useState(false);
    const [tour, setTour] = React.useState<Tour | null>(null);
    const [stepIndex, setStepIndex] = React.useState(0);
    const [rect, setRect] = React.useState<SpotRect | null>(null);
    const [waiting, setWaiting] = React.useState(false);

    React.useEffect(() => setMounted(true), []);

    const step = tour?.steps[stepIndex] ?? null;

    const stop = React.useCallback(() => {
        setTour(null);
        setStepIndex(0);
        setRect(null);
    }, []);

    const startTour = React.useCallback((id: string) => {
        const t = tourById(id);
        if (!t) return;
        setCatalogOpen(false);
        if (session.role !== t.role) switchRole(t.role);
        setTour(t);
        setStepIndex(0);
    }, [session.role, switchRole]);

    // Navigate to the step's route when needed.
    React.useEffect(() => {
        if (!step) return;
        if (pathname !== step.route) {
            setWaiting(true);
            router.push(step.route);
        }
    }, [step, pathname, router]);

    // Locate + measure the target element (poll briefly — pages mount async).
    React.useEffect(() => {
        if (!step) return;
        if (pathname !== step.route) return; // still navigating
        let cancelled = false;
        let attempts = 0;

        const measure = () => {
            if (cancelled) return;
            if (!step.selector) {
                setRect(null);
                setWaiting(false);
                return;
            }
            const el = document.querySelector(step.selector);
            if (el) {
                // Measure synchronously — rAF stalls in backgrounded tabs.
                el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
                const r = el.getBoundingClientRect();
                setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
                setWaiting(false);
            } else if (attempts++ < 20) {
                setTimeout(measure, 200);
            } else {
                setRect(null); // fall back to page-level card
                setWaiting(false);
            }
        };
        setWaiting(true);
        measure();

        const onRelayout = () => measure();
        window.addEventListener('resize', onRelayout);
        return () => {
            cancelled = true;
            window.removeEventListener('resize', onRelayout);
        };
    }, [step, pathname]);

    // Keyboard: arrows advance, Escape exits.
    React.useEffect(() => {
        if (!tour) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') stop();
            else if (e.key === 'ArrowRight') setStepIndex((i) => Math.min(i + 1, tour.steps.length - 1));
            else if (e.key === 'ArrowLeft') setStepIndex((i) => Math.max(i - 1, 0));
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [tour, stop]);

    const next = () => {
        if (!tour) return;
        if (stepIndex >= tour.steps.length - 1) stop();
        else setStepIndex((i) => i + 1);
    };
    const prev = () => setStepIndex((i) => Math.max(i - 1, 0));

    const value = React.useMemo<TourContextValue>(
        () => ({ startTour, openCatalog: () => setCatalogOpen(true), active: !!tour }),
        [startTour, tour]
    );

    const isLast = tour ? stepIndex === tour.steps.length - 1 : false;

    // Card position: under the spotlight when it fits, else above, else centered bottom.
    const cardStyle: React.CSSProperties = React.useMemo(() => {
        if (!rect) return { left: '50%', bottom: '2rem', transform: 'translateX(-50%)' };
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
        const below = rect.top + rect.height + 16;
        const style: React.CSSProperties = { left: Math.max(16, Math.min(rect.left, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 416)) };
        if (below + 220 < vh) style.top = below;
        else if (rect.top > 240) style.top = Math.max(16, rect.top - 236);
        else { style.bottom = '2rem'; style.left = '50%'; style.transform = 'translateX(-50%)'; }
        return style;
    }, [rect]);

    return (
        <TourContext.Provider value={value}>
            {children}

            {/* Tour catalog */}
            <Dialog
                open={catalogOpen}
                onClose={() => setCatalogOpen(false)}
                title="Live product tour"
                description="Pick a module — the tour switches to the right app, navigates the real pages, and walks you through them."
                size="lg"
            >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {TOURS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => startTour(t.id)}
                            className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-float"
                        >
                            <span className="gradient-brand inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white">
                                <t.icon className="h-5 w-5" aria-hidden />
                            </span>
                            <span className="min-w-0">
                                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    {t.name}
                                    <Badge tone="neutral">{t.steps.length} steps</Badge>
                                </span>
                                <span className="mt-0.5 block text-xs text-muted-foreground">{t.description}</span>
                            </span>
                        </button>
                    ))}
                </div>
            </Dialog>

            {/* Active tour overlay */}
            {mounted && createPortal(
                <AnimatePresence>
                    {tour && step && (
                        <motion.div
                            key="tour-overlay"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[180] pointer-events-none"
                            aria-live="polite"
                        >
                            {/* Spotlight: dim everything except the target */}
                            {rect ? (
                                <motion.div
                                    layout
                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                    className="absolute rounded-2xl border-2 border-primary"
                                    style={{
                                        top: rect.top, left: rect.left, width: rect.width, height: rect.height,
                                        boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.55)',
                                    }}
                                    aria-hidden
                                />
                            ) : (
                                <div className="absolute inset-0 bg-slate-950/55" aria-hidden />
                            )}

                            {/* Step card */}
                            <motion.div
                                key={`${tour.id}-${stepIndex}`}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                                className="pointer-events-auto fixed w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-popover p-5 shadow-pop"
                                style={cardStyle}
                                role="dialog"
                                aria-label={`Tour step ${stepIndex + 1}: ${step.title}`}
                            >
                                <div className="mb-1 flex items-center justify-between gap-3">
                                    <Badge tone="brand" dot>
                                        {tour.name} · {stepIndex + 1}/{tour.steps.length}
                                    </Badge>
                                    <button onClick={stop} aria-label="End tour" className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                    {waiting ? 'Loading…' : step.body}
                                </p>
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="flex gap-1" aria-hidden>
                                        {tour.steps.map((_, i) => (
                                            <span key={i} className={cn('h-1.5 rounded-full transition-all', i === stepIndex ? 'w-5 bg-primary' : 'w-1.5 bg-border')} />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {stepIndex > 0 && (
                                            <Button variant="ghost" size="sm" onClick={prev}>
                                                <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back
                                            </Button>
                                        )}
                                        <Button size="sm" onClick={next}>
                                            {isLast ? 'Finish' : 'Next'} {!isLast && <ArrowRight className="h-3.5 w-3.5" aria-hidden />}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </TourContext.Provider>
    );
}

export function useTour() {
    const ctx = React.useContext(TourContext);
    if (!ctx) throw new Error('useTour must be used within TourProvider');
    return ctx;
}

/** Header launcher button. */
export function TourLauncherButton({ className }: { className?: string }) {
    const { openCatalog } = useTour();
    return (
        <button
            onClick={openCatalog}
            aria-label="Start live demo tour"
            title="Live demo tour"
            className={cn(
                'inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold text-secondary transition-all hover:bg-secondary/10',
                className
            )}
        >
            <GraduationCap className="h-4 w-4" aria-hidden />
            <span className="hidden lg:inline">Demo</span>
        </button>
    );
}
