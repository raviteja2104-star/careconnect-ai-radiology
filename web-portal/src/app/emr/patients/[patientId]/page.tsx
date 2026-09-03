'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Stethoscope, Pill, FlaskConical, ScanLine, ReceiptText, Video, FileCheck2,
    CalendarDays, UploadCloud, AlertTriangle, ShieldAlert, Search, ClipboardList,
    Activity, HeartPulse, WifiOff,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
    PageHeader, Badge, Button, Card, CardHeader, CardTitle, CardDescription, CardContent,
    Avatar, StatCard, Timeline, TimelineItem, EmptyState, ErrorState, Dialog, Input,
    Skeleton, SkeletonCard,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
    fetchPatient360, fetchEncounters, createEncounter, patientDisplayName, ageOf,
    formatWhen, formatINR, ApiOfflineError, DEMO_ENCOUNTER_ID,
    type TimelineEvent, type EncounterRecord,
} from '../../_lib/api';

/* ── Timeline kind → presentation ── */

const KIND_META: Record<string, { icon: LucideIcon; tone: 'brand' | 'success' | 'warning' | 'danger' | 'neutral'; label: string }> = {
    encounter: { icon: Stethoscope, tone: 'brand', label: 'Encounters' },
    consultation: { icon: Stethoscope, tone: 'neutral', label: 'Consultations' },
    appointment: { icon: CalendarDays, tone: 'neutral', label: 'Appointments' },
    lab: { icon: FlaskConical, tone: 'success', label: 'Labs' },
    radiology: { icon: ScanLine, tone: 'warning', label: 'Radiology' },
    pharmacy: { icon: Pill, tone: 'success', label: 'Pharmacy' },
    billing: { icon: ReceiptText, tone: 'neutral', label: 'Billing' },
    consent: { icon: FileCheck2, tone: 'neutral', label: 'Consents' },
    telemedicine: { icon: Video, tone: 'brand', label: 'Telemedicine' },
    order: { icon: ClipboardList, tone: 'warning', label: 'Orders' },
};

function kindKey(kind: string): string {
    if (kind.startsWith('order:')) {
        const sub = kind.split(':')[1];
        if (sub === 'lab') return 'lab';
        if (sub === 'radiology') return 'radiology';
        if (sub === 'medication') return 'pharmacy';
        return 'order';
    }
    return KIND_META[kind] ? kind : 'order';
}

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    completed: 'success', paid: 'success', reported: 'success', dispensed: 'success', signed: 'success', granted: 'success',
    open: 'info', ordered: 'info', in_progress: 'info', scheduled: 'info',
    pending: 'warning', acknowledged: 'warning', documented: 'warning',
    cancelled: 'danger', overdue: 'danger',
};

export default function Patient360Page({ params }: { params: Promise<{ patientId: string }> }) {
    const { patientId } = React.use(params);
    const router = useRouter();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const q360 = useQuery({
        queryKey: ['emr', '360', patientId],
        queryFn: () => fetchPatient360(patientId),
    });
    const qEncounters = useQuery({
        queryKey: ['emr', 'encounters', patientId],
        queryFn: () => fetchEncounters(patientId),
    });

    const [kindFilter, setKindFilter] = React.useState<string | null>(null);
    const [search, setSearch] = React.useState('');
    const [uploadOpen, setUploadOpen] = React.useState(false);
    const [starting, setStarting] = React.useState<string | null>(null);

    const demo = Boolean(q360.data?.demo);
    const data = q360.data?.data;
    const patient = data?.patient;
    const name = patientDisplayName(patient);
    const age = ageOf(patient?.dateOfBirth);

    /** Reuse the latest still-open encounter, else create one; degrade to the demo encounter offline. */
    const openWorkspace = React.useCallback(
        async (panel: 'note' | 'medication' | 'lab' | 'radiology', forceNew = false) => {
            setStarting(panel);
            const suffix = panel === 'note' ? '' : `?panel=${panel}`;
            try {
                if (!forceNew) {
                    const existing = (qEncounters.data?.data || []).find(
                        (e: EncounterRecord) => !['closed', 'cancelled', 'signed'].includes(String(e.status))
                    );
                    if (existing) {
                        router.push(`/emr/encounter/${existing._id}${suffix}`);
                        return;
                    }
                }
                const enc = await createEncounter({
                    patientId,
                    type: 'opd',
                    specialty: 'General Medicine',
                    chiefComplaint: '',
                });
                queryClient.invalidateQueries({ queryKey: ['emr', 'encounters', patientId] });
                router.push(`/emr/encounter/${enc._id}${suffix}`);
            } catch (err) {
                if (err instanceof ApiOfflineError) {
                    toast('info', 'Backend offline', 'Opening the demo encounter workspace instead.');
                    router.push(`/emr/encounter/${DEMO_ENCOUNTER_ID}${suffix}`);
                } else {
                    toast('error', 'Could not start encounter', err instanceof Error ? err.message : undefined);
                }
            } finally {
                setStarting(null);
            }
        },
        [patientId, qEncounters.data, queryClient, router, toast]
    );

    /* ── Timeline filtering ── */
    const timeline = React.useMemo(() => {
        let events = data?.timeline ?? [];
        if (kindFilter) events = events.filter((e) => kindKey(e.kind) === kindFilter);
        if (search.trim()) {
            const s = search.toLowerCase();
            events = events.filter((e) => e.title.toLowerCase().includes(s) || String(e.status || '').toLowerCase().includes(s));
        }
        return events;
    }, [data?.timeline, kindFilter, search]);

    const presentKinds = React.useMemo(() => {
        const set = new Set<string>();
        (data?.timeline ?? []).forEach((e) => set.add(kindKey(e.kind)));
        return Array.from(set);
    }, [data?.timeline]);

    if (q360.isLoading) return <Patient360Skeleton />;
    if (q360.isError || !data) {
        return (
            <div className="space-y-6">
                <PageHeader title="Patient 360" crumbs={[{ label: 'Clinical', href: '/dashboard' }, { label: 'EMR', href: '/emr' }, { label: 'Patient 360' }]} />
                <ErrorState onRetry={() => q360.refetch()} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Patient 360"
                description="Longitudinal record — demographics, medications, diagnoses, and every clinical event."
                crumbs={[{ label: 'Clinical', href: '/dashboard' }, { label: 'EMR', href: '/emr' }, { label: name }]}
                actions={
                    demo ? (
                        <Badge tone="warning" dot pulse>
                            <WifiOff className="h-3 w-3" aria-hidden /> Demo data — backend offline
                        </Badge>
                    ) : undefined
                }
            />

            {/* ── Patient header card ── */}
            <Card className="animate-fade-up">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-5">
                            <Avatar name={name} src={patient?.avatar || undefined} size="xl" />
                            <div className="min-w-0">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <h2 className="text-2xl font-bold tracking-tight text-foreground">{name}</h2>
                                    {patient?.criticalAlert && (
                                        <Badge tone="danger" dot pulse>
                                            <ShieldAlert className="h-3 w-3" aria-hidden /> {patient.criticalAlert}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                    <span>{age != null ? `${age} Y` : '—'} · {patient?.gender ? patient.gender[0].toUpperCase() + patient.gender.slice(1) : '—'}</span>
                                    <span className="h-1 w-1 rounded-full bg-border" aria-hidden />
                                    <span>Blood group <strong className="text-foreground">{patient?.bloodGroup || '—'}</strong></span>
                                    <span className="h-1 w-1 rounded-full bg-border" aria-hidden />
                                    <span>{patient?.phone || '—'}</span>
                                </div>
                                <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1.5 text-xs sm:grid-cols-2">
                                    <div className="flex gap-2">
                                        <dt className="font-semibold uppercase tracking-wide text-subtle-foreground">UHID</dt>
                                        <dd className="font-mono text-foreground">{patient?.uhid || '—'}</dd>
                                    </div>
                                    <div className="flex gap-2">
                                        <dt className="font-semibold uppercase tracking-wide text-subtle-foreground">ABHA</dt>
                                        <dd className="font-mono text-foreground">{patient?.abhaId || '—'}</dd>
                                    </div>
                                    <div className="flex gap-2">
                                        <dt className="font-semibold uppercase tracking-wide text-subtle-foreground">Insurance</dt>
                                        <dd className="text-foreground">
                                            {patient?.insurance?.providerName
                                                ? `${patient.insurance.providerName}${patient.insurance.policyNumber ? ` · ${patient.insurance.policyNumber}` : ''}`
                                                : '—'}
                                        </dd>
                                    </div>
                                    <div className="flex gap-2">
                                        <dt className="font-semibold uppercase tracking-wide text-subtle-foreground">Primary physician</dt>
                                        <dd className="text-foreground">
                                            {patient?.primaryPhysicianName ||
                                                (typeof patient?.primaryDoctor === 'object' ? patient?.primaryDoctor?.name : undefined) || '—'}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {/* Allergies */}
                        <div className="shrink-0 lg:max-w-xs">
                            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-subtle-foreground">
                                <AlertTriangle className="h-3.5 w-3.5 text-danger" aria-hidden /> Allergies
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {(patient?.allergies?.length ? patient.allergies : []).map((a) => (
                                    <Badge key={a} tone="danger">{a}</Badge>
                                ))}
                                {!patient?.allergies?.length && <Badge tone="success">No known allergies</Badge>}
                            </div>
                        </div>
                    </div>

                    {/* ── Quick actions ── */}
                    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                        <Button onClick={() => openWorkspace('note', true)} loading={starting === 'note'}>
                            <Stethoscope className="h-4 w-4" aria-hidden /> Start Consultation
                        </Button>
                        <Button variant="outline" onClick={() => openWorkspace('medication')} loading={starting === 'medication'}>
                            <Pill className="h-4 w-4" aria-hidden /> New Prescription
                        </Button>
                        <Button variant="outline" onClick={() => openWorkspace('lab')} loading={starting === 'lab'}>
                            <FlaskConical className="h-4 w-4" aria-hidden /> Order Lab
                        </Button>
                        <Button variant="outline" onClick={() => openWorkspace('radiology')} loading={starting === 'radiology'}>
                            <ScanLine className="h-4 w-4" aria-hidden /> Order Radiology
                        </Button>
                        <Button variant="outline" onClick={() => setUploadOpen(true)}>
                            <UploadCloud className="h-4 w-4" aria-hidden /> Upload Document
                        </Button>
                        <Link href="/billing">
                            <Button variant="ghost">
                                <ReceiptText className="h-4 w-4" aria-hidden /> View Billing
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* ── Main grid: stats + meds/dx rail | timeline ── */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-1">
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard label="Encounters" value={data.summary.encounters} icon={Stethoscope} tone="brand" delay={0} />
                        <StatCard label="Open Orders" value={data.summary.openOrders} icon={ClipboardList} tone="amber" delay={0.05} />
                        <StatCard label="Lab Reports" value={data.summary.labReports} icon={FlaskConical} tone="teal" delay={0.1} />
                        <StatCard label="Radiology" value={data.summary.radiologyStudies} icon={ScanLine} tone="violet" delay={0.15} />
                        <StatCard label="Active Meds" value={data.summary.activeMedications} icon={Pill} tone="emerald" delay={0.2} className="col-span-2" />
                    </div>

                    {/* Active medications */}
                    <Card className="animate-fade-up">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Pill className="h-4 w-4 text-primary" aria-hidden /> Active Medications
                            </CardTitle>
                            <CardDescription>Currently prescribed and dispensed drugs.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {data.activeMedications.length === 0 && (
                                <EmptyState icon={Pill} title="No active medications" className="py-8" />
                            )}
                            {data.activeMedications.map((m, i) => (
                                <div key={`${m.name}-${i}`} className="rounded-xl border border-border bg-muted/40 p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="text-sm font-bold text-foreground">{m.name} {m.dose ? <span className="font-medium text-muted-foreground">{m.dose}</span> : null}</h4>
                                        {m.frequency && <Badge tone="info" className="text-[10px]">{m.frequency}</Badge>}
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {[m.route, m.duration, m.instructions].filter(Boolean).join(' · ') || '—'}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Diagnoses */}
                    <Card className="animate-fade-up">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <HeartPulse className="h-4 w-4 text-primary" aria-hidden /> Diagnoses
                            </CardTitle>
                            <CardDescription>Problem list across all encounters.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {data.diagnoses.length === 0 && (
                                <EmptyState icon={HeartPulse} title="No recorded diagnoses" className="py-8" />
                            )}
                            {data.diagnoses.map((dx, i) => (
                                <div key={dx._id || i} className="rounded-xl border border-border bg-muted/40 p-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="text-sm font-semibold text-foreground">{dx.term}</h4>
                                        {dx.isPrimary && <Badge tone="brand" className="text-[10px] uppercase">Primary</Badge>}
                                        {dx.type && (
                                            <Badge tone={dx.type === 'confirmed' ? 'success' : dx.type === 'ruled_out' ? 'neutral' : 'warning'} className="text-[10px] uppercase">
                                                {dx.type.replace('_', ' ')}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {dx.code ? <span className="font-mono">{dx.code}</span> : 'No ICD code'} · {dx.notedAt ? formatWhen(dx.notedAt) : 'date unknown'}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Longitudinal timeline ── */}
                <Card className="animate-fade-up xl:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Activity className="h-4 w-4 text-primary" aria-hidden /> Longitudinal Timeline
                        </CardTitle>
                        <CardDescription>Every clinical, diagnostic, and financial event on one chronological axis.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="w-full sm:max-w-xs">
                                <Input
                                    icon={<Search />}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search events…"
                                    aria-label="Search timeline events"
                                />
                            </div>
                            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter timeline by event type">
                                <button
                                    type="button"
                                    onClick={() => setKindFilter(null)}
                                    aria-pressed={kindFilter === null}
                                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${kindFilter === null ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                                >
                                    All
                                </button>
                                {presentKinds.map((k) => (
                                    <button
                                        key={k}
                                        type="button"
                                        onClick={() => setKindFilter(kindFilter === k ? null : k)}
                                        aria-pressed={kindFilter === k}
                                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${kindFilter === k ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {KIND_META[k]?.label ?? k}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {timeline.length === 0 ? (
                            <EmptyState
                                icon={Activity}
                                title="No matching events"
                                description="Try clearing the search or filters."
                                action={{ label: 'Clear filters', onClick: () => { setKindFilter(null); setSearch(''); } }}
                            />
                        ) : (
                            <Timeline>
                                {timeline.map((ev: TimelineEvent, i) => {
                                    const meta = KIND_META[kindKey(ev.kind)];
                                    const Icon = meta?.icon ?? ClipboardList;
                                    return (
                                        <TimelineItem key={`${ev.ref || i}-${ev.at}`} icon={Icon} tone={meta?.tone ?? 'neutral'} title={ev.title} meta={formatWhen(ev.at)}>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {ev.status && (
                                                    <Badge tone={STATUS_TONE[ev.status] ?? 'neutral'} className="text-[10px] uppercase">{ev.status.replace('_', ' ')}</Badge>
                                                )}
                                                {ev.priority && ['stat', 'emergency', 'urgent'].includes(ev.priority) && (
                                                    <Badge tone="danger" className="text-[10px] uppercase">{ev.priority}</Badge>
                                                )}
                                                {ev.amount != null && <span className="text-xs font-semibold text-foreground">{formatINR(ev.amount)}</span>}
                                            </div>
                                        </TimelineItem>
                                    );
                                })}
                            </Timeline>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Upload document placeholder ── */}
            <Dialog
                open={uploadOpen}
                onClose={() => setUploadOpen(false)}
                title="Upload Document"
                description="Attach discharge summaries, external reports, or scanned records to this patient."
                footer={
                    <>
                        <Button variant="outline" onClick={() => setUploadOpen(false)}>Close</Button>
                        <Button disabled title="Document storage integration is pending">
                            <UploadCloud className="h-4 w-4" aria-hidden /> Upload
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center">
                    <UploadCloud className="mb-3 h-8 w-8 text-subtle-foreground" aria-hidden />
                    <h4 className="text-sm font-semibold text-foreground">Storage integration pending</h4>
                    <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
                        Document upload requires the object-storage service, which is not connected yet.
                        Nothing will be uploaded from this dialog — the action stays disabled until the
                        integration ships, so no document is ever silently lost.
                    </p>
                </div>
            </Dialog>
        </div>
    );
}

/* ── Loading skeleton shaped like the real content ── */
function Patient360Skeleton() {
    return (
        <div className="space-y-6" aria-busy="true" aria-label="Loading patient record">
            <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-8 w-64" />
            </div>
            <SkeletonCard />
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-1">
                    <div className="grid grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
                    </div>
                    <SkeletonCard />
                </div>
                <div className="xl:col-span-2">
                    <SkeletonCard />
                </div>
            </div>
        </div>
    );
}
