'use client';

import * as React from 'react';
import {
    AlertTriangle,
    Check,
    CheckCircle2,
    ClipboardCheck,
    FlaskConical,
    History,
    Lock,
    Pencil,
    Printer,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    TestTubes,
    TrendingUp,
} from 'lucide-react';
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Dialog,
    ErrorState,
    Input,
    Label,
    PageHeader,
    Select,
    SkeletonCard,
    Textarea,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { CHART_COLORS, chartAxis, chartGrid, chartTooltip } from '@/lib/chart-theme';
import { cn } from '@/lib/utils';
import { openPrescriptionPrintWindow } from '@/components/prescriptionSheet';
import {
    ApiHttpError,
    ApiOfflineError,
    effectiveFlag,
    fetchHistory,
    fetchWorklistItem,
    formatDay,
    formatWhen,
    isTextParameter,
    numericValue,
    patchSample,
    postAmend,
    postCollect,
    postCriticalAck,
    postRelease,
    postVerify,
    PRIORITY_META,
    provisionalFlag,
    putResults,
    runEntryChecks,
    SAMPLE_QUALITIES,
    STATUS_FLOW,
    STATUS_META,
    TEXT_SUGGESTIONS,
    unackedCriticals,
    type HistoryPoint,
    type LabParameter,
    type LabStatus,
    type LabTest,
    type ResultFlag,
    type ResultsPayload,
    type SampleQuality,
    type WorklistItem,
} from '../../_lib/api';
import { buildLabReportHtml } from '../../_lib/report';

/* ─────────────────────────── Draft plumbing ───────────────────────── */

interface ParamDraft { value: string; comments: string }
interface TestDraft { params: Record<string, ParamDraft>; techComments: string }
type Draft = Record<string, TestDraft>;

function draftFromItem(it: WorklistItem): Draft {
    const d: Draft = {};
    for (const t of it.tests) {
        d[t.code] = {
            techComments: t.techComments || '',
            params: Object.fromEntries(t.parameters.map((p) => [p.name, { value: p.value ?? '', comments: p.comments ?? '' }])),
        };
    }
    return d;
}

function mergeDraft(it: WorklistItem, draft: Draft): LabTest[] {
    return it.tests.map((t) => {
        const td = draft[t.code];
        if (!td) return t;
        return {
            ...t,
            techComments: td.techComments || undefined,
            parameters: t.parameters.map((p) => {
                const pd = td.params[p.name];
                if (!pd) return p;
                const changed = pd.value !== (p.value ?? '');
                return {
                    ...p,
                    value: pd.value,
                    comments: pd.comments || undefined,
                    flag: changed ? provisionalFlag(pd.value, p.refRangeUsed) : p.flag,
                };
            }),
        };
    });
}

function payloadFromDraft(it: WorklistItem, draft: Draft): ResultsPayload {
    return {
        tests: it.tests.map((t) => ({
            code: t.code,
            techComments: draft[t.code]?.techComments || undefined,
            parameters: t.parameters.map((p) => ({
                name: p.name,
                value: draft[t.code]?.params[p.name]?.value ?? p.value ?? '',
                comments: draft[t.code]?.params[p.name]?.comments || undefined,
            })),
        })),
    };
}

/* ─────────────────────────── Small pieces ─────────────────────────── */

const FLAG_TONE: Record<Exclude<ResultFlag, null>, 'info' | 'warning' | 'danger' | 'success'> = {
    low: 'info',
    high: 'warning',
    critical: 'danger',
    normal: 'success',
    positive: 'warning',
    negative: 'success',
    abnormal: 'warning',
};

function FlagBadge({ flag, provisional }: { flag: ResultFlag; provisional?: boolean }) {
    if (!flag) return <Badge tone="outline">—</Badge>;
    return (
        <Badge
            tone={FLAG_TONE[flag]}
            dot={flag === 'critical'}
            pulse={flag === 'critical'}
            title={provisional ? 'Provisional flag — computed locally, confirmed on save' : undefined}
        >
            {flag === 'critical' ? 'CRITICAL' : flag.charAt(0).toUpperCase() + flag.slice(1)}
            {provisional ? '*' : ''}
        </Badge>
    );
}

function StatusStepper({ status }: { status: LabStatus }) {
    const idx = STATUS_FLOW.indexOf(status);
    return (
        <div className="overflow-x-auto scrollbar-thin">
            <ol className="flex min-w-max items-center gap-0 py-1" aria-label="Report workflow progress">
                {STATUS_FLOW.map((s, i) => {
                    const done = idx > i || status === 'RELEASED' && i === STATUS_FLOW.length - 1;
                    const current = idx === i;
                    return (
                        <li key={s} className="flex items-center">
                            {i > 0 && <span className={cn('h-px w-6 sm:w-9', idx >= i ? 'bg-primary' : 'bg-border')} aria-hidden />}
                            <span className="flex items-center gap-1.5 px-1" aria-current={current ? 'step' : undefined}>
                                <span
                                    className={cn(
                                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
                                        done && 'border-primary bg-primary text-primary-foreground',
                                        current && !done && 'border-primary bg-primary/10 text-primary',
                                        !done && !current && 'border-border bg-muted text-muted-foreground'
                                    )}
                                >
                                    {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : i + 1}
                                </span>
                                <span className={cn('text-xs font-medium whitespace-nowrap', current ? 'text-foreground' : 'text-muted-foreground')}>
                                    {STATUS_META[s].label}
                                </span>
                            </span>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

/* ────────────────────────────── Page ──────────────────────────────── */

export default function LabResultEntryPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const { toast } = useToast();

    const [item, setItem] = React.useState<WorklistItem | null>(null);
    const [demo, setDemo] = React.useState(false);
    const [loadError, setLoadError] = React.useState(false);
    const [draft, setDraft] = React.useState<Draft>({});
    const [busy, setBusy] = React.useState<string | null>(null);

    const [sampleQuality, setSampleQuality] = React.useState<SampleQuality>('accepted');
    const [sampleReason, setSampleReason] = React.useState('');
    const [rejectOpen, setRejectOpen] = React.useState(false);

    const [ackIndex, setAckIndex] = React.useState<number | null>(null);
    const [ackWho, setAckWho] = React.useState('');
    const [ackMethod, setAckMethod] = React.useState('phone');

    const [releaseOpen, setReleaseOpen] = React.useState(false);
    const [amendOpen, setAmendOpen] = React.useState(false);
    const [amendReason, setAmendReason] = React.useState('');
    const [amendMode, setAmendMode] = React.useState(false);

    const [trendParam, setTrendParam] = React.useState<{ name: string; unit?: string } | null>(null);
    const [trendData, setTrendData] = React.useState<HistoryPoint[] | null>(null);
    const [trendDemo, setTrendDemo] = React.useState(false);
    const [trendLoading, setTrendLoading] = React.useState(false);

    const load = React.useCallback(async (preserveDraft = false) => {
        try {
            const res = await fetchWorklistItem(id);
            setItem(res.data);
            setDemo(res.demo);
            setLoadError(false);
            if (!preserveDraft) setDraft(draftFromItem(res.data));
            if (res.data.sample?.quality) setSampleQuality(res.data.sample.quality);
        } catch {
            setLoadError(true);
        }
    }, [id]);

    React.useEffect(() => {
        load();
    }, [load]);

    /**
     * Runs a write against the backend; on ApiOfflineError the change is
     * simulated locally and clearly labelled as demo behavior (never a silent
     * fake success).
     */
    const doWrite = React.useCallback(
        async (
            key: string,
            fn: () => Promise<unknown>,
            simulate: (prev: WorklistItem) => WorklistItem,
            successMsg: string,
            opts?: { preserveDraft?: boolean; resetDraftOnSimulate?: boolean }
        ) => {
            setBusy(key);
            try {
                await fn();
                toast('success', successMsg);
                await load(opts?.preserveDraft ?? true);
            } catch (err) {
                if (err instanceof ApiOfflineError) {
                    setItem((prev) => {
                        if (!prev) return prev;
                        const next = simulate(prev);
                        if (opts?.resetDraftOnSimulate) setDraft(draftFromItem(next));
                        return next;
                    });
                    setDemo(true);
                    toast('info', 'Backend offline', `${successMsg} — simulated locally (demo).`);
                } else if (err instanceof ApiHttpError) {
                    toast('error', err.message);
                } else {
                    toast('error', 'Something went wrong');
                }
            } finally {
                setBusy(null);
            }
        },
        [load, toast]
    );

    /* ---- Derived ---- */
    const merged = React.useMemo(() => (item ? mergeDraft(item, draft) : []), [item, draft]);
    const checks = React.useMemo(() => runEntryChecks(merged), [merged]);
    const criticals = item?.criticalEvents || [];
    const unacked = item ? unackedCriticals(item) : [];
    const locked = Boolean(item?.locked);
    const editable = item ? !(locked && !amendMode) : false;
    const now = () => new Date().toISOString();

    const setParam = (code: string, name: string, patch: Partial<ParamDraft>) => {
        setDraft((d) => {
            const td = d[code] ?? { params: {}, techComments: '' };
            const pd = td.params[name] ?? { value: '', comments: '' };
            return { ...d, [code]: { ...td, params: { ...td.params, [name]: { ...pd, ...patch } } } };
        });
    };

    /* ---- Actions ---- */
    const handleCollect = () =>
        doWrite('collect', () => postCollect(id), (prev) => ({
            ...prev,
            status: 'SAMPLE_COLLECTED',
            sample: { ...prev.sample, collectedAt: now(), quality: 'accepted' },
        }), 'Sample marked as collected');

    const handleSampleUpdate = () => {
        if (sampleQuality === 'accepted') {
            doWrite('sample', () => patchSample(id, { quality: 'accepted' }), (prev) => ({
                ...prev,
                sample: { ...prev.sample, quality: 'accepted', rejectedReason: undefined },
            }), 'Sample quality updated');
        } else {
            setRejectOpen(true);
        }
    };

    const confirmReject = () => {
        setRejectOpen(false);
        doWrite('sample', () => patchSample(id, { quality: sampleQuality, rejectedReason: sampleReason }), (prev) => ({
            ...prev,
            status: 'REJECTED',
            sample: {
                ...prev.sample,
                quality: sampleQuality,
                rejectedReason: sampleReason,
                recollectionRequired: true,
            },
        }), 'Sample rejected');
    };

    const handleSave = () => {
        if (!item) return;
        doWrite('save', () => putResults(id, payloadFromDraft(item, draft)), (prev) => ({
            ...prev,
            tests: mergeDraft(prev, draft),
            status: prev.status === 'ORDERED' || prev.status === 'SAMPLE_COLLECTED' || prev.status === 'PROCESSING'
                ? 'RESULT_PENDING'
                : prev.status,
        }), 'Results saved', { preserveDraft: false, resetDraftOnSimulate: true });
    };

    const handleVerify = (level: 'technical' | 'pathologist') =>
        doWrite(`verify-${level}`, () => postVerify(id, { level }), (prev) => ({
            ...prev,
            verification: level === 'technical'
                ? { ...prev.verification, technicalBy: 'You — Lab Technologist', technicalAt: now() }
                : { ...prev.verification, pathologistBy: 'You — Pathologist', pathologistAt: now() },
            status: level === 'technical'
                ? (prev.status === 'RESULT_PENDING' || prev.status === 'PROCESSING' || prev.status === 'SAMPLE_COLLECTED'
                    ? 'VERIFICATION_PENDING'
                    : prev.status)
                : 'VERIFIED',
        }), level === 'technical' ? 'Technically verified' : 'Pathologist verification recorded');

    const confirmAck = () => {
        if (ackIndex === null) return;
        const index = ackIndex;
        setAckIndex(null);
        doWrite('ack', () => postCriticalAck(id, { index, notifiedWho: ackWho, notificationMethod: ackMethod }), (prev) => ({
            ...prev,
            criticalEvents: (prev.criticalEvents || []).map((e, i) =>
                i === index ? { ...e, acknowledgedAt: now(), notifiedWho: ackWho, notificationMethod: ackMethod } : e
            ),
        }), 'Critical result acknowledged');
        setAckWho('');
        setAckMethod('phone');
    };

    const confirmRelease = () => {
        setReleaseOpen(false);
        doWrite('release', () => postRelease(id), (prev) => ({
            ...prev,
            status: 'RELEASED',
            releasedAt: now(),
            locked: true,
        }), 'Report released');
    };

    const startAmend = () => {
        if (!amendReason.trim()) return;
        setAmendOpen(false);
        setAmendMode(true);
        toast('info', 'Amendment mode', 'Editing enabled — submit to record the amendment.');
    };

    const submitAmend = () => {
        if (!item) return;
        const reason = amendReason.trim();
        doWrite('amend', () => postAmend(id, { reason, ...payloadFromDraft(item, draft) }), (prev) => ({
            ...prev,
            tests: mergeDraft(prev, draft),
            amendments: [...(prev.amendments || []), { at: now(), reason }],
        }), 'Amendment recorded', { preserveDraft: false, resetDraftOnSimulate: true });
        setAmendMode(false);
        setAmendReason('');
    };

    const cancelAmend = () => {
        setAmendMode(false);
        setAmendReason('');
        if (item) setDraft(draftFromItem(item));
    };

    const handlePrint = () => {
        if (!item) return;
        const ok = openPrescriptionPrintWindow(buildLabReportHtml({ ...item, tests: merged }));
        if (!ok) toast('error', 'Popup blocked', 'Allow popups for this site to print the report.');
    };

    const toggleTrend = async (p: LabParameter) => {
        if (!item) return;
        if (trendParam?.name === p.name) {
            setTrendParam(null);
            setTrendData(null);
            return;
        }
        setTrendParam({ name: p.name, unit: p.unit });
        setTrendData(null);
        setTrendLoading(true);
        try {
            const res = await fetchHistory(item.patientId._id, p.name);
            setTrendData(res.data);
            setTrendDemo(res.demo);
        } catch {
            setTrendData([]);
        } finally {
            setTrendLoading(false);
        }
    };

    /* ---- Loading / error ---- */
    if (loadError && !item) {
        return (
            <div className="space-y-6">
                <PageHeader title="Result entry" crumbs={[{ label: 'Laboratory' }, { label: 'Worklist', href: '/lab/worklist' }, { label: 'Result entry' }]} />
                <ErrorState onRetry={() => load()} />
            </div>
        );
    }
    if (!item) {
        return (
            <div className="space-y-6">
                <PageHeader title="Result entry" crumbs={[{ label: 'Laboratory' }, { label: 'Worklist', href: '/lab/worklist' }, { label: '…' }]} />
                <SkeletonCard lines={2} />
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 space-y-6">
                        <SkeletonCard lines={6} />
                        <SkeletonCard lines={8} />
                    </div>
                    <div className="space-y-6">
                        <SkeletonCard lines={4} />
                        <SkeletonCard lines={4} />
                    </div>
                </div>
            </div>
        );
    }

    const priorityMeta = PRIORITY_META[item.priority] ?? PRIORITY_META.routine;
    const statusMeta = STATUS_META[item.status] ?? { label: item.status, tone: 'neutral' as const };
    const v = item.verification || {};
    const pathologistBlocked = !v.technicalAt || unacked.length > 0;
    const canRelease = Boolean(v.pathologistAt) || item.status === 'VERIFIED';

    return (
        <div className="space-y-6">
            <PageHeader
                title={item.patientId?.name || 'Unknown patient'}
                description={
                    <span className="inline-flex flex-wrap items-center gap-2">
                        <span className="font-semibold tabular-nums text-foreground">{item.labNumber}</span>
                        <span>· Ordered by {item.orderingDoctorId?.name || '—'} · {formatWhen(item.createdAt)}</span>
                    </span>
                }
                crumbs={[
                    { label: 'Laboratory' },
                    { label: 'Worklist', href: '/lab/worklist' },
                    { label: item.labNumber },
                ]}
                actions={
                    <div className="flex flex-wrap items-center gap-3">
                        {demo && <Badge tone="warning" dot>Demo data — backend offline</Badge>}
                        <Badge tone={priorityMeta.tone} dot={priorityMeta.pulse} pulse={priorityMeta.pulse}>{priorityMeta.label}</Badge>
                        <Badge tone={statusMeta.tone} dot>{statusMeta.label}</Badge>
                        <Button variant="outline" size="sm" onClick={() => load(true)}>
                            <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Refresh
                        </Button>
                        <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="h-3.5 w-3.5" aria-hidden /> Print / Save PDF
                        </Button>
                    </div>
                }
            />

            {/* Workflow stepper */}
            <Card className="animate-fade-up">
                <CardContent className="py-4">
                    <StatusStepper status={item.status} />
                </CardContent>
            </Card>

            {/* Rejected banner */}
            {item.status === 'REJECTED' && (
                <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-danger/40 bg-danger-soft p-4" role="alert">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-danger">Sample rejected{item.sample?.quality ? ` — ${SAMPLE_QUALITIES.find((q) => q.value === item.sample?.quality)?.label || item.sample.quality}` : ''}</p>
                        <p className="mt-0.5 text-sm text-foreground">{item.sample?.rejectedReason || 'No reason recorded.'}</p>
                    </div>
                    {item.sample?.recollectionRequired && <Badge tone="danger" dot pulse>Recollection required</Badge>}
                </div>
            )}

            {/* CRITICAL stop banner */}
            {unacked.length > 0 && (
                <div className="rounded-2xl border-2 border-danger bg-danger-soft p-5" role="alert">
                    <div className="flex items-start gap-3">
                        <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-danger" aria-hidden />
                        <div className="min-w-0 flex-1">
                            <p className="text-base font-bold tracking-wide text-danger">STOP — critical result{unacked.length > 1 ? 's' : ''} awaiting acknowledgement</p>
                            <p className="mt-0.5 text-sm text-foreground">
                                Notify the ordering clinician immediately and record who was informed. Pathologist verification stays blocked until every critical value is acknowledged.
                            </p>
                            <ul className="mt-3 space-y-2">
                                {criticals.map((e, i) =>
                                    e.acknowledgedAt ? null : (
                                        <li key={`${e.parameter}-${i}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/40 bg-card px-4 py-2.5">
                                            <span className="text-sm font-semibold text-foreground">
                                                {e.parameter} = <span className="text-danger">{e.value}</span>
                                            </span>
                                            <Button variant="danger" size="sm" onClick={() => setAckIndex(i)} disabled={busy !== null}>
                                                Acknowledge
                                            </Button>
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Amendment-in-progress banner */}
            {amendMode && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-warning/50 bg-warning-soft p-4" role="status">
                    <Pencil className="h-5 w-5 shrink-0 text-warning" aria-hidden />
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-warning">Amendment in progress — editing enabled</p>
                        <p className="mt-0.5 text-sm text-foreground">Reason: {amendReason}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={cancelAmend}>Cancel</Button>
                        <Button size="sm" onClick={submitAmend} loading={busy === 'amend'}>Submit amendment</Button>
                    </div>
                </div>
            )}

            {/* Locked banner */}
            {locked && !amendMode && (
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-muted/50 p-4" role="status">
                    <Lock className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">Report released &amp; locked</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Released {formatWhen(item.releasedAt)}. Changes require a formal amendment with a documented reason.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setAmendOpen(true)}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden /> Amend report
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* ── Main column ── */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Sample panel */}
                    <Card className="animate-fade-up">
                        <CardHeader className="flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="flex items-center gap-2"><TestTubes className="h-4 w-4 text-primary" aria-hidden /> Sample</CardTitle>
                                <CardDescription>
                                    {item.sample?.collectedAt ? `Collected ${formatWhen(item.sample.collectedAt)}` : 'Not yet collected'}
                                </CardDescription>
                            </div>
                            {item.status === 'ORDERED' && (
                                <Button size="sm" onClick={handleCollect} loading={busy === 'collect'}>
                                    <FlaskConical className="h-3.5 w-3.5" aria-hidden /> Mark collected
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                                <div>
                                    <Label htmlFor="sample-quality">Sample quality</Label>
                                    <Select
                                        id="sample-quality"
                                        value={sampleQuality}
                                        onChange={(e) => setSampleQuality(e.target.value as SampleQuality)}
                                        disabled={locked || item.status === 'ORDERED'}
                                    >
                                        {SAMPLE_QUALITIES.map((q) => (
                                            <option key={q.value} value={q.value}>{q.label}</option>
                                        ))}
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="sample-reason">Reason {sampleQuality !== 'accepted' ? '(required for rejection)' : '(optional)'}</Label>
                                    <Input
                                        id="sample-reason"
                                        value={sampleReason}
                                        onChange={(e) => setSampleReason(e.target.value)}
                                        placeholder="e.g. visible hemolysis after centrifugation"
                                        disabled={locked || item.status === 'ORDERED'}
                                    />
                                </div>
                                <Button
                                    variant={sampleQuality === 'accepted' ? 'outline' : 'danger'}
                                    onClick={handleSampleUpdate}
                                    disabled={locked || item.status === 'ORDERED' || (sampleQuality !== 'accepted' && !sampleReason.trim())}
                                    loading={busy === 'sample'}
                                >
                                    {sampleQuality === 'accepted' ? 'Update quality' : 'Reject sample…'}
                                </Button>
                            </div>
                            {item.sample?.quality && item.sample.quality !== 'accepted' && (
                                <p className="mt-3 text-sm text-danger">
                                    Current quality: {SAMPLE_QUALITIES.find((q) => q.value === item.sample?.quality)?.label || item.sample.quality}
                                    {item.sample.rejectedReason ? ` — ${item.sample.rejectedReason}` : ''}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Result entry per test */}
                    {item.tests.map((t) => {
                        const td = draft[t.code];
                        return (
                            <Card key={t.code} className="animate-fade-up">
                                <CardHeader className="flex-row items-center justify-between space-y-0">
                                    <div>
                                        <CardTitle>{t.name}</CardTitle>
                                        <CardDescription>Code {t.code}{t.specimen ? ` · Specimen: ${t.specimen}` : ''}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="overflow-x-auto scrollbar-thin rounded-xl border border-border">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/60">
                                                <tr className="border-b border-border">
                                                    <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parameter</th>
                                                    <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Result</th>
                                                    <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit</th>
                                                    <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Reference range</th>
                                                    <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Flag</th>
                                                    <th scope="col" className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comments</th>
                                                    <th scope="col" className="px-3 py-2.5" aria-label="Trend" />
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {t.parameters.map((p) => {
                                                    const pd = td?.params[p.name] ?? { value: p.value ?? '', comments: p.comments ?? '' };
                                                    const textParam = isTextParameter(p);
                                                    const flag = effectiveFlag(p, pd.value);
                                                    const isProvisional = pd.value !== (p.value ?? '');
                                                    const trendOpen = trendParam?.name === p.name;
                                                    return (
                                                        <React.Fragment key={p.name}>
                                                            <tr className={cn(flag === 'critical' && 'bg-danger-soft/40')}>
                                                                <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">{p.name}</td>
                                                                <td className="px-3 py-2 min-w-40">
                                                                    <Input
                                                                        value={pd.value}
                                                                        onChange={(e) => setParam(t.code, p.name, { value: e.target.value })}
                                                                        disabled={!editable}
                                                                        aria-label={`${p.name} result`}
                                                                        className="h-9 tabular-nums"
                                                                        placeholder={textParam ? 'e.g. Negative' : 'Value'}
                                                                    />
                                                                    {textParam && editable && (
                                                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                                                            {TEXT_SUGGESTIONS.map((s) => (
                                                                                <button
                                                                                    key={s}
                                                                                    type="button"
                                                                                    onClick={() => setParam(t.code, p.name, { value: s })}
                                                                                    className={cn(
                                                                                        'rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors',
                                                                                        pd.value === s
                                                                                            ? 'border-primary bg-primary/10 text-primary'
                                                                                            : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                                                                                    )}
                                                                                >
                                                                                    {s}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{p.unit || '—'}</td>
                                                                <td className="px-3 py-2.5 text-muted-foreground tabular-nums whitespace-nowrap">{p.refRangeUsed || '—'}</td>
                                                                <td className="px-3 py-2.5"><FlagBadge flag={flag} provisional={isProvisional} /></td>
                                                                <td className="px-3 py-2 min-w-36">
                                                                    <Input
                                                                        value={pd.comments}
                                                                        onChange={(e) => setParam(t.code, p.name, { comments: e.target.value })}
                                                                        disabled={!editable}
                                                                        aria-label={`${p.name} comments`}
                                                                        className="h-9"
                                                                        placeholder="—"
                                                                    />
                                                                </td>
                                                                <td className="px-2 py-2 text-right">
                                                                    {!textParam && (
                                                                        <Button
                                                                            variant={trendOpen ? 'secondary' : 'ghost'}
                                                                            size="icon-sm"
                                                                            aria-label={`Toggle trend for ${p.name}`}
                                                                            aria-pressed={trendOpen}
                                                                            onClick={() => toggleTrend(p)}
                                                                        >
                                                                            <TrendingUp className="h-4 w-4" aria-hidden />
                                                                        </Button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                            {trendOpen && (
                                                                <tr>
                                                                    <td colSpan={7} className="bg-muted/30 px-4 py-4">
                                                                        <TrendPanel
                                                                            name={p.name}
                                                                            unit={p.unit}
                                                                            refRange={p.refRangeUsed}
                                                                            currentValue={pd.value}
                                                                            data={trendData}
                                                                            demo={trendDemo}
                                                                            loading={trendLoading}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div>
                                        <Label htmlFor={`tech-comments-${t.code}`}>Technologist comments</Label>
                                        <Textarea
                                            id={`tech-comments-${t.code}`}
                                            value={td?.techComments ?? ''}
                                            onChange={(e) =>
                                                setDraft((d) => ({
                                                    ...d,
                                                    [t.code]: { params: d[t.code]?.params ?? {}, techComments: e.target.value },
                                                }))
                                            }
                                            disabled={!editable}
                                            className="min-h-16"
                                            placeholder="Analyser notes, dilutions, repeat runs…"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    <div className="flex flex-wrap items-center gap-3">
                        {!amendMode && (
                            <Button onClick={handleSave} disabled={locked} loading={busy === 'save'}>
                                <ClipboardCheck className="h-4 w-4" aria-hidden /> Save results
                            </Button>
                        )}
                        {locked && !amendMode && (
                            <p className="text-sm text-muted-foreground">Report is locked after release — use <b>Amend report</b> to make changes.</p>
                        )}
                    </div>
                </div>

                {/* ── Context rail ── */}
                <div className="space-y-6">
                    {/* Verification & release */}
                    <Card className="animate-fade-up">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" aria-hidden /> Verification &amp; release</CardTitle>
                            <CardDescription>Two-step sign-off before the report can be released.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-xl border border-border p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Technical verification</p>
                                        {v.technicalAt ? (
                                            <p className="mt-0.5 text-xs text-muted-foreground">{v.technicalBy || '—'} · {formatWhen(v.technicalAt)}</p>
                                        ) : (
                                            <p className="mt-0.5 text-xs text-muted-foreground">Not yet verified</p>
                                        )}
                                    </div>
                                    {v.technicalAt ? (
                                        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden />
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleVerify('technical')}
                                            disabled={locked || item.status === 'ORDERED' || item.status === 'REJECTED'}
                                            loading={busy === 'verify-technical'}
                                        >
                                            Technical verify
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl border border-border p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Pathologist verification</p>
                                        {v.pathologistAt ? (
                                            <p className="mt-0.5 text-xs text-muted-foreground">{v.pathologistBy || '—'} · {formatWhen(v.pathologistAt)}</p>
                                        ) : (
                                            <p className="mt-0.5 text-xs text-muted-foreground">Not yet verified</p>
                                        )}
                                    </div>
                                    {v.pathologistAt ? (
                                        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden />
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleVerify('pathologist')}
                                            disabled={locked || pathologistBlocked || item.status === 'REJECTED'}
                                            loading={busy === 'verify-pathologist'}
                                        >
                                            Pathologist verify
                                        </Button>
                                    )}
                                </div>
                                {!v.pathologistAt && unacked.length > 0 && (
                                    <p className="mt-2 text-xs text-danger">
                                        Blocked — {unacked.length} critical result{unacked.length > 1 ? 's' : ''} must be acknowledged first (the server enforces this too).
                                    </p>
                                )}
                                {!v.pathologistAt && unacked.length === 0 && !v.technicalAt && (
                                    <p className="mt-2 text-xs text-muted-foreground">Requires technical verification first.</p>
                                )}
                            </div>

                            {!locked && (
                                <Button
                                    className="w-full"
                                    onClick={() => setReleaseOpen(true)}
                                    disabled={!canRelease}
                                    loading={busy === 'release'}
                                >
                                    <Lock className="h-4 w-4" aria-hidden /> Release report
                                </Button>
                            )}
                            {!locked && !canRelease && (
                                <p className="text-xs text-muted-foreground">Release becomes available after pathologist verification.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Acknowledged criticals */}
                    {criticals.some((e) => e.acknowledgedAt) && (
                        <Card className="animate-fade-up">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-danger" aria-hidden /> Critical notifications</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {criticals.map((e, i) =>
                                    e.acknowledgedAt ? (
                                        <div key={`${e.parameter}-${i}`} className="rounded-xl bg-success-soft px-3 py-2 text-sm">
                                            <p className="font-semibold text-foreground">{e.parameter} = {e.value}</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                Notified {e.notifiedWho || '—'} via {e.notificationMethod || '—'} · {formatWhen(e.acknowledgedAt)}
                                            </p>
                                        </div>
                                    ) : null
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Automated entry checks */}
                    <Card className="animate-fade-up">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-primary" aria-hidden /> Automated entry checks</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2.5">
                            {checks.length === 0 ? (
                                <div className="flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2.5 text-sm text-foreground">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-hidden /> No entry issues detected.
                                </div>
                            ) : (
                                checks.map((c, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            'flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm',
                                            c.severity === 'warning' ? 'bg-warning-soft text-foreground' : 'bg-info-soft text-foreground'
                                        )}
                                    >
                                        <AlertTriangle className={cn('mt-0.5 h-4 w-4 shrink-0', c.severity === 'warning' ? 'text-warning' : 'text-info')} aria-hidden />
                                        <span>{c.message}</span>
                                    </div>
                                ))
                            )}
                            <p className="pt-1 text-xs text-muted-foreground">
                                Automated entry checks — verification and release remain with authorized laboratory professionals.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Amendments */}
                    {(item.amendments?.length ?? 0) > 0 && (
                        <Card className="animate-fade-up">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><History className="h-4 w-4 text-primary" aria-hidden /> Amendments</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {item.amendments!.map((a, i) => (
                                    <div key={i} className="rounded-xl border border-border px-3 py-2 text-sm">
                                        <p className="text-xs text-muted-foreground tabular-nums">{formatWhen(a.at)}</p>
                                        <p className="mt-0.5 text-foreground">{a.reason}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Report */}
                    <Card className="animate-fade-up">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Printer className="h-4 w-4 text-primary" aria-hidden /> Report</CardTitle>
                            <CardDescription>
                                {item.status === 'RELEASED'
                                    ? (item.amendments?.length ? 'Amended report — amendment history is printed on the sheet.' : 'Final released report with verification signatories and QR placeholder.')
                                    : 'Prints with a PRELIMINARY stamp until the report is released.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full" onClick={handlePrint}>
                                <Printer className="h-4 w-4" aria-hidden /> Print / Save PDF
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ── Dialogs ── */}
            <Dialog
                open={rejectOpen}
                onClose={() => setRejectOpen(false)}
                title="Reject sample?"
                description="Rejecting the sample stops processing and flags the order for recollection."
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
                        <Button variant="danger" onClick={confirmReject} disabled={!sampleReason.trim()}>Reject sample</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-foreground">
                        Quality: <b>{SAMPLE_QUALITIES.find((q) => q.value === sampleQuality)?.label || sampleQuality}</b> · Recollection will be required.
                    </div>
                    <div>
                        <Label htmlFor="reject-reason">Rejection reason (required)</Label>
                        <Textarea
                            id="reject-reason"
                            value={sampleReason}
                            onChange={(e) => setSampleReason(e.target.value)}
                            placeholder="Describe why the sample cannot be processed…"
                        />
                    </div>
                </div>
            </Dialog>

            <Dialog
                open={ackIndex !== null}
                onClose={() => setAckIndex(null)}
                title="Acknowledge critical result"
                description={
                    ackIndex !== null && criticals[ackIndex]
                        ? `${criticals[ackIndex].parameter} = ${criticals[ackIndex].value}`
                        : undefined
                }
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setAckIndex(null)}>Cancel</Button>
                        <Button variant="danger" onClick={confirmAck} disabled={!ackWho.trim()}>Record acknowledgement</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="ack-who">Who was notified? (required)</Label>
                        <Input
                            id="ack-who"
                            value={ackWho}
                            onChange={(e) => setAckWho(e.target.value)}
                            placeholder="e.g. Dr. Kavita Nair (ordering physician)"
                        />
                    </div>
                    <div>
                        <Label htmlFor="ack-method">Notification method</Label>
                        <Select id="ack-method" value={ackMethod} onChange={(e) => setAckMethod(e.target.value)}>
                            <option value="phone">Phone</option>
                            <option value="in-person">In person</option>
                            <option value="message">Message</option>
                        </Select>
                    </div>
                </div>
            </Dialog>

            <Dialog
                open={releaseOpen}
                onClose={() => setReleaseOpen(false)}
                title="Release report?"
                description="Releasing sends the verified report to the ordering clinician and patient record."
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setReleaseOpen(false)}>Cancel</Button>
                        <Button onClick={confirmRelease}>Release &amp; lock</Button>
                    </>
                }
            >
                <div className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-foreground">
                    <b>This locks the report.</b> After release, results can only be changed through a formal amendment with a documented reason.
                </div>
            </Dialog>

            <Dialog
                open={amendOpen}
                onClose={() => setAmendOpen(false)}
                title="Amend released report"
                description="An amendment reason is mandatory and becomes part of the permanent report history."
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setAmendOpen(false)}>Cancel</Button>
                        <Button onClick={startAmend} disabled={!amendReason.trim()}>Start amendment</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="amend-reason">Reason for amendment (required)</Label>
                        <Textarea
                            id="amend-reason"
                            value={amendReason}
                            onChange={(e) => setAmendReason(e.target.value)}
                            placeholder="e.g. Transcription error in Free T4 value…"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        After starting, result fields unlock for editing; submitting records the amendment against the released report.
                    </p>
                </div>
            </Dialog>
        </div>
    );
}

/* ─────────────────────────── Trend panel ──────────────────────────── */

function TrendPanel({ name, unit, refRange, currentValue, data, demo, loading }: {
    name: string;
    unit?: string;
    refRange?: string;
    currentValue: string;
    data: HistoryPoint[] | null;
    demo: boolean;
    loading: boolean;
}) {
    const points = React.useMemo(() => {
        const history = (data || [])
            .map((h) => ({ label: formatDay(h.at), value: numericValue(h.value), flag: h.flag ?? provisionalFlag(h.value, h.refRangeUsed), when: h.at }))
            .filter((p) => p.value !== null);
        const current = numericValue(currentValue);
        if (current !== null) {
            history.push({ label: 'Current', value: current, flag: provisionalFlag(currentValue, refRange), when: '' });
        }
        return history;
    }, [data, currentValue, refRange]);

    if (loading) {
        return <div className="h-44 skeleton-shimmer rounded-xl" aria-busy />;
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                    {name} trend{unit ? ` (${unit})` : ''}
                </p>
                {demo && <Badge tone="warning" dot>Demo data — backend offline</Badge>}
            </div>
            {points.length === 0 ? (
                <p className="text-sm text-muted-foreground">No prior results found for this parameter.</p>
            ) : (
                <>
                    <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                                <CartesianGrid {...chartGrid} />
                                <XAxis {...chartAxis} dataKey="label" />
                                <YAxis {...chartAxis} domain={['auto', 'auto']} width={70} />
                                <Tooltip {...chartTooltip} />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    name={name}
                                    stroke={CHART_COLORS[0]}
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: CHART_COLORS[0] }}
                                    activeDot={{ r: 5 }}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="overflow-x-auto scrollbar-thin rounded-xl border border-border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/60">
                                <tr className="border-b border-border">
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">When</th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Value</th>
                                    <th scope="col" className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Flag</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {points.map((p, i) => (
                                    <tr key={i} className={cn(p.label === 'Current' && 'bg-primary/5 font-semibold')}>
                                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                                            {p.label === 'Current' ? 'Current (unsaved entry)' : `${p.label} · ${p.when ? formatWhen(p.when) : ''}`}
                                        </td>
                                        <td className="px-3 py-2 tabular-nums">{p.value}{unit ? ` ${unit}` : ''}</td>
                                        <td className="px-3 py-2"><FlagBadge flag={p.flag} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            <p className="text-xs text-muted-foreground">Informational — not a diagnosis.</p>
        </div>
    );
}
