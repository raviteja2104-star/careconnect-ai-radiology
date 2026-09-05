'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    CalendarClock, Calendar, CalendarCheck, CalendarX2, Phone, Navigation2, Video, Download,
    RotateCcw, XCircle, Clock3, Stethoscope,
} from 'lucide-react';
import {
    PageHeader, Card, CardContent, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent,
    EmptyState, ErrorState, SkeletonCard, Dialog, Label, Textarea, Select,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
    fetchMyAppointments, cancelAppointment, rescheduleAppointment, fetchProviderProfile, fetchAvailability,
    telUrl, directionsUrl, formatDDMMYYYY, type AppointmentRecord, type Slot,
} from '../_lib/api';

function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}

const SLOT_ICON: Record<Slot['status'], string> = { available: '🟢', limited: '🟡', full: '🔴', closed: '⚪' };

const STATUS_TONE: Record<string, 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'> = {
    scheduled: 'info',
    completed: 'success',
    cancelled: 'danger',
};

function nextDays(n: number): { iso: string; label: string }[] {
    const out: { iso: string; label: string }[] = [];
    for (let i = 0; i < n; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        out.push({ iso: d.toISOString().slice(0, 10), label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }) });
    }
    return out;
}

function downloadReceipt(appt: AppointmentRecord) {
    const receipt = {
        receiptType: 'CareConnect Nearby — Appointment Receipt',
        generatedAt: new Date().toISOString(),
        confirmationCode: appt.confirmationCode,
        provider: appt.providerName,
        locality: appt.providerLocality,
        doctor: appt.doctorName,
        service: appt.serviceName,
        type: appt.type,
        date: appt.date,
        startTime: appt.startTime,
        status: appt.status,
        patient: appt.patientDetails,
        paymentMode: appt.paymentMode,
        bookedAt: appt.createdAt,
        demoBooking: Boolean(appt.demo),
    };
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `careconnect-receipt-${appt.confirmationCode}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function AppointmentCard({
    appt, onReschedule, onCancel,
}: {
    appt: AppointmentRecord;
    onReschedule: (a: AppointmentRecord) => void;
    onCancel: (a: AppointmentRecord) => void;
}) {
    const router = useRouter();
    const { toast } = useToast();
    const [findingDirections, setFindingDirections] = React.useState(false);
    const isFuture = appt.date >= todayIso() && appt.status === 'scheduled';
    const isVideo = appt.type === 'video';

    async function handleDirections() {
        setFindingDirections(true);
        try {
            const res = await fetchProviderProfile(appt.providerId);
            window.open(directionsUrl(res.data.provider.geo, res.data.provider.name), '_blank', 'noopener,noreferrer');
        } catch {
            toast('error', 'Could not load directions', 'Try again in a moment.');
        } finally {
            setFindingDirections(false);
        }
    }

    async function handleCall() {
        try {
            const res = await fetchProviderProfile(appt.providerId);
            const tel = telUrl(res.data.provider.phone);
            if (tel) window.location.href = tel;
            else toast('info', 'No phone number on file for this provider');
        } catch {
            toast('error', 'Could not load provider contact info');
        }
    }

    return (
        <Card>
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{appt.providerName}</h3>
                        <Badge tone={STATUS_TONE[appt.status] ?? 'neutral'} className="capitalize">{appt.status}</Badge>
                        {appt.demo && <Badge tone="outline">Demo</Badge>}
                    </div>
                    {(appt.doctorName || appt.serviceName) && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Stethoscope className="h-3.5 w-3.5" aria-hidden /> {appt.doctorName ?? appt.serviceName}
                        </p>
                    )}
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" aria-hidden /> {formatDDMMYYYY(appt.date)} · {appt.startTime}
                        <span className="capitalize">· {appt.type.replace(/_/g, ' ')}</span>
                    </p>
                    {appt.providerLocality && (
                        <p className="mt-1 text-xs text-muted-foreground">{appt.providerLocality}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">Confirmation: <span className="font-mono">{appt.confirmationCode}</span></p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
                    {isVideo && isFuture && (
                        <Button size="sm" onClick={() => router.push('/telemedicine')}>
                            <Video className="h-3.5 w-3.5" aria-hidden /> Join teleconsult
                        </Button>
                    )}
                    {isFuture && (
                        <Button size="sm" variant="outline" onClick={() => onReschedule(appt)}>
                            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reschedule
                        </Button>
                    )}
                    {isFuture && (
                        <Button size="sm" variant="ghost" onClick={() => onCancel(appt)}>
                            <XCircle className="h-3.5 w-3.5" aria-hidden /> Cancel
                        </Button>
                    )}
                    {!isVideo && (
                        <Button size="sm" variant="ghost" onClick={handleDirections} loading={findingDirections}>
                            <Navigation2 className="h-3.5 w-3.5" aria-hidden /> Directions
                        </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={handleCall}>
                        <Phone className="h-3.5 w-3.5" aria-hidden /> Call
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => downloadReceipt(appt)}>
                        <Download className="h-3.5 w-3.5" aria-hidden /> Receipt
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function MyAppointmentsPage() {
    const { toast } = useToast();
    const [appointments, setAppointments] = React.useState<AppointmentRecord[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [demo, setDemo] = React.useState(false);
    const [tab, setTab] = React.useState('today');

    const [cancelTarget, setCancelTarget] = React.useState<AppointmentRecord | null>(null);
    const [cancelReason, setCancelReason] = React.useState('');
    const [cancelling, setCancelling] = React.useState(false);

    const [rescheduleTarget, setRescheduleTarget] = React.useState<AppointmentRecord | null>(null);
    const [newDate, setNewDate] = React.useState('');
    const [newSlots, setNewSlots] = React.useState<Slot[]>([]);
    const [newSlotsLoading, setNewSlotsLoading] = React.useState(false);
    const [selectedNewSlot, setSelectedNewSlot] = React.useState<Slot | null>(null);
    const [rescheduling, setRescheduling] = React.useState(false);

    const load = React.useCallback(() => {
        setLoading(true);
        setError(null);
        fetchMyAppointments()
            .then((res) => { setAppointments(res.data); setDemo(res.demo); setLoading(false); })
            .catch((err) => { setError(err instanceof Error ? err.message : 'Failed to load appointments'); setLoading(false); });
    }, []);

    React.useEffect(() => { load(); }, [load]);

    const today = todayIso();
    const buckets = React.useMemo(() => {
        const b = { today: [] as AppointmentRecord[], upcoming: [] as AppointmentRecord[], past: [] as AppointmentRecord[], cancelled: [] as AppointmentRecord[] };
        for (const a of appointments) {
            if (a.status === 'cancelled') b.cancelled.push(a);
            else if (a.date === today) b.today.push(a);
            else if (a.date > today && a.status === 'scheduled') b.upcoming.push(a);
            else b.past.push(a);
        }
        const byDateAsc = (x: AppointmentRecord, y: AppointmentRecord) => x.date.localeCompare(y.date) || x.startTime.localeCompare(y.startTime);
        const byDateDesc = (x: AppointmentRecord, y: AppointmentRecord) => y.date.localeCompare(x.date) || y.startTime.localeCompare(x.startTime);
        b.today.sort(byDateAsc); b.upcoming.sort(byDateAsc); b.past.sort(byDateDesc); b.cancelled.sort(byDateDesc);
        return b;
    }, [appointments, today]);

    function openReschedule(a: AppointmentRecord) {
        setRescheduleTarget(a);
        setNewDate('');
        setNewSlots([]);
        setSelectedNewSlot(null);
    }

    React.useEffect(() => {
        if (!rescheduleTarget || !newDate) return;
        setNewSlotsLoading(true);
        setSelectedNewSlot(null);
        fetchAvailability(rescheduleTarget.providerId, rescheduleTarget.doctorId, newDate)
            .then((res) => { setNewSlots(res.data.slots); setNewSlotsLoading(false); })
            .catch(() => { setNewSlots([]); setNewSlotsLoading(false); });
    }, [rescheduleTarget, newDate]);

    async function confirmReschedule() {
        if (!rescheduleTarget || !newDate) return;
        const startTime = selectedNewSlot?.startTime;
        if (!startTime) return;
        setRescheduling(true);
        try {
            await rescheduleAppointment(rescheduleTarget._id, newDate, startTime);
            toast('success', 'Appointment rescheduled', `${formatDDMMYYYY(newDate)} · ${startTime}`);
            setRescheduleTarget(null);
            load();
        } catch (err) {
            toast('error', 'Could not reschedule', err instanceof Error ? err.message : undefined);
        } finally {
            setRescheduling(false);
        }
    }

    async function confirmCancel() {
        if (!cancelTarget) return;
        setCancelling(true);
        try {
            await cancelAppointment(cancelTarget._id, cancelReason || 'Cancelled by patient');
            toast('success', 'Appointment cancelled');
            setCancelTarget(null);
            setCancelReason('');
            load();
        } catch (err) {
            toast('error', 'Could not cancel', err instanceof Error ? err.message : undefined);
        } finally {
            setCancelling(false);
        }
    }

    function renderList(list: AppointmentRecord[], emptyTitle: string, emptyDescription: string) {
        if (list.length === 0) {
            return <EmptyState icon={CalendarClock} title={emptyTitle} description={emptyDescription} />;
        }
        return (
            <div className="space-y-3">
                {list.map((a) => (
                    <AppointmentCard key={a._id} appt={a} onReschedule={openReschedule} onCancel={setCancelTarget} />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Appointments"
                description="Every booking you've made through CareConnect Nearby, in one place."
                crumbs={[{ label: 'CareConnect Nearby', href: '/nearby' }, { label: 'My Appointments' }]}
                actions={demo ? <Badge tone="warning" dot pulse>Demo data — backend offline</Badge> : undefined}
            />

            {error && <ErrorState description={error} onRetry={load} />}

            {!error && loading && (
                <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} lines={3} />)}</div>
            )}

            {!error && !loading && (
                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList>
                        <TabsTrigger value="today">Today ({buckets.today.length})</TabsTrigger>
                        <TabsTrigger value="upcoming">Upcoming ({buckets.upcoming.length})</TabsTrigger>
                        <TabsTrigger value="past">Past ({buckets.past.length})</TabsTrigger>
                        <TabsTrigger value="cancelled">Cancelled ({buckets.cancelled.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="today">
                        {renderList(buckets.today, 'Nothing scheduled today', 'Appointments booked for today will show up here.')}
                    </TabsContent>
                    <TabsContent value="upcoming">
                        {renderList(buckets.upcoming, 'No upcoming appointments', 'Book a provider from CareConnect Nearby to see it here.')}
                    </TabsContent>
                    <TabsContent value="past">
                        {renderList(buckets.past, 'No past appointments yet', 'Completed visits will appear here.')}
                    </TabsContent>
                    <TabsContent value="cancelled">
                        {renderList(buckets.cancelled, 'No cancelled appointments', 'Cancelled bookings will show up here.')}
                    </TabsContent>
                </Tabs>
            )}

            {/* Cancel dialog */}
            <Dialog
                open={cancelTarget != null}
                onClose={() => setCancelTarget(null)}
                title="Cancel appointment"
                description={cancelTarget ? `${cancelTarget.providerName} · ${formatDDMMYYYY(cancelTarget.date)} · ${cancelTarget.startTime}` : undefined}
                footer={
                    <>
                        <Button variant="outline" onClick={() => setCancelTarget(null)}>Keep appointment</Button>
                        <Button variant="danger" onClick={confirmCancel} loading={cancelling}>Cancel appointment</Button>
                    </>
                }
            >
                <Label htmlFor="cancel-reason">Reason (optional)</Label>
                <Textarea id="cancel-reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Let the provider know why you're cancelling" rows={3} />
            </Dialog>

            {/* Reschedule dialog */}
            <Dialog
                open={rescheduleTarget != null}
                onClose={() => setRescheduleTarget(null)}
                title="Reschedule appointment"
                description={rescheduleTarget ? rescheduleTarget.providerName : undefined}
                footer={
                    <>
                        <Button variant="outline" onClick={() => setRescheduleTarget(null)}>Cancel</Button>
                        <Button onClick={confirmReschedule} loading={rescheduling} disabled={!selectedNewSlot}>Confirm new time</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">New date</p>
                        <div className="flex flex-wrap gap-1.5">
                            {nextDays(10).map((d) => (
                                <button
                                    key={d.iso}
                                    type="button"
                                    onClick={() => setNewDate(d.iso)}
                                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${newDate === d.iso ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted/50'}`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    {newDate && (
                        <div>
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Clock3 className="h-3.5 w-3.5" aria-hidden /> New time</p>
                            {newSlotsLoading && <div className="flex gap-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-9 w-16 skeleton-shimmer rounded-lg" />)}</div>}
                            {!newSlotsLoading && newSlots.length === 0 && <p className="text-xs text-muted-foreground">No real-time slots for this date — try another date.</p>}
                            {!newSlotsLoading && newSlots.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {newSlots.map((s) => {
                                        const disabled = s.status === 'full' || s.status === 'closed';
                                        return (
                                            <button
                                                key={s.startTime}
                                                type="button"
                                                disabled={disabled}
                                                onClick={() => setSelectedNewSlot(s)}
                                                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${selectedNewSlot?.startTime === s.startTime ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted/50'}`}
                                            >
                                                {SLOT_ICON[s.status]} {s.startTime}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Dialog>
        </div>
    );
}
