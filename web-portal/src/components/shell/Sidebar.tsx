'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HeartPulse, Search, Pin, PinOff, ChevronsLeft, ChevronsRight, LogOut, ChevronDown, Check, Repeat,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSession } from '@/components/providers/SessionProvider';
import { navGroupsForRole, homeForRole, appForRole, type NavItem } from '@/lib/navigation';
import { Badge } from '@/components/ui/badge';
import { Dropdown, DropdownItem, DropdownLabel } from '@/components/ui/dropdown';

const APP_LABELS: Record<string, string> = {
    PATIENT: 'Patient Portal',
    PHYSICIAN: 'Clinical Workspace',
    RADIOLOGIST: 'Radiology Workspace',
    SUPER_ADMIN: 'Hospital OS — Admin',
};

const PINS_KEY = 'cc-pinned-paths';
const RECENTS_KEY = 'cc-recent-paths';

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    /** Mobile drawer mode: rendered inside an overlay, never collapsed. */
    mobile?: boolean;
    onNavigate?: () => void;
    badges?: Partial<Record<'messages' | 'notifications' | 'alerts', number>>;
}

function usePersistedList(key: string, limit: number) {
    const [list, setList] = React.useState<string[]>([]);
    React.useEffect(() => {
        try { setList(JSON.parse(localStorage.getItem(key) || '[]')); } catch { /* ignore */ }
    }, [key]);
    const update = React.useCallback((next: string[]) => {
        const trimmed = next.slice(0, limit);
        setList(trimmed);
        localStorage.setItem(key, JSON.stringify(trimmed));
    }, [key, limit]);
    return [list, update] as const;
}

export function Sidebar({ collapsed, onToggle, mobile, onNavigate, badges = {} }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { session, switchRole, availableRoles, isAuthenticated, logout } = useSession();
    const app = appForRole(session.role);
    const groups = React.useMemo(() => navGroupsForRole(session.role), [session.role]);
    const [query, setQuery] = React.useState('');
    const [pins, setPins] = usePersistedList(PINS_KEY, 6);
    const [recents, setRecents] = usePersistedList(RECENTS_KEY, 5);
    const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({});

    const allItems = React.useMemo(() => groups.flatMap((g) => g.items), [groups]);

    // Track recently visited pages.
    React.useEffect(() => {
        if (!pathname || pathname === '/') return;
        if (!allItems.some((i) => i.path === pathname)) return;
        setRecents([pathname, ...recents.filter((p) => p !== pathname)]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    const togglePin = (path: string) => {
        setPins(pins.includes(path) ? pins.filter((p) => p !== path) : [path, ...pins]);
    };

    const isActive = (path: string) =>
        pathname === path || (path !== '/' && pathname.startsWith(path + '/'));

    const filter = query.trim().toLowerCase();
    const matches = (item: NavItem) =>
        !filter ||
        item.name.toLowerCase().includes(filter) ||
        (item.keywords || '').includes(filter);

    const showLabels = mobile || !collapsed;
    const pinnedItems = pins
        .map((p) => allItems.find((i) => i.path === p))
        .filter((i): i is NavItem => Boolean(i));
    const recentItems = recents
        .map((p) => allItems.find((i) => i.path === p))
        .filter((i): i is NavItem => Boolean(i))
        .filter((i) => !pins.includes(i.path));

    const renderItem = (item: NavItem, opts?: { pinned?: boolean }) => {
        const active = isActive(item.path);
        const badgeCount = item.badgeKey ? badges[item.badgeKey] : undefined;
        return (
            <div key={item.path + (opts?.pinned ? ':pin' : '')} className="group/item relative">
                <Link
                    href={item.path}
                    onClick={onNavigate}
                    title={!showLabels ? item.name : undefined}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
                        showLabels ? '' : 'justify-center px-0',
                        active
                            ? 'gradient-brand text-white shadow-soft'
                            : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    )}
                >
                    <item.icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-white' : '')} aria-hidden />
                    {showLabels && <span className="truncate flex-1">{item.name}</span>}
                    {showLabels && typeof badgeCount === 'number' && badgeCount > 0 && (
                        <Badge tone={active ? 'neutral' : 'brand'} className={cn(active && 'bg-white/20 text-white')}>
                            {badgeCount}
                        </Badge>
                    )}
                </Link>
                {showLabels && (
                    <button
                        onClick={() => togglePin(item.path)}
                        aria-label={pins.includes(item.path) ? `Unpin ${item.name}` : `Pin ${item.name}`}
                        className={cn(
                            'absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 opacity-0 transition-opacity group-hover/item:opacity-100',
                            active ? 'text-white/80 hover:text-white' : 'text-subtle-foreground hover:text-foreground',
                            typeof badgeCount === 'number' && badgeCount > 0 && 'hidden'
                        )}
                    >
                        {pins.includes(item.path) ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                    </button>
                )}
            </div>
        );
    };

    return (
        <aside
            className={cn(
                'flex h-full flex-col bg-card/80 glass-panel border-r border-border',
                mobile ? 'w-72 rounded-r-3xl' : 'w-full'
            )}
            aria-label="Primary navigation"
        >
            {/* Brand + workspace */}
            <div className={cn('flex items-center gap-3 px-4 pt-5 pb-3', !showLabels && 'justify-center px-2')}>
                <div className="gradient-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-soft">
                    <HeartPulse className="h-5 w-5 text-white" aria-hidden />
                </div>
                {showLabels && (
                    <div className="min-w-0">
                        <p className="truncate text-base font-bold tracking-tight text-foreground">{app.name}</p>
                        {isAuthenticated ? (
                            /* Real sign-in: the user lives in exactly one app — no switcher. */
                            <p className="truncate text-xs text-muted-foreground">{app.subtitle}</p>
                        ) : (
                            <Dropdown
                                align="left"
                                trigger={
                                    <button className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground" aria-label="Switch workspace">
                                        <Repeat className="h-3 w-3" aria-hidden />
                                        <span className="truncate max-w-36">{app.subtitle}</span>
                                        <ChevronDown className="h-3 w-3" aria-hidden />
                                    </button>
                                }
                            >
                                <DropdownLabel>Switch app</DropdownLabel>
                                {availableRoles.map((role) => (
                                    <DropdownItem
                                        key={role}
                                        icon={session.role === role ? <Check /> : undefined}
                                        onClick={() => {
                                            switchRole(role);
                                            router.push(homeForRole(role as typeof session.role));
                                            onNavigate?.();
                                        }}
                                    >
                                        {APP_LABELS[role] ?? role}
                                    </DropdownItem>
                                ))}
                            </Dropdown>
                        )}
                    </div>
                )}
            </div>

            {/* Search */}
            {showLabels && (
                <div className="px-4 pb-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle-foreground" aria-hidden />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Filter navigation…"
                            aria-label="Filter navigation"
                            className="h-8 w-full rounded-lg border border-transparent bg-muted/70 pl-9 pr-3 text-xs text-foreground outline-none transition-all placeholder:text-subtle-foreground focus:border-primary/40 focus:bg-card"
                        />
                    </div>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4 pt-1">
                {!filter && showLabels && pinnedItems.length > 0 && (
                    <div className="mb-3">
                        <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-subtle-foreground">Pinned</p>
                        <div className="space-y-0.5">{pinnedItems.map((i) => renderItem(i, { pinned: true }))}</div>
                    </div>
                )}
                {!filter && showLabels && recentItems.length > 0 && (
                    <div className="mb-3">
                        <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-subtle-foreground">Recent</p>
                        <div className="space-y-0.5">{recentItems.slice(0, 3).map((i) => renderItem(i))}</div>
                    </div>
                )}

                {groups.map((group) => {
                    const visible = group.items.filter(matches);
                    if (visible.length === 0) return null;
                    const isOpen = openGroups[group.id] ?? true;
                    return (
                        <div key={group.id} className="mb-2">
                            {showLabels ? (
                                <button
                                    onClick={() => setOpenGroups((s) => ({ ...s, [group.id]: !isOpen }))}
                                    aria-expanded={isOpen}
                                    className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-subtle-foreground transition-colors hover:text-muted-foreground"
                                >
                                    {group.label}
                                    <ChevronDown className={cn('h-3 w-3 transition-transform', !isOpen && '-rotate-90')} aria-hidden />
                                </button>
                            ) : (
                                <div className="mx-auto my-2 h-px w-6 bg-border" aria-hidden />
                            )}
                            <AnimatePresence initial={false}>
                                {(isOpen || Boolean(filter) || !showLabels) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-0.5 overflow-hidden"
                                    >
                                        {visible.map((i) => renderItem(i))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className={cn('border-t border-border p-3', !showLabels && 'flex flex-col items-center gap-1')}>
                <button
                    onClick={() => {
                        logout();
                        onNavigate?.();
                    }}
                    className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger-soft',
                        !showLabels && 'justify-center px-0'
                    )}
                    title={!showLabels ? 'Logout' : undefined}
                >
                    <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
                    {showLabels && 'Logout'}
                </button>
                {!mobile && (
                    <button
                        onClick={onToggle}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground',
                            !showLabels && 'justify-center px-0'
                        )}
                    >
                        {collapsed ? <ChevronsRight className="h-[18px] w-[18px]" aria-hidden /> : <ChevronsLeft className="h-[18px] w-[18px]" aria-hidden />}
                        {showLabels && 'Collapse'}
                    </button>
                )}
            </div>
        </aside>
    );
}
