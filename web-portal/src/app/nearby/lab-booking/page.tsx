'use client';

import * as React from 'react';
import {
    Search as SearchIcon, FlaskConical, MapPin, LocateFixed, Truck, Building2, CalendarCheck2,
    CheckCircle2, Clock3, PartyPopper,
} from 'lucide-react';
import {
    PageHeader, Card, CardContent, Button, Badge, Input, Select, Label, Textarea, EmptyState,
    ErrorState, SkeletonCard,
} from '@/components/ui';
import { VerificationBadge } from '../_components/VerificationBadge';
import {
    searchProviders, fetchProviderProfile, fetchAvailability, createLabBooking, requestBrowserLocation,
    localityToGeo, VIZAG_LOCALITIES, VIZAG_CENTER, formatINR, telUrl,
    type NearbyProvider, type ServiceSummary, type Slot, type UserLocation, type LabBookingRecord,
} from '../_lib/api';

const SLOT_ICON: Record<Slot['status'], string> = { available: '🟢', limited: '🟡', full: '🔴', closed: '⚪' };

function nextDays(n: number): { iso: string; label: string }[] {
    const out: { iso: string; label: string }[] = [];
    for (let i = 0; i < n; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        out.push({ iso: d.toISOString().slice(0, 10), label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }) });
    }
    return out;
}

function LabBookingPanel({
    provider, tests, onDone,
}: {
    provider: NearbyProvider;
    tests: ServiceSummary[];
    onDone: () => void;
}) {
    const allowHome = provider.homeCollection || tests.some((t) => t.homeCollection);
    const [method, setMethod] = React.useState<'home' | 'lab'>(allowHome ? 'home' : 'lab');
    const [address, setAddress] = React.useState('');
    const [date, setDate] = React.useState('');
    const [slots, setSlots] = React.useState<Slot[]>([]);
    const [slotsLoading, setSlotsLoading] = React.useState(false);
    const [selectedSlot, setSelectedSlot] = React.useState<Slot | null>(null);
    const [submitting, setSubmitting] = React.useState(false);
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const [confirmed, setConfirmed] = React.useState<LabBookingRecord | null>(null);
    const [confirmedDemo, setConfirmedDemo] = React.useState(false);

    React.useEffect(() => {
        if (!date) return;
        setSlotsLoading(true);
        setSelectedSlot(null);
        fetchAvailability(provider._id, undefined, date)
            .then((res) => { setSlots(res.data.slots); setSlotsLoading(false); })
            .catch(() => { setSlots([]); setSlotsLoading(false); });
    }, [provider._id, date]);

    const total = tests.reduce((sum, t) => sum + (t.price ?? 0), 0);
    const canSubmit = Boolean(date) && (method === 'lab' || address.trim().length > 0) &&
        (slots.length === 0 || (selectedSlot != null && selectedSlot.status !== 'full' && selectedSlot.status !== 'closed'));

    async function submit() {
        setSubmitting(true);
        setSubmitError(null);
        try {
            const { booking, demo } = await createLabBooking({
                providerId: provider._id,
                tests: tests.map((t) => t.name),
                collectionMethod: method,
                date,
                slot: selectedSlot?.startTime ?? 'To be confirmed by provider',
                address: method === 'home' ? address : undefined,
            });
            setConfirmed(booking);
            setConfirmedDemo(demo);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Booking failed — please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    if (confirmed) {
        return (
            <div className="space-y-3 rounded-xl border border-success/30 bg-success-soft p-4">
                <div className="flex items-center gap-2 text-success">
                    <PartyPopper className="h-5 w-5" aria-hidden />
                    <p className="text-sm font-semibold">Lab booking confirmed</p>
                </div>
                <p className="text-xs text-muted-foreground">Confirmation code</p>
                <p className="font-mono text-sm font-semibold text-foreground">{confirmed.confirmationCode}</p>
                {confirmedDemo && <Badge tone="warning" dot>Demo booking — not sent to a real backend</Badge>}
                <div className="pt-1">
                    <Button size="sm" variant="outline" onClick={onDone}>Done</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Collection method</p>
                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={!allowHome}
                        onClick={() => setMethod('home')}
                        className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${method === 'home' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'}`}
                    >
                        <Truck className="mx-auto mb-1 h-4 w-4" aria-hidden /> Home collection
                    </button>
                    <button
                        type="button"
                        onClick={() => setMethod('lab')}
                        className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${method === 'lab' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'}`}
                    >
                        <Building2 className="mx-auto mb-1 h-4 w-4" aria-hidden /> Visit lab
                    </button>
                </div>
                {!allowHome && <p className="mt-1 text-[11px] text-muted-foreground">This provider hasn&apos;t listed home collection for these tests.</p>}
            </div>

            {method === 'home' && (
                <div>
                    <Label htmlFor={`addr-${provider._id}`}>Collection address</Label>
                    <Textarea id={`addr-${provider._id}`} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House no., street, locality, landmark" rows={2} />
                </div>
            )}

            <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</p>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {nextDays(7).map((d) => (
                        <button
                            key={d.iso}
                            type="button"
                            onClick={() => setDate(d.iso)}
                            className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${date === d.iso ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted/50'}`}
                        >
                            {d.label}
                        </button>
                    ))}
                </div>
            </div>

            {date && (
                <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Clock3 className="h-3.5 w-3.5" aria-hidden /> Time slot</p>
                    {slotsLoading && <div className="flex gap-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-9 w-16 skeleton-shimmer rounded-lg" />)}</div>}
                    {!slotsLoading && slots.length === 0 && (
                        <p className="text-xs text-muted-foreground">Real-time slot data isn&apos;t available for this lab yet — the provider will confirm your exact time after booking.</p>
                    )}
                    {!slotsLoading && slots.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {slots.map((s) => {
                                const disabled = s.status === 'full' || s.status === 'closed';
                                return (
                                    <button
                                        key={s.startTime}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => setSelectedSlot(s)}
                                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${selectedSlot?.startTime === s.startTime ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted/50'}`}
                                    >
                                        {SLOT_ICON[s.status]} {s.startTime}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {submitError && <p className="text-xs text-danger">{submitError}</p>}

            <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm font-semibold text-foreground">Total: {formatINR(total)}</span>
                <Button size="sm" onClick={submit} loading={submitting} disabled={!canSubmit || submitting}>
                    <CalendarCheck2 className="h-3.5 w-3.5" aria-hidden /> Confirm booking
                </Button>
            </div>
        </div>
    );
}

function LabCard({ provider, query }: { provider: NearbyProvider; query: string }) {
    const [services, setServices] = React.useState<ServiceSummary[] | null>(null);
    const [loadError, setLoadError] = React.useState(false);
    const [selected, setSelected] = React.useState<Set<string>>(new Set());
    const [bookingOpen, setBookingOpen] = React.useState(false);

    React.useEffect(() => {
        let cancelled = false;
        fetchProviderProfile(provider._id)
            .then((res) => { if (!cancelled) setServices(res.data.services); })
            .catch(() => { if (!cancelled) setLoadError(true); });
        return () => { cancelled = true; };
    }, [provider._id]);

    const matched = React.useMemo(() => {
        const list = services ?? [];
        if (!query.trim()) return list;
        const needle = query.trim().toLowerCase();
        return list.filter((s) => s.name.toLowerCase().includes(needle) || s.category.toLowerCase().includes(needle));
    }, [services, query]);

    const tel = telUrl(provider.phone);
    const selectedTests = matched.filter((t) => selected.has(t._id));

    function toggle(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }

    return (
        <Card>
            <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <h3 className="text-base font-semibold text-foreground">{provider.name}</h3>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" aria-hidden /> {provider.locality} · {provider.distanceKm} km away
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <VerificationBadge status={provider.verificationStatus} lastVerifiedAt={provider.lastVerifiedAt} />
                            {provider.availableToday && <Badge tone="success"><CalendarCheck2 className="h-3 w-3" aria-hidden /> Available today</Badge>}
                            {provider.homeCollection && <Badge tone="info"><Truck className="h-3 w-3" aria-hidden /> Home collection</Badge>}
                        </div>
                    </div>
                    {tel && <Button size="sm" variant="ghost" onClick={() => (window.location.href = tel)}>Call</Button>}
                </div>

                {services === null && !loadError && (
                    <div className="space-y-1.5">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-8 skeleton-shimmer rounded-lg" />)}</div>
                )}
                {loadError && <p className="text-xs text-danger">Couldn&apos;t load this lab&apos;s test list.</p>}
                {services !== null && matched.length === 0 && (
                    <p className="text-xs text-muted-foreground">No tests matching &quot;{query}&quot; listed at this lab.</p>
                )}
                {services !== null && matched.length > 0 && (
                    <div className="space-y-1.5">
                        {matched.map((t) => (
                            <label key={t._id} className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40">
                                <span className="flex items-center gap-2">
                                    <input type="checkbox" checked={selected.has(t._id)} onChange={() => toggle(t._id)} />
                                    <span>
                                        <span className="block font-medium text-foreground">{t.name}</span>
                                        <span className="block text-[11px] text-muted-foreground">{t.category}{t.homeCollection ? ' · Home collection available' : ''}</span>
                                    </span>
                                </span>
                                <span className="text-sm font-semibold text-foreground">{formatINR(t.price)}</span>
                            </label>
                        ))}
                    </div>
                )}

                {selectedTests.length > 0 && !bookingOpen && (
                    <Button size="sm" onClick={() => setBookingOpen(true)}>
                        Book {selectedTests.length} test{selectedTests.length > 1 ? 's' : ''}
                    </Button>
                )}

                {bookingOpen && (
                    <LabBookingPanel
                        provider={provider}
                        tests={selectedTests}
                        onDone={() => { setBookingOpen(false); setSelected(new Set()); }}
                    />
                )}
            </CardContent>
        </Card>
    );
}

export default function LabBookingPage() {
    const [query, setQuery] = React.useState('');
    const [queryDraft, setQueryDraft] = React.useState('');
    const [locality, setLocality] = React.useState('');
    const [userLoc, setUserLoc] = React.useState<UserLocation | null>(null);
    const [locating, setLocating] = React.useState(false);

    const [providers, setProviders] = React.useState<NearbyProvider[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [demo, setDemo] = React.useState(false);

    const load = React.useCallback(() => {
        setLoading(true);
        setError(null);
        const origin = userLoc ?? VIZAG_CENTER;
        searchProviders({ type: 'diagnostic', lat: origin.lat, lng: origin.lng, radiusKm: 30 })
            .then((res) => { setProviders(res.data.results); setDemo(res.demo); setLoading(false); })
            .catch((err) => { setError(err instanceof Error ? err.message : 'Search failed'); setLoading(false); });
    }, [userLoc]);

    React.useEffect(() => { load(); }, [load]);

    async function handleUseMyLocation() {
        setLocating(true);
        const loc = await requestBrowserLocation();
        setLocating(false);
        if (loc) { setLocality(''); setUserLoc(loc); }
    }
    function handleLocalitySelect(name: string) {
        setLocality(name);
        const geo = localityToGeo(name);
        if (geo) setUserLoc({ ...geo, source: 'locality', locality: name });
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Book a lab test"
                description="Search a test, compare nearby labs on price and home collection, then book a slot."
                crumbs={[{ label: 'CareConnect Nearby', href: '/nearby' }, { label: 'Book a test' }]}
                actions={demo ? <Badge tone="warning" dot pulse>Demo data — backend offline</Badge> : undefined}
            />

            <Card>
                <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                    <form className="flex flex-1 items-center gap-2" onSubmit={(e) => { e.preventDefault(); setQuery(queryDraft); }}>
                        <Input
                            icon={<SearchIcon aria-hidden />}
                            value={queryDraft}
                            onChange={(e) => setQueryDraft(e.target.value)}
                            placeholder="e.g. CBC, Chest X-Ray, Full Body Checkup"
                            aria-label="Search tests"
                        />
                        <Button type="submit" variant="outline" className="shrink-0">Search</Button>
                    </form>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={handleUseMyLocation} loading={locating}>
                            <LocateFixed className="h-3.5 w-3.5" aria-hidden /> Use my location
                        </Button>
                        <Select value={locality} onChange={(e) => handleLocalitySelect(e.target.value)} aria-label="Locality" className="h-9 w-40 text-xs">
                            <option value="">Choose locality…</option>
                            {VIZAG_LOCALITIES.map((l) => <option key={l.name} value={l.name}>{l.name}</option>)}
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {error && <ErrorState description={error} onRetry={load} />}

            {!error && loading && (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} lines={3} />)}</div>
            )}

            {!error && !loading && providers.length === 0 && (
                <EmptyState icon={FlaskConical} title="No diagnostic labs found nearby" description="Try a different locality or widen your search." />
            )}

            {!error && !loading && providers.length > 0 && (
                <div className="space-y-4">
                    {providers.map((p) => <LabCard key={p._id} provider={p} query={query} />)}
                </div>
            )}
        </div>
    );
}
