'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Search, Bell, Sparkles, Plus, Moon, Sun, Contrast, Menu, CalendarPlus, UserPlus,
    FlaskConical, Video, Settings, LogOut, User, Building2, MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/components/providers/SessionProvider';
import { useTheme } from '@/components/providers/ThemeProvider';
import { TourLauncherButton } from '@/components/tour/TourProvider';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown, DropdownItem, DropdownLabel, DropdownSeparator } from '@/components/ui/dropdown';

interface HeaderProps {
    onOpenPalette: () => void;
    onOpenMobileNav: () => void;
}

export function Header({ onOpenPalette, onOpenMobileNav }: HeaderProps) {
    const router = useRouter();
    const { resolvedTheme, toggleTheme, highContrast, setHighContrast } = useTheme();
    const { session, logout } = useSession();
    const [isMac, setIsMac] = React.useState(false);
    React.useEffect(() => {
        setIsMac(/Mac|iPhone|iPad/.test(navigator.platform));
    }, []);

    const iconBtn =
        'inline-flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';

    return (
        <header className="sticky top-0 z-40 glass-panel border-b border-border">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
                {/* Mobile nav trigger */}
                <button className={cn(iconBtn, 'lg:hidden')} onClick={onOpenMobileNav} aria-label="Open navigation">
                    <Menu className="h-5 w-5" />
                </button>

                {/* Global search → command palette */}
                <button
                    onClick={onOpenPalette}
                    className="group flex h-10 w-full max-w-md items-center gap-3 rounded-xl border border-border bg-card/60 px-3.5 text-sm text-subtle-foreground transition-all hover:border-primary/40 hover:shadow-soft"
                    aria-label="Open global search"
                >
                    <Search className="h-4 w-4" aria-hidden />
                    <span className="flex-1 truncate text-left">Search patients, pages, actions…</span>
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {isMac ? '⌘' : 'Ctrl'} K
                    </kbd>
                </button>

                <div className="ml-auto flex items-center gap-1.5">
                    {/* Live demo tour */}
                    <TourLauncherButton className="hidden sm:inline-flex" />

                    {/* AI assistant */}
                    <Link
                        href="/ai-assistant"
                        className="hidden sm:inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold text-primary transition-all hover:bg-primary/10"
                    >
                        <Sparkles className="h-4 w-4" aria-hidden />
                        AI Assistant
                    </Link>

                    {/* Quick add */}
                    <Dropdown
                        trigger={
                            <button className="gradient-brand inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-soft transition-all hover:shadow-float" aria-label="Quick add">
                                <Plus className="h-5 w-5" />
                            </button>
                        }
                    >
                        <DropdownLabel>Quick actions</DropdownLabel>
                        <DropdownItem icon={<CalendarPlus />} onClick={() => router.push('/appointments/book')}>Book appointment</DropdownItem>
                        <DropdownItem icon={<UserPlus />} onClick={() => router.push('/reception/walkin')}>Register walk-in</DropdownItem>
                        <DropdownItem icon={<FlaskConical />} onClick={() => router.push('/lab-orders')}>New lab order</DropdownItem>
                        <DropdownItem icon={<Video />} onClick={() => router.push('/telemedicine')}>Start teleconsult</DropdownItem>
                    </Dropdown>

                    {/* Theme */}
                    <button className={iconBtn} onClick={toggleTheme} aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                        {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                    <button
                        className={cn(iconBtn, highContrast && 'bg-primary/10 text-primary')}
                        onClick={() => setHighContrast(!highContrast)}
                        aria-label={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
                        aria-pressed={highContrast}
                    >
                        <Contrast className="h-5 w-5" />
                    </button>

                    {/* Messages / notifications */}
                    <Link href="/messages" className={cn(iconBtn, 'hidden sm:inline-flex')} aria-label="Messages">
                        <MessageSquare className="h-5 w-5" />
                    </Link>
                    <Link href="/notifications" className={cn(iconBtn, 'relative')} aria-label="Notifications">
                        <Bell className="h-5 w-5" />
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-card" aria-hidden />
                    </Link>

                    <div className="mx-1 hidden h-8 w-px bg-border sm:block" aria-hidden />

                    {/* Profile */}
                    <Dropdown
                        trigger={
                            <button className="flex items-center gap-2.5 rounded-xl p-1 pr-2 transition-colors hover:bg-muted" aria-label="Account menu">
                                <Avatar name={session.name} size="sm" status="online" />
                                <span className="hidden text-left md:block">
                                    <span className="block text-sm font-semibold leading-tight text-foreground max-w-36 truncate">{session.name}</span>
                                    <span className="block text-[11px] leading-tight text-muted-foreground">{session.role.replace('_', ' ')}</span>
                                </span>
                            </button>
                        }
                    >
                        <DropdownLabel>{session.email}</DropdownLabel>
                        <DropdownItem icon={<Building2 />}>{session.hospitalName}</DropdownItem>
                        <DropdownSeparator />
                        <DropdownItem icon={<User />} onClick={() => router.push('/settings')}>Profile</DropdownItem>
                        <DropdownItem icon={<Settings />} onClick={() => router.push('/settings')}>Settings</DropdownItem>
                        <DropdownSeparator />
                        <DropdownItem icon={<LogOut />} danger onClick={logout}>Logout</DropdownItem>
                    </Dropdown>
                </div>
            </div>
        </header>
    );
}
