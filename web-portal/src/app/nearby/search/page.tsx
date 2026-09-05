'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Search as SearchIcon, List, Map as MapIcon, LocateFixed, MapPin, ChevronLeft, ChevronRight, SearchX,
} from 'lucide-react';
import {
    PageHeader, Card, CardContent, Button, Input, Badge, EmptyState, ErrorState, SkeletonCard, Select,
} from '@/components/ui';
import { FilterSidebar, DEFAULT_FILTERS, type FilterState } from './_components/FilterSidebar';
import { ProviderCard } from './_components/ProviderCard';
import { SimplifiedMap } from './_components/SimplifiedMap';
import {
    searchProviders, looksAppointmentAvailable, requestBrowserLocation, localityToGeo, VIZAG_LOCALITIES,
    VIZAG_CENTER, type NearbyProvider, type UserLocation,
} from '../_lib/api';

const PAGE_SIZE = 6;

function parseBool(v: string | null): boolean {
    return v === 'true' || v === '1';
}

function filtersFromParams(sp: URLSearchParams): FilterState {
    return {
        radiusKm: sp.get('distance') ? Number(sp.get('distance')) : DEFAULT_FILTERS.radiusKm,
        type: (sp.get('type') as FilterState['type']) || '',
        specialties: sp.get('specialty') ? sp.get('specialty')!.split(',').filter(Boolean) : [],
        openNow: parseBool(sp.get('open-now')),
        availableToday: parseBool(sp.get('available-today')),
        appointmentAvailable: parseBool(sp.get('appointment-available')),
        emergency: parseBool(sp.get('emergency')),
        teleconsultation: parseBool(sp.get('online-consult')) || parseBool(sp.get('teleconsultation')),
        homeCollection: parseBool(sp.get('home-collection')),
        verifiedOnly: parseBool(sp.get('verified-only')),
        maxFee: sp.get('fee') ? Number(sp.get('fee')) : DEFAULT_FILTERS.maxFee,
        insurance: sp.get('insurance') || '',
    };
}

function paramsFromState(filters: FilterState, extra: {
    q: string; lat?: number; lng?: number; locality?: string; pincode?: string;
}): URLSearchParams {
    const qs = new URLSearchParams();
    if (extra.q.trim()) qs.set('q', extra.q.trim());
    if (extra.lat != null) qs.set('lat', String(extra.lat));
    if (extra.lng != null) qs.set('lng', String(extra.lng));
    if (extra.locality) qs.set('locality', extra.locality);
    if (extra.pincode) qs.set('pincode', extra.pincode);
    if (filters.radiusKm !== DEFAULT_FILTERS.radiusKm) qs.set('distance', String(filters.radiusKm));
    if (filters.type) qs.set('type', filters.type);
    if (filters.specialties.length) qs.set('specialty', filters.specialties.join(','));
    if (filters.openNow) qs.set('open-now', 'true');
    if (filters.availableToday) qs.set('available-today', 'true');
    if (filters.appointmentAvailable) qs.set('appointment-available', 'true');
    if (filters.emergency) qs.set('emergency', 'true');
    if (filters.teleconsultation) qs.set('online-consult', 'true');
    if (filters.homeCollection) qs.set('home-collection', 'true');
    if (filters.verifiedOnly) qs.set('verified-only', 'true');
    if (filters.maxFee !== DEFAULT_FILTERS.maxFee) qs.set('fee', String(filters.maxFee));
    if (filters.insurance.trim()) qs.set('insurance', filters.insurance.trim());
    return qs;
}

function SearchPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [filters, setFilters] = React.useState<FilterState>(() => filtersFromParams(searchParams));
    const [q, setQ] = React.useState(searchParams.get('q') || '');
    const [qDraft, setQDraft] = React.useState(q);
    const [locality, setLocality] = React.useState(searchParams.get('locality') || '');
    const [pincode] = React.useState(searchParams.get('pincode') || '');
    const [userLoc, setUserLoc] = React.useState<UserLocation | null>(() => {
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        if (lat && lng) {
            return { lat: Number(lat), lng: Number(lng), source: searchParams.get('locality') ? 'locality' : 'geolocation', locality: searchParams.get('locality') || undefined };
        }
        const loc = searchParams.get('locality');
        if (loc) {
            const geo = localityToGeo(loc);
            if (geo) return { ...geo, source: 'locality', locality: loc };
        }
        return null;
    });
    const [locating, setLocating] = React.useState(false);

    const [viewMode, setViewMode] = React.useState<'list' | 'map'>('list');
    const [page, setPage] = React.useState(1);
    const [highlightedId, setHighlightedId] = React.useState<string | null>(null);

    const [rawResults, setRawResults] = React.useState<NearbyProvider[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [demo, setDemo] = React.useState(false);
    const requestIdRef = React.useRef(0);

    // Keep the URL in sync with current filter/search/location state.
    React.useEffect(() => {
        const qs = paramsFromState(filters, {
            q, lat: userLoc?.lat, lng: userLoc?.lng, locality: userLoc?.locality || locality, pincode,
        });
        const next = qs.toString();
        router.replace(`/nearby/search${next ? `?${next}` : ''}`, { scroll: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, q, userLoc, locality, pincode]);

    const runSearch = React.useCallback(() => {
        const id = ++requestIdRef.current;
        setLoading(true);
        setError(null);
        const origin = userLoc ?? VIZAG_CENTER;
        searchProviders({
            lat: origin.lat,
            lng: origin.lng,
            radiusKm: filters.radiusKm,
            type: filters.type || undefined,
            specialty: filters.specialties.join(',') || undefined,
            q: q || undefined,
            openNow: filters.openNow || undefined,
            availableToday: filters.availableToday || undefined,
            verifiedOnly: filters.verifiedOnly || undefined,
            homeCollection: filters.homeCollection || undefined,
            teleconsultation: filters.teleconsultation || undefined,
            emergency: filters.emergency || undefined,
            maxFee: filters.maxFee < DEFAULT_FILTERS.maxFee ? filters.maxFee : undefined,
        })
            .then((res) => {
                if (id !== requestIdRef.current) return;
                setRawResults(res.data.results);
                setDemo(res.demo);
                setLoading(false);
            })
            .catch((err) => {
                if (id !== requestIdRef.current) return;
                setError(err instanceof Error ? err.message : 'Search failed');
                setLoading(false);
            });
    }, [filters, q, userLoc]);

    React.useEffect(() => { runSearch(); }, [runSearch]);
    React.useEffect(() => { setPage(1); }, [filters, q, userLoc]);

    // Contract gaps filled client-side: /search has no `appointmentAvailable`
    // or `insurance` params, so these two filters are applied to the fetched
    // page locally instead of being sent to the backend.
    const results = React.useMemo(() => {
        let list = rawResults;
        if (filters.appointmentAvailable) list = list.filter(looksAppointmentAvailable);
        if (filters.insurance.trim()) {
            const needle = filters.insurance.trim().toLowerCase();
            list = list.filter((p) => (p.insuranceAccepted ?? []).some((i) => i.toLowerCase().includes(needle)));
        }
        return list;
    }, [rawResults, filters.appointmentAvailable, filters.insurance]);

    const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
    const pageResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    async function handleUseMyLocation() {
        setLocating(true);
        const loc = await requestBrowserLocation();
        setLocating(false);
        if (loc) {
            setLocality('');
            setUserLoc(loc);
        }
    }

    function handleLocalitySelect(name: string) {
        setLocality(name);
        const geo = localityToGeo(name);
        if (geo) setUserLoc({ ...geo, source: 'locality', locality: name });
    }

    function resetFilters() {
        setFilters(DEFAULT_FILTERS);
    }

    const locationLabel = userLoc?.locality
        ? userLoc.locality
        : userLoc?.source === 'geolocation'
            ? 'Your current location'
            : 'Visakhapatnam (default)';

    return (
        <div className="space-y-6">
            <PageHeader
                title="Find nearby care"
                description="Hospitals, clinics, labs and pharmacies, filtered by what you actually need."
                crumbs={[{ label: 'CareConnect Nearby', href: '/nearby' }, { label: 'Search' }]}
                actions={demo ? <Badge tone="warning" dot pulse>Demo data — backend offline</Badge> : undefined}
            />

            {/* Search + location bar */}
            <Card>
                <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
                    <form
                        className="flex flex-1 items-center gap-2"
                        onSubmit={(e) => { e.preventDefault(); setQ(qDraft); }}
                    >
                        <Input
                            icon={<SearchIcon aria-hidden />}
                            value={qDraft}
                            onChange={(e) => setQDraft(e.target.value)}
                            placeholder="Search by name, specialty, or service"
                            aria-label="Search providers"
                        />
                        <Button type="submit" size="md" variant="outline" className="shrink-0">Search</Button>
                    </form>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={handleUseMyLocation} loading={locating}>
                            <LocateFixed className="h-3.5 w-3.5" aria-hidden /> Use my location
                        </Button>
                        <span className="text-xs text-muted-foreground">or</span>
                        <Select
                            value={locality}
                            onChange={(e) => handleLocalitySelect(e.target.value)}
                            aria-label="Locality"
                            className="h-9 w-44 text-xs"
                        >
                            <option value="">Choose locality…</option>
                            {VIZAG_LOCALITIES.map((l) => (
                                <option key={l.name} value={l.name}>{l.name}</option>
                            ))}
                        </Select>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" aria-hidden /> {locationLabel}
                        </span>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
                <div className="xl:col-span-1">
                    <FilterSidebar filters={filters} onChange={(next) => setFilters((f) => ({ ...f, ...next }))} onReset={resetFilters} />
                </div>

                <div className="space-y-4 xl:col-span-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            {loading ? 'Searching…' : `${results.length} result${results.length === 1 ? '' : 's'} within ${filters.radiusKm} km`}
                        </p>
                        <div className="inline-flex rounded-xl bg-muted p-1">
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                aria-pressed={viewMode === 'list'}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <List className="h-3.5 w-3.5" aria-hidden /> List
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('map')}
                                aria-pressed={viewMode === 'map'}
                                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'map' ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <MapIcon className="h-3.5 w-3.5" aria-hidden /> Map
                            </button>
                        </div>
                    </div>

                    {error && <ErrorState description={error} onRetry={runSearch} />}

                    {!error && loading && (
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={3} />)}
                        </div>
                    )}

                    {!error && !loading && results.length === 0 && (
                        <EmptyState
                            icon={SearchX}
                            title="No providers match your filters"
                            description="Try widening the distance, clearing a filter, or searching a different term."
                            action={{ label: 'Reset filters', onClick: resetFilters }}
                        />
                    )}

                    {!error && !loading && results.length > 0 && viewMode === 'map' && (
                        <div className="space-y-4">
                            <SimplifiedMap
                                providers={results}
                                highlightedId={highlightedId}
                                onSelect={(id) => router.push(`/nearby/provider/${id}`)}
                                onHover={setHighlightedId}
                            />
                            <div className="space-y-3">
                                {pageResults.map((p, i) => (
                                    <ProviderCard key={p._id} provider={p} delay={i * 0.03} highlighted={highlightedId === p._id} onHover={setHighlightedId} />
                                ))}
                            </div>
                        </div>
                    )}

                    {!error && !loading && results.length > 0 && viewMode === 'list' && (
                        <div className="space-y-3">
                            {pageResults.map((p, i) => (
                                <ProviderCard key={p._id} provider={p} delay={i * 0.03} highlighted={highlightedId === p._id} onHover={setHighlightedId} />
                            ))}
                        </div>
                    )}

                    {!error && !loading && results.length > PAGE_SIZE && (
                        <div className="flex items-center justify-center gap-3 pt-2">
                            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                                <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> Prev
                            </Button>
                            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                                Next <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function NearbySearchPage() {
    return (
        <React.Suspense fallback={<div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={3} />)}</div>}>
            <SearchPageInner />
        </React.Suspense>
    );
}
