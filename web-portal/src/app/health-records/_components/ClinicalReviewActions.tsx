'use client';

import * as React from 'react';
import { CheckCircle2, PencilLine, XCircle, ShieldAlert } from 'lucide-react';
import { Button, Dialog, Textarea, Badge } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
    submitClinicalReview, ApiOfflineError, ApiHttpError,
    RECORD_STATUS_LABELS, RECORD_STATUS_TONE,
    type ClinicalReviewModel, type ClinicalReviewDecision, type RecordStatus,
    type PrescriptionRecord, type LabReportRecord, type DiagnosticReportRecord,
} from '../_lib/api';

type ReviewedRecord = PrescriptionRecord | LabReportRecord | DiagnosticReportRecord;

const DIALOG_COPY: Record<ClinicalReviewDecision, { title: string; description: string; confirmLabel: string; tone?: 'danger' }> = {
    ACCEPT: {
        title: 'Clinically verify this record',
        description: 'This marks the record VERIFIED — a permanent, doctor-signed clinical confirmation. The backend refuses further direct edits to this record afterward, by design.',
        confirmLabel: 'Verify',
    },
    EDIT: {
        title: 'Send back for edits',
        description: 'Marks this record as needing corrections before it can be clinically verified. Add notes so the capturing staff know what to fix.',
        confirmLabel: 'Send back',
    },
    REJECT: {
        title: 'Reject record',
        description: 'Rejects this AI-extracted record outright. Add a reason where possible.',
        confirmLabel: 'Reject',
        tone: 'danger',
    },
};

/**
 * Doctor clinical-review action for a structured record (Prescription /
 * LabReport / DiagnosticReport). Backend contract: POST
 * /records/:model/:id/clinical-review with { decision, notes? }. ACCEPT
 * requires the caller to actually be a doctor server-side — `isDoctor` here
 * only controls whether the Approve control is enabled/shown; the backend
 * remains the authority and will 403 with its own message otherwise.
 */
export function ClinicalReviewActions({
    model, id, status, isDoctor, onReviewed, dense,
}: {
    model: ClinicalReviewModel;
    id: string;
    status: RecordStatus;
    isDoctor: boolean;
    onReviewed?: (record: ReviewedRecord) => void;
    dense?: boolean;
}) {
    const { toast } = useToast();
    const [pending, setPending] = React.useState<ClinicalReviewDecision | null>(null);
    const [notes, setNotes] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);

    const close = () => {
        if (submitting) return;
        setPending(null);
        setNotes('');
    };

    const submit = async () => {
        if (!pending) return;
        setSubmitting(true);
        try {
            const res = await submitClinicalReview(model, id, { decision: pending, notes: notes.trim() || undefined });
            toast(
                'success',
                pending === 'ACCEPT' ? 'Record verified' : pending === 'REJECT' ? 'Record rejected' : 'Sent back for edits',
                `${model} is now ${RECORD_STATUS_LABELS[res.record.status]}.`
            );
            onReviewed?.(res.record);
            setPending(null);
            setNotes('');
        } catch (err) {
            if (err instanceof ApiHttpError) {
                toast('error', 'Clinical review failed', err.message);
            } else if (err instanceof ApiOfflineError) {
                toast('error', 'Backend unreachable', 'Could not submit the review — try again once the backend is reachable.');
            } else {
                toast('error', 'Clinical review failed', err instanceof Error ? err.message : undefined);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (status === 'VERIFIED') {
        return <Badge tone="success"><CheckCircle2 className="h-3 w-3" aria-hidden /> Clinically verified</Badge>;
    }

    const copy = pending ? DIALOG_COPY[pending] : null;

    return (
        <div className={dense ? 'flex flex-wrap items-center gap-1.5' : 'flex flex-wrap items-center gap-2'}>
            <Badge tone={RECORD_STATUS_TONE[status]}>{RECORD_STATUS_LABELS[status]}</Badge>

            <Button size="sm" onClick={() => setPending('ACCEPT')} disabled={!isDoctor}>
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Approve
            </Button>
            {!isDoctor && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden /> Only a doctor can clinically verify this record.
                </span>
            )}

            <Button size="sm" variant="outline" onClick={() => setPending('EDIT')}>
                <PencilLine className="h-3.5 w-3.5" aria-hidden /> Edit / send back
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPending('REJECT')}>
                <XCircle className="h-3.5 w-3.5" aria-hidden /> Reject
            </Button>

            <Dialog
                open={!!pending}
                onClose={close}
                title={copy?.title}
                description={copy?.description}
                footer={
                    <>
                        <Button variant="outline" onClick={close} disabled={submitting}>Cancel</Button>
                        <Button variant={copy?.tone === 'danger' ? 'danger' : 'primary'} loading={submitting} onClick={submit}>
                            {copy?.confirmLabel}
                        </Button>
                    </>
                }
            >
                <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes (optional)…"
                    rows={4}
                />
            </Dialog>
        </div>
    );
}
