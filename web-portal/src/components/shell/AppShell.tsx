'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { isChromeless, canAccessRoute, homeForRole, isPatientOnlyHome } from '@/lib/navigation';
import { useSession } from '@/components/providers/SessionProvider';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from './CommandPalette';

const COLLAPSE_KEY = 'cc-sidebar-collapsed';

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { session, hydrated } = useSession();
    const [collapsed, setCollapsed] = React.useState(false);
    const [mobileNav, setMobileNav] = React.useState(false);
    const [paletteOpen, setPaletteOpen] = React.useState(false);

    // App separation: each role lives in its own app. Blocked routes redirect
    // to the role's home (patients can never see clinical/admin surfaces, and
    // clinicians land on their workspace instead of the patient portal).
    const blocked = hydrated && (
        !canAccessRoute(session.role, pathname) || isPatientOnlyHome(session.role, pathname)
    );
    React.useEffect(() => {
        if (blocked) router.replace(homeForRole(session.role));
    }, [blocked, router, session.role]);

    React.useEffect(() => {
        setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    }, []);

    const toggleCollapse = () => {
        setCollapsed((c) => {
            localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
            return !c;
        });
    };

    // Global ⌘K / Ctrl+K
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setPaletteOpen((o) => !o);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Close the mobile drawer on route change.
    React.useEffect(() => setMobileNav(false), [pathname]);

    // Full-bleed routes (kiosk, TV display) skip all chrome.
    if (isChromeless(pathname)) {
        return <>{children}</>;
    }

    // Never flash restricted content while the redirect commits.
    if (blocked) {
        return (
            <div className="flex min-h-screen items-center justify-center gradient-surface">
                <p className="text-sm text-muted-foreground animate-pulse-soft">Opening your workspace…</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen gradient-surface">
            {/* Desktop sidebar */}
            <motion.div
                animate={{ width: collapsed ? 76 : 264 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="fixed inset-y-0 left-0 z-40 hidden lg:block"
            >
                <Sidebar collapsed={collapsed} onToggle={toggleCollapse} />
            </motion.div>

            {/* Mobile drawer */}
            <AnimatePresence>
                {mobileNav && (
                    <div className="fixed inset-0 z-[90] lg:hidden">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
                            onClick={() => setMobileNav(false)}
                            aria-hidden
                        />
                        <motion.div
                            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute inset-y-0 left-0"
                        >
                            <Sidebar collapsed={false} mobile onToggle={() => {}} onNavigate={() => setMobileNav(false)} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Main column */}
            <div
                className={cn(
                    'flex min-h-screen flex-col transition-[margin-left] duration-250 ease-out',
                    collapsed ? 'lg:ml-[76px]' : 'lg:ml-[264px]'
                )}
            >
                <Header onOpenPalette={() => setPaletteOpen(true)} onOpenMobileNav={() => setMobileNav(true)} />
                <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="mx-auto w-full max-w-[1600px]"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>

            <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        </div>
    );
}
