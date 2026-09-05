'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Phone, Navigation2, CalendarCheck2, Star, Truck, Video, Siren, Building2, MapPin, Clock3,
    GraduationCap, Stethoscope, ShieldAlert, ImageOff,
} from 'lucide-react';
import {
    PageHeader, Card, CardHeader, CardTitle, CardContent, Button, Badge, Tabs, TabsList, TabsTrigger,
    TabsContent, SkeletonCard, ErrorState, EmptyState,
} from '@/components/ui';
import { VerificationBadge } from '../../_components/VerificationBadge';
import {
    fetchProviderProfile, isAppointmentEnabled, PROVIDER_TYPE_LABELS, feeRangeLabel, formatINR,
    directionsUrl, telUrl, type ProviderProfile,
} from '../../_lib/api';

const TYPE_TONE: Record<string, string> = {
    hospital: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
    clinic: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    diagnostic: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
    pharmacy: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',
};

export default function ProviderProfilePage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const id = params.id;

    const [profile, setProfile] = React.useState<ProviderProfile | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [demo, setDemo] = React.useState(false);

    const load = React.useCallback(() => {
        setLoading(true);
        setError(null);
        fetchProviderProfile(id)
            .then((res) => { setProfile(res.data); setDemo(res.demo); setLoading(false); })
            .catch((err) => { setError(err instanceof Error ? err.message : 'Failed to load provider'); setLoading(false); });
    }, [id]);

    React.useEffect(() => { load(); }, [load]);

    if (loading) {
        return (
            <div className="space-y-6">
                <SkeletonCard lines={2} />
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <SkeletonCard lines={6} className="xl:col-span-2" />
                    <SkeletonCard lines={4} />
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return <ErrorState description={error ?? 'Provider not found'} onRetry={load} />;
    }

    const { provider, doctors, services } = profile;
    const tel = telUrl(provider.phone);
    const closed = provider.verificationStatus === 'CLOSED';
    const bookable = !closed && isAppointmentEnabled(profile);

    return (
        <div className="space-y-6">
            <PageHeader
                title={provider.name}
                description={`${PROVIDER_TYPE_LABELS[provider.type]}${provider.subtype ? ` · ${provider.subtype}` : ''} · ${provider.locality}`}
                crumbs={[{ label: 'CareConnect Nearby', href: '/nearby' }, { label: 'Search', href: '/nearby/search' }, { label: provider.name }]}
                actions={demo ? <Badge tone="warning" dot pulse>Demo data — backend offline</Badge> : undefined}
            />

            {closed && (
                <div className="flex items-start gap-2 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
                    <p className="text-sm font-medium text-danger">
                        This listing is marked permanently closed. Booking and directions to visit in person are disabled.
                    </p>
                </div>
            )}

            {/* Photo strip */}
            {provider.photos && provider.photos.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1">
                    {provider.photos.map((src, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={src} alt={`${provider.name} photo ${i + 1}`} className="h-40 w-64 shrink-0 rounded-2xl object-cover shadow-soft" />
                    ))}
                </div>
            ) : (
                <div className={`flex h-32 items-center justify-center gap-2 rounded-2xl border border-dashed border-border ${TYPE_TONE[provider.type] ?? 'bg-muted/40'}`}>
                    <ImageOff className="h-5 w-5" aria-hidden />
                    <span className="text-sm font-medium">No photos submitted yet</span>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                {/* Main content */}
                <div className="space-y-6 xl:col-span-2">
                    <Card>
                        <CardContent className="space-y-3 p-5">
                            <div className="flex flex-wrap items-center gap-2">
                                <VerificationBadge status={provider.verificationStatus} lastVerifiedAt={provider.lastVerifiedAt} />
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                                    <span className={`h-2 w-2 rounded-full ${provider.openNow ? 'bg-success' : 'bg-danger'}`} aria-hidden />
                                    <span className={provider.openNow ? 'text-success' : 'text-danger'}>{provider.openNow ? 'Open now' : 'Closed now'}</span>
                                </span>
                                {provider.reviewSummary && (
                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                                        {provider.reviewSummary.avg.toFixed(1)} ({provider.reviewSummary.count} reviews)
                                    </span>
                                )}
                            </div>
                            <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {provider.address}
                                <span className="whitespace-nowrap">· {provider.distanceKm} km away</span>
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {provider.homeCollection && <Badge tone="info"><Truck className="h-3 w-3" aria-hidden /> Home collection</Badge>}
                                {provider.teleconsultation && <Badge tone="info"><Video className="h-3 w-3" aria-hidden /> Teleconsult</Badge>}
                                {provider.emergencyAvailable && <Badge tone="danger"><Siren className="h-3 w-3" aria-hidden /> Emergency</Badge>}
                            </div>
                            {provider.availableToday && !closed && (
                                <p className="flex items-center gap-1.5 text-xs font-semibold text-success">
                                    <CalendarCheck2 className="h-3.5 w-3.5" aria-hidden /> Appointments available today
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="overview">
                        <TabsList>
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="doctors">Doctors ({doctors.length})</TabsTrigger>
                            <TabsTrigger value="services">Services ({services.length})</TabsTrigger>
                            <TabsTrigger value="reviews">Reviews</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview">
                            <Card>
                                <CardHeader><CardTitle>About</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Services offered</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {provider.servicesOffered.map((s) => <Badge key={s} tone="outline">{s}</Badge>)}
                                        </div>
                                    </div>
                                    {provider.specialties.length > 0 && (
                                        <div>
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Specialties</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {provider.specialties.map((s) => <Badge key={s} tone="brand">{s}</Badge>)}
                                            </div>
                                        </div>
                                    )}
                                    {provider.insuranceAccepted && provider.insuranceAccepted.length > 0 && (
                                        <div>
                                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Insurance accepted</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {provider.insuranceAccepted.map((s) => <Badge key={s} tone="neutral">{s}</Badge>)}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            <Clock3 className="h-3.5 w-3.5" aria-hidden /> Working hours
                                        </p>
                                        {provider.workingHours && provider.workingHours.length > 0 ? (
                                            <div className="overflow-hidden rounded-xl border border-border">
                                                <table className="w-full text-sm">
                                                    <tbody className="divide-y divide-border">
                                                        {provider.workingHours.map((wh) => (
                                                            <tr key={wh.day}>
                                                                <th scope="row" className="w-24 bg-muted/40 px-3 py-2 text-left font-medium text-foreground">{wh.day}</th>
                                                                <td className="px-3 py-2 text-muted-foreground">
                                                                    {wh.closed ? 'Closed' : wh.opens && wh.closes ? `${wh.opens} – ${wh.closes}` : 'Hours not listed'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Working hours not listed for this provider.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="doctors">
                            {doctors.length === 0 ? (
                                <EmptyState icon={Stethoscope} title="No doctors listed" description="This provider hasn't listed individual doctors yet." />
                            ) : (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {doctors.map((d) => (
                                        <Card key={d._id}>
                                            <CardContent className="space-y-2 p-4">
                                                <p className="text-sm font-semibold text-foreground">{d.name}</p>
                                                <p className="text-xs text-muted-foreground">{d.specialty}</p>
                                                {d.qualification && (
                                                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <GraduationCap className="h-3.5 w-3.5" aria-hidden /> {d.qualification}
                                                        {d.experienceYears != null && ` · ${d.experienceYears} yrs exp`}
                                                    </p>
                                                )}
                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="text-sm font-medium text-foreground">{formatINR(d.consultationFee)}</span>
                                                    {(d.consultationTypes?.length ?? 0) > 0 ? (
                                                        <Badge tone="success">Bookable</Badge>
                                                    ) : (
                                                        <Badge tone="neutral">Call to book</Badge>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="services">
                            {services.length === 0 ? (
                                <EmptyState icon={Building2} title="No services listed" description="This provider hasn't listed individual services yet." />
                            ) : (
                                <div className="space-y-2">
                                    {services.map((s) => (
                                        <div key={s._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{s.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {s.category}{s.durationMinutes ? ` · ${s.durationMinutes} min` : ''}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {s.homeCollection && <Badge tone="info"><Truck className="h-3 w-3" aria-hidden /> Home</Badge>}
                                                {s.onlineBooking ? <Badge tone="success">Online booking</Badge> : <Badge tone="neutral">Call to book</Badge>}
                                                <span className="w-20 text-right text-sm font-semibold text-foreground">{formatINR(s.price)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="reviews">
                            <Card>
                                <CardContent className="space-y-3 p-5">
                                    {provider.reviewSummary ? (
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl font-bold text-foreground">{provider.reviewSummary.avg.toFixed(1)}</span>
                                            <div>
                                                <div className="flex items-center gap-0.5">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star key={i} className={`h-4 w-4 ${i < Math.round(provider.reviewSummary!.avg) ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} aria-hidden />
                                                    ))}
                                                </div>
                                                <p className="text-xs text-muted-foreground">{provider.reviewSummary.count} reviews</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No reviews yet for this provider.</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Individual review text isn&apos;t available from CareConnect yet — only the aggregate rating is shown here, exactly as returned by the backend.
                                    </p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Context rail */}
                <div className="space-y-4">
                    <Card>
                        <CardContent className="space-y-3 p-5">
                            <Button
                                className="w-full"
                                size="lg"
                                disabled={!bookable}
                                onClick={() => router.push(`/nearby/book/${provider._id}`)}
                            >
                                <CalendarCheck2 className="h-4 w-4" aria-hidden /> Book Appointment
                            </Button>
                            {!bookable && (
                                <p className="text-center text-xs text-muted-foreground">
                                    {closed ? 'This listing is closed.' : 'Online booking not available — call to book.'}
                                </p>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                {tel && (
                                    <Button variant="outline" onClick={() => (window.location.href = tel)}>
                                        <Phone className="h-4 w-4" aria-hidden /> Call
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    className={tel ? '' : 'col-span-2'}
                                    onClick={() => window.open(directionsUrl(provider.geo, provider.name), '_blank', 'noopener,noreferrer')}
                                >
                                    <Navigation2 className="h-4 w-4" aria-hidden /> Directions
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-sm">Fees</CardTitle></CardHeader>
                        <CardContent className="p-5 pt-0">
                            <p className="text-lg font-semibold text-foreground">{feeRangeLabel(provider.consultationFeeRange)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Consultation fee range, where listed.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
