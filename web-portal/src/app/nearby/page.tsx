'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Search, MapPin, LocateFixed, Stethoscope, Building2, FlaskConical, TestTube2,
    Video, Siren, ChevronRight, ShieldCheck, Sparkles,
} from 'lucide-react';
import { Card, CardContent, Button, Badge, Input, Select, Label } from '@/components/ui';
import {
    VIZAG_LOCALITIES, requestBrowserLocation, localityToGeo, type UserLocation,
} from './_lib/api';

const QUICK_ACTIONS: Array<{
    label: string;
    description: string;
    icon: React.ElementType;
    tone: string;
    build: () => { path: string; params?: Record<string, string> };
}> = [
    {
        label: 'Find Doctor',
        description: 'Clinics & specialists',
        icon: Stethoscope,
        tone: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
        build: () => ({ path: '/nearby/search', params: { type: 'clinic' } }),
    },
    {
        label: 'Find Hospital',
        description: 'Multispecialty & general',
        icon: Building2,
        tone: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
        build: () => ({ path: '/nearby/search', params: { type: 'hospital' } }),
    },
    {
        label: 'Find Lab',
        description: 'Diagnostics near you',
        icon: FlaskConical,
        tone: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
        build: () => ({ path: '/nearby/search', params: { type: 'diagnostic' } }),
    },
    {
        label: 'Book Test',
        description: 'Home collection or visit',
        icon: TestTube2,
        tone: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',
        build: () => ({ path: '/nearby/lab-booking' }),
    },
    {
        label: 'Teleconsult',
        description: 'Video consultation today',
        icon: Video,
        tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
        build: () => ({ path: '/nearby/search', params: { teleconsultation: 'true' } }),
    },
    {
        label: 'Emergency',
        description: 'Urgent care & ambulance',
        icon: Siren,
        tone: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
        build: () => ({ path: '/emergency' }),
    },
];

export default function NearbyHomePage() {
    const router = useRouter();
    const [query, setQuery] = React.useState('');
    const [locationMode, setLocationMode] = React.useState<'none' | 'geo' | 'locality' | 'pincode'>('none');
    const [locating, setLocating] = React.useState(false);
    const [locationLabel, setLocationLabel] = React.useState<string | null>(null);
    const [locality, setLocality] = React.useState('');
    const [pincode, setPincode] = React.useState('');
    const [geoDenied, setGeoDenied] = React.useState(false);
    const [userLoc, setUserLoc] = React.useState<UserLocation | null>(null);

    async function handleUseMyLocation() {
        setLocating(true);
        setGeoDenied(false);
        const loc = await requestBrowserLocation();
        setLocating(false);
        if (!loc) {
            setGeoDenied(true);
            setLocationMode('locality');
            return;
        }
        setUserLoc(loc);
        setLocationMode('geo');
        setLocationLabel('Your current location');
    }

    function handleLocalitySelect(name: string) {
        setLocality(name);
        const geo = localityToGeo(name);
        if (geo) {
            setUserLoc({ ...geo, source: 'locality', locality: name });
            setLocationMode('locality');
            setLocationLabel(name);
        }
    }

    function buildSearchParams(extra?: Record<string, string>): string {
        const qs = new URLSearchParams();
        if (query.trim()) qs.set('q', query.trim());
        if (userLoc) {
            qs.set('lat', String(userLoc.lat));
            qs.set('lng', String(userLoc.lng));
        }
        if (locality) qs.set('locality', locality);
        if (pincode.trim()) qs.set('pincode', pincode.trim());
        if (extra) Object.entries(extra).forEach(([k, v]) => qs.set(k, v));
        return qs.toString();
    }

    function goSearch() {
        router.push(`/nearby/search?${buildSearchParams()}`);
    }

    function goQuickAction(action: (typeof QUICK_ACTIONS)[number]) {
        const { path, params } = action.build();
        if (path === '/emergency') {
            router.push(path);
            return;
        }
        const qs = buildSearchParams(params);
        router.push(`${path}${qs ? `?${qs}` : ''}`);
    }

    return (
        <div className="space-y-8">
            {/* Hero */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
                <Card variant="gradient" className="overflow-hidden rounded-3xl">
                    <CardContent className="relative p-6 md:p-10">
                        <span
                            className="pointer-events-none absolute right-0 top-0 h-72 w-72 -translate-y-1/3 translate-x-1/4 rounded-full bg-white opacity-5"
                            aria-hidden
                        />
                        <div className="relative max-w-2xl">
                            <Badge tone="outline" className="border-white/30 bg-white/10 text-white">
                                <Sparkles className="h-3 w-3" aria-hidden /> CareConnect Nearby
                            </Badge>
                            <h1 className="mt-4 text-2xl font-bold tracking-tight md:text-4xl">
                                Find the right care, near you, when you need it.
                            </h1>
                            <p className="mt-3 text-sm leading-relaxed opacity-90 md:text-base">
                                Search verified hospitals, clinics, labs, and pharmacies across Visakhapatnam —
                                compare distance, fees, and real availability before you book.
                            </p>

                            {/* Big search bar */}
                            <form
                                className="mt-6 flex flex-col gap-2 sm:flex-row"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    goSearch();
                                }}
                            >
                                <div className="relative flex-1">
                                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden />
                                    <input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="What healthcare do you need? e.g. cardiologist, blood test, pharmacy"
                                        aria-label="What healthcare do you need?"
                                        className="h-12 w-full rounded-xl border-0 bg-white pl-10 pr-4 text-sm text-zinc-900 shadow-soft outline-none ring-0 placeholder:text-zinc-400 focus:ring-2 focus:ring-white/60"
                                    />
                                </div>
                                <Button type="submit" size="lg" variant="secondary" className="shrink-0 bg-white text-primary hover:bg-white/90">
                                    <Search className="h-4 w-4" aria-hidden /> Search
                                </Button>
                            </form>

                            {/* Location chip */}
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <Button
                                    type="button"
                                    variant="glass"
                                    size="sm"
                                    onClick={handleUseMyLocation}
                                    loading={locating}
                                    className="border-white/25 text-white hover:text-white"
                                >
                                    <LocateFixed className="h-3.5 w-3.5" aria-hidden />
                                    {locationMode === 'geo' && locationLabel ? locationLabel : 'Use my location'}
                                </Button>

                                <span className="text-xs text-white/70">or</span>

                                <div className="flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-white/80" aria-hidden />
                                    <Select
                                        value={locality}
                                        onChange={(e) => handleLocalitySelect(e.target.value)}
                                        aria-label="Enter locality"
                                        className="h-9 w-44 border-white/20 bg-white/10 text-xs text-white [&>option]:text-zinc-900"
                                    >
                                        <option value="">Enter locality…</option>
                                        {VIZAG_LOCALITIES.map((l) => (
                                            <option key={l.name} value={l.name}>{l.name}</option>
                                        ))}
                                    </Select>
                                </div>

                                <span className="text-xs text-white/70">or</span>

                                <Input
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="PIN code"
                                    aria-label="PIN code"
                                    className="h-9 w-28 border-white/20 bg-white/10 text-xs text-white placeholder:text-white/60"
                                />
                            </div>

                            {geoDenied && (
                                <p className="mt-2 text-xs text-white/80">
                                    Couldn&apos;t access your location — pick a locality instead, or allow location access and try again.
                                </p>
                            )}
                            {locationMode === 'locality' && locality && (
                                <p className="mt-2 flex items-center gap-1.5 text-xs text-white/80">
                                    <MapPin className="h-3 w-3" aria-hidden /> Searching near {locality}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Quick actions */}
            <div>
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Quick actions</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {QUICK_ACTIONS.map((action, i) => (
                        <motion.button
                            key={action.label}
                            type="button"
                            onClick={() => goQuickAction(action)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                            whileHover={{ y: -2 }}
                            className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-soft transition-shadow hover:shadow-float"
                        >
                            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${action.tone}`}>
                                <action.icon className="h-5 w-5" aria-hidden />
                            </span>
                            <span>
                                <span className="block text-sm font-semibold text-foreground">{action.label}</span>
                                <span className="block text-xs text-muted-foreground">{action.description}</span>
                            </span>
                        </motion.button>
                    ))}
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-danger/25 bg-danger-soft px-3.5 py-2.5">
                    <Siren className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
                    <p className="text-xs font-medium leading-relaxed text-danger">
                        For life-threatening emergencies, call <span className="font-bold">108</span> immediately.
                        The Emergency tile above opens CareConnect&apos;s emergency care view — it is not a booking flow.
                    </p>
                </div>
            </div>

            {/* Trust / honesty strip */}
            <Card>
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <ShieldCheck className="h-5 w-5" aria-hidden />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-foreground">Every listing shows its real verification status</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                Verified, Claimed, Unverified, Temporarily unavailable, or Closed — always visible, never hidden behind a generic badge.
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push('/nearby/search')}>
                        Browse all providers <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
