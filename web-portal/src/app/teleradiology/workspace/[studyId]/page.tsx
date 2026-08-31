'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, Contrast,
    ExternalLink, FileSignature, FilePlus2, History, Keyboard, Layers, Move,
    PenLine, Play, Ruler, RotateCw, ShieldCheck, Siren, Sparkles, Stethoscope,
    Timer, ZoomIn,
} from 'lucide-react';
import {
    Badge, Button, Card, CardContent, CardHeader, CardTitle, Dialog, EmptyState,
    Label, PageHeader, Select, Skeleton, SkeletonCard, Tabs, TabsContent, TabsList,
    TabsTrigger, Textarea, Timeline, TimelineItem,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
    ApiHttpError, API_BASE, REPORT_SECTION_KEYS, REPORT_TEMPLATES, STATUS_FLOW,
    addAddendum, ackCritical, assignedName, claimStudy, fetchAiHealth, fetchWorklist,
    flagCritical, humanizeMin, isBreached, isSignedOrLater, patchStatus, patientKey,
    patientName, postAiRadiologyDraft, saveReport, signReport, slaRemainingMin, studyAgeMin,
    type AiReportDraft, type ReportSections, type StudyStatus,
} from '../../_lib/api';
import { DemoBadge, PriorityBadge, StatusBadge } from '../../_lib/shared';

const REFETCH_MS = 30_000;

const SECTION_DEFS: { key: keyof ReportSections; label: string; rows: number; shortcut: string }[] = [
    { key: 'technique', label: 'Technique', rows: 2, shortcut: '1' },
    { key: 'comparison', label: 'Comparison', rows: 2, shortcut: '2' },
    { key: 'findings', label: 'Findings', rows: 6, shortcut: '3' },
    { key: 'impression', label: 'Impression', rows: 4, shortcut: '4' },
    { key: 'recommendations', label: 'Recommendations', rows: 2, shortcut: '5' },
];

const STEPPER: StudyStatus[] = ['UNREAD', 'IN_PROGRESS', 'DRAFT', 'REVIEW', 'SIGNED'];

const emptySections = (): ReportSections => ({
    technique: '', comparison: '', findings: '', impression: '', recommendations: '',
});

function normalizeSections(s?: ReportSections | null): ReportSections {
    const out = emptySections();
    for (const k of REPORT_SECTION_KEYS) out[k] = s?.[k] ?? '';
    return out;
}

function formatWhen(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) +
        ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function errMessage(err: unknown): string {
    if (err instanceof ApiHttpError) return err.message;
    if (err instanceof Error) return err.message;
    return 'Unexpected error';
}

export default function ReadingWorkspacePage({ params }: { params: Promise<{ studyId: string }> }) {
    const { studyId } = React.use(params);
    return <ReadingWorkspace studyId={studyId} />;
}

function ReadingWorkspace({ studyId }: { studyId: string }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const worklist = useQuery({
        queryKey: ['telerad', 'worklist', 'all'],
        queryFn: () => fetchWorklist({}),
        refetchInterval: REFETCH_MS,
    });
    const studies = React.useMemo(() => worklist.data?.data ?? [], [worklist.data]);
    const demo = Boolean(worklist.data?.demo);
    const study = React.useMemo(
        () => studies.find((s) => s._id === studyId || s.accessionNumber === studyId) ?? null,
        [studies, studyId]
    );
    const signed = study ? isSignedOrLater(study) : false;

    /* ─────────────── Report draft state + debounced autosave ─────────────── */

    const [sections, setSections] = React.useState<ReportSections>(emptySections());
    const [saveState, setSaveState] = React.useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
    const loadedForRef = React.useRef<string | null>(null);
    const lastSavedRef = React.useRef<string>('');
    const sectionRefs = React.useRef<Partial<Record<keyof ReportSections, HTMLTextAreaElement | null>>>({});

    // Initialize local draft when the study (or navigation target) changes.
    React.useEffect(() => {
        if (!study) return;
        if (loadedForRef.current === study._id) return;
        loadedForRef.current = study._id;
        const initial = normalizeSections(study.report?.sections);
        setSections(initial);
        lastSavedRef.current = JSON.stringify(initial);
        setSaveState('idle');
    }, [study]);

    const save = useMutation({
        mutationFn: (body: ReportSections) => saveReport(studyId, body),
        onMutate: () => setSaveState('saving'),
        onSuccess: (_res, body) => {
            lastSavedRef.current = JSON.stringify(body);
            setSaveState('saved');
            queryClient.invalidateQueries({ queryKey: ['telerad'] });
        },
        onError: (err) => {
            setSaveState('error');
            toast('error', 'Draft not saved', errMessage(err));
        },
    });
    // `mutate` has a stable identity in react-query v5.
    const saveMutate = save.mutate;

    // 1.5s debounce after the last edit.
    React.useEffect(() => {
        if (!study || signed) return;
        if (JSON.stringify(sections) === lastSavedRef.current) return;
        setSaveState('dirty');
        const timer = setTimeout(() => saveMutate(sections), 1500);
        return () => clearTimeout(timer);
    }, [sections, study, signed, saveMutate]);

    const setSection = (key: keyof ReportSections, value: string) =>
        setSections((prev) => ({ ...prev, [key]: value }));

    /* ─────────────────────────── Mutations ─────────────────────────── */

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['telerad'] });
    const demoNote = (isDemo: boolean) => (isDemo ? 'Demo mode — not persisted to backend' : undefined);

    const claim = useMutation({
        mutationFn: () => claimStudy(studyId),
        onSuccess: ({ demo: d }) => { toast('success', 'Study claimed — reading in progress', demoNote(d)); invalidate(); },
        onError: (err) => toast('error', 'Could not claim study', errMessage(err)),
    });

    const advance = useMutation({
        mutationFn: (status: StudyStatus) => patchStatus(studyId, status),
        onSuccess: ({ data, demo: d }) => { toast('success', `Status → ${data.status.replace('_', ' ')}`, demoNote(d)); invalidate(); },
        onError: (err) => toast('error', 'Transition rejected', errMessage(err)),
    });

    const [signOpen, setSignOpen] = React.useState(false);
    const sign = useMutation({
        mutationFn: async () => {
            // Flush any unsaved edits first so the backend signs the latest draft.
            if (JSON.stringify(sections) !== lastSavedRef.current) {
                await saveReport(studyId, sections);
                lastSavedRef.current = JSON.stringify(sections);
            }
            return signReport(studyId);
        },
        onSuccess: ({ demo: d }) => {
            setSignOpen(false);
            toast('success', 'Report signed', demoNote(d) ?? 'Report is now immutable');
            invalidate();
        },
        onError: (err) => toast('error', 'Could not sign report', errMessage(err)),
    });

    const [addendumOpen, setAddendumOpen] = React.useState(false);
    const [addendumReason, setAddendumReason] = React.useState('');
    const [addendumSections, setAddendumSections] = React.useState<ReportSections>({ findings: '', impression: '' });
    const addendum = useMutation({
        mutationFn: () => addAddendum(studyId, { sections: addendumSections, reason: addendumReason.trim() }),
        onSuccess: ({ demo: d }) => {
            setAddendumOpen(false);
            setAddendumReason('');
            setAddendumSections({ findings: '', impression: '' });
            toast('success', 'Addendum recorded', demoNote(d));
            invalidate();
        },
        onError: (err) => toast('error', 'Addendum rejected', errMessage(err)),
    });

    const [criticalOpen, setCriticalOpen] = React.useState(false);
    const [criticalDesc, setCriticalDesc] = React.useState('');
    const critical = useMutation({
        mutationFn: () => flagCritical(studyId, criticalDesc.trim()),
        onSuccess: ({ demo: d }) => {
            setCriticalOpen(false);
            setCriticalDesc('');
            toast('success', 'Critical finding flagged — referring team notified', demoNote(d));
            invalidate();
        },
        onError: (err) => toast('error', 'Could not flag critical finding', errMessage(err)),
    });
    const ack = useMutation({
        mutationFn: () => ackCritical(studyId),
        onSuccess: ({ demo: d }) => { toast('success', 'Critical finding acknowledged', demoNote(d)); invalidate(); },
        onError: (err) => toast('error', 'Could not acknowledge', errMessage(err)),
    });

    /* ─────────────────────── Keyboard shortcuts ────────────────────── */

    const navigateRelative = React.useCallback((dir: 1 | -1) => {
        if (studies.length === 0) return;
        const idx = studies.findIndex((s) => s._id === (study?._id ?? studyId));
        const next = studies[(idx + dir + studies.length) % studies.length];
        if (next) router.push(`/teleradiology/workspace/${next._id}`);
    }, [studies, study, studyId, router]);

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'Enter') {
                if (study && !signed) { e.preventDefault(); setSignOpen(true); }
                return;
            }
            const target = e.target as HTMLElement | null;
            const editing = target && (
                target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' || target.isContentEditable
            );
            if (editing || e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.key === 'j') { e.preventDefault(); navigateRelative(1); }
            else if (e.key === 'k') { e.preventDefault(); navigateRelative(-1); }
            else if (/^[1-5]$/.test(e.key)) {
                const def = SECTION_DEFS[Number(e.key) - 1];
                const el = def && sectionRefs.current[def.key];
                if (el) { e.preventDefault(); el.focus(); }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [navigateRelative, study, signed]);

    /* ───────────────────────── Template insert ─────────────────────── */

    const [templateKey, setTemplateKey] = React.useState('');
    const applyTemplate = () => {
        const tpl = REPORT_TEMPLATES.find((t) => t.key === templateKey);
        if (!tpl || signed) return;
        setSections((prev) => {
            const merged = { ...prev };
            for (const k of REPORT_SECTION_KEYS) {
                const existing = (merged[k] ?? '').trim();
                merged[k] = existing ? `${existing}\n${tpl.sections[k] ?? ''}` : (tpl.sections[k] ?? '');
            }
            return merged;
        });
        toast('info', `Template applied: ${tpl.label}`, 'Review and edit before signing');
    };

    /* ───────────────── Claude AI report drafting ───────────────── */

    // Availability probed once on mount; when false (no ANTHROPIC_API_KEY on
    // the AI service, or backend offline) the panel keeps today's behavior.
    const [aiAvailable, setAiAvailable] = React.useState(false);
    React.useEffect(() => {
        let active = true;
        fetchAiHealth().then((ok) => { if (active) setAiAvailable(ok); });
        return () => { active = false; };
    }, []);

    const [aiDraft, setAiDraft] = React.useState<AiReportDraft | null>(null);
    const aiDraftMutation = useMutation({
        mutationFn: () => {
            if (!study) throw new Error('Study not loaded');
            return postAiRadiologyDraft({
                modality: study.modality,
                bodyPart: study.bodyPart,
                clinicalIndication: study.clinicalIndication,
                aiTriageFindings: study.aiTriage?.findings ?? [],
            });
        },
        onSuccess: (d) => {
            setAiDraft(d);
            toast('info', 'Claude draft ready', 'Review each section — nothing is inserted until you click');
        },
        onError: (err) => toast('error', 'AI draft failed', errMessage(err)),
    });

    /** Appends one drafted section to the report (explicit per-section click). */
    const insertAiDraftSection = (key: keyof ReportSections) => {
        const value = aiDraft?.[key]?.trim();
        if (signed || !value) return;
        setSections((prev) => ({
            ...prev,
            [key]: prev[key]?.trim() ? `${prev[key]}\n${value}` : value,
        }));
        sectionRefs.current[key]?.focus();
    };

    /** Fills ONLY empty report sections from the draft (explicit click). */
    const insertAiDraftIntoEmpty = () => {
        if (!aiDraft || signed) return;
        setSections((prev) => {
            const merged = { ...prev };
            for (const k of REPORT_SECTION_KEYS) {
                const value = aiDraft[k]?.trim();
                if (value && !(merged[k] ?? '').trim()) merged[k] = value;
            }
            return merged;
        });
        toast('info', 'Claude draft inserted into empty sections', 'Existing text was left untouched — review before signing');
    };

    const insertAiFinding = (finding: string, confidence: number, reason?: string) => {
        if (signed) return;
        const line = `AI-flagged: ${finding} (confidence ${Math.round(confidence * 100)}%)${reason ? ` — ${reason}` : ''}. Radiologist verified.`;
        setSections((prev) => ({
            ...prev,
            findings: prev.findings?.trim() ? `${prev.findings}\n${line}` : line,
        }));
        sectionRefs.current.findings?.focus();
        toast('info', 'AI finding inserted into Findings', 'Edit as needed — AI never signs reports');
    };

    /* ─────────────────────────── Rendering ─────────────────────────── */

    if (worklist.isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-2"><SkeletonCard lines={8} /></div>
                    <div className="xl:col-span-5"><SkeletonCard lines={10} /></div>
                    <div className="xl:col-span-5"><SkeletonCard lines={10} /></div>
                </div>
            </div>
        );
    }

    if (!study) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Reading Workspace"
                    crumbs={[{ label: 'Teleradiology' }, { label: 'Worklist', href: '/teleradiology/worklist' }, { label: 'Workspace' }]}
                />
                <EmptyState
                    icon={Stethoscope}
                    title="Study not found"
                    description="This study is not on the current worklist. It may have been delivered and archived."
                    action={{ label: 'Back to worklist', onClick: () => router.push('/teleradiology/worklist') }}
                />
            </div>
        );
    }

    const remaining = slaRemainingMin(study);
    const breached = isBreached(study);
    const currentStepIdx = (() => {
        const i = STEPPER.indexOf(study.status === 'DELIVERED' ? 'SIGNED' : study.status);
        if (i >= 0) return i;
        return -1; // ORDERED / RECEIVED — before the read starts
    })();
    const nextStatus: StudyStatus | null =
        study.status === 'DELIVERED' || study.status === 'SIGNED'
            ? null
            : STATUS_FLOW[STATUS_FLOW.indexOf(study.status) + 1] ?? null;
    const unassigned = !assignedName(study);
    const priors = studies.filter((s) => s._id !== study._id && patientKey(s) && patientKey(s) === patientKey(study));
    const cf = study.criticalFinding;

    return (
        <div className="space-y-6">
            <PageHeader
                title={
                    <span className="flex flex-wrap items-center gap-3">
                        {study.accessionNumber}
                        <PriorityBadge priority={study.priority} />
                        <StatusBadge status={study.status} />
                    </span>
                }
                description={`${patientName(study)} · ${study.modality}${study.contrast ? ' with contrast' : ''} · ${study.bodyPart || 'Unspecified'} · age ${humanizeMin(studyAgeMin(study))}${remaining != null ? ` · SLA ${breached ? `${humanizeMin(Math.abs(remaining))} over` : `${humanizeMin(remaining)} left`}` : ''}`}
                crumbs={[
                    { label: 'Teleradiology' },
                    { label: 'Worklist', href: '/teleradiology/worklist' },
                    { label: study.accessionNumber },
                ]}
                actions={
                    <div className="flex flex-wrap items-center gap-3">
                        <DemoBadge show={demo} />
                        <Button variant="danger" size="sm" onClick={() => setCriticalOpen(true)}>
                            <Siren className="h-4 w-4" aria-hidden /> Flag Critical
                        </Button>
                    </div>
                }
            />

            {/* Critical finding banner */}
            {cf?.flagged && (
                <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        'flex flex-wrap items-center gap-3 rounded-2xl border p-4',
                        cf.acknowledgedAt ? 'border-success/30 bg-success-soft' : 'border-danger/40 bg-danger-soft'
                    )}
                >
                    {cf.acknowledgedAt
                        ? <ShieldCheck className="h-5 w-5 text-success" aria-hidden />
                        : <AlertTriangle className="h-5 w-5 text-danger animate-pulse" aria-hidden />}
                    <div className="min-w-0 flex-1">
                        <p className={cn('text-sm font-semibold', cf.acknowledgedAt ? 'text-success' : 'text-danger')}>
                            Critical finding {cf.acknowledgedAt ? 'acknowledged' : '— awaiting acknowledgement'}
                        </p>
                        <p className="text-sm text-foreground">{cf.description || '—'}</p>
                        {cf.acknowledgedAt && (
                            <p className="text-xs text-muted-foreground">Acknowledged {formatWhen(cf.acknowledgedAt)}</p>
                        )}
                    </div>
                    {!cf.acknowledgedAt && (
                        <Button size="sm" variant="outline" loading={ack.isPending} onClick={() => ack.mutate()}>
                            <CheckCircle2 className="h-4 w-4" aria-hidden /> Acknowledge
                        </Button>
                    )}
                </motion.div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* ───────── LEFT: mini worklist rail ───────── */}
                <aside className="xl:col-span-2 order-2 xl:order-1">
                    <Card className="overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Worklist</CardTitle>
                        </CardHeader>
                        <CardContent className="p-2">
                            <ul className="max-h-[560px] space-y-1 overflow-y-auto scrollbar-thin">
                                {studies.map((s) => {
                                    const active = s._id === study._id;
                                    return (
                                        <li key={s._id}>
                                            <Link
                                                href={`/teleradiology/workspace/${s._id}`}
                                                aria-current={active ? 'page' : undefined}
                                                className={cn(
                                                    'block rounded-xl border px-2.5 py-2 transition-colors',
                                                    active
                                                        ? 'border-primary/40 bg-primary/10'
                                                        : 'border-transparent hover:bg-muted'
                                                )}
                                            >
                                                <div className="flex items-center justify-between gap-1">
                                                    <span className="truncate font-mono text-[11px] font-semibold text-foreground">{s.accessionNumber}</span>
                                                    {(s.priority === 'stat' || s.priority === 'emergency') && (
                                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger animate-pulse" aria-label="High acuity" />
                                                    )}
                                                </div>
                                                <p className="truncate text-[11px] text-muted-foreground">
                                                    {s.modality} · {s.bodyPart || '—'}
                                                </p>
                                                <p className={cn('text-[11px] tabular-nums', isBreached(s) ? 'text-danger font-semibold' : 'text-subtle-foreground')}>
                                                    {humanizeMin(studyAgeMin(s))} · {s.status.replace('_', ' ').toLowerCase()}
                                                </p>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Shortcuts legend */}
                    <div className="mt-4 rounded-2xl border border-border bg-card p-3 shadow-soft">
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <Keyboard className="h-3.5 w-3.5" aria-hidden /> Shortcuts
                        </p>
                        <ul className="space-y-1 text-[11px] text-muted-foreground">
                            <li><kbd className="rounded border border-border bg-muted px-1 font-mono">j</kbd> / <kbd className="rounded border border-border bg-muted px-1 font-mono">k</kbd> next / previous study</li>
                            <li><kbd className="rounded border border-border bg-muted px-1 font-mono">1</kbd>–<kbd className="rounded border border-border bg-muted px-1 font-mono">5</kbd> focus report section</li>
                            <li><kbd className="rounded border border-border bg-muted px-1 font-mono">Ctrl</kbd>+<kbd className="rounded border border-border bg-muted px-1 font-mono">Enter</kbd> sign report</li>
                        </ul>
                    </div>
                </aside>

                {/* ───────── CENTER: viewer stage ───────── */}
                <section className="xl:col-span-5 order-1 xl:order-2">
                    {/* Deliberately always-dark surface — DICOM reading convention. */}
                    <div className="flex h-full min-h-[480px] flex-col overflow-hidden rounded-3xl border border-border bg-zinc-950 text-zinc-100 shadow-float">
                        {/* Disabled viewer toolbar */}
                        <div className="flex flex-wrap items-center gap-1 border-b border-zinc-800 px-3 py-2">
                            {[
                                { icon: Contrast, label: 'W/L' },
                                { icon: ZoomIn, label: 'Zoom' },
                                { icon: Move, label: 'Pan' },
                                { icon: Layers, label: 'MPR' },
                                { icon: Play, label: 'Cine' },
                                { icon: Ruler, label: 'Measure' },
                                { icon: RotateCw, label: 'Rotate' },
                            ].map(({ icon: Icon, label }) => (
                                <button
                                    key={label}
                                    type="button"
                                    disabled
                                    title={`${label} — available in the external viewer`}
                                    className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500"
                                >
                                    <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
                                </button>
                            ))}
                            <span className="ml-auto text-[11px] italic text-zinc-500">Viewer streams in external window</span>
                        </div>

                        {/* Stage */}
                        <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
                            <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900">
                                <Layers className="h-7 w-7 text-zinc-400" aria-hidden />
                            </span>
                            <div>
                                <p className="text-lg font-semibold text-zinc-100">
                                    {study.modality}{study.contrast ? ' + contrast' : ''} · {study.bodyPart || 'Unspecified'}
                                </p>
                                <p className="mt-1 max-w-md text-sm text-zinc-400">{study.clinicalIndication || 'No clinical indication recorded.'}</p>
                            </div>
                            <Button
                                size="lg"
                                onClick={() => window.open(`${API_BASE}/viewer?study=${encodeURIComponent(study.studyInstanceUID)}`, '_blank', 'noopener')}
                            >
                                <ExternalLink className="h-4 w-4" aria-hidden /> Open DICOM Viewer
                            </Button>
                            <p className="text-[11px] text-zinc-500">
                                Images are never rendered inline here — full-fidelity streaming happens in the dedicated viewer window.
                            </p>
                        </div>

                        {/* Metadata */}
                        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 border-t border-zinc-800 px-5 py-4 text-xs sm:grid-cols-3">
                            {[
                                ['Accession', study.accessionNumber],
                                ['Study UID', study.studyInstanceUID],
                                ['Patient', patientName(study)],
                                ['Modality', `${study.modality}${study.contrast ? ' +C' : ''}`],
                                ['Body part', study.bodyPart || '—'],
                                ['Assigned', assignedName(study) ?? 'Unassigned'],
                            ].map(([k, v]) => (
                                <div key={k as string} className="min-w-0">
                                    <dt className="text-zinc-500">{k}</dt>
                                    <dd className="truncate font-medium text-zinc-200" title={String(v)}>{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </section>

                {/* ───────── RIGHT: reporting + AI copilot ───────── */}
                <section className="xl:col-span-5 order-3 space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <PenLine className="h-4 w-4 text-primary" aria-hidden /> Structured report
                                </CardTitle>
                                <SaveIndicator state={signed ? 'idle' : saveState} signed={signed} />
                            </div>

                            {/* Status stepper rail */}
                            <div className="mt-3">
                                <ol className="flex items-center gap-1" aria-label="Report status">
                                    {STEPPER.map((step, i) => {
                                        const done = currentStepIdx > i || (currentStepIdx === i && step === 'SIGNED');
                                        const current = currentStepIdx === i;
                                        return (
                                            <React.Fragment key={step}>
                                                {i > 0 && (
                                                    <span className={cn('h-0.5 flex-1 rounded-full', currentStepIdx >= i ? 'bg-primary' : 'bg-muted')} aria-hidden />
                                                )}
                                                <li
                                                    className={cn(
                                                        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                                        current ? 'bg-primary text-primary-foreground'
                                                            : done ? 'bg-primary/15 text-primary'
                                                                : 'bg-muted text-muted-foreground'
                                                    )}
                                                    aria-current={current ? 'step' : undefined}
                                                >
                                                    {step.replace('_', ' ')}
                                                </li>
                                            </React.Fragment>
                                        );
                                    })}
                                </ol>
                                {!signed && (
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        {unassigned ? (
                                            <Button size="sm" loading={claim.isPending} onClick={() => claim.mutate()}>
                                                Claim & start reading <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                                            </Button>
                                        ) : nextStatus === 'SIGNED' ? (
                                            <Button size="sm" onClick={() => setSignOpen(true)}>
                                                <FileSignature className="h-4 w-4" aria-hidden /> Sign report
                                            </Button>
                                        ) : nextStatus ? (
                                            <Button
                                                size="sm" variant="outline"
                                                loading={advance.isPending}
                                                onClick={() => advance.mutate(nextStatus)}
                                            >
                                                Advance to {nextStatus.replace('_', ' ')} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                                            </Button>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* Signed banner */}
                            {signed && study.report?.signatureHash && (
                                <div className="rounded-xl border border-success/30 bg-success-soft p-3">
                                    <p className="flex items-center gap-1.5 text-sm font-semibold text-success">
                                        <ShieldCheck className="h-4 w-4" aria-hidden /> Signed & immutable
                                    </p>
                                    <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{study.report.signatureHash}</p>
                                    <p className="text-xs text-muted-foreground">Signed {formatWhen(study.report.signedAt || study.tat?.signedAt)}</p>
                                    <Button size="sm" variant="outline" className="mt-2" onClick={() => setAddendumOpen(true)}>
                                        <FilePlus2 className="h-4 w-4" aria-hidden /> Add Addendum
                                    </Button>
                                </div>
                            )}

                            {/* Template picker — inserts only on explicit click */}
                            {!signed && (
                                <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <Label htmlFor="tpl-select">Template</Label>
                                        <Select id="tpl-select" className="h-9" value={templateKey} onChange={(e) => setTemplateKey(e.target.value)}>
                                            <option value="">Choose a template…</option>
                                            {REPORT_TEMPLATES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                                        </Select>
                                    </div>
                                    <Button variant="secondary" size="sm" className="h-9" disabled={!templateKey} onClick={applyTemplate}>
                                        Insert
                                    </Button>
                                </div>
                            )}

                            {SECTION_DEFS.map((def) => (
                                <div key={def.key}>
                                    <Label htmlFor={`sect-${def.key}`} className="flex items-center justify-between">
                                        <span>
                                            {def.label}
                                            {def.key === 'impression' && <span className="ml-1 text-danger" title="Required to sign">*</span>}
                                        </span>
                                        <kbd className="rounded border border-border bg-muted px-1 text-[10px] font-mono text-subtle-foreground">{def.shortcut}</kbd>
                                    </Label>
                                    <Textarea
                                        id={`sect-${def.key}`}
                                        ref={(el) => { sectionRefs.current[def.key] = el; }}
                                        rows={def.rows}
                                        className="min-h-0 text-sm leading-relaxed"
                                        value={sections[def.key] ?? ''}
                                        readOnly={signed}
                                        placeholder={signed ? '—' : `${def.label}…`}
                                        onChange={(e) => setSection(def.key, e.target.value)}
                                    />
                                </div>
                            ))}

                            {/* Addendum history */}
                            {(study.report?.versions?.length ?? 0) > 0 && (
                                <div className="rounded-xl border border-border bg-muted/40 p-3">
                                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                                        <History className="h-3.5 w-3.5" aria-hidden /> Addenda & versions
                                    </p>
                                    <ul className="space-y-2">
                                        {study.report!.versions!.map((v, i) => (
                                            <li key={i} className="text-xs">
                                                <span className="font-semibold text-foreground">v{v.versionNumber ?? i + 1}</span>
                                                {v.reason && <span className="text-muted-foreground"> — {v.reason}</span>}
                                                <span className="text-subtle-foreground"> · {formatWhen(v.createdAt)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* AI copilot */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Sparkles className="h-4 w-4 text-primary" aria-hidden /> AI triage copilot
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                {aiAvailable
                                    ? 'Claude AI — radiologist review required; AI never signs reports.'
                                    : 'AI triage — radiologist review required; AI never signs reports.'}
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Claude report drafting — only when the AI service is live */}
                            {aiAvailable && !signed && (
                                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">Draft report with AI</p>
                                            <p className="text-xs text-muted-foreground">
                                                Claude drafts all five sections from the study metadata and triage flags.
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            loading={aiDraftMutation.isPending}
                                            onClick={() => aiDraftMutation.mutate()}
                                        >
                                            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Draft report with AI
                                        </Button>
                                    </div>
                                    {aiDraft && (
                                        <div className="mt-3 space-y-2">
                                            {SECTION_DEFS.map((def) => {
                                                const value = aiDraft[def.key]?.trim();
                                                if (!value) return null;
                                                return (
                                                    <div key={def.key} className="rounded-lg border border-border bg-card p-2.5">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-[11px] font-bold uppercase tracking-wide text-subtle-foreground">{def.label}</p>
                                                            <Button
                                                                size="sm" variant="outline" className="h-6 px-2 text-[11px]"
                                                                onClick={() => insertAiDraftSection(def.key)}
                                                            >
                                                                Insert
                                                            </Button>
                                                        </div>
                                                        <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{value}</p>
                                                    </div>
                                                );
                                            })}
                                            <div className="flex items-center justify-between gap-2 pt-1">
                                                <p className="text-[11px] text-subtle-foreground">
                                                    Drafted by Claude — verify against the images before signing.
                                                </p>
                                                <Button size="sm" variant="secondary" onClick={insertAiDraftIntoEmpty}>
                                                    Insert draft (empty sections only)
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {(study.aiTriage?.findings?.length ?? 0) === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {study.aiTriage?.processed ? 'AI triage processed — no findings flagged.' : 'AI triage has not processed this study yet.'}
                                </p>
                            ) : (
                                study.aiTriage!.findings!.map((f, i) => {
                                    const pct = Math.round((f.confidence ?? 0) * 100);
                                    const urgencyTone = f.urgency === 'critical' ? 'danger' : f.urgency === 'high' ? 'warning' : 'info';
                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: i * 0.05 }}
                                            className="rounded-xl border border-border bg-muted/30 p-3"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <p className="text-sm font-semibold text-foreground">{f.finding}</p>
                                                <div className="flex items-center gap-2">
                                                    <Badge tone={urgencyTone}>{f.urgency ?? 'info'}</Badge>
                                                    <span className="text-xs font-bold tabular-nums text-foreground">{pct}%</span>
                                                </div>
                                            </div>
                                            {f.reason && <p className="mt-1 text-xs text-muted-foreground">{f.reason}</p>}
                                            <Button
                                                size="sm" variant="outline" className="mt-2"
                                                disabled={signed}
                                                onClick={() => insertAiFinding(f.finding, f.confidence ?? 0, f.reason)}
                                            >
                                                Insert into findings
                                            </Button>
                                        </motion.div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>

            {/* ───────── Bottom strip: priors / timeline / critical comms ───────── */}
            <Card>
                <CardContent className="pt-4">
                    <Tabs defaultValue="timeline">
                        <TabsList>
                            <TabsTrigger value="priors">Priors ({priors.length})</TabsTrigger>
                            <TabsTrigger value="timeline">TAT timeline</TabsTrigger>
                            <TabsTrigger value="critical">Critical comms</TabsTrigger>
                        </TabsList>

                        <TabsContent value="priors" className="pt-4">
                            {priors.length === 0 ? (
                                <EmptyState
                                    icon={History}
                                    title="No prior studies on file"
                                    description="No other studies for this patient are on the current worklist."
                                />
                            ) : (
                                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {priors.map((p) => (
                                        <li key={p._id}>
                                            <Link
                                                href={`/teleradiology/workspace/${p._id}`}
                                                className="block rounded-xl border border-border bg-muted/30 p-3 transition-colors hover:bg-muted"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-mono text-xs font-semibold text-foreground">{p.accessionNumber}</span>
                                                    <StatusBadge status={p.status} />
                                                </div>
                                                <p className="mt-1 text-sm text-muted-foreground">{p.modality} · {p.bodyPart || '—'}</p>
                                                <p className="text-xs text-subtle-foreground">{formatWhen(p.tat?.orderedAt)}</p>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </TabsContent>

                        <TabsContent value="timeline" className="pt-4">
                            <Timeline>
                                {([
                                    ['Ordered', study.tat?.orderedAt, Timer, 'neutral'],
                                    ['Received from scanner', study.tat?.receivedAt, Layers, 'neutral'],
                                    ['Assigned', study.tat?.assignedAt, Stethoscope, 'brand'],
                                    ['Opened by radiologist', study.tat?.openedAt, ZoomIn, 'brand'],
                                    ['Report started', study.tat?.reportStartedAt, PenLine, 'brand'],
                                    ['Signed', study.tat?.signedAt, FileSignature, 'success'],
                                    ['Delivered', study.tat?.deliveredAt, CheckCircle2, 'success'],
                                ] as const)
                                    .filter(([, at]) => Boolean(at))
                                    .map(([label, at, Icon, tone]) => (
                                        <TimelineItem key={label} icon={Icon} tone={tone} title={label} meta={formatWhen(at)} />
                                    ))}
                            </Timeline>
                            {!study.tat?.orderedAt && (
                                <p className="text-sm text-muted-foreground">No timing milestones recorded yet.</p>
                            )}
                        </TabsContent>

                        <TabsContent value="critical" className="pt-4">
                            {cf?.flagged ? (
                                <div className="space-y-3">
                                    <div className={cn('rounded-xl border p-4', cf.acknowledgedAt ? 'border-success/30 bg-success-soft' : 'border-danger/40 bg-danger-soft')}>
                                        <p className={cn('flex items-center gap-1.5 text-sm font-semibold', cf.acknowledgedAt ? 'text-success' : 'text-danger')}>
                                            <Siren className="h-4 w-4" aria-hidden />
                                            {cf.acknowledgedAt ? 'Closed-loop communication complete' : 'Open critical finding'}
                                        </p>
                                        <p className="mt-1 text-sm text-foreground">{cf.description || '—'}</p>
                                        {cf.acknowledgedAt
                                            ? <p className="mt-1 text-xs text-muted-foreground">Acknowledged {formatWhen(cf.acknowledgedAt)}</p>
                                            : (
                                                <Button size="sm" variant="outline" className="mt-2" loading={ack.isPending} onClick={() => ack.mutate()}>
                                                    <CheckCircle2 className="h-4 w-4" aria-hidden /> Acknowledge receipt
                                                </Button>
                                            )}
                                    </div>
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Siren}
                                    title="No critical finding flagged"
                                    description="Use Flag Critical to open a closed-loop notification to the referring team."
                                    action={{ label: 'Flag Critical', onClick: () => setCriticalOpen(true) }}
                                />
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* ───────── Sign dialog ───────── */}
            <Dialog
                open={signOpen}
                onClose={() => setSignOpen(false)}
                title="Sign report"
                description="Signing is final — the report becomes immutable and any later change requires an addendum."
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setSignOpen(false)}>Cancel</Button>
                        <Button
                            loading={sign.isPending}
                            disabled={!sections.impression?.trim()}
                            onClick={() => sign.mutate()}
                        >
                            <FileSignature className="h-4 w-4" aria-hidden /> Sign & lock
                        </Button>
                    </>
                }
            >
                {!sections.impression?.trim() ? (
                    <div className="rounded-xl border border-danger/40 bg-danger-soft p-3 text-sm text-danger">
                        <AlertTriangle className="mr-1.5 inline h-4 w-4" aria-hidden />
                        The Impression section is empty. An impression is required before signing.
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Impression to be signed</p>
                            <p className="mt-1 whitespace-pre-wrap rounded-xl border border-border bg-muted/40 p-3 text-sm text-foreground">
                                {sections.impression}
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            A cryptographic signature hash will be generated and attached to this report version.
                        </p>
                    </div>
                )}
            </Dialog>

            {/* ───────── Addendum dialog ───────── */}
            <Dialog
                open={addendumOpen}
                onClose={() => setAddendumOpen(false)}
                title="Add addendum"
                description="Addenda are appended to the signed report — the original remains unchanged."
                size="lg"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setAddendumOpen(false)}>Cancel</Button>
                        <Button
                            loading={addendum.isPending}
                            disabled={!addendumReason.trim() || !(addendumSections.findings?.trim() || addendumSections.impression?.trim())}
                            onClick={() => addendum.mutate()}
                        >
                            <FilePlus2 className="h-4 w-4" aria-hidden /> Record addendum
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="addendum-reason">Reason for addendum</Label>
                        <Textarea
                            id="addendum-reason" rows={2} className="min-h-0"
                            placeholder="e.g. Additional finding identified on second review…"
                            value={addendumReason}
                            onChange={(e) => setAddendumReason(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label htmlFor="addendum-findings">Addendum findings</Label>
                        <Textarea
                            id="addendum-findings" rows={4} className="min-h-0"
                            value={addendumSections.findings ?? ''}
                            onChange={(e) => setAddendumSections((p) => ({ ...p, findings: e.target.value }))}
                        />
                    </div>
                    <div>
                        <Label htmlFor="addendum-impression">Addendum impression</Label>
                        <Textarea
                            id="addendum-impression" rows={3} className="min-h-0"
                            value={addendumSections.impression ?? ''}
                            onChange={(e) => setAddendumSections((p) => ({ ...p, impression: e.target.value }))}
                        />
                    </div>
                </div>
            </Dialog>

            {/* ───────── Critical finding dialog ───────── */}
            <Dialog
                open={criticalOpen}
                onClose={() => setCriticalOpen(false)}
                title="Flag critical finding"
                description="This opens a closed-loop critical results notification to the referring clinician."
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setCriticalOpen(false)}>Cancel</Button>
                        <Button
                            variant="danger"
                            loading={critical.isPending}
                            disabled={!criticalDesc.trim()}
                            onClick={() => critical.mutate()}
                        >
                            <Siren className="h-4 w-4" aria-hidden /> Flag critical
                        </Button>
                    </>
                }
            >
                <Label htmlFor="critical-desc">Describe the critical finding</Label>
                <Textarea
                    id="critical-desc" rows={3} className="min-h-0"
                    placeholder="e.g. Acute intracranial hemorrhage with midline shift — verbal report required…"
                    value={criticalDesc}
                    onChange={(e) => setCriticalDesc(e.target.value)}
                />
            </Dialog>
        </div>
    );
}

/* ───────────────────────── Saved indicator ───────────────────────── */

function SaveIndicator({ state, signed }: { state: 'idle' | 'dirty' | 'saving' | 'saved' | 'error'; signed: boolean }) {
    if (signed) return <Badge tone="success">Signed — read only</Badge>;
    switch (state) {
        case 'saving': return <Badge tone="info" dot pulse>Saving…</Badge>;
        case 'saved': return <Badge tone="success" dot>Draft saved</Badge>;
        case 'dirty': return <Badge tone="warning" dot>Unsaved changes</Badge>;
        case 'error': return <Badge tone="danger" dot>Save failed</Badge>;
        default: return <Badge tone="outline">Draft</Badge>;
    }
}
