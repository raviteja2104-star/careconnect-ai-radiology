'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, CornerDownLeft, Moon, Sun, Contrast, UserCheck, Users, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/components/providers/SessionProvider';
import { allNavItems, type NavItem } from '@/lib/navigation';
import { useTheme } from '@/components/providers/ThemeProvider';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

interface CommandPaletteProps {
    open: boolean;
    onClose: () => void;
}

type Entry =
    | { kind: 'nav'; item: NavItem }
    | { kind: 'action'; id: string; name: string; icon: React.ElementType; run: () => void }
    | { kind: 'result'; id: string; name: string; sublabel: string; icon: React.ElementType; href: string };

interface ClinicalSearchData {
    doctors: Array<{ _id: string; firstName: string; lastName: string; specialization?: string }>;
    patients: Array<{ _id: string; firstName: string; lastName: string; email?: string; phone?: string }>;
    appointments: Array<{
        _id: string;
        reason?: string;
        specialty?: string;
        patient?: { firstName: string; lastName: string };
    }>;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
    const router = useRouter();
    const { toggleTheme, resolvedTheme, highContrast, setHighContrast } = useTheme();
    const [query, setQuery] = React.useState('');
    const [active, setActive] = React.useState(0);
    const [mounted, setMounted] = React.useState(false);
    const [clinicalData, setClinicalData] = React.useState<ClinicalSearchData | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const { session } = useSession();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    React.useEffect(() => setMounted(true), []);
    React.useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setQuery('');
            setActive(0);
            setClinicalData(null);
            setTimeout(() => inputRef.current?.focus(), 30);
        }
    }, [open]);

    // Fetch clinical search results from the backend whenever the query changes
    React.useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setClinicalData(null);
            return;
        }
        const controller = new AbortController();
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        fetch(`${API_BASE}/api/search/clinical?q=${encodeURIComponent(trimmed)}`, {
            headers,
            signal: controller.signal,
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => {
                if (json?.success) setClinicalData(json.data ?? null);
            })
            .catch(() => {}); // AbortError on unmount / new query — safe to ignore
        return () => controller.abort();
    }, [query]);

    const entries = React.useMemo<Entry[]>(() => {
        const nav: Entry[] = allNavItems(session.role).map((item) => ({ kind: 'nav', item }));
        const actions: Entry[] = [
            {
                kind: 'action', id: 'theme',
                name: resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
                icon: resolvedTheme === 'dark' ? Sun : Moon,
                run: toggleTheme,
            },
            {
                kind: 'action', id: 'contrast',
                name: highContrast ? 'Disable high contrast' : 'Enable high contrast',
                icon: Contrast,
                run: () => setHighContrast(!highContrast),
            },
        ];
        return [...nav, ...actions];
    }, [session.role, resolvedTheme, highContrast, toggleTheme, setHighContrast]);

    const q = query.trim().toLowerCase();

    // Local nav + action entries
    const localFiltered = entries.filter((e) =>
        e.kind === 'nav'
            ? e.item.name.toLowerCase().includes(q) || (e.item.keywords || '').includes(q) || e.item.path.includes(q)
            : e.name.toLowerCase().includes(q),
    );

    // Clinical backend result entries
    const resultEntries: Entry[] = React.useMemo(() => {
        if (!clinicalData) return [];
        const res: Entry[] = [];
        for (const doc of (clinicalData.doctors ?? []).slice(0, 3)) {
            res.push({
                kind: 'result',
                id: `doc-${doc._id}`,
                name: `Dr. ${doc.firstName} ${doc.lastName}`,
                sublabel: doc.specialization ?? 'Doctor',
                icon: UserCheck,
                href: `/doctor/profile?id=${doc._id}`,
            });
        }
        for (const pat of (clinicalData.patients ?? []).slice(0, 3)) {
            res.push({
                kind: 'result',
                id: `pat-${pat._id}`,
                name: `${pat.firstName} ${pat.lastName}`,
                sublabel: pat.phone ?? pat.email ?? 'Patient',
                icon: Users,
                href: `/patients/${pat._id}`,
            });
        }
        for (const apt of (clinicalData.appointments ?? []).slice(0, 2)) {
            const ptName = apt.patient
                ? `${apt.patient.firstName} ${apt.patient.lastName}`
                : '';
            res.push({
                kind: 'result',
                id: `apt-${apt._id}`,
                name: apt.reason ?? apt.specialty ?? 'Appointment',
                sublabel: ptName ? `Patient: ${ptName}` : 'Appointment',
                icon: CalendarDays,
                href: `/appointments`,
            });
        }
        return res;
    }, [clinicalData]);

    const filtered = [...localFiltered, ...resultEntries].slice(0, 12);

    const run = React.useCallback((entry: Entry) => {
        onClose();
        if (entry.kind === 'nav') router.push(entry.item.path);
        else if (entry.kind === 'result') router.push(entry.href);
        else entry.run();
    }, [onClose, router]);

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
        else if (e.key === 'Enter' && filtered[active]) { e.preventDefault(); run(filtered[active]); }
        else if (e.key === 'Escape') onClose();
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[150] flex items-start justify-center px-4 pt-[12vh]">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={onClose} aria-hidden
                    />
                    <motion.div
                        role="dialog" aria-modal="true" aria-label="Command palette"
                        initial={{ opacity: 0, scale: 0.97, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: -8 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-popover shadow-pop"
                        onKeyDown={onKeyDown}
                    >
                        <div className="flex items-center gap-3 border-b border-border px-4">
                            <Search className="h-4.5 w-4.5 text-subtle-foreground" aria-hidden />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                                placeholder="Search pages, actions, patients, doctors…"
                                aria-label="Search pages, actions, patients, doctors"
                                className="h-13 flex-1 bg-transparent py-4 text-sm text-foreground outline-none placeholder:text-subtle-foreground"
                            />
                            <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">ESC</kbd>
                        </div>
                        <ul className="max-h-80 overflow-y-auto scrollbar-thin p-2" role="listbox">
                            {filtered.length === 0 && (
                                <li className="px-3 py-8 text-center text-sm text-muted-foreground">No results for &ldquo;{query}&rdquo;.</li>
                            )}
                            {filtered.map((entry, i) => {
                                const Icon = entry.kind === 'nav' ? entry.item.icon : entry.icon;
                                const name = entry.kind === 'nav' ? entry.item.name : entry.name;
                                const detail =
                                    entry.kind === 'nav'
                                        ? entry.item.path
                                        : entry.kind === 'result'
                                          ? entry.sublabel
                                          : 'Action';
                                const key =
                                    entry.kind === 'nav' ? entry.item.path : entry.id;
                                return (
                                    <li key={key} role="option" aria-selected={i === active}>
                                        <button
                                            onMouseEnter={() => setActive(i)}
                                            onClick={() => run(entry)}
                                            className={cn(
                                                'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                                                i === active ? 'bg-primary/10 text-foreground' : 'text-muted-foreground',
                                            )}
                                        >
                                            <span className={cn(
                                                'inline-flex h-8 w-8 items-center justify-center rounded-lg',
                                                i === active ? 'gradient-brand text-white' : 'bg-muted text-muted-foreground',
                                            )}>
                                                <Icon className="h-4 w-4" aria-hidden />
                                            </span>
                                            <span className="flex-1 truncate font-medium">{name}</span>
                                            <span className="truncate text-xs text-subtle-foreground">{detail}</span>
                                            {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-subtle-foreground" aria-hidden />}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
