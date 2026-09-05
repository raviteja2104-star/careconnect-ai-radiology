'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    CheckCircle2, ChevronLeft, ChevronRight, Stethoscope, Beaker, CalendarDays, Clock3, User,
    CreditCard, PartyPopper, Phone, Navigation2, CalendarClock,
} from 'lucide-react';
import {
    PageHeader, Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Select, Label,
    FieldHint, SkeletonCard, ErrorState, EmptyState,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
    fetchProviderProfile, fetchAvailability, createAppointment, ApiHttpError, formatINR, telUrl,
    directionsUrl, type ProviderProfile, type DoctorSummary, type ServiceSummary, type Slot,
    type PatientDetails, type PaymentMode, type AppointmentRecord,
} from '../../_lib/api';

type Selection =
    | { kind: 'doctor'; doctor: DoctorSummary; consultationType: string }
    | { kind: 'service'; service: ServiceSummary };

const STEPS = ['Doctor / Service', 'Date', 'Time', 'Your details', 'Confirm'] as const;

const SLOT_ICON: Record<Slot['status'], string> = {
    available: '🟢',
    limited: '🟡',
    full: '🔴',
    closed: '⚪',
};

const SLOT_LABEL: Record<Slot['status'], string> = {
    available: 'Available',
    limited: 'Limited',
    full: 'Full',
    closed: 'Closed',
};

function nextDays(n: number): { iso: string; label: string }[] {
    const out: { iso: string; label: string }[] = [];
    for (let i = 0; i < n; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        out.push({
            iso: d.toISOString().slice(0, 10),
            label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }),
        });
    }
    return out;
}

export default function BookAppointmentPage() {
    const params = useParams<{ providerId: string }>();
    const router = useRouter();
    const { toast } = useToast();
    const providerId = params.providerId;

    const [profile, setProfile] = React.useState<ProviderProfile | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [demo, setDemo] = React.useState(false);

    const [step, setStep] = React.useState(0);
    const [selection, setSelection] = React.useState<Selection | null>(null);
    const [date, setDate] = React.useState<string>('');
    const [slots, setSlots] = React.useState<Slot[]>([]);
    const [slotsLoading, setSlotsLoading] = React.useState(false);
    const [slotsError, setSlotsError] = React.useState<string | null>(null);
    const [selectedSlot, setSelectedSlot] = React.useState<Slot | null>(null);

    const [patient, setPatient] = React.useState<PatientDetails>({ name: '', age: 0, gender: '', phone: '' });
    const [paymentMode, setPaymentMode] = React.useState<PaymentMode>('pay_at_location');
    const [submitting, setSubmitting] = React.useState(false);
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const [confirmed, setConfirmed] = React.useState<AppointmentRecord | null>(null);
    const [confirmedDemo, setConfirmedDemo] = React.useState(false);

    const load = React.useCallback(() => {
        setLoading(true);
        setError(null);
        fetchProviderProfile(providerId)
            .then((res) => { setProfile(res.data); setDemo(res.demo); setLoading(false); })
            .catch((err) => { setError(err instanceof Error ? err.message : 'Failed to load provider'); setLoading(false); });
    }, [providerId]);

    React.useEffect(() => { load(); }, [load]);

    const bookableDoctors = React.useMemo(
        () => (profile?.doctors ?? []).filter((d) => (d.consultationTypes?.length ?? 0) > 0),
        [profile]
    );
    const bookableServices = React.useMemo(
        () => (profile?.services ?? []).filter((s) => s.onlineBooking),
        [profile]
    );

    const doctorId = selection?.kind === 'doctor' ? selection.doctor._id : undefined;

    const loadSlots = React.useCallback(() => {
        if (!date) return;
        setSlotsLoading(true);
        setSlotsError(null);
        setSelectedSlot(null);
        fetchAvailability(providerId, doctorId, date)
            .then((res) => { setSlots(res.data.slots); setSlotsLoading(false); })
            .catch((err) => { setSlotsError(err instanceof Error ? err.message : 'Failed to load availability'); setSlotsLoading(false); });
    }, [providerId, doctorId, date]);

    React.useEffect(() => {
        if (step === 2) loadSlots();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, date, doctorId]);

    if (loading) {
        return (
            <div className="space-y-6">
                <SkeletonCard lines={2} />
                <SkeletonCard lines={6} />
            </div>
        );
    }

    if (error || !profile) {
        return <ErrorState description={error ?? 'Provider not found'} onRetry={load} />;
    }

    const { provider } = profile;

    if (bookableDoctors.length === 0 && bookableServices.length === 0) {
        return (
            <div className="space-y-6">
                <PageHeader title="Book Appointment" crumbs={[{ label: 'CareConnect Nearby', href: '/nearby' }, { label: provider.name, href: `/nearby/provider/${providerId}` }, { label: 'Book' }]} />
                <EmptyState
                    icon={CalendarClock}
                    title="Online booking not available"
                    description={`${provider.name} doesn't accept online bookings yet. Call the provider directly to book.`}
                    action={{ label: 'Back to profile', onClick: () => router.push(`/nearby/provider/${providerId}`) }}
                />
            </div>
        );
    }

    function selectDoctor(d: DoctorSummary, type: string) {
        setSelection({ kind: 'doctor', doctor: d, consultationType: type });
    }
    function selectService(s: ServiceSummary) {
        setSelection({ kind: 'service', service: s });
    }

    function goNext() {
        setStep((s) => Math.min(STEPS.length - 1, s + 1));
    }
    function goBack() {
        setStep((s) => Math.max(0, s - 1));
    }

    function canProceed(): boolean {
        if (step === 0) return selection != null;
        if (step === 1) return Boolean(date);
        if (step === 2) return selectedSlot != null && selectedSlot.status !== 'full' && selectedSlot.status !== 'closed';
        if (step === 3) return Boolean(patient.name.trim() && patient.age > 0 && patient.gender && patient.phone.trim().length >= 10);
        return true;
    }

    async function handleSubmit() {
        if (!selection || !date || !selectedSlot) return;
        setSubmitting(true);
        setSubmitError(null);
        const type = selection.kind === 'doctor' ? selection.consultationType : (selection.service.homeCollection ? 'home_collection' : 'in_person');
        try {
            const { appointment, demo: isDemo } = await createAppointment({
                providerId,
                doctorId: selection.kind === 'doctor' ? selection.doctor._id : undefined,
                serviceId: selection.kind === 'service' ? selection.service._id : undefined,
                type,
                date,
                startTime: selectedSlot.startTime,
                patientDetails: patient,
                paymentMode,
            });
            setConfirmed(appointment);
            setConfirmedDemo(isDemo);
        } catch (err) {
            if (err instanceof ApiHttpError && err.status === 409) {
                toast('warning', 'That slot was just taken', 'Refreshing availability — please pick another time.');
                setStep(2);
                loadSlots();
            } else {
                setSubmitError(err instanceof Error ? err.message : 'Booking failed — please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    }

    if (confirmed) {
        const tel = telUrl(provider.phone);
        return (
            <div className="mx-auto max-w-xl space-y-6">
                <Card variant="gradient" className="overflow-hidden">
                    <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                            <PartyPopper className="h-7 w-7" aria-hidden />
                        </span>
                        <h2 className="text-xl font-bold">Appointment confirmed</h2>
                        <p className="text-sm opacity-90">Confirmation code</p>
                        <p className="rounded-lg bg-white/15 px-4 py-2 text-lg font-mono font-semibold tracking-wide">{confirmed.confirmationCode}</p>
                        {confirmedDemo && <Badge tone="outline" className="border-white/30 bg-white/10 text-white">Demo booking — not sent to a real backend</Badge>}
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="space-y-2 p-5 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Provider</span><span className="font-medium text-foreground">{confirmed.providerName}</span></div>
                        {confirmed.doctorName && <div className="flex justify-between"><span className="text-muted-foreground">Doctor</span><span className="font-medium text-foreground">{confirmed.doctorName}</span></div>}
                        {confirmed.serviceName && <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-medium text-foreground">{confirmed.serviceName}</span></div>}
                        <div className="flex justify-between"><span className="text-muted-foreground">Date &amp; time</span><span className="font-medium text-foreground">{confirmed.date} · {confirmed.startTime}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="font-medium capitalize text-foreground">{confirmed.paymentMode.replace(/_/g, ' ')}</span></div>
                    </CardContent>
                </Card>
                <div className="flex flex-wrap gap-2">
                    {tel && <Button variant="outline" onClick={() => (window.location.href = tel)}><Phone className="h-4 w-4" aria-hidden /> Call provider</Button>}
                    <Button variant="outline" onClick={() => window.open(directionsUrl(provider.geo, provider.name), '_blank', 'noopener,noreferrer')}>
                        <Navigation2 className="h-4 w-4" aria-hidden /> Directions
                    </Button>
                    <Button onClick={() => router.push('/nearby/my-appointments')}>View my appointments</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <PageHeader
                title="Book Appointment"
                description={provider.name}
                crumbs={[{ label: 'CareConnect Nearby', href: '/nearby' }, { label: provider.name, href: `/nearby/provider/${providerId}` }, { label: 'Book' }]}
                actions={demo ? <Badge tone="warning" dot pulse>Demo data — backend offline</Badge> : undefined}
            />

            {/* Stepper */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {STEPS.map((label, i) => (
                    <React.Fragment key={label}>
                        <div className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${i === step ? 'bg-primary text-primary-foreground' : i < step ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground'}`}>
                            {i < step ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : <span>{i + 1}</span>}
                            {label}
                        </div>
                        {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />}
                    </React.Fragment>
                ))}
            </div>

            <Card>
                <CardContent className="space-y-5 p-5">
                    {step === 0 && (
                        <div className="space-y-4">
                            {bookableDoctors.length > 0 && (
                                <div>
                                    <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground"><Stethoscope className="h-4 w-4" aria-hidden /> Doctors</p>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {bookableDoctors.map((d) => (
                                            <div key={d._id} className={`rounded-xl border p-3 ${selection?.kind === 'doctor' && selection.doctor._id === d._id ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                                <p className="text-sm font-semibold text-foreground">{d.name}</p>
                                                <p className="text-xs text-muted-foreground">{d.specialty} · {formatINR(d.consultationFee)}</p>
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {(d.consultationTypes ?? []).map((t) => (
                                                        <button
                                                            key={t}
                                                            type="button"
                                                            onClick={() => selectDoctor(d, t)}
                                                            className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors ${selection?.kind === 'doctor' && selection.doctor._id === d._id && selection.consultationType === t ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:bg-muted/50'}`}
                                                        >
                                                            {t.replace('_', ' ')}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {bookableServices.length > 0 && (
                                <div>
                                    <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground"><Beaker className="h-4 w-4" aria-hidden /> Services</p>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {bookableServices.map((s) => (
                                            <button
                                                key={s._id}
                                                type="button"
                                                onClick={() => selectService(s)}
                                                className={`rounded-xl border p-3 text-left transition-colors ${selection?.kind === 'service' && selection.service._id === s._id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'}`}
                                            >
                                                <p className="text-sm font-semibold text-foreground">{s.name}</p>
                                                <p className="text-xs text-muted-foreground">{s.category} · {formatINR(s.price)}{s.durationMinutes ? ` · ${s.durationMinutes} min` : ''}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 1 && (
                        <div>
                            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground"><CalendarDays className="h-4 w-4" aria-hidden /> Choose a date</p>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                {nextDays(14).map((d) => (
                                    <button
                                        key={d.iso}
                                        type="button"
                                        onClick={() => setDate(d.iso)}
                                        className={`rounded-xl border px-2 py-2.5 text-center text-xs font-medium transition-colors ${date === d.iso ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted/50'}`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground"><Clock3 className="h-4 w-4" aria-hidden /> Choose a time — {date}</p>
                            {slotsLoading && (
                                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                    {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-11 skeleton-shimmer rounded-xl" />)}
                                </div>
                            )}
                            {!slotsLoading && slotsError && <ErrorState description={slotsError} onRetry={loadSlots} />}
                            {!slotsLoading && !slotsError && slots.length === 0 && (
                                <EmptyState
                                    icon={Clock3}
                                    title="No time slots for this date"
                                    description={doctorId ? 'Try a different date.' : "Real-time slot data isn't available for this service yet — pick a date and the provider will confirm your exact time."}
                                    action={{ label: 'Choose another date', onClick: () => setStep(1) }}
                                />
                            )}
                            {!slotsLoading && !slotsError && slots.length > 0 && (
                                <>
                                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                        {slots.map((s) => {
                                            const disabled = s.status === 'full' || s.status === 'closed';
                                            const active = selectedSlot?.startTime === s.startTime;
                                            return (
                                                <button
                                                    key={s.startTime}
                                                    type="button"
                                                    disabled={disabled}
                                                    onClick={() => setSelectedSlot(s)}
                                                    className={`rounded-xl border px-2 py-2.5 text-center text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted/50'}`}
                                                >
                                                    <span className="mr-1">{SLOT_ICON[s.status]}</span>{s.startTime}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                                        {(['available', 'limited', 'full', 'closed'] as Slot['status'][]).map((st) => (
                                            <span key={st}>{SLOT_ICON[st]} {SLOT_LABEL[st]}</span>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><User className="h-4 w-4" aria-hidden /> Patient details</p>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="p-name">Full name</Label>
                                    <Input id="p-name" value={patient.name} onChange={(e) => setPatient((p) => ({ ...p, name: e.target.value }))} placeholder="Patient's full name" />
                                </div>
                                <div>
                                    <Label htmlFor="p-age">Age</Label>
                                    <Input id="p-age" type="number" min={0} max={120} value={patient.age || ''} onChange={(e) => setPatient((p) => ({ ...p, age: Number(e.target.value) }))} placeholder="Age" />
                                </div>
                                <div>
                                    <Label htmlFor="p-gender">Gender</Label>
                                    <Select id="p-gender" value={patient.gender} onChange={(e) => setPatient((p) => ({ ...p, gender: e.target.value }))}>
                                        <option value="">Select…</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="p-phone">Phone number</Label>
                                    <Input id="p-phone" value={patient.phone} onChange={(e) => setPatient((p) => ({ ...p, phone: e.target.value }))} placeholder="+91 90000 00000" />
                                    <FieldHint>Used only to send booking confirmations and provider reminders.</FieldHint>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && selection && (
                        <div className="space-y-5">
                            <div>
                                <p className="mb-2 text-sm font-semibold text-foreground">Review your booking</p>
                                <div className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-4 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Provider</span><span className="font-medium text-foreground">{provider.name}</span></div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{selection.kind === 'doctor' ? 'Doctor' : 'Service'}</span>
                                        <span className="font-medium text-foreground">{selection.kind === 'doctor' ? selection.doctor.name : selection.service.name}</span>
                                    </div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Date &amp; time</span><span className="font-medium text-foreground">{date} · {selectedSlot?.startTime}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span className="font-medium text-foreground">{patient.name}, {patient.age}, {patient.gender}</span></div>
                                </div>
                            </div>
                            <div>
                                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground"><CreditCard className="h-4 w-4" aria-hidden /> Payment</p>
                                <div className="space-y-2">
                                    {([
                                        { value: 'pay_at_location', label: 'Pay at location', hint: 'Recommended — pay when you arrive' },
                                        { value: 'upi', label: 'UPI', hint: 'Pay online now via UPI' },
                                        { value: 'card', label: 'Card', hint: 'Pay online now via debit/credit card' },
                                        { value: 'insurance', label: 'Insurance', hint: 'Cashless via accepted insurance' },
                                    ] as { value: PaymentMode; label: string; hint: string }[]).map((opt) => (
                                        <label key={opt.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${paymentMode === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'}`}>
                                            <input
                                                type="radio"
                                                name="paymentMode"
                                                className="mt-0.5"
                                                checked={paymentMode === opt.value}
                                                onChange={() => setPaymentMode(opt.value)}
                                            />
                                            <span>
                                                <span className="block text-sm font-medium text-foreground">{opt.label}</span>
                                                <span className="block text-xs text-muted-foreground">{opt.hint}</span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {submitError && <p className="text-sm text-danger">{submitError}</p>}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={goBack} disabled={step === 0}>
                    <ChevronLeft className="h-4 w-4" aria-hidden /> Back
                </Button>
                {step < STEPS.length - 1 ? (
                    <Button onClick={goNext} disabled={!canProceed()}>
                        Next <ChevronRight className="h-4 w-4" aria-hidden />
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} loading={submitting} disabled={!canProceed() || submitting}>
                        Confirm booking
                    </Button>
                )}
            </div>
        </div>
    );
}
