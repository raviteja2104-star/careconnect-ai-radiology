'use client';

/**
 * Health Record Capture — document review page.
 *
 * Shows the original scanned page(s) next to the AI-extracted fields. Every
 * field carries a confidence badge and requires an explicit human decision
 * (Accept / Edit / Reject) before the document can be confirmed — the AI's
 * reading is never treated as confirmed medical fact on its own. A null
 * value on an illegible field is always shown as "Unable to confidently read
 * this field", never as blank/normal.
 */

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    AlertTriangle, Check, ChevronLeft, ChevronRight, FileWarning, Loader2, Pencil, RefreshCw,
    ShieldAlert, ShieldCheck, X,
} from 'lucide-react';
import {
    Badge, Button, Card, CardContent, CardHeader, CardTitle, CardDescription, Dialog, ErrorState,
    Input, Label, PageHeader, SkeletonCard, Textarea,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import {
    ApiHttpError, ApiOfflineError,
    confidenceLabel, confidenceTone, confirmDocument, decideField, DOCUMENT_STATUS_LABELS,
    DOCUMENT_STATUS_TONE, DOCUMENT_TYPE_LABELS, fetchDocumentPageBlob, fetchHealthDocument,
    fetchMedicineSuggestions, formatDateTime, humanizeGroupKey, HUMAN_STATUS_LABELS, HUMAN_STATUS_TONE,
    parseBracketPath, reprocessHealthDocument, reviewDocument,
    type DocumentAndExtraction, type ExtractedField, type MedicineSuggestionsResult,
} from '@/app/health-records/_lib/capture-api';

/* ─────────────────────────── Field grouping ─────────────────────────── */

interface GroupedFields {
    flat: ExtractedField[];
    groups: Map<string, Map<number, ExtractedField[]>>;
}

function groupFields(fields: ExtractedField[]): GroupedFields {
    const flat: ExtractedField[] = [];
    const groups = new Map<string, Map<number, ExtractedField[]>>();
    for (const f of fields) {
        const parsed = parseBracketPath(f.key);
        if (!parsed) {
            flat.push(f);
            continue;
        }
        if (!groups.has(parsed.group)) groups.set(parsed.group, new Map());
        const byIndex = groups.get(parsed.group)!;
        if (!byIndex.has(parsed.index)) byIndex.set(parsed.index, []);
        byIndex.get(parsed.index)!.push(f);
    }
    return { flat, groups };
}

/* ─────────────────────────── Confidence badge ────────────────────────── */

function ConfidenceBadge({ level, note }: { level: ExtractedField['confidenceLevel']; note?: string }) {
    return (
        <Badge tone={confidenceTone(level)} title={note} className="shrink-0">
            {confidenceLabel(level)}
        </Badge>
    );
}

/* ─────────────────────────── Medicine suggestions ────────────────────── */

function MedicineSuggestionPicker({
    rawText,
    onPick,
}: {
    rawText: string;
    onPick: (label: string) => void;
}) {
    const [loading, setLoading] = React.useState(true);
    const [result, setResult] = React.useState<MedicineSuggestionsResult | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetchMedicineSuggestions(rawText)
            .then((res) => { if (!cancelled) setResult(res); })
            .catch((err) => {
                if (cancelled) return;
                setError(err instanceof ApiOfflineError ? 'Backend unreachable — pick manually below.' : 'Could not load medicine suggestions — pick manually below.');
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [rawText]);

    if (loading) {
        return (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Looking up medicine matches…
            </p>
        );
    }
    if (error) return <p className="text-xs text-danger">{error}</p>;
    if (!result || result.candidates.length === 0) {
        return <p className="text-xs text-muted-foreground">No catalog matches found — enter the medicine name manually below.</p>;
    }
    return (
        <div className="space-y-1.5">
            {result.interpretation && (
                <p className="text-xs text-muted-foreground">
                    AI interpretation: <span className="font-medium text-foreground">{result.interpretation}</span>{' '}
                    <ConfidenceBadge level={result.confidenceLevel} note={result.note} />
                </p>
            )}
            <div className="flex flex-wrap gap-1.5">
                {result.candidates.map((c) => (
                    <button
                        key={c.catalogEntryId}
                        type="button"
                        onClick={() => onPick(c.label)}
                        className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
                        title={[c.generic, c.strength, c.form].filter(Boolean).join(' · ') || undefined}
                    >
                        {c.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ─────────────────────────── Field row ───────────────────────────────── */

function FieldRow({
    field,
    documentId,
    highlighted,
    onUpdated,
}: {
    field: ExtractedField;
    documentId: string;
    highlighted: boolean;
    onUpdated: (extraction: import('@/app/health-records/_lib/capture-api').DocumentExtraction) => void;
}) {
    const { toast } = useToast();
    const [editing, setEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState<string>('');
    const [busy, setBusy] = React.useState(false);

    const isMedication = field.key.startsWith('medications[');
    const displayValue = field.humanStatus === 'EDITED' && field.humanValue !== undefined ? field.humanValue : field.value;
    const isUnreadable = field.value === null && field.illegible;
    const currentSourceText = String(displayValue ?? '');

    async function submitDecision(decision: 'ACCEPT' | 'REJECT' | 'EDIT', value?: string | number) {
        setBusy(true);
        try {
            const updated = await decideField(documentId, field.key, decision === 'EDIT' ? { decision, value } : { decision });
            onUpdated(updated);
            setEditing(false);
        } catch (err) {
            if (err instanceof ApiOfflineError) toast('error', 'Backend unreachable', 'The decision was not saved.');
            else if (err instanceof ApiHttpError) toast('error', 'Could not save decision', err.message);
            else toast('error', 'Could not save decision');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div
            className={cn(
                'rounded-xl border p-3.5 transition-colors',
                highlighted ? 'border-danger bg-danger-soft' : 'border-border bg-card'
            )}
        >
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{field.label}</p>
                    {isUnreadable ? (
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm italic text-danger">
                            <ShieldAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            Unable to confidently read this field
                        </p>
                    ) : (
                        <p className="mt-0.5 break-words text-sm text-foreground">
                            {displayValue === null || displayValue === '' ? <span className="italic text-muted-foreground">(empty)</span> : String(displayValue)}
                        </p>
                    )}
                    {field.confidenceNote && (
                        <p className="mt-1 text-xs text-muted-foreground">{field.confidenceNote}</p>
                    )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <ConfidenceBadge level={field.confidenceLevel} note={field.confidenceNote} />
                    <Badge tone={HUMAN_STATUS_TONE[field.humanStatus]}>{HUMAN_STATUS_LABELS[field.humanStatus]}</Badge>
                </div>
            </div>

            {!editing ? (
                <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => submitDecision('ACCEPT')}>
                        <Check className="h-3.5 w-3.5" aria-hidden /> Accept
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => { setEditValue(isUnreadable ? '' : currentSourceText); setEditing(true); }}
                    >
                        <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => submitDecision('REJECT')}>
                        <X className="h-3.5 w-3.5" aria-hidden /> Reject
                    </Button>
                </div>
            ) : (
                <div className="mt-3 space-y-2.5 border-t border-border pt-3">
                    {isMedication && currentSourceText && (
                        <MedicineSuggestionPicker
                            rawText={currentSourceText}
                            onPick={(label) => submitDecision('EDIT', label)}
                        />
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder={isMedication ? 'Or type the medicine name manually' : 'Corrected value'}
                            className="max-w-xs"
                            type={typeof field.value === 'number' ? 'number' : 'text'}
                        />
                        <Button size="sm" disabled={busy || editValue.trim() === ''} onClick={() => submitDecision('EDIT', editValue)}>
                            Save
                        </Button>
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => setEditing(false)}>Cancel</Button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────── Original page viewer ────────────────────── */

function OriginalPageViewer({ documentId, pages }: { documentId: string; pages: DocumentAndExtraction['document']['pages'] }) {
    const [pageIdx, setPageIdx] = React.useState(0);
    const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(true);

    const page = pages[pageIdx];

    React.useEffect(() => {
        let cancelled = false;
        let objectUrl: string | null = null;
        setLoading(true);
        setError(null);
        setBlobUrl(null);
        if (!page) { setLoading(false); return; }
        fetchDocumentPageBlob(documentId, page.pageNumber)
            .then((blob) => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(blob);
                setBlobUrl(objectUrl);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err instanceof ApiOfflineError ? 'Backend unreachable — cannot load the original page.' : 'Could not load the original page.');
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [documentId, page]);

    if (!page) return null;
    const isPdf = page.mimeType === 'application/pdf';

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="text-base">Original Document</CardTitle>
                    <CardDescription>Page {pageIdx + 1} of {pages.length}{page.originalName ? ` — ${page.originalName}` : ''}</CardDescription>
                </div>
                {pages.length > 1 && (
                    <div className="flex items-center gap-1.5">
                        <Button size="icon-sm" variant="outline" disabled={pageIdx === 0} onClick={() => setPageIdx((i) => i - 1)} aria-label="Previous page">
                            <ChevronLeft className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button size="icon-sm" variant="outline" disabled={pageIdx === pages.length - 1} onClick={() => setPageIdx((i) => i + 1)} aria-label="Next page">
                            <ChevronRight className="h-4 w-4" aria-hidden />
                        </Button>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                {page.quality?.warnings && page.quality.warnings.length > 0 && (
                    <div className="mb-3 space-y-1 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-xs text-warning">
                        {page.quality.warnings.map((w, i) => (
                            <p key={i} className="flex items-start gap-1.5"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />{w}</p>
                        ))}
                    </div>
                )}
                <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
                    {loading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />}
                    {!loading && error && <p className="p-6 text-center text-sm text-danger">{error}</p>}
                    {!loading && !error && blobUrl && (
                        isPdf ? (
                            <iframe src={blobUrl} title={`Document page ${pageIdx + 1}`} className="h-[600px] w-full" />
                        ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={blobUrl} alt={`Original document page ${pageIdx + 1}`} className="max-h-[600px] w-full object-contain" />
                        )
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

/* ─────────────────────────── Review dialog (rescan/reject) ───────────── */

function WholeDocumentReviewDialog({
    open,
    decision,
    onClose,
    onSubmit,
    busy,
}: {
    open: boolean;
    decision: 'REJECT' | 'RESCAN_REQUESTED' | null;
    onClose: () => void;
    onSubmit: (notes: string) => void;
    busy: boolean;
}) {
    const [notes, setNotes] = React.useState('');
    React.useEffect(() => { if (open) setNotes(''); }, [open]);
    const title = decision === 'REJECT' ? 'Reject Document' : 'Request Rescan';
    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={title}
            description={decision === 'REJECT'
                ? 'This marks the whole document as rejected. It will not be turned into a structured record.'
                : 'This asks the capturer to rescan the document (e.g. it was blurry or cut off).'}
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
                    <Button variant={decision === 'REJECT' ? 'danger' : 'primary'} onClick={() => onSubmit(notes)} loading={busy}>
                        {title}
                    </Button>
                </>
            }
        >
            <Label htmlFor="review-notes">Notes (optional)</Label>
            <Textarea id="review-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Why is this being rejected / rescanned?" />
        </Dialog>
    );
}

/* ─────────────────────────── Page ────────────────────────────────────── */

export default function DocumentReviewPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { toast } = useToast();
    const documentId = params.id;

    const [data, setData] = React.useState<DocumentAndExtraction | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [demo, setDemo] = React.useState(false);
    const [loadError, setLoadError] = React.useState<string | null>(null);

    const [reprocessing, setReprocessing] = React.useState(false);
    const [confirming, setConfirming] = React.useState(false);
    const [pendingHighlight, setPendingHighlight] = React.useState<Set<string>>(new Set());
    const [reviewDialogDecision, setReviewDialogDecision] = React.useState<'REJECT' | 'RESCAN_REQUESTED' | null>(null);
    const [reviewBusy, setReviewBusy] = React.useState(false);

    const load = React.useCallback(() => {
        setLoading(true);
        setLoadError(null);
        fetchHealthDocument(documentId)
            .then((res) => { setData(res.data); setDemo(res.demo); })
            .catch((err) => {
                setLoadError(err instanceof ApiHttpError ? err.message : 'Could not load this document.');
            })
            .finally(() => setLoading(false));
    }, [documentId]);

    React.useEffect(() => { load(); }, [load]);

    function updateExtraction(extraction: import('@/app/health-records/_lib/capture-api').DocumentExtraction) {
        setData((prev) => (prev ? { ...prev, extraction } : prev));
        setPendingHighlight((prev) => {
            if (prev.size === 0) return prev;
            const next = new Set(prev);
            extraction.fields.forEach((f) => { if (f.humanStatus !== 'PENDING') next.delete(f.key); });
            return next;
        });
    }

    async function handleReprocess() {
        setReprocessing(true);
        try {
            const result = await reprocessHealthDocument(documentId);
            setData(result);
            toast('success', 'AI extraction re-run', result.extraction ? 'Fields are ready for review.' : undefined);
        } catch (err) {
            if (err instanceof ApiHttpError && err.status === 503) {
                toast('warning', 'AI still unavailable', err.message || 'Try again shortly.');
            } else if (err instanceof ApiOfflineError) {
                toast('error', 'Backend unreachable', 'Could not retry AI extraction.');
            } else {
                toast('error', 'Retry failed');
            }
        } finally {
            setReprocessing(false);
        }
    }

    async function handleConfirm() {
        setConfirming(true);
        try {
            const res = await confirmDocument(documentId);
            toast('success', 'Document confirmed', res.structuredRecord ? 'Saved as a structured health record.' : undefined);
            setData((prev) => (prev ? { ...prev, document: res.document } : prev));
            setPendingHighlight(new Set());
        } catch (err) {
            if (err instanceof ApiHttpError && err.status === 409) {
                const pending = Array.isArray(err.body.pendingFields) ? (err.body.pendingFields as string[]) : [];
                setPendingHighlight(new Set(pending));
                toast('warning', 'Some fields still need a decision', `${pending.length} field(s) highlighted below.`);
            } else if (err instanceof ApiOfflineError) {
                toast('error', 'Backend unreachable', 'The document was not confirmed.');
            } else if (err instanceof ApiHttpError) {
                toast('error', 'Could not confirm document', err.message);
            } else {
                toast('error', 'Could not confirm document');
            }
        } finally {
            setConfirming(false);
        }
    }

    async function handleWholeDocumentReview(notes: string) {
        if (!reviewDialogDecision) return;
        setReviewBusy(true);
        try {
            const document = await reviewDocument(documentId, { decision: reviewDialogDecision, notes: notes || undefined });
            setData((prev) => (prev ? { ...prev, document } : prev));
            toast('success', reviewDialogDecision === 'REJECT' ? 'Document rejected' : 'Rescan requested');
            setReviewDialogDecision(null);
        } catch (err) {
            if (err instanceof ApiOfflineError) toast('error', 'Backend unreachable', 'The action was not saved.');
            else if (err instanceof ApiHttpError) toast('error', 'Action failed', err.message);
            else toast('error', 'Action failed');
        } finally {
            setReviewBusy(false);
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Reviewing Document" crumbs={[{ label: 'Home', href: '/' }, { label: 'Health Records', href: '/health-records' }, { label: 'Review' }]} />
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="space-y-6">
                <PageHeader title="Reviewing Document" crumbs={[{ label: 'Home', href: '/' }, { label: 'Health Records', href: '/health-records' }, { label: 'Review' }]} />
                <ErrorState description={loadError} onRetry={load} />
            </div>
        );
    }

    if (demo || !data) {
        return (
            <div className="space-y-6">
                <PageHeader title="Reviewing Document" crumbs={[{ label: 'Home', href: '/' }, { label: 'Health Records', href: '/health-records' }, { label: 'Review' }]} />
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
                    <FileWarning className="h-10 w-10 text-muted-foreground" aria-hidden />
                    <h3 className="text-base font-semibold text-foreground">Health Record Capture requires a live backend connection</h3>
                    <p className="max-w-sm text-sm text-muted-foreground">
                        This document could not be loaded because the CareConnect backend isn&apos;t reachable right now.
                        No demo data is shown for medical documents — try again once the backend is running.
                    </p>
                    <Button variant="outline" onClick={load}>
                        <RefreshCw className="h-4 w-4" aria-hidden /> Retry
                    </Button>
                </div>
            </div>
        );
    }

    const { document, extraction } = data;
    const pendingCount = extraction ? extraction.fields.filter((f) => f.humanStatus === 'PENDING').length : 0;
    const grouped = extraction ? groupFields(extraction.fields) : null;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Review Extracted Fields"
                description="Every AI-read field needs your decision before it becomes part of the health record."
                crumbs={[{ label: 'Home', href: '/' }, { label: 'Health Records', href: '/health-records' }, { label: 'Review' }]}
                actions={
                    <>
                        <Button variant="outline" onClick={() => setReviewDialogDecision('RESCAN_REQUESTED')}>Request Rescan</Button>
                        <Button variant="danger" onClick={() => setReviewDialogDecision('REJECT')}>Reject Document</Button>
                    </>
                }
            />

            <Card>
                <CardContent className="flex flex-wrap items-center gap-3 p-5">
                    <Badge tone="brand">{DOCUMENT_TYPE_LABELS[document.documentType]}</Badge>
                    <ConfidenceBadge level={document.documentTypeConfidence} />
                    <Badge tone={DOCUMENT_STATUS_TONE[document.status]}>{DOCUMENT_STATUS_LABELS[document.status]}</Badge>
                    <span className="text-xs text-muted-foreground">Captured {formatDateTime(document.createdAt)}</span>
                    {document.documentTypeSource === 'AI_CLASSIFIED' && (document.documentTypeConfidence === 'LOW' || document.documentTypeConfidence === null) && (
                        <span className="flex items-center gap-1.5 text-xs text-warning">
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                            AI classified this with low confidence — verify it&apos;s the right document type.
                        </span>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <OriginalPageViewer documentId={document._id} pages={document.pages} />

                <div className="space-y-4">
                    {!extraction ? (
                        <Card>
                            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                                <FileWarning className="h-10 w-10 text-warning" aria-hidden />
                                <h3 className="text-base font-semibold text-foreground">AI reading wasn&apos;t available</h3>
                                <p className="max-w-sm text-sm text-muted-foreground">
                                    The document was saved, but the AI service was unavailable when it was uploaded. You can retry
                                    the AI reading now, or complete this record manually once manual entry is available.
                                </p>
                                <Button onClick={handleReprocess} loading={reprocessing}>
                                    <RefreshCw className="h-4 w-4" aria-hidden /> Retry AI extraction
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <Card>
                                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        {pendingCount > 0 ? (
                                            <>
                                                <ShieldAlert className="h-4 w-4 text-warning" aria-hidden />
                                                <span className="font-medium text-foreground">{pendingCount} field{pendingCount === 1 ? '' : 's'} still need a decision</span>
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="h-4 w-4 text-success" aria-hidden />
                                                <span className="font-medium text-foreground">All fields have a decision</span>
                                            </>
                                        )}
                                    </div>
                                    <Button onClick={handleConfirm} disabled={pendingCount > 0} loading={confirming}>
                                        <Check className="h-4 w-4" aria-hidden /> Confirm Document
                                    </Button>
                                </CardContent>
                            </Card>

                            {extraction.classification.confidenceNote && (
                                <p className="text-xs text-muted-foreground">{extraction.classification.confidenceNote}</p>
                            )}

                            {grouped!.flat.map((field) => (
                                <FieldRow
                                    key={field.key}
                                    field={field}
                                    documentId={document._id}
                                    highlighted={pendingHighlight.has(field.key)}
                                    onUpdated={updateExtraction}
                                />
                            ))}

                            {Array.from(grouped!.groups.entries()).map(([groupName, byIndex]) => (
                                <div key={groupName} className="space-y-3">
                                    {Array.from(byIndex.entries())
                                        .sort(([a], [b]) => a - b)
                                        .map(([idx, fields]) => (
                                            <Card key={`${groupName}-${idx}`}>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm">{humanizeGroupKey(groupName)} #{idx + 1}</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-2.5 pt-0">
                                                    {fields.map((field) => (
                                                        <FieldRow
                                                            key={field.key}
                                                            field={field}
                                                            documentId={document._id}
                                                            highlighted={pendingHighlight.has(field.key)}
                                                            onUpdated={updateExtraction}
                                                        />
                                                    ))}
                                                </CardContent>
                                            </Card>
                                        ))}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            <WholeDocumentReviewDialog
                open={reviewDialogDecision !== null}
                decision={reviewDialogDecision}
                onClose={() => setReviewDialogDecision(null)}
                onSubmit={handleWholeDocumentReview}
                busy={reviewBusy}
            />
        </div>
    );
}
