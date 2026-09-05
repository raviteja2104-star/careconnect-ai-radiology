'use client';

import * as React from 'react';
import {
    FlaskConical, ScanLine, Pill, ClipboardList, Plus, Trash2, ShieldAlert,
    AlertTriangle, MoreHorizontal, CheckCircle2, PlayCircle, XCircle, Hand,
} from 'lucide-react';
import {
    Badge, Button, Card, CardHeader, CardTitle, CardDescription, CardContent,
    Tabs, TabsList, TabsTrigger, TabsContent, Input, Textarea, Select, Label, Switch,
    Dialog, DataTable, Dropdown, DropdownItem, DropdownLabel, type Column,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
    postOrder, patchOrderStatus, demoScreenDrugs, ApiOfflineError, ApiHttpError, formatWhen,
    type ClinicalOrderRecord, type CreateOrderBody, type DrugLine, type SafetyFlag,
} from '../../_lib/api';
import { SuggestInput } from '../../_components/SuggestInput';
import { postAiMedicationSuggestions, type MedSuggestion, type MedSuggestionResponse } from '../../_lib/api';
import {
    Sparkles as IconAi, RefreshCcw as IconRefresh, Info as IconInfo,
    X as IconX, ShieldAlert as IconShield,
} from 'lucide-react';

export type OrderPanelTab = 'lab' | 'radiology' | 'medication' | 'list';

interface OrdersPanelProps {
    encounterId: string;
    serverOrders: ClinicalOrderRecord[];
    initialTab?: OrderPanelTab;
    allergies: string[];
    currentMedications: string[];
    /** Diagnosis terms entered on the encounter — drives AI med suggestions. */
    diagnoses?: string[];
    patientMeta?: { age?: number; gender?: string };
    onChanged: () => void;
}

const COMMON_LAB_TESTS = [
    'Complete Blood Count (CBC)', 'Lipid Profile', 'HbA1c', 'Liver Function Test',
    'Kidney Function Test', 'Serum Electrolytes', 'Thyroid Profile', 'Troponin I',
    'CRP', 'Urinalysis',
];

const EMPTY_DRUG: DrugLine = {
    name: '', dose: '', frequency: '1-0-1 (BID)', route: 'Oral', duration: '',
    instructions: '', foodTiming: 'after food', prn: false,
};

const PRIORITY_TONE: Record<string, 'danger' | 'warning' | 'neutral'> = {
    emergency: 'danger', stat: 'danger', urgent: 'warning', routine: 'neutral',
};

const STATUS_TONE: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
    completed: 'success', in_progress: 'info', acknowledged: 'warning', ordered: 'info', cancelled: 'danger',
};

export function OrdersPanel({
    encounterId, serverOrders, initialTab, allergies, currentMedications,
    diagnoses = [], patientMeta = {}, onChanged,
}: OrdersPanelProps) {
    const { toast } = useToast();
    const [tab, setTab] = React.useState<OrderPanelTab>(initialTab && initialTab !== 'list' ? initialTab : 'lab');

    /* ── AI medication suggestions (decision support — doctor decides) ── */
    const [aiSugs, setAiSugs] = React.useState<MedSuggestionResponse | null>(null);
    const [aiLoading, setAiLoading] = React.useState(false);
    const [aiDismissed, setAiDismissed] = React.useState<string[]>([]);
    const [aiInfoOpen, setAiInfoOpen] = React.useState<Record<string, boolean>>({});
    const [aiWarnAck, setAiWarnAck] = React.useState<Record<string, boolean>>({});
    const aiFetchedFor = React.useRef<string>('');

    const dxSignature = diagnoses.join('|');
    const fetchAiSuggestions = React.useCallback(async (exclude: string[] = []) => {
        setAiLoading(true);
        const res = await postAiMedicationSuggestions({
            diagnoses,
            patient: {
                age: patientMeta.age,
                gender: patientMeta.gender,
                allergies,
                currentMedications,
            },
            exclude,
        });
        setAiSugs(res);
        setAiLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dxSignature, allergies.join('|'), currentMedications.join('|'), patientMeta.age, patientMeta.gender]);

    // Auto-fetch once per diagnosis set when the medication tab is open.
    React.useEffect(() => {
        if (tab !== 'medication' || diagnoses.length === 0) return;
        if (aiFetchedFor.current === dxSignature) return;
        aiFetchedFor.current = dxSignature;
        fetchAiSuggestions();
    }, [tab, dxSignature, diagnoses.length, fetchAiSuggestions]);

    const freqToOption = (f?: string): string => {
        const s = (f || '').toLowerCase();
        if (s.includes('1-1-1-1') || s.includes('qid') || s.includes('6 hourly')) return '1-1-1-1 (QID)';
        if (s.includes('1-1-1') || s.includes('tid')) return '1-1-1 (TID)';
        if (s.includes('1-0-1') || s.includes('bid')) return '1-0-1 (BID)';
        if (s.includes('0-0-1') || s.includes('hs') || s.includes('night')) return '0-0-1 (OD night)';
        if (s.includes('sos') || s.includes('needed') || s.includes('prn')) return 'SOS';
        if (s.includes('1-0-0') || s.includes('od') || s.includes('once')) return '1-0-0 (OD)';
        return '';
    };

    const addSuggestionToRx = (s: MedSuggestion) => {
        const mappedFreq = freqToOption(s.frequency);
        const line: DrugLine = {
            name: s.generic && s.generic !== s.name ? `${s.name} (${s.generic})` : s.name,
            dose: s.dosage || '',
            frequency: mappedFreq || '1-0-1 (BID)',
            route: s.route || 'Oral',
            duration: s.duration || '',
            instructions: [
                !mappedFreq && s.frequency ? `Frequency: ${s.frequency}` : '',
                s.precautions || '',
            ].filter(Boolean).join('. '),
            foodTiming: 'after food',
            prn: /sos|prn/i.test(s.frequency || ''),
        };
        setDrugs((list) => {
            const firstEmpty = list.findIndex((d) => !d.name.trim());
            if (firstEmpty >= 0) {
                const next = [...list];
                next[firstEmpty] = line;
                return next;
            }
            return [...list, line];
        });
        toast('success', 'Added to prescription draft', `${s.name} — review, adjust, and place the order to prescribe.`);
    };
    const [localOrders, setLocalOrders] = React.useState<ClinicalOrderRecord[]>([]);
    const [statusOverrides, setStatusOverrides] = React.useState<Record<string, string>>({});

    const orders = React.useMemo<ClinicalOrderRecord[]>(
        () =>
            [...localOrders, ...serverOrders].map((o) =>
                statusOverrides[o._id] ? { ...o, status: statusOverrides[o._id] } : o
            ),
        [localOrders, serverOrders, statusOverrides]
    );

    /* ── Lab order state ── */
    const [labTests, setLabTests] = React.useState<string[]>([]);
    const [labCustom, setLabCustom] = React.useState('');
    const [labPriority, setLabPriority] = React.useState<CreateOrderBody['priority']>('routine');
    const [labNotes, setLabNotes] = React.useState('');

    /* ── Radiology order state ── */
    const [radModality, setRadModality] = React.useState('XR');
    const [radBodyPart, setRadBodyPart] = React.useState('');
    const [radIndication, setRadIndication] = React.useState('');
    const [radPriority, setRadPriority] = React.useState<CreateOrderBody['priority']>('routine');

    /* ── Medication order state ── */
    const [drugs, setDrugs] = React.useState<DrugLine[]>([{ ...EMPTY_DRUG }]);
    const [renalImpairment, setRenalImpairment] = React.useState(false);
    const [pregnant, setPregnant] = React.useState(false);

    /* ── Safety-flag dialog (the clinical-safety centerpiece) ── */
    const [safetyFlags, setSafetyFlags] = React.useState<SafetyFlag[] | null>(null);
    const [overrideReason, setOverrideReason] = React.useState('');
    const [pendingBody, setPendingBody] = React.useState<CreateOrderBody | null>(null);
    const [submitting, setSubmitting] = React.useState<string | null>(null);

    const recordLocalOrder = (body: CreateOrderBody, flags?: SafetyFlag[]) => {
        setLocalOrders((list) => [
            {
                _id: `local-${Date.now()}`,
                orderCode: `LOC-${String(list.length + 1).padStart(3, '0')}`,
                category: body.category,
                priority: body.priority,
                status: 'ordered',
                details: body.details as ClinicalOrderRecord['details'],
                safetyReview: flags?.length ? { flags, overrideReason: body.overrideReason } : undefined,
                createdAt: new Date().toISOString(),
            },
            ...list,
        ]);
    };

    /** Shared submit path for all order categories, incl. the 422 safety flow. */
    const submitOrder = async (body: CreateOrderBody, kind: string) => {
        setSubmitting(kind);
        try {
            const created = await postOrder(encounterId, body);
            const warnFlags = created.safetyReview?.flags?.filter((f) => f.severity !== 'info') || [];
            if (warnFlags.length) {
                toast('warning', 'Order placed with advisories', warnFlags.map((f) => f.message).join(' '));
            } else {
                toast('success', 'Order placed', created.orderCode || undefined);
            }
            onChanged();
            return true;
        } catch (err) {
            if (err instanceof ApiHttpError && err.status === 422 && Array.isArray(err.body?.flags)) {
                // Backend refused: critical safety flags need explicit clinician acknowledgement.
                setSafetyFlags(err.body.flags as SafetyFlag[]);
                setPendingBody(body);
                return false;
            }
            if (err instanceof ApiOfflineError) {
                // Offline — replicate the advisory screening client-side so the
                // safety workflow still protects (and demos) correctly.
                if (body.category === 'medication' && !body.acknowledgeCritical) {
                    const flags = demoScreenDrugs(
                        (body.details.drugs as Partial<DrugLine>[]) || [],
                        body.safetyContext || {}
                    );
                    if (flags.some((f) => f.severity === 'critical')) {
                        setSafetyFlags(flags);
                        setPendingBody(body);
                        return false;
                    }
                    recordLocalOrder(body, flags);
                    if (flags.length) toast('warning', 'Recorded locally with advisories (demo)', flags.map((f) => f.message).join(' '));
                    else toast('info', 'Recorded locally (demo)', 'Backend offline — order stored locally only.');
                    return true;
                }
                recordLocalOrder(body, body.category === 'medication' ? safetyFlags || undefined : undefined);
                toast('info', 'Recorded locally (demo)', 'Backend offline — order stored locally only.');
                return true;
            }
            toast('error', 'Failed to place order', err instanceof Error ? err.message : undefined);
            return false;
        } finally {
            setSubmitting(null);
        }
    };

    const submitLab = async () => {
        const tests = [...labTests, ...(labCustom.trim() ? [labCustom.trim()] : [])];
        if (!tests.length) return;
        const ok = await submitOrder({
            category: 'lab',
            priority: labPriority,
            department: 'Laboratory',
            details: { tests, notes: labNotes.trim() || undefined },
        }, 'lab');
        if (ok) { setLabTests([]); setLabCustom(''); setLabNotes(''); setLabPriority('routine'); }
    };

    const submitRadiology = async () => {
        if (!radBodyPart.trim() || !radIndication.trim()) return;
        const ok = await submitOrder({
            category: 'radiology',
            priority: radPriority,
            department: 'Radiology',
            details: { modality: radModality, bodyPart: radBodyPart.trim(), indication: radIndication.trim() },
        }, 'radiology');
        if (ok) { setRadBodyPart(''); setRadIndication(''); setRadPriority('routine'); setRadModality('XR'); }
    };

    const buildMedicationBody = (): CreateOrderBody | null => {
        const valid = drugs.filter((d) => d.name.trim());
        if (!valid.length) return null;
        return {
            category: 'medication',
            priority: 'routine',
            department: 'Pharmacy',
            details: { drugs: valid.map((d) => ({ ...d, name: d.name.trim() })) },
            safetyContext: { currentMedications, allergies, renalImpairment, pregnant },
        };
    };

    const submitMedication = async () => {
        const body = buildMedicationBody();
        if (!body) return;
        const ok = await submitOrder(body, 'medication');
        if (ok) resetMedication();
    };

    const resetMedication = () => {
        setDrugs([{ ...EMPTY_DRUG }]);
        setRenalImpairment(false);
        setPregnant(false);
    };

    const closeSafetyDialog = () => {
        setSafetyFlags(null);
        setPendingBody(null);
        setOverrideReason('');
    };

    const acknowledgeAndResubmit = async () => {
        if (!pendingBody || !overrideReason.trim()) return;
        const body: CreateOrderBody = { ...pendingBody, acknowledgeCritical: true, overrideReason: overrideReason.trim() };
        setSubmitting('override');
        try {
            const created = await postOrder(encounterId, body);
            toast('success', 'Order placed with override', `${created.orderCode || ''} — override reason recorded in the audit trail.`.trim());
            onChanged();
            closeSafetyDialog();
            resetMedication();
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                recordLocalOrder(body, safetyFlags || undefined);
                toast('info', 'Override recorded locally (demo)', 'Backend offline — order and override reason stored locally only.');
                closeSafetyDialog();
                resetMedication();
            } else {
                toast('error', 'Failed to place order', err instanceof Error ? err.message : undefined);
            }
        } finally {
            setSubmitting(null);
        }
    };

    /* ── Order status updates ── */
    const updateStatus = async (order: ClinicalOrderRecord, status: string) => {
        try {
            if (order._id.startsWith('local-')) throw new ApiOfflineError();
            await patchOrderStatus(order._id, { status });
            toast('success', 'Order updated', `${order.orderCode || 'Order'} → ${status.replace('_', ' ')}`);
            onChanged();
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                setStatusOverrides((m) => ({ ...m, [order._id]: status }));
                toast('info', 'Updated locally (demo)', 'Backend offline — status change stored locally only.');
            } else {
                toast('error', 'Failed to update order', err instanceof Error ? err.message : undefined);
            }
        }
    };

    /* ── DataTable columns ── */
    const columns: Column<ClinicalOrderRecord>[] = [
        {
            key: 'orderCode', header: 'Order', sortable: true,
            accessor: (o) => o.orderCode || o._id,
            cell: (o) => <span className="font-mono text-xs font-semibold text-foreground">{o.orderCode || o._id.slice(-6)}</span>,
        },
        {
            key: 'category', header: 'Category', sortable: true,
            cell: (o) => <span className="capitalize">{o.category}</span>,
        },
        {
            key: 'summary', header: 'Details',
            accessor: (o) => summarizeOrder(o),
            cell: (o) => (
                <span className="block max-w-56 truncate text-xs text-muted-foreground" title={summarizeOrder(o)}>
                    {summarizeOrder(o)}
                    {o.safetyReview?.overrideReason && (
                        <Badge tone="danger" className="ml-1.5 text-[9px] uppercase">override</Badge>
                    )}
                </span>
            ),
        },
        {
            key: 'priority', header: 'Priority', sortable: true,
            accessor: (o) => o.priority || 'routine',
            cell: (o) => (
                <Badge tone={PRIORITY_TONE[o.priority || 'routine'] || 'neutral'} className="text-[10px] uppercase">
                    {o.priority || 'routine'}
                </Badge>
            ),
        },
        {
            key: 'status', header: 'Status', sortable: true,
            accessor: (o) => o.status || 'ordered',
            cell: (o) => (
                <Badge tone={STATUS_TONE[o.status || 'ordered'] || 'neutral'} className="text-[10px] uppercase" dot>
                    {(o.status || 'ordered').replace('_', ' ')}
                </Badge>
            ),
        },
        {
            key: 'createdAt', header: 'Placed', sortable: true,
            accessor: (o) => o.createdAt || '',
            cell: (o) => <span className="whitespace-nowrap text-xs text-muted-foreground">{formatWhen(o.createdAt)}</span>,
        },
    ];

    return (
        <>
            <Card className="animate-fade-up">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ClipboardList className="h-4 w-4 text-primary" aria-hidden /> Orders
                    </CardTitle>
                    <CardDescription>Place lab, radiology, and medication orders — medication orders pass advisory safety screening.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={tab} onValueChange={(v) => setTab(v as OrderPanelTab)}>
                        <TabsList className="w-full justify-start overflow-x-auto no-scrollbar">
                            <TabsTrigger value="lab"><FlaskConical className="h-3.5 w-3.5" aria-hidden /> Lab</TabsTrigger>
                            <TabsTrigger value="radiology"><ScanLine className="h-3.5 w-3.5" aria-hidden /> Radiology</TabsTrigger>
                            <TabsTrigger value="medication"><Pill className="h-3.5 w-3.5" aria-hidden /> Medication</TabsTrigger>
                            <TabsTrigger value="list"><ClipboardList className="h-3.5 w-3.5" aria-hidden /> All Orders ({orders.length})</TabsTrigger>
                        </TabsList>

                        {/* ── Lab ── */}
                        <TabsContent value="lab" className="space-y-4">
                            <div>
                                <span className="mb-1.5 block text-sm font-medium text-foreground">Common tests</span>
                                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Select lab tests">
                                    {COMMON_LAB_TESTS.map((t) => {
                                        const on = labTests.includes(t);
                                        return (
                                            <button
                                                key={t}
                                                type="button"
                                                aria-pressed={on}
                                                onClick={() => setLabTests((s) => on ? s.filter((x) => x !== t) : [...s, t])}
                                                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${on ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                                            >
                                                {t}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="lab-custom">Other test</Label>
                                    <SuggestInput
                                        id="lab-custom"
                                        kind="lab_test"
                                        value={labCustom}
                                        onChange={setLabCustom}
                                        placeholder="Start typing — e.g. HbA… → HbA1c"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="lab-priority">Priority</Label>
                                    <Select id="lab-priority" value={labPriority} onChange={(e) => setLabPriority(e.target.value as CreateOrderBody['priority'])}>
                                        <option value="routine">Routine</option>
                                        <option value="urgent">Urgent</option>
                                        <option value="stat">STAT</option>
                                        <option value="emergency">Emergency</option>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="lab-notes">Clinical notes</Label>
                                <Input id="lab-notes" value={labNotes} onChange={(e) => setLabNotes(e.target.value)} placeholder="e.g. Fasting sample required" />
                            </div>
                            <Button onClick={submitLab} disabled={!labTests.length && !labCustom.trim()} loading={submitting === 'lab'}>
                                <Plus className="h-4 w-4" aria-hidden /> Place Lab Order
                                {labTests.length + (labCustom.trim() ? 1 : 0) > 0 && ` (${labTests.length + (labCustom.trim() ? 1 : 0)})`}
                            </Button>
                        </TabsContent>

                        {/* ── Radiology ── */}
                        <TabsContent value="radiology" className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="rad-modality">Modality</Label>
                                    <Select id="rad-modality" value={radModality} onChange={(e) => setRadModality(e.target.value)}>
                                        <option value="XR">XR — X-Ray</option>
                                        <option value="CT">CT — Computed Tomography</option>
                                        <option value="MRI">MRI — Magnetic Resonance</option>
                                        <option value="US">US — Ultrasound</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="rad-priority">Priority</Label>
                                    <Select id="rad-priority" value={radPriority} onChange={(e) => setRadPriority(e.target.value as CreateOrderBody['priority'])}>
                                        <option value="routine">Routine</option>
                                        <option value="urgent">Urgent</option>
                                        <option value="stat">STAT</option>
                                        <option value="emergency">Emergency</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="rad-bodypart">Body part / region</Label>
                                    <Input id="rad-bodypart" value={radBodyPart} onChange={(e) => setRadBodyPart(e.target.value)} placeholder="e.g. Chest PA, Brain, Abdomen" />
                                </div>
                                <div>
                                    <Label htmlFor="rad-indication">Clinical indication</Label>
                                    <Input id="rad-indication" value={radIndication} onChange={(e) => setRadIndication(e.target.value)} placeholder="e.g. R/O consolidation" />
                                </div>
                            </div>
                            {(radPriority === 'stat' || radPriority === 'emergency') && (
                                <p className="flex items-center gap-1.5 rounded-xl border border-danger/30 bg-danger-soft p-2.5 text-xs font-semibold text-danger">
                                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                    {radPriority.toUpperCase()} study — the radiology desk is paged immediately on placement.
                                </p>
                            )}
                            <Button onClick={submitRadiology} disabled={!radBodyPart.trim() || !radIndication.trim()} loading={submitting === 'radiology'}>
                                <Plus className="h-4 w-4" aria-hidden /> Place Radiology Order
                            </Button>
                        </TabsContent>

                        {/* ── Medication ── */}
                        <TabsContent value="medication" className="space-y-4">
                            {/* ── AI Medication Suggestions — decision support only ── */}
                            <div className="rounded-2xl border border-primary/25 bg-primary/[0.04] p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <IconAi className="h-4 w-4 text-primary" aria-hidden />
                                        <span className="text-sm font-semibold text-foreground">AI Medication Suggestions</span>
                                        {aiSugs && aiSugs.source === 'ai' && <Badge tone="brand" dot>Claude AI</Badge>}
                                        {aiSugs && aiSugs.source === 'reference' && <Badge tone="neutral">First-line reference</Badge>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {aiSugs && aiSugs.suggestions.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => fetchAiSuggestions([...aiSugs.suggestions.map((s) => s.name), ...aiDismissed])}
                                                disabled={aiLoading}
                                            >
                                                <IconRefresh className="h-3.5 w-3.5" aria-hidden /> Alternatives
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm" onClick={() => fetchAiSuggestions(aiDismissed)} loading={aiLoading} disabled={diagnoses.length === 0}>
                                            {aiSugs ? 'Refresh' : 'Suggest medications'}
                                        </Button>
                                    </div>
                                </div>
                                <p className="mt-1.5 text-xs text-muted-foreground">
                                    Decision support only — the doctor reviews, modifies, and explicitly approves every medication. AI assists the doctor; the doctor makes the decision.
                                </p>

                                {diagnoses.length === 0 && (
                                    <div className="mt-3 rounded-xl border border-warning/40 bg-warning-soft px-3.5 py-2.5 text-sm text-warning">
                                        Additional patient information may be required before generating a reliable medication suggestion. Add at least one diagnosis above.
                                    </div>
                                )}
                                {aiSugs && aiSugs.source === 'unavailable' && (
                                    <div className="mt-3 rounded-xl border border-border bg-muted/60 px-3.5 py-2.5 text-sm text-muted-foreground">
                                        Suggestions are unavailable right now — the backend could not be reached.
                                    </div>
                                )}
                                {aiSugs && aiSugs.source !== 'unavailable' && aiSugs.notice && (
                                    <div className="mt-3 text-xs text-muted-foreground">{aiSugs.notice}</div>
                                )}

                                {aiSugs && aiSugs.suggestions.filter((s) => !aiDismissed.includes(s.name)).length > 0 && (
                                    <div className="mt-3 space-y-2.5">
                                        {aiSugs.suggestions.filter((s) => !aiDismissed.includes(s.name)).map((s) => {
                                            const warns = (s.warnings || []).filter((w) => w.severity !== 'info');
                                            const critical = warns.some((w) => w.severity === 'critical');
                                            const needsAck = warns.length > 0 && !aiWarnAck[s.name];
                                            return (
                                                <div key={s.name} className="rounded-xl border border-border bg-card p-3.5">
                                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="text-sm font-semibold text-foreground">{s.name}</span>
                                                                {s.generic && s.generic !== s.name && (
                                                                    <span className="text-xs text-muted-foreground">{s.generic}</span>
                                                                )}
                                                                {critical && <Badge tone="danger" dot pulse>Review required</Badge>}
                                                                {!critical && warns.length > 0 && <Badge tone="warning" dot>Caution</Badge>}
                                                            </div>
                                                            {s.indication && <p className="mt-1 text-xs text-muted-foreground">{s.indication}</p>}
                                                            <p className="mt-1.5 text-xs font-medium text-foreground">
                                                                {[s.dosage, s.route, s.frequency, s.duration].filter(Boolean).join(' · ')}
                                                            </p>
                                                        </div>
                                                        <div className="flex shrink-0 items-center gap-1.5">
                                                            <Button
                                                                size="sm"
                                                                variant={needsAck ? 'outline' : 'secondary'}
                                                                onClick={() => {
                                                                    if (needsAck) { setAiWarnAck((m) => ({ ...m, [s.name]: true })); return; }
                                                                    addSuggestionToRx(s);
                                                                }}
                                                            >
                                                                {needsAck ? 'Review warnings' : '✓ Add to Prescription'}
                                                            </Button>
                                                            <Button variant="ghost" size="icon-sm" aria-label={`Clinical information for ${s.name}`} onClick={() => setAiInfoOpen((m) => ({ ...m, [s.name]: !m[s.name] }))}>
                                                                <IconInfo className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon-sm" aria-label={`Dismiss ${s.name}`} onClick={() => setAiDismissed((d) => [...d, s.name])}>
                                                                <IconX className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    {warns.length > 0 && (
                                                        <div className={`mt-2.5 rounded-lg border px-3 py-2 text-xs ${critical ? 'border-danger/40 bg-danger-soft text-danger' : 'border-warning/40 bg-warning-soft text-warning'}`} role="alert">
                                                            <span className="flex items-center gap-1.5 font-semibold"><IconShield className="h-3.5 w-3.5" aria-hidden /> Patient-specific safety check</span>
                                                            <ul className="mt-1 list-disc pl-4">
                                                                {warns.map((w, i) => <li key={i}>{w.message}</li>)}
                                                            </ul>
                                                            {aiWarnAck[s.name] && (
                                                                <p className="mt-1.5 font-medium">Reviewed — you may now add this to the prescription draft.</p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {aiInfoOpen[s.name] && (
                                                        <div className="mt-2.5 space-y-1.5 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                                                            {s.precautions && <p><span className="font-semibold text-foreground">Precautions:</span> {s.precautions}</p>}
                                                            {s.interactions && <p><span className="font-semibold text-foreground">Interactions:</span> {s.interactions}</p>}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                {drugs.map((d, i) => (
                                    <div key={i} className="relative rounded-2xl border border-border bg-muted/40 p-4">
                                        {drugs.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setDrugs((list) => list.filter((_, j) => j !== i))}
                                                aria-label={`Remove drug row ${i + 1}`}
                                                className="absolute right-3 top-3 rounded-md p-1 text-subtle-foreground transition-colors hover:bg-danger-soft hover:text-danger"
                                            >
                                                <Trash2 className="h-4 w-4" aria-hidden />
                                            </button>
                                        )}
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                            <div className="sm:col-span-2">
                                                <Label htmlFor={`drug-name-${i}`}>Drug name</Label>
                                                <SuggestInput
                                                    id={`drug-name-${i}`}
                                                    kind="medication"
                                                    value={d.name}
                                                    onChange={(v) => patchDrug(setDrugs, i, { name: v })}
                                                    onSelect={(item) => patchDrug(setDrugs, i, {
                                                        name: item.meta?.generic
                                                            ? `${item.meta.generic}${item.meta.brand ? ` (${item.meta.brand})` : ''}`
                                                            : item.label,
                                                        ...(d.dose ? {} : { dose: item.meta?.strength || '' }),
                                                    })}
                                                    placeholder="Start typing — e.g. Met… → Metformin"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor={`drug-dose-${i}`}>Dose</Label>
                                                <Input id={`drug-dose-${i}`} value={d.dose} onChange={(e) => patchDrug(setDrugs, i, { dose: e.target.value })} placeholder="500 mg" />
                                            </div>
                                            <div>
                                                <Label htmlFor={`drug-freq-${i}`}>Frequency</Label>
                                                <Select id={`drug-freq-${i}`} value={d.frequency} onChange={(e) => patchDrug(setDrugs, i, { frequency: e.target.value })}>
                                                    <option>1-0-0 (OD)</option>
                                                    <option>0-0-1 (OD night)</option>
                                                    <option>1-0-1 (BID)</option>
                                                    <option>1-1-1 (TID)</option>
                                                    <option>1-1-1-1 (QID)</option>
                                                    <option>SOS</option>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor={`drug-route-${i}`}>Route</Label>
                                                <Select id={`drug-route-${i}`} value={d.route} onChange={(e) => patchDrug(setDrugs, i, { route: e.target.value })}>
                                                    <option>Oral</option>
                                                    <option>IV</option>
                                                    <option>IM</option>
                                                    <option>SC</option>
                                                    <option>Topical</option>
                                                    <option>Inhalation</option>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor={`drug-duration-${i}`}>Duration</Label>
                                                <SuggestInput
                                                    id={`drug-duration-${i}`}
                                                    kind="duration"
                                                    value={d.duration}
                                                    onChange={(v) => patchDrug(setDrugs, i, { duration: v })}
                                                    placeholder="e.g. 5 days"
                                                />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <Label htmlFor={`drug-instr-${i}`}>Instructions</Label>
                                                <SuggestInput
                                                    id={`drug-instr-${i}`}
                                                    kind="instruction"
                                                    commaSeparated
                                                    value={d.instructions}
                                                    onChange={(v) => patchDrug(setDrugs, i, { instructions: v })}
                                                    placeholder="e.g. After food (comma-separate multiple)"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor={`drug-food-${i}`}>Food timing</Label>
                                                <Select id={`drug-food-${i}`} value={d.foodTiming} onChange={(e) => patchDrug(setDrugs, i, { foodTiming: e.target.value as DrugLine['foodTiming'] })}>
                                                    <option value="before food">Before food</option>
                                                    <option value="after food">After food</option>
                                                    <option value="with food">With food</option>
                                                    <option value="">Not specified</option>
                                                </Select>
                                            </div>
                                            <div className="flex items-center gap-2 pt-1 sm:col-span-3">
                                                <Switch checked={d.prn} onCheckedChange={(v) => patchDrug(setDrugs, i, { prn: v })} label={`PRN (as needed) for drug ${i + 1}`} />
                                                <span className="text-xs font-medium text-muted-foreground">PRN — take only as needed</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setDrugs((l) => [...l, { ...EMPTY_DRUG }])}>
                                <Plus className="h-3.5 w-3.5" aria-hidden /> Add another drug
                            </Button>

                            {/* Safety context */}
                            <div className="rounded-2xl border border-border bg-muted/40 p-4">
                                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-subtle-foreground">
                                    <ShieldAlert className="h-3.5 w-3.5" aria-hidden /> Safety screening context
                                </h4>
                                <p className="mb-3 text-xs text-muted-foreground">
                                    Screened against {allergies.length} recorded allergie(s) and {currentMedications.length} active medication(s).
                                </p>
                                <div className="flex flex-wrap gap-x-6 gap-y-2">
                                    <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                                        <Switch checked={renalImpairment} onCheckedChange={setRenalImpairment} label="Renal impairment" /> Renal impairment
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                                        <Switch checked={pregnant} onCheckedChange={setPregnant} label="Pregnant" /> Pregnant
                                    </label>
                                </div>
                            </div>

                            <Button onClick={submitMedication} disabled={!drugs.some((d) => d.name.trim())} loading={submitting === 'medication'}>
                                <Pill className="h-4 w-4" aria-hidden /> Screen &amp; Place Medication Order
                            </Button>
                        </TabsContent>

                        {/* ── Existing orders ── */}
                        <TabsContent value="list">
                            <DataTable<ClinicalOrderRecord>
                                columns={columns}
                                data={orders}
                                rowKey={(o) => o._id}
                                searchPlaceholder="Search orders…"
                                emptyTitle="No orders yet"
                                emptyDescription="Orders placed from the Lab, Radiology, and Medication tabs appear here."
                                dense
                                rowActions={(o) =>
                                    ['completed', 'cancelled'].includes(String(o.status)) ? null : (
                                        <Dropdown
                                            trigger={
                                                <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${o.orderCode || 'order'}`}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            }
                                        >
                                            <DropdownLabel>Update status</DropdownLabel>
                                            <DropdownItem icon={<Hand />} onClick={() => updateStatus(o, 'acknowledged')}>Acknowledge</DropdownItem>
                                            <DropdownItem icon={<PlayCircle />} onClick={() => updateStatus(o, 'in_progress')}>Mark in progress</DropdownItem>
                                            <DropdownItem icon={<CheckCircle2 />} onClick={() => updateStatus(o, 'completed')}>Complete</DropdownItem>
                                            <DropdownItem icon={<XCircle />} danger onClick={() => updateStatus(o, 'cancelled')}>Cancel order</DropdownItem>
                                        </Dropdown>
                                    )
                                }
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* ── Critical safety-flag dialog — cancel or acknowledge with reason ── */}
            <Dialog
                open={Boolean(safetyFlags)}
                onClose={closeSafetyDialog}
                size="lg"
                title={
                    <span className="flex items-center gap-2 text-danger">
                        <ShieldAlert className="h-5 w-5" aria-hidden /> Critical safety flags detected
                    </span>
                }
                description="This medication order was NOT placed. Review each flag — you may cancel, or override with a documented clinical justification."
                footer={
                    <>
                        <Button variant="outline" onClick={closeSafetyDialog}>Cancel order</Button>
                        <Button
                            variant="danger"
                            onClick={acknowledgeAndResubmit}
                            disabled={!overrideReason.trim()}
                            loading={submitting === 'override'}
                        >
                            <ShieldAlert className="h-4 w-4" aria-hidden /> Acknowledge Risk &amp; Place Order
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <ul className="space-y-2">
                        {(safetyFlags || []).map((f, i) => (
                            <li
                                key={i}
                                className={`flex items-start gap-3 rounded-xl border p-3 ${
                                    f.severity === 'critical'
                                        ? 'border-danger/40 bg-danger-soft'
                                        : 'border-warning/40 bg-warning-soft'
                                }`}
                            >
                                <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${f.severity === 'critical' ? 'text-danger' : 'text-warning'}`} aria-hidden />
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge tone={f.severity === 'critical' ? 'danger' : 'warning'} className="text-[10px] uppercase">{f.severity}</Badge>
                                        <span className="text-[10px] font-bold uppercase tracking-wide text-subtle-foreground">{f.kind.replace('_', ' ')}</span>
                                    </div>
                                    <p className="mt-1 text-sm text-foreground">{f.message}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div>
                        <Label htmlFor="override-reason">Clinical justification for override <span className="text-danger">*</span></Label>
                        <Textarea
                            id="override-reason"
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            placeholder="e.g. Benefit outweighs risk; INR monitored twice weekly, patient counselled on bleeding precautions."
                        />
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            The override reason and your identity are recorded permanently in the order&apos;s audit trail.
                        </p>
                    </div>
                </div>
            </Dialog>
        </>
    );
}

function patchDrug(
    setDrugs: React.Dispatch<React.SetStateAction<DrugLine[]>>,
    index: number,
    patch: Partial<DrugLine>
) {
    setDrugs((list) => list.map((d, i) => (i === index ? { ...d, ...patch } : d)));
}

function summarizeOrder(o: ClinicalOrderRecord): string {
    const d = o.details || {};
    if (o.category === 'lab' && Array.isArray(d.tests)) return d.tests.join(', ');
    if (o.category === 'radiology') return [d.modality, d.bodyPart, d.indication].filter(Boolean).join(' · ');
    if (o.category === 'medication' && Array.isArray(d.drugs)) {
        return d.drugs.map((x) => [x.name, x.dose].filter(Boolean).join(' ')).join(', ');
    }
    return typeof d.notes === 'string' ? d.notes : '—';
}
