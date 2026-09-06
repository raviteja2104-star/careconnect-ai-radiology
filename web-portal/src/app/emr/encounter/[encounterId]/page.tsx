'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    CheckCircle2, Loader2, PenLine, ShieldCheck, FileSignature, Plus, WifiOff,
    Stethoscope, AlertCircle,
} from 'lucide-react';
import {
    PageHeader, Badge, Button, Card, CardHeader, CardTitle, CardDescription, CardContent,
    Tabs, TabsList, TabsTrigger, Input, Textarea, Select, Label, Switch, Dialog,
    Skeleton, SkeletonCard, ErrorState,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { usePermissions } from '@/contexts/PermissionContext';
import {
    fetchEncounterBundle, fetchPatient360, putNote, signNote, amendNote, postDiagnosis,
    postVitals, patientDisplayName, ApiOfflineError,
    type NoteFormat, type NoteSections, type ClinicalNoteRecord, type DiagnosisEntry,
    type VitalsEntry,
} from '../../_lib/api';
import { ContextRail } from './context-rail';
import { OrdersPanel, type OrderPanelTab } from './orders-panel';
import { CopilotRail } from './copilot-rail';
import { SuggestInput } from '../../_components/SuggestInput';

/* ── Section catalogs per note format ── */

const HISTORY_SECTIONS: [keyof NoteSections, string][] = [
    ['chiefComplaint', 'Chief Complaint'],
    ['historyOfPresentIllness', 'History of Present Illness'],
    ['pastMedicalHistory', 'Past Medical History'],
    ['pastSurgicalHistory', 'Past Surgical History'],
    ['familyHistory', 'Family History'],
    ['socialHistory', 'Social History'],
    ['physicalExamination', 'Physical Examination'],
];

const FORMAT_SECTIONS: Record<Exclude<NoteFormat, 'CUSTOM'>, [keyof NoteSections, string][]> = {
    SOAP: [
        ['subjective', 'Subjective'],
        ['objective', 'Objective'],
        ['assessment', 'Assessment'],
        ['plan', 'Plan'],
    ],
    DAP: [
        ['data', 'Data'],
        ['assessment', 'Assessment'],
        ['plan', 'Plan'],
    ],
    BIRP: [
        ['behavior', 'Behavior'],
        ['intervention', 'Intervention'],
        ['response', 'Response'],
        ['plan', 'Plan'],
    ],
};

type SaveState = 'idle' | 'saving' | 'saved' | 'local' | 'error';

async function sha256Hex(text: string): Promise<string> {
    try {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
        return 'local-signature';
    }
}

export default function EncounterWorkspacePage({ params }: { params: Promise<{ encounterId: string }> }) {
    return (
        <React.Suspense fallback={<WorkspaceSkeleton />}>
            <EncounterWorkspace params={params} />
        </React.Suspense>
    );
}

function EncounterWorkspace({ params }: { params: Promise<{ encounterId: string }> }) {
    const { encounterId } = React.use(params);
    const searchParams = useSearchParams();
    const initialPanel = (searchParams.get('panel') as OrderPanelTab | null) || undefined;
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { hasPermission } = usePermissions();
    const canSignNote = hasPermission('DOCTOR.SIGN_CLINICAL_NOTES');

    const qBundle = useQuery({
        queryKey: ['emr', 'encounter', encounterId],
        queryFn: () => fetchEncounterBundle(encounterId),
    });

    const bundle = qBundle.data?.data;
    const demo = Boolean(qBundle.data?.demo);
    const encounter = bundle?.encounter;
    const patientId = typeof encounter?.patientId === 'object' ? encounter.patientId._id : encounter?.patientId;

    const q360 = useQuery({
        queryKey: ['emr', '360', patientId],
        queryFn: () => fetchPatient360(patientId as string),
        enabled: Boolean(patientId),
    });
    const p360 = q360.data?.data;
    const patientName = patientDisplayName(p360?.patient) || (typeof encounter?.patientId === 'object' ? encounter?.patientId.name : undefined) || 'Patient';

    /* ── Note state ── */
    const [format, setFormat] = React.useState<NoteFormat>('SOAP');
    const [sections, setSections] = React.useState<NoteSections>({});
    const [note, setNote] = React.useState<ClinicalNoteRecord | null>(null);
    const [saveState, setSaveState] = React.useState<SaveState>('idle');
    const [savedAt, setSavedAt] = React.useState<Date | null>(null);
    const [dirty, setDirty] = React.useState(false);
    const [hydratedFor, setHydratedFor] = React.useState<string | null>(null);

    // Hydrate the editor from the latest server note, once per encounter
    // (state adjustment during render — avoids an effect-driven double render).
    if (bundle && hydratedFor !== encounterId) {
        setHydratedFor(encounterId);
        const latest = bundle.notes[0] ?? null;
        if (latest) {
            setNote(latest);
            setFormat(latest.format || 'SOAP');
            setSections(latest.sections || {});
        } else {
            setSections({ chiefComplaint: bundle.encounter.chiefComplaint || '' });
        }
    }

    const isSigned = note?.status === 'signed';

    const updateSection = (key: keyof NoteSections, value: string) => {
        if (isSigned) return;
        setSections((s) => ({ ...s, [key]: value }));
        setDirty(true);
    };

    /** Append copilot-drafted content into sections — only via the explicit Insert button. */
    const insertSections = React.useCallback((incoming: NoteSections) => {
        if (note?.status === 'signed') {
            toast('warning', 'Note is signed', 'Amend the note before inserting drafted content.');
            return;
        }
        setSections((prev) => {
            const next = { ...prev };
            (Object.keys(incoming) as (keyof NoteSections)[]).forEach((k) => {
                const add = incoming[k];
                if (!add) return;
                next[k] = prev[k] ? `${prev[k]}\n\n${add}` : add;
            });
            return next;
        });
        setDirty(true);
        toast('success', 'Inserted into note', 'Drafted content appended to the relevant sections.');
    }, [note?.status, toast]);

    /* ── Debounced autosave (1.5s after the last edit) ── */
    React.useEffect(() => {
        if (!dirty || isSigned || !encounter) return;
        const timer = setTimeout(async () => {
            setSaveState('saving');
            try {
                const saved = await putNote(encounterId, { format, sections });
                setNote(saved);
                setSaveState('saved');
                setSavedAt(new Date());
                setDirty(false);
            } catch (err) {
                if (err instanceof ApiOfflineError) {
                    // Honest local fallback — clearly labelled, never presented as a server save.
                    setNote((prev) => ({
                        _id: prev?._id || 'local-draft',
                        encounterId,
                        format,
                        sections,
                        version: prev?.version || 1,
                        status: 'draft',
                    }));
                    setSaveState('local');
                    setSavedAt(new Date());
                    setDirty(false);
                } else {
                    setSaveState('error');
                }
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [dirty, sections, format, isSigned, encounter, encounterId]);

    /* ── Sign / amend ── */
    const [signOpen, setSignOpen] = React.useState(false);
    const [signing, setSigning] = React.useState(false);
    const [amendOpen, setAmendOpen] = React.useState(false);
    const [amendReason, setAmendReason] = React.useState('');
    const [amending, setAmending] = React.useState(false);

    const handleSign = async () => {
        setSigning(true);
        try {
            // Flush the draft first so the server signs the current content.
            let current = note;
            try {
                current = await putNote(encounterId, { format, sections });
                setNote(current);
            } catch (err) {
                if (!(err instanceof ApiOfflineError)) throw err;
                current = null; // offline — sign locally below
            }
            if (current && current._id !== 'local-draft') {
                const signed = await signNote(current._id);
                setNote(signed);
                toast('success', 'Note signed', 'The clinical note is now immutable.');
            } else {
                const hash = await sha256Hex(JSON.stringify(sections));
                setNote((prev) => ({
                    _id: prev?._id || 'local-draft',
                    encounterId,
                    format,
                    sections,
                    version: prev?.version || 1,
                    status: 'signed',
                    signedAt: new Date().toISOString(),
                    signatureHash: hash,
                }));
                toast('info', 'Signed locally (demo)', 'Backend offline — signature recorded locally only.');
            }
            setDirty(false);
            setSignOpen(false);
            queryClient.invalidateQueries({ queryKey: ['emr', 'encounter', encounterId] });
        } catch (err) {
            toast('error', 'Failed to sign note', err instanceof Error ? err.message : undefined);
        } finally {
            setSigning(false);
        }
    };

    const handleAmend = async () => {
        if (!amendReason.trim() || !note) return;
        setAmending(true);
        try {
            if (note._id !== 'local-draft' && !demo) {
                const draft = await amendNote(note._id, { reason: amendReason.trim() });
                setNote(draft);
                setSections(draft.sections || sections);
                toast('success', 'Amendment draft created', `Version ${draft.version} is now editable.`);
            } else {
                setNote((prev) => prev ? { ...prev, status: 'draft', version: prev.version + 1, signatureHash: undefined, signedAt: undefined } : prev);
                toast('info', 'Amended locally (demo)', 'Backend offline — new draft version created locally.');
            }
            setAmendOpen(false);
            setAmendReason('');
            queryClient.invalidateQueries({ queryKey: ['emr', 'encounter', encounterId] });
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                setNote((prev) => prev ? { ...prev, status: 'draft', version: prev.version + 1, signatureHash: undefined, signedAt: undefined } : prev);
                setAmendOpen(false);
                setAmendReason('');
                toast('info', 'Amended locally (demo)', 'Backend offline — new draft version created locally.');
            } else {
                toast('error', 'Failed to amend note', err instanceof Error ? err.message : undefined);
            }
        } finally {
            setAmending(false);
        }
    };

    /* ── Diagnoses ── */
    const [dxTerm, setDxTerm] = React.useState('');
    const [dxCode, setDxCode] = React.useState<string | undefined>(undefined);
    const [dxType, setDxType] = React.useState<'provisional' | 'differential' | 'confirmed' | 'ruled_out'>('provisional');
    const [dxPrimary, setDxPrimary] = React.useState(false);
    const [dxSaving, setDxSaving] = React.useState(false);
    const [localDx, setLocalDx] = React.useState<DiagnosisEntry[]>([]);
    const diagnoses = React.useMemo(
        () => [...(encounter?.diagnoses || []), ...localDx],
        [encounter?.diagnoses, localDx]
    );

    const handleAddDiagnosis = async () => {
        if (!dxTerm.trim()) return;
        setDxSaving(true);
        const body = { term: dxTerm.trim(), type: dxType, isPrimary: dxPrimary, ...(dxCode ? { code: dxCode } : {}) };
        try {
            await postDiagnosis(encounterId, body);
            queryClient.invalidateQueries({ queryKey: ['emr', 'encounter', encounterId] });
            toast('success', 'Diagnosis added', body.term);
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                setLocalDx((d) => [...d, { ...body, _id: `local-${Date.now()}`, notedAt: new Date().toISOString() }]);
                toast('info', 'Added locally (demo)', 'Backend offline — diagnosis recorded locally only.');
            } else {
                toast('error', 'Failed to add diagnosis', err instanceof Error ? err.message : undefined);
            }
        } finally {
            setDxTerm('');
            setDxCode(undefined);
            setDxPrimary(false);
            setDxSaving(false);
        }
    };

    /* ── Vitals (form lives in the context rail) ── */
    const [localVitals, setLocalVitals] = React.useState<VitalsEntry[]>([]);
    const vitals = React.useMemo(
        () => [...localVitals, ...(encounter?.vitals || [])],
        [encounter?.vitals, localVitals]
    );
    const submitVitals = async (v: VitalsEntry) => {
        try {
            await postVitals(encounterId, v);
            queryClient.invalidateQueries({ queryKey: ['emr', 'encounter', encounterId] });
            toast('success', 'Vitals recorded');
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                setLocalVitals((list) => [{ ...v, recordedAt: new Date().toISOString(), _id: `local-${Date.now()}` }, ...list]);
                toast('info', 'Recorded locally (demo)', 'Backend offline — vitals stored locally only.');
            } else {
                toast('error', 'Failed to record vitals', err instanceof Error ? err.message : undefined);
                throw err;
            }
        }
    };

    /* ── Render ── */

    if (qBundle.isLoading) return <WorkspaceSkeleton />;
    if (qBundle.isError || !bundle || !encounter) {
        return (
            <div className="space-y-6">
                <PageHeader title="Encounter Workspace" crumbs={[{ label: 'Clinical', href: '/dashboard' }, { label: 'EMR', href: '/emr' }, { label: 'Encounter' }]} />
                <ErrorState onRetry={() => qBundle.refetch()} />
            </div>
        );
    }

    const activeSections = FORMAT_SECTIONS[(format === 'CUSTOM' ? 'SOAP' : format) as Exclude<NoteFormat, 'CUSTOM'>];

    const saveIndicator = (
        <span aria-live="polite" className="flex items-center gap-1.5 text-xs font-semibold">
            {saveState === 'saving' && (
                <span className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Saving…</span>
            )}
            {saveState === 'saved' && savedAt && (
                <span className="flex items-center gap-1.5 text-success"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Saved {savedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            )}
            {saveState === 'local' && savedAt && (
                <span className="flex items-center gap-1.5 text-warning"><WifiOff className="h-3.5 w-3.5" aria-hidden /> Saved locally {savedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            )}
            {saveState === 'error' && (
                <span className="flex items-center gap-1.5 text-danger"><AlertCircle className="h-3.5 w-3.5" aria-hidden /> Save failed — retrying on next edit</span>
            )}
        </span>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Clinical Encounter Workspace"
                description={`${(encounter.type || 'opd').toUpperCase()} · ${encounter.specialty || 'General Medicine'} · ${patientName}`}
                crumbs={[
                    { label: 'Clinical', href: '/dashboard' },
                    { label: 'EMR', href: '/emr' },
                    { label: patientName, href: patientId ? `/emr/patients/${patientId}` : undefined },
                    { label: 'Encounter' },
                ]}
                actions={
                    <div className="flex flex-wrap items-center gap-3">
                        {saveIndicator}
                        {demo && (
                            <Badge tone="warning" dot pulse>
                                <WifiOff className="h-3 w-3" aria-hidden /> Demo data — backend offline
                            </Badge>
                        )}
                        <Badge tone={encounter.status === 'signed' ? 'success' : 'info'} className="uppercase">{encounter.status || 'open'}</Badge>
                    </div>
                }
            />

            {/* Three-pane workspace: context rail | documentation | copilot. Stacks on mobile. */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                {/* ── LEFT: patient context ── */}
                <div className="space-y-6 xl:col-span-3">
                    <ContextRail
                        encounter={encounter}
                        p360={p360}
                        diagnoses={diagnoses}
                        vitals={vitals}
                        onSubmitVitals={submitVitals}
                    />
                </div>

                {/* ── CENTER: documentation + orders ── */}
                <div className="space-y-6 xl:col-span-6">
                    <Card className="animate-fade-up">
                        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <PenLine className="h-4 w-4 text-primary" aria-hidden /> Clinical Documentation
                                    {note && <Badge tone="outline" className="text-[10px]">v{note.version}</Badge>}
                                </CardTitle>
                                <CardDescription>Structured note with autosave — drafts persist every 1.5s.</CardDescription>
                            </div>
                            <Tabs value={format} onValueChange={(v) => { if (!isSigned) { setFormat(v as NoteFormat); setDirty(true); } }}>
                                <TabsList aria-label="Note format">
                                    <TabsTrigger value="SOAP" disabled={isSigned}>SOAP</TabsTrigger>
                                    <TabsTrigger value="DAP" disabled={isSigned}>DAP</TabsTrigger>
                                    <TabsTrigger value="BIRP" disabled={isSigned}>BIRP</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {isSigned && (
                                <div className="flex flex-col gap-3 rounded-2xl border border-success/30 bg-success-soft p-4 sm:flex-row sm:items-center sm:justify-between" role="status">
                                    <div className="flex items-start gap-3">
                                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
                                        <div>
                                            <p className="text-sm font-semibold text-success">Signed &amp; immutable</p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {note?.signedAt ? new Date(note.signedAt).toLocaleString('en-IN') : ''}
                                                {note?.signatureHash && (
                                                    <span className="mt-0.5 block break-all font-mono text-[10px]">SHA-256 {note.signatureHash}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setAmendOpen(true)}>
                                        <PenLine className="h-3.5 w-3.5" aria-hidden /> Amend
                                    </Button>
                                </div>
                            )}

                            {/* History sections */}
                            <fieldset disabled={isSigned} className="space-y-4">
                                <legend className="sr-only">History and examination sections</legend>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {HISTORY_SECTIONS.map(([key, label]) => (
                                        <div key={key} className={key === 'chiefComplaint' || key === 'historyOfPresentIllness' || key === 'physicalExamination' ? 'md:col-span-2' : ''}>
                                            <Label htmlFor={`note-${key}`}>{label}</Label>
                                            {key === 'chiefComplaint' ? (
                                                <SuggestInput
                                                    id={`note-${key}`}
                                                    kind="complaint"
                                                    commaSeparated
                                                    value={sections[key] as string || ''}
                                                    onChange={(v) => updateSection(key, v)}
                                                    placeholder="Start typing — e.g. Fe… → Fever (comma-separate multiple)"
                                                />
                                            ) : (
                                                <Textarea
                                                    id={`note-${key}`}
                                                    value={sections[key] as string || ''}
                                                    onChange={(e) => updateSection(key, e.target.value)}
                                                    placeholder={`${label}…`}
                                                    className="min-h-20"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-border pt-4">
                                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-subtle-foreground">{format} Sections</h4>
                                    <div className="space-y-4">
                                        {activeSections.map(([key, label]) => (
                                            <div key={key}>
                                                <Label htmlFor={`note-${key}`}>{label}</Label>
                                                <Textarea
                                                    id={`note-${key}`}
                                                    value={sections[key] as string || ''}
                                                    onChange={(e) => updateSection(key, e.target.value)}
                                                    placeholder={`${label}…`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </fieldset>

                            {/* Diagnosis adder */}
                            <div className="rounded-2xl border border-border bg-muted/40 p-4">
                                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <Stethoscope className="h-4 w-4 text-primary" aria-hidden /> Diagnoses
                                </h4>
                                {diagnoses.length > 0 && (
                                    <div className="mb-3 flex flex-wrap gap-1.5">
                                        {diagnoses.map((dx, i) => (
                                            <Badge key={dx._id || i} tone={dx.isPrimary ? 'brand' : dx.type === 'confirmed' ? 'success' : 'neutral'}>
                                                {dx.term}{dx.isPrimary ? ' · primary' : ''}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-end">
                                    <div>
                                        <Label htmlFor="dx-term">Diagnosis term{dxCode ? ` · ICD-10 ${dxCode}` : ''}</Label>
                                        <SuggestInput
                                            id="dx-term"
                                            kind="diagnosis"
                                            value={dxTerm}
                                            onChange={(v) => { setDxTerm(v); setDxCode(undefined); }}
                                            onSelect={(item) => setDxCode(item.code)}
                                            placeholder="Start typing — e.g. hyp… → Essential hypertension (I10)"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="dx-type">Type</Label>
                                        <Select id="dx-type" value={dxType} onChange={(e) => setDxType(e.target.value as typeof dxType)}>
                                            <option value="provisional">Provisional</option>
                                            <option value="differential">Differential</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="ruled_out">Ruled out</option>
                                        </Select>
                                    </div>
                                    <div className="flex items-center gap-2 pb-2.5">
                                        <Switch checked={dxPrimary} onCheckedChange={setDxPrimary} label="Mark as primary diagnosis" />
                                        <span className="text-xs font-medium text-muted-foreground">Primary</span>
                                    </div>
                                    <Button variant="secondary" onClick={handleAddDiagnosis} disabled={!dxTerm.trim()} loading={dxSaving}>
                                        <Plus className="h-4 w-4" aria-hidden /> Add
                                    </Button>
                                </div>
                            </div>

                            {/* Sign */}
                            {!isSigned && (
                                <div className="flex flex-col items-stretch gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs text-muted-foreground">
                                        Signing locks this note permanently. Corrections after signing require a formal amendment.
                                    </p>
                                    <Button
                                        size="lg"
                                        onClick={() => setSignOpen(true)}
                                        disabled={!canSignNote}
                                        title={canSignNote ? undefined : 'You do not have permission to sign clinical notes'}
                                    >
                                        <FileSignature className="h-4 w-4" aria-hidden /> Sign Note
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── Orders ── */}
                    <OrdersPanel
                        encounterId={encounterId}
                        serverOrders={bundle.orders}
                        initialTab={initialPanel}
                        allergies={p360?.patient.allergies || []}
                        currentMedications={(p360?.activeMedications || []).map((m) => m.name || '').filter(Boolean)}
                        diagnoses={diagnoses.map((d) => d.term).filter(Boolean)}
                        patientMeta={{
                            age: p360?.patient.dateOfBirth
                                ? Math.floor((Date.now() - new Date(p360.patient.dateOfBirth).getTime()) / 31557600000)
                                : undefined,
                            gender: p360?.patient.gender,
                        }}
                        onChanged={() => queryClient.invalidateQueries({ queryKey: ['emr', 'encounter', encounterId] })}
                    />
                </div>

                {/* ── RIGHT: AI copilot ── */}
                <div className="xl:col-span-3">
                    <CopilotRail
                        encounter={encounter}
                        p360={p360}
                        vitals={vitals}
                        diagnoses={diagnoses}
                        noteFormat={format}
                        insertSections={insertSections}
                    />
                </div>
            </div>

            {/* ── Sign confirmation ── */}
            <Dialog
                open={signOpen}
                onClose={() => setSignOpen(false)}
                title="Sign clinical note?"
                description="Signed notes are immutable and become part of the permanent medical record."
                footer={
                    <>
                        <Button variant="outline" onClick={() => setSignOpen(false)}>Cancel</Button>
                        <Button onClick={handleSign} loading={signing} disabled={!canSignNote}>
                            <FileSignature className="h-4 w-4" aria-hidden /> Sign &amp; Lock
                        </Button>
                    </>
                }
            >
                <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                        You are signing the <strong className="text-foreground">{format}</strong> note
                        {note ? <> (version {note.version})</> : null} for{' '}
                        <strong className="text-foreground">{patientName}</strong>.
                    </p>
                    <ul className="list-disc space-y-1 pl-5 text-xs">
                        <li>The content is hashed (SHA-256) and time-stamped as your electronic signature.</li>
                        <li>No further edits are possible — corrections require an amendment with a documented reason.</li>
                    </ul>
                </div>
            </Dialog>

            {/* ── Amend dialog ── */}
            <Dialog
                open={amendOpen}
                onClose={() => setAmendOpen(false)}
                title="Amend signed note"
                description="Creates a new draft version superseding the signed note. The reason is recorded in the audit trail."
                footer={
                    <>
                        <Button variant="outline" onClick={() => setAmendOpen(false)}>Cancel</Button>
                        <Button onClick={handleAmend} disabled={!amendReason.trim()} loading={amending}>
                            <PenLine className="h-4 w-4" aria-hidden /> Create Amendment
                        </Button>
                    </>
                }
            >
                <Label htmlFor="amend-reason">Reason for amendment</Label>
                <Textarea
                    id="amend-reason"
                    value={amendReason}
                    onChange={(e) => setAmendReason(e.target.value)}
                    placeholder="e.g. Correcting the documented dosage of Metformin after pharmacy clarification."
                />
            </Dialog>
        </div>
    );
}

/* ── Loading skeleton shaped like the three-pane workspace ── */
function WorkspaceSkeleton() {
    return (
        <div className="space-y-6" aria-busy="true" aria-label="Loading encounter workspace">
            <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-8 w-72" />
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                <div className="space-y-6 xl:col-span-3"><SkeletonCard /><SkeletonCard /></div>
                <div className="space-y-6 xl:col-span-6"><SkeletonCard /><SkeletonCard /></div>
                <div className="xl:col-span-3"><SkeletonCard /></div>
            </div>
        </div>
    );
}
