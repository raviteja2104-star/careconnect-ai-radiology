'use client';

import * as React from 'react';
import { Button, Dialog, FieldHint, Input, Label, Select, Switch, Textarea } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
    ApiOfflineError,
    createBillable,
    demoUpsert,
    updateBillable,
    TYPE_LABELS,
    type BillableItem,
    type BillableType,
    type IvdExt,
    type LabExt,
} from '../_lib/api';

const TYPE_OPTIONS: BillableType[] = ['lab_test', 'panel', 'imaging', 'consumable', 'ivd_kit', 'blood_bank'];

interface Draft {
    itemCode: string;
    name: string;
    type: BillableType;
    category: string;
    subcategory: string;
    department: string;
    unit: string;
    unitPrice: string;
    gst: string;
    hsnSac: string;
    notes: string;
    active: boolean;
    // labExt
    testCode: string;
    specimen: string;
    container: string;
    collectionInstructions: string;
    tatHours: string;
    method: string;
    resultType: string;
    criticalValue: string;
    nablScope: boolean;
    externalReferral: boolean;
    memberCodes: string;
    // ivdExt
    packSize: string;
    storageTemp: string;
    supplier: string;
    purchasePrice: string;
    currentStock: string;
    reorderLevel: string;
    lotNumber: string;
    expiryDate: string;
    regulatoryClass: string;
}

function toDraft(item: BillableItem | null, fallbackType: BillableType): Draft {
    return {
        itemCode: item?.itemCode ?? '',
        name: item?.name ?? '',
        type: item?.type ?? fallbackType,
        category: item?.category ?? '',
        subcategory: item?.subcategory ?? '',
        department: item?.department ?? '',
        unit: item?.unit ?? '',
        unitPrice: item?.unitPrice != null ? String(item.unitPrice) : '',
        gst: item?.gst != null ? String(item.gst) : '',
        hsnSac: item?.hsnSac ?? '',
        notes: item?.notes ?? '',
        active: item?.active ?? true,
        testCode: item?.labExt?.testCode ?? '',
        specimen: item?.labExt?.specimen ?? '',
        container: item?.labExt?.container ?? '',
        collectionInstructions: item?.labExt?.collectionInstructions ?? '',
        tatHours: item?.labExt?.tatHours != null ? String(item.labExt.tatHours) : '',
        method: item?.labExt?.method ?? '',
        resultType: item?.labExt?.resultType ?? '',
        criticalValue: item?.labExt?.criticalValue ?? '',
        nablScope: item?.labExt?.nablScope ?? false,
        externalReferral: item?.labExt?.externalReferral ?? false,
        memberCodes: (item?.labExt?.memberCodes ?? []).join(', '),
        packSize: item?.ivdExt?.packSize ?? '',
        storageTemp: item?.ivdExt?.storageTemp ?? '',
        supplier: item?.ivdExt?.supplier ?? '',
        purchasePrice: item?.ivdExt?.purchasePrice != null ? String(item.ivdExt.purchasePrice) : '',
        currentStock: item?.ivdExt?.currentStock != null ? String(item.ivdExt.currentStock) : '',
        reorderLevel: item?.ivdExt?.reorderLevel != null ? String(item.ivdExt.reorderLevel) : '',
        lotNumber: item?.ivdExt?.lotNumber ?? '',
        expiryDate: item?.ivdExt?.expiryDate ?? '',
        regulatoryClass: item?.ivdExt?.regulatoryClass ?? '',
    };
}

function num(s: string): number | undefined {
    if (s.trim() === '') return undefined;
    const n = Number(s);
    return Number.isNaN(n) ? undefined : n;
}

export interface EditDialogProps {
    open: boolean;
    onClose: () => void;
    /** null = create mode */
    item: BillableItem | null;
    defaultType: BillableType;
    onSaved: () => void;
}

export function EditDialog({ open, onClose, item, defaultType, onSaved }: EditDialogProps) {
    const { toast } = useToast();
    const [draft, setDraft] = React.useState<Draft>(() => toDraft(item, defaultType));
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (open) {
            setDraft(toDraft(item, defaultType));
            setError(null);
        }
    }, [open, item, defaultType]);

    const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
        setDraft((d) => ({ ...d, [key]: value }));

    const isLabLike = draft.type === 'lab_test' || draft.type === 'panel';
    const isIvd = draft.type === 'ivd_kit';

    const buildBody = (): Partial<BillableItem> => {
        const labExt: LabExt | undefined = isLabLike
            ? {
                  testCode: draft.testCode.trim() || undefined,
                  specimen: draft.specimen.trim() || undefined,
                  container: draft.container.trim() || undefined,
                  collectionInstructions: draft.collectionInstructions.trim() || undefined,
                  tatHours: num(draft.tatHours),
                  method: draft.method.trim() || undefined,
                  resultType: draft.resultType.trim() || undefined,
                  criticalValue: draft.criticalValue.trim() || undefined,
                  nablScope: draft.nablScope,
                  externalReferral: draft.externalReferral,
                  memberCodes: draft.memberCodes
                      .split(',')
                      .map((c) => c.trim())
                      .filter(Boolean),
              }
            : undefined;
        const ivdExt: IvdExt | undefined = isIvd
            ? {
                  packSize: draft.packSize.trim() || undefined,
                  storageTemp: draft.storageTemp.trim() || undefined,
                  supplier: draft.supplier.trim() || undefined,
                  purchasePrice: num(draft.purchasePrice),
                  currentStock: num(draft.currentStock),
                  reorderLevel: num(draft.reorderLevel),
                  lotNumber: draft.lotNumber.trim() || undefined,
                  expiryDate: draft.expiryDate.trim() || undefined,
                  regulatoryClass: draft.regulatoryClass.trim() || undefined,
              }
            : undefined;
        return {
            itemCode: draft.itemCode.trim(),
            name: draft.name.trim(),
            type: draft.type,
            category: draft.category.trim() || undefined,
            subcategory: draft.subcategory.trim() || undefined,
            department: draft.department.trim() || undefined,
            unit: draft.unit.trim() || undefined,
            unitPrice: num(draft.unitPrice),
            gst: num(draft.gst),
            hsnSac: draft.hsnSac.trim() || undefined,
            notes: draft.notes.trim() || undefined,
            active: draft.active,
            ...(labExt ? { labExt } : {}),
            ...(ivdExt ? { ivdExt } : {}),
        };
    };

    const save = async () => {
        if (!draft.itemCode.trim() || !draft.name.trim()) {
            setError('Item code and name are required.');
            return;
        }
        setError(null);
        setSaving(true);
        const body = buildBody();
        try {
            if (item) await updateBillable(item._id, body);
            else await createBillable(body);
            toast('success', item ? 'Item updated' : 'Item created');
            onSaved();
            onClose();
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                demoUpsert({
                    _id: item?._id ?? `demo-new-${Date.now()}`,
                    active: true,
                    ...(item ?? {}),
                    ...body,
                } as BillableItem);
                toast('info', 'Saved to demo data', 'Backend offline — this change lives only in this browser session.');
                onSaved();
                onClose();
            } else {
                setError(err instanceof Error ? err.message : 'Save failed');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            size="xl"
            title={item ? `Edit ${item.itemCode}` : 'New billable item'}
            description={item ? item.name : 'Add an item to the configurable catalogue'}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={save} loading={saving}>
                        {item ? 'Save changes' : 'Create item'}
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                {error && (
                    <p className="rounded-xl bg-danger-soft px-4 py-2.5 text-sm text-danger" role="alert">
                        {error}
                    </p>
                )}

                <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Item details</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <Label htmlFor="bi-code">Item code *</Label>
                            <Input id="bi-code" value={draft.itemCode} onChange={(e) => set('itemCode', e.target.value)} placeholder="LAB-CBC" />
                        </div>
                        <div className="lg:col-span-2">
                            <Label htmlFor="bi-name">Name *</Label>
                            <Input id="bi-name" value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Complete Blood Count (CBC)" />
                        </div>
                        <div>
                            <Label htmlFor="bi-type">Type</Label>
                            <Select id="bi-type" value={draft.type} onChange={(e) => set('type', e.target.value as BillableType)} disabled={!!item}>
                                {TYPE_OPTIONS.map((t) => (
                                    <option key={t} value={t}>
                                        {TYPE_LABELS[t]}
                                    </option>
                                ))}
                            </Select>
                            {item && <FieldHint>Type cannot change after creation.</FieldHint>}
                        </div>
                        <div>
                            <Label htmlFor="bi-category">Category</Label>
                            <Input id="bi-category" value={draft.category} onChange={(e) => set('category', e.target.value)} placeholder="Hematology" />
                        </div>
                        <div>
                            <Label htmlFor="bi-subcategory">Subcategory</Label>
                            <Input id="bi-subcategory" value={draft.subcategory} onChange={(e) => set('subcategory', e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="bi-department">Department</Label>
                            <Input id="bi-department" value={draft.department} onChange={(e) => set('department', e.target.value)} placeholder="Pathology" />
                        </div>
                        <div>
                            <Label htmlFor="bi-unit">Unit</Label>
                            <Input id="bi-unit" value={draft.unit} onChange={(e) => set('unit', e.target.value)} placeholder="test / piece / kit" />
                        </div>
                        <div>
                            <Label htmlFor="bi-price">Unit price (₹)</Label>
                            <Input id="bi-price" type="number" min={0} value={draft.unitPrice} onChange={(e) => set('unitPrice', e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="bi-gst">GST %</Label>
                            <Input id="bi-gst" type="number" min={0} max={28} value={draft.gst} onChange={(e) => set('gst', e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="bi-hsn">HSN / SAC</Label>
                            <Input id="bi-hsn" value={draft.hsnSac} onChange={(e) => set('hsnSac', e.target.value)} placeholder="999316" />
                            <FieldHint>Metadata field — confirm with your GST advisor.</FieldHint>
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                            <Switch checked={draft.active} onCheckedChange={(v) => set('active', v)} label="Active" />
                            <span className="text-sm text-foreground">{draft.active ? 'Active' : 'Inactive'}</span>
                        </div>
                        <div className="sm:col-span-2 lg:col-span-3">
                            <Label htmlFor="bi-notes">Notes</Label>
                            <Textarea id="bi-notes" value={draft.notes} onChange={(e) => set('notes', e.target.value)} className="min-h-16" />
                        </div>
                    </div>
                </section>

                {isLabLike && (
                    <section>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {draft.type === 'panel' ? 'Panel / lab details' : 'Laboratory details'}
                        </h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <Label htmlFor="bi-testcode">Test code</Label>
                                <Input id="bi-testcode" value={draft.testCode} onChange={(e) => set('testCode', e.target.value)} placeholder="CBC" />
                            </div>
                            <div>
                                <Label htmlFor="bi-specimen">Specimen</Label>
                                <Input id="bi-specimen" value={draft.specimen} onChange={(e) => set('specimen', e.target.value)} placeholder="Whole blood" />
                            </div>
                            <div>
                                <Label htmlFor="bi-container">Container</Label>
                                <Input id="bi-container" value={draft.container} onChange={(e) => set('container', e.target.value)} placeholder="EDTA (lavender)" />
                            </div>
                            <div>
                                <Label htmlFor="bi-tat">TAT (hours)</Label>
                                <Input id="bi-tat" type="number" min={0} value={draft.tatHours} onChange={(e) => set('tatHours', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="bi-method">Method</Label>
                                <Input id="bi-method" value={draft.method} onChange={(e) => set('method', e.target.value)} placeholder="HPLC / CLIA / …" />
                            </div>
                            <div>
                                <Label htmlFor="bi-resulttype">Result type</Label>
                                <Input id="bi-resulttype" value={draft.resultType} onChange={(e) => set('resultType', e.target.value)} placeholder="numeric / descriptive" />
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3">
                                <Label htmlFor="bi-collect">Collection instructions</Label>
                                <Input id="bi-collect" value={draft.collectionInstructions} onChange={(e) => set('collectionInstructions', e.target.value)} placeholder="10–12 hours fasting" />
                            </div>
                            <div>
                                <Label htmlFor="bi-critical">Critical value</Label>
                                <Input id="bi-critical" value={draft.criticalValue} onChange={(e) => set('criticalValue', e.target.value)} placeholder="Per lab-validated cutoff" />
                            </div>
                            <div className="sm:col-span-2 lg:col-span-2">
                                <Label htmlFor="bi-members">Member test codes (panels)</Label>
                                <Input id="bi-members" value={draft.memberCodes} onChange={(e) => set('memberCodes', e.target.value)} placeholder="FBS, HBA1C, URINE-RM" />
                                <FieldHint>Comma-separated test codes bundled into this panel.</FieldHint>
                            </div>
                            <div className="flex items-center gap-3">
                                <Switch checked={draft.nablScope} onCheckedChange={(v) => set('nablScope', v)} label="In NABL scope" />
                                <span className="text-sm text-foreground">In NABL scope</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Switch checked={draft.externalReferral} onCheckedChange={(v) => set('externalReferral', v)} label="External referral" />
                                <span className="text-sm text-foreground">External referral</span>
                            </div>
                        </div>
                    </section>
                )}

                {isIvd && (
                    <section>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">IVD kit details</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <Label htmlFor="bi-pack">Pack size</Label>
                                <Input id="bi-pack" value={draft.packSize} onChange={(e) => set('packSize', e.target.value)} placeholder="25 tests" />
                            </div>
                            <div>
                                <Label htmlFor="bi-storage">Storage temp</Label>
                                <Input id="bi-storage" value={draft.storageTemp} onChange={(e) => set('storageTemp', e.target.value)} placeholder="2–8 °C" />
                            </div>
                            <div>
                                <Label htmlFor="bi-supplier">Supplier</Label>
                                <Input id="bi-supplier" value={draft.supplier} onChange={(e) => set('supplier', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="bi-purchase">Purchase price (₹)</Label>
                                <Input id="bi-purchase" type="number" min={0} value={draft.purchasePrice} onChange={(e) => set('purchasePrice', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="bi-stock">Current stock</Label>
                                <Input id="bi-stock" type="number" min={0} value={draft.currentStock} onChange={(e) => set('currentStock', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="bi-reorder">Reorder level</Label>
                                <Input id="bi-reorder" type="number" min={0} value={draft.reorderLevel} onChange={(e) => set('reorderLevel', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="bi-lot">Lot number</Label>
                                <Input id="bi-lot" value={draft.lotNumber} onChange={(e) => set('lotNumber', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="bi-expiry">Expiry date</Label>
                                <Input id="bi-expiry" type="date" value={draft.expiryDate} onChange={(e) => set('expiryDate', e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="bi-regclass">Regulatory class (configurable — verify against current CDSCO classification)</Label>
                                <Input id="bi-regclass" value={draft.regulatoryClass} onChange={(e) => set('regulatoryClass', e.target.value)} placeholder="e.g. Class B (verify)" />
                                <FieldHint>Free text. Not a compliance determination — confirm with the current CDSCO IVD classification before use.</FieldHint>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </Dialog>
    );
}
