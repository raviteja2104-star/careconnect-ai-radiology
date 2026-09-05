'use client';

import * as React from 'react';
import {
    Upload, FileSpreadsheet, History, ListChecks, CheckCircle2, XCircle, PlayCircle,
    ChevronLeft, ChevronRight, AlertTriangle, Copy, Import,
} from 'lucide-react';
import {
    Badge, Button, Card, CardContent, CardHeader, CardTitle, DataTable, Dialog, EmptyState, ErrorState,
    PageHeader, Select, SkeletonCard, SkeletonTable, StatCard, StatGrid, type Column,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
    ApiOfflineError, bulkDecideImportRows, commitImportBatch, decideImportRow, fetchImportBatch,
    fetchImportBatches, fetchImportRows, formatDate, isRowResolved, uploadImportFile,
    BATCH_STATUS_LABELS, BATCH_STATUS_TONE, ROW_STATUS_LABELS, ROW_STATUS_TONE,
    type Batch, type BatchStats, type CommitResult, type Decision, type NormalizedProviderRow,
    type Row as ImportRow, type RowStatus,
} from './_lib/api';
import { RowDecisionDialog } from './_components/row-decision-dialog';

const ROW_STATUS_OPTIONS: RowStatus[] = ['VALID', 'INVALID', 'DUPLICATE', 'APPROVED', 'REJECTED', 'IMPORTED'];
const ROWS_LIMIT = 50;

function issuesCell(row: ImportRow) {
    const errs = row.validationErrors.length;
    const warns = row.validationWarnings.length;
    const dups = row.duplicateMatches.length;
    if (!errs && !warns && !dups) return <span className="text-muted-foreground">—</span>;
    return (
        <div className="flex flex-wrap items-center gap-1">
            {errs > 0 && <Badge tone="danger">{errs} error{errs > 1 ? 's' : ''}</Badge>}
            {warns > 0 && <Badge tone="warning">{warns} warning{warns > 1 ? 's' : ''}</Badge>}
            {dups > 0 && <Badge tone="info">{dups} dup{dups > 1 ? 's' : ''}</Badge>}
        </div>
    );
}

export default function ProviderImportPage() {
    const { toast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    /* ── Batches ── */
    const [batches, setBatches] = React.useState<Batch[]>([]);
    const [batchesLoading, setBatchesLoading] = React.useState(true);
    const [batchesError, setBatchesError] = React.useState<string | null>(null);
    const [batchesDemo, setBatchesDemo] = React.useState(false);
    const [batchesRefreshKey, setBatchesRefreshKey] = React.useState(0);

    const [selectedBatchId, setSelectedBatchId] = React.useState<string | null>(null);
    const selectedBatch = React.useMemo(() => batches.find((b) => b._id === selectedBatchId) ?? null, [batches, selectedBatchId]);

    const loadBatches = React.useCallback(async () => {
        setBatchesLoading(true);
        setBatchesError(null);
        try {
            const res = await fetchImportBatches();
            setBatches(res.data);
            setBatchesDemo(res.demo);
        } catch (err) {
            setBatchesError(err instanceof Error ? err.message : 'Failed to load import batches');
        } finally {
            setBatchesLoading(false);
        }
    }, []);

    React.useEffect(() => { loadBatches(); }, [loadBatches, batchesRefreshKey]);

    const refreshSelectedBatch = React.useCallback(async (id: string) => {
        try {
            const res = await fetchImportBatch(id);
            if (res.data) setBatches((prev) => prev.map((b) => (b._id === id ? res.data! : b)));
        } catch { /* keep last-known batch summary if this fails */ }
    }, []);

    /* ── Upload ── */
    const [uploading, setUploading] = React.useState(false);

    const handleUpload = async (file: File) => {
        setUploading(true);
        try {
            const { batch } = await uploadImportFile(file);
            setBatches((prev) => [batch, ...prev.filter((b) => b._id !== batch._id)]);
            setSelectedBatchId(batch._id);
            setStatusFilter('');
            setRowsPage(1);
            setSelectedRowIds(new Set());
            toast('success', 'File uploaded', `${batch.totalRows} row${batch.totalRows === 1 ? '' : 's'} staged for review.`);
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                toast('error', 'Backend unreachable', 'The import pipeline requires a live connection — nothing was uploaded.');
            } else {
                toast('error', 'Upload failed', err instanceof Error ? err.message : undefined);
            }
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    /* ── Rows ── */
    const [rows, setRows] = React.useState<ImportRow[]>([]);
    const [rowsTotal, setRowsTotal] = React.useState(0);
    const [rowsPage, setRowsPage] = React.useState(1);
    const [rowsLoading, setRowsLoading] = React.useState(false);
    const [rowsError, setRowsError] = React.useState<string | null>(null);
    const [statusFilter, setStatusFilter] = React.useState<RowStatus | ''>('');
    const [selectedRowIds, setSelectedRowIds] = React.useState<Set<string>>(new Set());
    const [rowsRefreshKey, setRowsRefreshKey] = React.useState(0);

    React.useEffect(() => {
        if (!selectedBatchId) { setRows([]); setRowsTotal(0); return; }
        let cancelled = false;
        setRowsLoading(true);
        setRowsError(null);
        fetchImportRows(selectedBatchId, { status: statusFilter || undefined, page: rowsPage, limit: ROWS_LIMIT })
            .then((res) => {
                if (cancelled) return;
                setRows(res.data.rows);
                setRowsTotal(res.data.total);
            })
            .catch((err) => !cancelled && setRowsError(err instanceof Error ? err.message : 'Failed to load rows'))
            .finally(() => !cancelled && setRowsLoading(false));
        return () => { cancelled = true; };
    }, [selectedBatchId, statusFilter, rowsPage, rowsRefreshKey]);

    const selectBatch = (id: string) => {
        setSelectedBatchId(id);
        setStatusFilter('');
        setRowsPage(1);
        setSelectedRowIds(new Set());
    };

    const refreshRows = React.useCallback(() => setRowsRefreshKey((k) => k + 1), []);

    const toggleRow = (id: string) => {
        setSelectedRowIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const allOnPageSelected = rows.length > 0 && rows.every((r) => selectedRowIds.has(r._id));
    const toggleAllOnPage = () => {
        setSelectedRowIds((prev) => {
            const next = new Set(prev);
            if (allOnPageSelected) rows.forEach((r) => next.delete(r._id));
            else rows.forEach((r) => next.add(r._id));
            return next;
        });
    };

    /* ── Single-row decisions ── */
    const [decisionRow, setDecisionRow] = React.useState<ImportRow | null>(null);
    const [decisionOpen, setDecisionOpen] = React.useState(false);
    const [decisionSaving, setDecisionSaving] = React.useState(false);

    const openDecision = (row: ImportRow) => { setDecisionRow(row); setDecisionOpen(true); };

    const applyDecideResult = (updated: ImportRow) => {
        setRows((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
        if (selectedBatchId) refreshSelectedBatch(selectedBatchId);
    };

    const decide = async (row: ImportRow, decision: Decision, editedData?: Partial<NormalizedProviderRow>, reviewNotes?: string) => {
        if (!selectedBatchId) return;
        setDecisionSaving(true);
        try {
            const updated = await decideImportRow(selectedBatchId, row._id, { decision, editedData, reviewNotes });
            applyDecideResult(updated);
            toast('success', decision === 'APPROVE' ? 'Row approved' : 'Row rejected', updated.normalizedData?.name);
            setDecisionOpen(false);
        } catch (err) {
            toast('error', decision === 'APPROVE' ? 'Approve failed' : 'Reject failed', err instanceof Error ? err.message : undefined);
        } finally {
            setDecisionSaving(false);
        }
    };

    const quickApprove = (row: ImportRow) => {
        if (!isRowResolved(row)) { openDecision(row); return; }
        decide(row, 'APPROVE');
    };
    const quickReject = (row: ImportRow) => decide(row, 'REJECT');

    /* ── Bulk decisions ── */
    const [bulkLoading, setBulkLoading] = React.useState<Decision | null>(null);

    const bulkDecide = async (decision: Decision) => {
        if (!selectedBatchId || selectedRowIds.size === 0) return;
        setBulkLoading(decision);
        try {
            const { results } = await bulkDecideImportRows(selectedBatchId, [...selectedRowIds], decision);
            const okCount = results.filter((r) => r.ok).length;
            const failed = results.filter((r) => !r.ok);
            if (failed.length === 0) {
                toast('success', `${okCount} row${okCount === 1 ? '' : 's'} ${decision === 'APPROVE' ? 'approved' : 'rejected'}`);
            } else {
                toast('warning', `${okCount} ${decision === 'APPROVE' ? 'approved' : 'rejected'}, ${failed.length} failed`, failed.slice(0, 3).map((f) => f.message).filter(Boolean).join(' · ') || undefined);
            }
            setSelectedRowIds(new Set());
            refreshRows();
            refreshSelectedBatch(selectedBatchId);
        } catch (err) {
            toast('error', 'Bulk action failed', err instanceof Error ? err.message : undefined);
        } finally {
            setBulkLoading(null);
        }
    };

    /* ── Commit ── */
    const [committing, setCommitting] = React.useState(false);
    const [commitConfirmOpen, setCommitConfirmOpen] = React.useState(false);
    const [commitResult, setCommitResult] = React.useState<CommitResult | null>(null);

    const doCommit = async () => {
        if (!selectedBatchId) return;
        setCommitting(true);
        try {
            const result = await commitImportBatch(selectedBatchId);
            setCommitResult(result);
            toast(result.failed > 0 ? 'warning' : 'success', `Imported ${result.imported} provider${result.imported === 1 ? '' : 's'}`, result.failed > 0 ? `${result.failed} row(s) failed to import — see summary.` : undefined);
            refreshRows();
            refreshSelectedBatch(selectedBatchId);
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                toast('error', 'Backend unreachable', 'Commit requires a live connection — nothing was imported.');
            } else {
                toast('error', 'Commit failed', err instanceof Error ? err.message : undefined);
            }
        } finally {
            setCommitting(false);
            setCommitConfirmOpen(false);
        }
    };

    const canCommit = !!selectedBatch && selectedBatch.stats.approved > 0 &&
        (selectedBatch.status === 'REVIEW_PENDING' || selectedBatch.status === 'PARTIALLY_IMPORTED');

    /* ── Columns ── */
    const columns: Column<ImportRow>[] = [
        {
            key: 'select', header: (
                <input type="checkbox" aria-label="Select all rows on this page" checked={allOnPageSelected} onChange={toggleAllOnPage} className="h-4 w-4 accent-primary" />
            ), cell: (row) => (
                <input
                    type="checkbox"
                    aria-label={`Select ${row.normalizedData?.name ?? `row ${row.rowIndex}`}`}
                    checked={selectedRowIds.has(row._id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleRow(row._id)}
                    className="h-4 w-4 accent-primary"
                />
            ), className: 'w-10',
        },
        {
            key: 'name', header: 'Provider', sortable: true,
            accessor: (r) => r.normalizedData?.name ?? '',
            cell: (row) => (
                <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{row.normalizedData?.name || <span className="italic text-muted-foreground">(no name)</span>}</p>
                    <p className="text-xs text-muted-foreground">Row #{row.rowIndex}</p>
                </div>
            ),
        },
        {
            key: 'type', header: 'Type',
            accessor: (r) => r.normalizedData?.type ?? '',
            cell: (row) => (
                <span className="inline-flex items-center gap-1">
                    {row.normalizedData?.type || <span className="text-muted-foreground">—</span>}
                    {!row.normalizedData?.providerTypeId && row.normalizedData?.type && <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-label="Unresolved provider type" />}
                </span>
            ),
        },
        {
            key: 'locality', header: 'Locality',
            accessor: (r) => r.normalizedData?.locality ?? '',
            cell: (row) => (
                <span className="inline-flex items-center gap-1">
                    {row.normalizedData?.locality || <span className="text-muted-foreground">—</span>}
                    {!row.normalizedData?.localityId && row.normalizedData?.locality && <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-label="Unresolved locality" />}
                </span>
            ),
        },
        { key: 'phone', header: 'Phone', accessor: (r) => r.normalizedData?.phone ?? '', cell: (row) => row.normalizedData?.phone || <span className="text-muted-foreground">—</span> },
        { key: 'status', header: 'Status', cell: (row) => <Badge tone={ROW_STATUS_TONE[row.status]}>{ROW_STATUS_LABELS[row.status]}</Badge> },
        { key: 'issues', header: 'Issues', cell: issuesCell },
    ];

    /* ── Render ── */
    return (
        <div className="space-y-6">
            <PageHeader
                title="Provider Import"
                description="Upload an Excel/CSV file of providers, review each staged row (validation, duplicates, resolved type & locality), then commit the approved ones into the live directory as unverified providers."
                crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Nearby Directory', href: '/admin/nearby' }, { label: 'Provider Import' }]}
                actions={batchesDemo ? <Badge tone="warning" dot pulse>Backend unavailable</Badge> : undefined}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload panel */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base"><Upload className="h-4 w-4" aria-hidden /> Upload a batch</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                        <p className="text-sm text-muted-foreground">
                            .xlsx or .csv, up to 5000 rows. Nothing touches the live directory until you approve rows and commit.
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.csv"
                            aria-label="Choose provider import file"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                            disabled={uploading}
                            className="block w-full text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3.5 file:py-2 file:text-sm file:font-medium file:text-primary-foreground file:cursor-pointer hover:file:opacity-90 disabled:opacity-60"
                        />
                        {uploading && <p className="text-xs text-muted-foreground">Uploading and parsing…</p>}
                    </CardContent>
                </Card>

                {/* Batch history */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4" aria-hidden /> Batch history</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {batchesError ? (
                            <ErrorState onRetry={() => setBatchesRefreshKey((k) => k + 1)} description={batchesError} />
                        ) : batchesLoading ? (
                            <SkeletonCard lines={3} />
                        ) : batches.length === 0 ? (
                            <EmptyState
                                icon={FileSpreadsheet}
                                title={batchesDemo ? 'Import pipeline requires a live backend connection' : 'No import batches yet'}
                                description={batchesDemo ? 'Batch history, review and commit all require the Nearby backend at localhost:5000.' : 'Upload a file to stage your first batch of providers.'}
                            />
                        ) : (
                            <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-2 pr-1">
                                {batches.map((b) => (
                                    <button
                                        key={b._id}
                                        onClick={() => selectBatch(b._id)}
                                        className={`w-full rounded-xl border px-3.5 py-2.5 text-left transition-colors ${b._id === selectedBatchId ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'}`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="font-medium text-foreground truncate">{b.fileName}</p>
                                            <Badge tone={BATCH_STATUS_TONE[b.status]}>{BATCH_STATUS_LABELS[b.status]}</Badge>
                                        </div>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {b.totalRows} rows · {b.stats.approved} approved · {b.stats.imported} imported · {formatDate(b.createdAt)}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {selectedBatch && (
                <>
                    <Card>
                        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
                            <div>
                                <CardTitle className="text-base">{selectedBatch.fileName}</CardTitle>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {selectedBatch.sheetName ? `Sheet “${selectedBatch.sheetName}” · ` : ''}
                                    {selectedBatch.totalRows} rows · uploaded {formatDate(selectedBatch.createdAt)}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge tone={BATCH_STATUS_TONE[selectedBatch.status]}>{BATCH_STATUS_LABELS[selectedBatch.status]}</Badge>
                                <Button onClick={() => setCommitConfirmOpen(true)} disabled={!canCommit} loading={committing}>
                                    <Import className="h-4 w-4" aria-hidden /> Import Approved Rows
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-4">
                            {selectedBatch.status === 'FAILED' && selectedBatch.errorSummary && (
                                <div className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
                                    {selectedBatch.errorSummary}
                                </div>
                            )}
                            <StatGrid>
                                <StatCard label="Valid" value={selectedBatch.stats.valid} icon={CheckCircle2} tone="emerald" />
                                <StatCard label="Invalid" value={selectedBatch.stats.invalid} icon={XCircle} tone="rose" />
                                <StatCard label="Duplicate" value={selectedBatch.stats.duplicate} icon={Copy} tone="amber" />
                                <StatCard label="Approved" value={selectedBatch.stats.approved} icon={ListChecks} tone="brand" />
                                <StatCard label="Rejected" value={selectedBatch.stats.rejected} icon={XCircle} tone="violet" />
                                <StatCard label="Imported" value={selectedBatch.stats.imported} icon={PlayCircle} tone="teal" />
                            </StatGrid>

                            {commitResult && (
                                <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm space-y-2">
                                    <p className="font-medium text-foreground">
                                        Last commit: {commitResult.imported} imported, {commitResult.failed} failed.
                                    </p>
                                    {commitResult.failures.length > 0 && (
                                        <ul className="space-y-1 text-xs text-danger">
                                            {commitResult.failures.map((f, i) => <li key={i}>Row {f.rowId}: {f.message}</li>)}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Row review */}
                    <Card>
                        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
                            <CardTitle className="text-base">Review rows</CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                                <Select
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value as RowStatus | ''); setRowsPage(1); setSelectedRowIds(new Set()); }}
                                    aria-label="Filter rows by status"
                                    className="h-9 w-auto min-w-40"
                                >
                                    <option value="">All statuses</option>
                                    {ROW_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{ROW_STATUS_LABELS[s]}</option>)}
                                </Select>
                                <Button size="sm" variant="outline" disabled={selectedRowIds.size === 0} loading={bulkLoading === 'APPROVE'} onClick={() => bulkDecide('APPROVE')}>
                                    Approve selected ({selectedRowIds.size})
                                </Button>
                                <Button size="sm" variant="ghost" disabled={selectedRowIds.size === 0} loading={bulkLoading === 'REJECT'} onClick={() => bulkDecide('REJECT')}>
                                    Reject selected
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                            {rowsError ? (
                                <ErrorState onRetry={refreshRows} description={rowsError} />
                            ) : rowsLoading ? (
                                <SkeletonTable rows={6} />
                            ) : (
                                <>
                                    <DataTable<ImportRow>
                                        columns={columns}
                                        data={rows}
                                        rowKey={(r) => r._id}
                                        searchable={false}
                                        pageSize={Math.max(rows.length, 1)}
                                        onRowClick={openDecision}
                                        emptyTitle="No rows match this filter"
                                        rowActions={(row) => (
                                            <div className="flex justify-end gap-1.5">
                                                <Button size="sm" variant="ghost" onClick={() => quickReject(row)} disabled={row.status === 'IMPORTED'}>Reject</Button>
                                                <Button size="sm" onClick={() => quickApprove(row)} disabled={row.status === 'IMPORTED'}>Approve</Button>
                                            </div>
                                        )}
                                    />
                                    {rowsTotal > ROWS_LIMIT && (
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <span className="tabular-nums">
                                                {(rowsPage - 1) * ROWS_LIMIT + 1}–{Math.min(rowsPage * ROWS_LIMIT, rowsTotal)} of {rowsTotal}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon-sm" aria-label="Previous page" disabled={rowsPage <= 1} onClick={() => setRowsPage((p) => p - 1)}>
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <span className="px-2 text-xs font-medium tabular-nums">
                                                    {rowsPage} / {Math.max(1, Math.ceil(rowsTotal / ROWS_LIMIT))}
                                                </span>
                                                <Button variant="ghost" size="icon-sm" aria-label="Next page" disabled={rowsPage >= Math.ceil(rowsTotal / ROWS_LIMIT)} onClick={() => setRowsPage((p) => p + 1)}>
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            <RowDecisionDialog
                open={decisionOpen}
                onClose={() => setDecisionOpen(false)}
                row={decisionRow}
                saving={decisionSaving}
                onDecide={(decision, editedData, reviewNotes) => decisionRow && decide(decisionRow, decision, editedData, reviewNotes)}
            />

            <Dialog
                open={commitConfirmOpen}
                onClose={() => setCommitConfirmOpen(false)}
                title="Import approved rows"
                description={selectedBatch ? `${selectedBatch.stats.approved} approved row(s) will be created as new, UNVERIFIED providers in the live directory. This does not affect rejected or pending rows, and is safe to re-run — already-imported rows are skipped.` : undefined}
                footer={
                    <>
                        <Button variant="outline" onClick={() => setCommitConfirmOpen(false)}>Cancel</Button>
                        <Button loading={committing} onClick={doCommit}>Import</Button>
                    </>
                }
            />
        </div>
    );
}
