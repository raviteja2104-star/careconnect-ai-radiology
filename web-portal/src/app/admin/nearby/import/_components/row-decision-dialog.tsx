'use client';

import * as React from 'react';
import { AlertTriangle, Copy, XCircle } from 'lucide-react';
import { Badge, Button, Dialog, FieldHint, Input, Label, Textarea } from '@/components/ui';
import { ROW_STATUS_LABELS, ROW_STATUS_TONE, isRowResolved, type Decision, type NormalizedProviderRow, type Row } from '../_lib/api';

export interface RowDecisionDialogProps {
    open: boolean;
    onClose: () => void;
    row: Row | null;
    saving?: boolean;
    onDecide: (decision: Decision, editedData?: Partial<NormalizedProviderRow>, reviewNotes?: string) => void;
}

const detailFields: Array<{ key: keyof NormalizedProviderRow; label: string }> = [
    { key: 'branchName', label: 'Branch' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'district', label: 'District' },
    { key: 'state', label: 'State' },
    { key: 'pincode', label: 'Pincode' },
    { key: 'email', label: 'Email' },
    { key: 'website', label: 'Website' },
    { key: 'consultationFee', label: 'Consultation fee' },
];

function duplicateLabel(m: Row['duplicateMatches'][number]): string {
    if (m.matchType === 'batch_duplicate') {
        return m.matchedRowIndex != null ? `Duplicates row #${m.matchedRowIndex} in this file` : 'Duplicates another row in this file';
    }
    const kind = m.matchType === 'existing_phone' ? 'phone number' : 'name + locality';
    return `Matches existing provider "${m.providerName ?? m.providerId ?? 'unknown'}" (${kind})`;
}

export function RowDecisionDialog({ open, onClose, row, saving, onDecide }: RowDecisionDialogProps) {
    const [typeInput, setTypeInput] = React.useState('');
    const [localityInput, setLocalityInput] = React.useState('');
    const [reviewNotes, setReviewNotes] = React.useState('');

    React.useEffect(() => {
        if (!open) return;
        setTypeInput(row?.normalizedData?.type ?? '');
        setLocalityInput(row?.normalizedData?.locality ?? '');
        setReviewNotes('');
    }, [open, row]);

    if (!row) return null;

    const resolved = isRowResolved(row);
    const nd = row.normalizedData ?? {};
    const changedType = typeInput.trim() !== (nd.type ?? '').trim();
    const changedLocality = localityInput.trim() !== (nd.locality ?? '').trim();
    const buildEditedData = (): Partial<NormalizedProviderRow> | undefined => {
        if (!changedType && !changedLocality) return undefined;
        return {
            ...(changedType ? { type: typeInput.trim() } : {}),
            ...(changedLocality ? { locality: localityInput.trim() } : {}),
        };
    };

    const canApprove = resolved || (typeInput.trim() && localityInput.trim());
    const decidable = row.status !== 'IMPORTED';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={nd.name || `Row #${row.rowIndex}`}
            description={`${nd.locality || 'Unknown locality'} · ${nd.phone || 'no phone on file'}`}
            size="lg"
            footer={
                decidable ? (
                    <>
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button
                            variant="outline"
                            loading={saving}
                            onClick={() => onDecide('REJECT', buildEditedData(), reviewNotes.trim() || undefined)}
                        >
                            Reject
                        </Button>
                        <Button
                            loading={saving}
                            disabled={!canApprove}
                            onClick={() => onDecide('APPROVE', buildEditedData(), reviewNotes.trim() || undefined)}
                        >
                            Approve
                        </Button>
                    </>
                ) : (
                    <Button variant="outline" onClick={onClose}>Close</Button>
                )
            }
        >
            <div className="space-y-5">
                <div className="flex items-center gap-2">
                    <Badge tone={ROW_STATUS_TONE[row.status]}>{ROW_STATUS_LABELS[row.status]}</Badge>
                    {row.reviewedAt && <span className="text-xs text-muted-foreground">Last reviewed {new Date(row.reviewedAt).toLocaleString('en-IN')}</span>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-border bg-muted/20 p-4 text-sm">
                    {detailFields.map(({ key, label }) => {
                        const v = nd[key];
                        if (v === undefined || v === null || v === '') return null;
                        return (
                            <div key={key} className="min-w-0">
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="text-foreground truncate">{String(v)}</p>
                            </div>
                        );
                    })}
                    {!!nd.specialties?.length && (
                        <div className="sm:col-span-2">
                            <p className="text-xs text-muted-foreground">Specialties</p>
                            <p className="text-foreground">{nd.specialties.join(', ')}</p>
                        </div>
                    )}
                </div>

                {decidable && (!resolved || changedType || changedLocality) && (
                    <div className="rounded-xl border border-warning/30 bg-warning-soft p-4 space-y-3">
                        <p className="text-sm font-medium text-foreground">
                            {resolved ? 'Correct type / locality' : 'Unresolved provider type or locality'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {resolved
                                ? 'Editing these re-resolves them against the master lists on Approve.'
                                : 'This row\'s type or locality did not match the ProviderType / Locality master lists. Fix the text below — the backend will re-resolve it, and Approve is disabled until it does.'}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="rd-type">Type</Label>
                                <Input id="rd-type" value={typeInput} onChange={(e) => setTypeInput(e.target.value)} placeholder="e.g. Clinic" />
                            </div>
                            <div>
                                <Label htmlFor="rd-locality">Locality</Label>
                                <Input id="rd-locality" value={localityInput} onChange={(e) => setLocalityInput(e.target.value)} placeholder="e.g. MVP Colony" />
                            </div>
                        </div>
                    </div>
                )}

                {row.validationErrors.length > 0 && (
                    <div className="space-y-1.5">
                        <p className="flex items-center gap-1.5 text-sm font-medium text-danger"><XCircle className="h-4 w-4" aria-hidden /> Validation errors</p>
                        <ul className="space-y-1 text-sm text-danger">
                            {row.validationErrors.map((e, i) => <li key={i} className="rounded-lg bg-danger-soft px-3 py-1.5">{e}</li>)}
                        </ul>
                    </div>
                )}

                {row.validationWarnings.length > 0 && (
                    <div className="space-y-1.5">
                        <p className="flex items-center gap-1.5 text-sm font-medium text-warning"><AlertTriangle className="h-4 w-4" aria-hidden /> Warnings</p>
                        <ul className="space-y-1 text-sm text-warning">
                            {row.validationWarnings.map((w, i) => <li key={i} className="rounded-lg bg-warning-soft px-3 py-1.5">{w}</li>)}
                        </ul>
                    </div>
                )}

                {row.duplicateMatches.length > 0 && (
                    <div className="space-y-1.5">
                        <p className="flex items-center gap-1.5 text-sm font-medium text-info"><Copy className="h-4 w-4" aria-hidden /> Possible duplicates</p>
                        <ul className="space-y-1 text-sm text-info">
                            {row.duplicateMatches.map((m, i) => <li key={i} className="rounded-lg bg-info-soft px-3 py-1.5">{duplicateLabel(m)}</li>)}
                        </ul>
                    </div>
                )}

                {row.reviewNotes && (
                    <div>
                        <p className="text-xs text-muted-foreground">Previous review note</p>
                        <p className="text-sm text-foreground">{row.reviewNotes}</p>
                    </div>
                )}

                {decidable && (
                    <div>
                        <Label htmlFor="rd-notes">Review notes (optional)</Label>
                        <Textarea id="rd-notes" value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Optional note for this decision…" />
                        {!canApprove && <FieldHint>Enter both a type and locality above to enable Approve.</FieldHint>}
                    </div>
                )}
            </div>
        </Dialog>
    );
}
