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

export type OrderPanelTab = 'lab' | 'radiology' | 'medication' | 'list';

interface OrdersPanelProps {
    encounterId: string;
    serverOrders: ClinicalOrderRecord[];
    initialTab?: OrderPanelTab;
    allergies: string[];
    currentMedications: string[];
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
    encounterId, serverOrders, initialTab, allergies, currentMedications, onChanged,
}: OrdersPanelProps) {
    const { toast } = useToast();
    const [tab, setTab] = React.useState<OrderPanelTab>(initialTab && initialTab !== 'list' ? initialTab : 'lab');
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
                                    <Input id="lab-custom" value={labCustom} onChange={(e) => setLabCustom(e.target.value)} placeholder="e.g. Serum Ferritin" />
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
                                                <Input id={`drug-name-${i}`} value={d.name} onChange={(e) => patchDrug(setDrugs, i, { name: e.target.value })} placeholder="e.g. Metformin" />
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
                                                <Input id={`drug-duration-${i}`} value={d.duration} onChange={(e) => patchDrug(setDrugs, i, { duration: e.target.value })} placeholder="e.g. 5 days" />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <Label htmlFor={`drug-instr-${i}`}>Instructions</Label>
                                                <Input id={`drug-instr-${i}`} value={d.instructions} onChange={(e) => patchDrug(setDrugs, i, { instructions: e.target.value })} placeholder="e.g. With a full glass of water" />
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
