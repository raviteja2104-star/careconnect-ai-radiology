'use client';

import * as React from 'react';
import { Share2, Plus, ShieldX, WifiOff, History } from 'lucide-react';
import {
    PageHeader, StatGrid, StatCard, Badge, Button, Card, CardContent, DataTable, Dialog, EmptyState, ErrorState,
    Input, Label, Select, Textarea, SkeletonTable, FieldHint, Tabs, TabsList, TabsTrigger,
    TabsContent, type Column,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useSession } from '@/components/providers/SessionProvider';
import { UserSearchSelector } from '@/components/health-records/UserSearchSelector';
import {
    fetchShares, createShare, revokeShare, fetchAccessHistory,
    ApiOfflineError, ApiHttpError, formatDate, formatDateTime,
    SHARE_SCOPE_LABELS, SHARE_STATUS_TONE, HEALTH_DOCUMENT_TYPES, documentTypeLabel,
    type RecordShare, type ShareScope, type AuditEntry, type UserSearchResult,
} from '../_lib/api';

function granteeLabel(s: RecordShare): string {
    return s.sharedWithLabel || s.sharedWithUserId || s.sharedWithProviderId || '—';
}

export default function RecordSharingPage() {
    const { session } = useSession();
    const patientId = session.userId;
    const { toast } = useToast();

    const [shares, setShares] = React.useState<RecordShare[]>([]);
    const [sharesDemo, setSharesDemo] = React.useState(false);
    const [sharesLoading, setSharesLoading] = React.useState(true);
    const [sharesError, setSharesError] = React.useState<string | null>(null);

    const [history, setHistory] = React.useState<AuditEntry[]>([]);
    const [historyDemo, setHistoryDemo] = React.useState(false);
    const [historyLoading, setHistoryLoading] = React.useState(true);
    const [historyError, setHistoryError] = React.useState<string | null>(null);

    const [refreshKey, setRefreshKey] = React.useState(0);
    const refresh = React.useCallback(() => setRefreshKey((k) => k + 1), []);

    const [createOpen, setCreateOpen] = React.useState(false);
    const [creating, setCreating] = React.useState(false);
    const [confirming, setConfirming] = React.useState(false);

    // Grantee — either a searched CareConnect user or a free-text external label.
    const [selectedGrantee, setSelectedGrantee] = React.useState<UserSearchResult | null>(null);
    const [externalLabel, setExternalLabel] = React.useState('');
    const [scope, setScope] = React.useState<ShareScope>('ALL_RECORDS');
    const [scopeDocumentTypes, setScopeDocumentTypes] = React.useState<string[]>([]);
    const [scopeDocumentIdsRaw, setScopeDocumentIdsRaw] = React.useState('');
    const [expiresAt, setExpiresAt] = React.useState('');

    const [revokeTarget, setRevokeTarget] = React.useState<RecordShare | null>(null);
    const [revoking, setRevoking] = React.useState(false);

    React.useEffect(() => {
        let cancelled = false;
        setSharesLoading(true);
        setSharesError(null);
        fetchShares(patientId)
            .then((res) => { if (!cancelled) { setShares(res.data); setSharesDemo(res.demo); } })
            .catch((err) => !cancelled && setSharesError(err instanceof Error ? err.message : 'Failed to load shares'))
            .finally(() => !cancelled && setSharesLoading(false));
        return () => { cancelled = true; };
    }, [patientId, refreshKey]);

    React.useEffect(() => {
        let cancelled = false;
        setHistoryLoading(true);
        setHistoryError(null);
        fetchAccessHistory(patientId)
            .then((res) => { if (!cancelled) { setHistory(res.data); setHistoryDemo(res.demo); } })
            .catch((err) => !cancelled && setHistoryError(err instanceof Error ? err.message : 'Failed to load access history'))
            .finally(() => !cancelled && setHistoryLoading(false));
        return () => { cancelled = true; };
    }, [patientId, refreshKey]);

    const resetCreateForm = () => {
        setSelectedGrantee(null);
        setExternalLabel('');
        setScope('ALL_RECORDS');
        setScopeDocumentTypes([]);
        setScopeDocumentIdsRaw('');
        setExpiresAt('');
        setConfirming(false);
    };

    // A share has a grantee if they selected a CareConnect user OR provided an external label.
    const hasGrantee = selectedGrantee !== null || externalLabel.trim().length > 0;

    function handleReviewAndConfirm() {
        if (!hasGrantee) {
            toast('warning', 'Identify the grantee', 'Search for a CareConnect user or enter an external label (e.g. "Dr. Meera Nair, Apollo").');
            return;
        }
        if (scope === 'DOCUMENT_TYPE' && scopeDocumentTypes.length === 0) {
            toast('warning', 'Pick at least one document type');
            return;
        }
        const scopeDocumentIds = scopeDocumentIdsRaw.split(',').map((s) => s.trim()).filter(Boolean);
        if (scope === 'SPECIFIC_DOCUMENT' && scopeDocumentIds.length === 0) {
            toast('warning', 'Add at least one document ID');
            return;
        }
        setConfirming(true);
    }

    const submitCreate = async () => {
        const scopeDocumentIds = scopeDocumentIdsRaw.split(',').map((s) => s.trim()).filter(Boolean);
        setCreating(true);
        try {
            const created = await createShare(patientId, {
                sharedWithUserId: selectedGrantee?.id || undefined,
                // Use the selected user's display name as the label when available,
                // otherwise use the manually entered external label.
                sharedWithLabel: selectedGrantee ? selectedGrantee.displayName : (externalLabel.trim() || undefined),
                scope,
                scopeDocumentTypes: scope === 'DOCUMENT_TYPE' ? scopeDocumentTypes : undefined,
                scopeDocumentIds: scope === 'SPECIFIC_DOCUMENT' ? scopeDocumentIds : undefined,
                expiresAt: expiresAt || undefined,
            });
            setShares((prev) => [created, ...prev]);
            toast('success', 'Share grant created', `${SHARE_SCOPE_LABELS[scope]} shared with ${granteeLabel(created)}.`);
            setCreateOpen(false);
            resetCreateForm();
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                toast('error', 'Backend unreachable', 'Could not create the share grant right now.');
            } else if (err instanceof ApiHttpError) {
                toast('error', 'Could not create share', err.message);
            } else {
                toast('error', 'Could not create share', err instanceof Error ? err.message : undefined);
            }
        } finally {
            setCreating(false);
        }
    };

    const submitRevoke = async () => {
        if (!revokeTarget) return;
        setRevoking(true);
        try {
            const updated = await revokeShare(revokeTarget._id);
            setShares((prev) => prev.map((s) => s._id === updated._id ? updated : s));
            toast('success', 'Share revoked');
            setRevokeTarget(null);
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                toast('error', 'Backend unreachable', 'Could not revoke this share right now.');
            } else if (err instanceof ApiHttpError) {
                toast('error', 'Could not revoke share', err.message);
            } else {
                toast('error', 'Could not revoke share', err instanceof Error ? err.message : undefined);
            }
        } finally {
            setRevoking(false);
        }
    };

    const activeShares = shares.filter((s) => s.status === 'ACTIVE');

    const shareColumns: Column<RecordShare>[] = [
        { key: 'grantee', header: 'Shared with', sortable: true, accessor: (s) => granteeLabel(s), cell: (s) => <span className="font-medium text-foreground">{granteeLabel(s)}</span> },
        { key: 'scope', header: 'Scope', cell: (s) => (
            <div>
                <Badge tone="brand">{SHARE_SCOPE_LABELS[s.scope]}</Badge>
                {s.scope === 'DOCUMENT_TYPE' && s.scopeDocumentTypes && s.scopeDocumentTypes.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">{s.scopeDocumentTypes.map(documentTypeLabel).join(', ')}</p>
                )}
            </div>
        ) },
        { key: 'status', header: 'Status', cell: (s) => <Badge tone={SHARE_STATUS_TONE[s.status]}>{s.status}</Badge> },
        { key: 'grantedAt', header: 'Granted', sortable: true, accessor: (s) => s.grantedAt, cell: (s) => formatDate(s.grantedAt) },
        { key: 'expiresAt', header: 'Expires', cell: (s) => s.expiresAt ? formatDate(s.expiresAt) : 'No expiry' },
    ];

    const historyColumns: Column<AuditEntry>[] = [
        { key: 'at', header: 'When', sortable: true, accessor: (e) => e.at, cell: (e) => formatDateTime(e.at) },
        { key: 'action', header: 'Action', cell: (e) => <span className="font-medium text-foreground">{e.action}</span> },
        { key: 'resource', header: 'Resource', cell: (e) => <span className="text-muted-foreground">{e.resource}{e.resourceId ? ` · ${String(e.resourceId).slice(-8)}` : ''}</span> },
        { key: 'actorRole', header: 'Actor role', cell: (e) => <Badge tone="outline">{e.actorRole || 'unknown'}</Badge> },
        { key: 'statusCode', header: 'Result', cell: (e) => <Badge tone={e.statusCode < 400 ? 'success' : 'danger'}>{e.statusCode}</Badge> },
    ];

    const granteeDisplayName = selectedGrantee
        ? selectedGrantee.displayName
        : externalLabel.trim() || '—';

    return (
        <div className="space-y-6">
            <PageHeader
                title="Record Sharing"
                description="Control exactly who can see your health records, and see who has actually accessed them."
                crumbs={[{ label: 'Home', href: '/' }, { label: 'Health Records', href: '/health-records' }, { label: 'Record Sharing' }]}
                actions={
                    <>
                        {(sharesDemo || historyDemo) && <Badge tone="warning" dot pulse><WifiOff className="h-3.5 w-3.5" aria-hidden /> Backend offline</Badge>}
                        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" aria-hidden /> Share records</Button>
                    </>
                }
            />

            <StatGrid>
                <StatCard label="Active shares" value={activeShares.length} icon={Share2} tone="brand" delay={0} />
                <StatCard label="Access log entries" value={history.length} icon={History} tone="violet" delay={0.05} />
            </StatGrid>

            <Tabs defaultValue="shares">
                <TabsList>
                    <TabsTrigger value="shares"><Share2 className="h-4 w-4" aria-hidden /> Active Shares</TabsTrigger>
                    <TabsTrigger value="history"><History className="h-4 w-4" aria-hidden /> Access History</TabsTrigger>
                </TabsList>

                <TabsContent value="shares">
                    {sharesError ? (
                        <ErrorState onRetry={refresh} description={sharesError} />
                    ) : sharesLoading ? (
                        <SkeletonTable rows={4} />
                    ) : sharesDemo && shares.length === 0 ? (
                        <EmptyState
                            icon={WifiOff}
                            title="Requires a live backend connection"
                            description="Share grants are real, revocable consent records — nothing here is simulated. Start the backend at localhost:5000 and reload."
                            action={{ label: 'Retry', onClick: refresh }}
                        />
                    ) : (
                        <DataTable<RecordShare>
                            columns={shareColumns}
                            data={shares}
                            rowKey={(s) => s._id}
                            exportName="record-shares"
                            emptyTitle="No shares yet"
                            emptyDescription="Share your records with a doctor, family member or lab using the button above."
                            rowActions={(s) => s.status === 'ACTIVE' ? (
                                <Button size="sm" variant="danger" onClick={() => setRevokeTarget(s)}>
                                    <ShieldX className="h-3.5 w-3.5" aria-hidden /> Revoke
                                </Button>
                            ) : null}
                        />
                    )}
                </TabsContent>

                <TabsContent value="history">
                    {historyError ? (
                        <ErrorState onRetry={refresh} description={historyError} />
                    ) : historyLoading ? (
                        <SkeletonTable rows={4} />
                    ) : historyDemo && history.length === 0 ? (
                        <EmptyState
                            icon={WifiOff}
                            title="Requires a live backend connection"
                            description="Access history reads the real hash-chained audit log — nothing here is simulated. Start the backend at localhost:5000 and reload."
                            action={{ label: 'Retry', onClick: refresh }}
                        />
                    ) : (
                        <DataTable<AuditEntry>
                            columns={historyColumns}
                            data={history}
                            rowKey={(e) => String(e.seq)}
                            exportName="access-history"
                            emptyTitle="No access recorded yet"
                            emptyDescription="Every read or write against your health records is hash-chain audited and will appear here."
                        />
                    )}
                </TabsContent>
            </Tabs>

            {/* Create share dialog — two-step: configure → confirm → write */}
            <Dialog
                open={createOpen}
                onClose={() => { if (!creating) { setCreateOpen(false); resetCreateForm(); } }}
                title={confirming ? 'Confirm share grant' : 'Share your records'}
                description={
                    confirming
                        ? 'Verify the grantee and scope before granting access.'
                        : 'Choose who to share with and what they can see. You can revoke this at any time.'
                }
                size="lg"
                footer={
                    confirming ? (
                        <>
                            <Button variant="outline" onClick={() => setConfirming(false)} disabled={creating}>Back</Button>
                            <Button loading={creating} onClick={submitCreate}>Confirm — create share</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => { setCreateOpen(false); resetCreateForm(); }} disabled={creating}>Cancel</Button>
                            <Button onClick={handleReviewAndConfirm} disabled={!hasGrantee}>Review &amp; confirm</Button>
                        </>
                    )
                }
            >
                {confirming ? (
                    /* ── Confirmation step ── */
                    <div className="space-y-4">
                        <Card>
                            <CardContent className="pt-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sharing with</p>
                                <p className="mt-2 text-lg font-semibold text-foreground">{granteeDisplayName}</p>
                                {selectedGrantee && (
                                    <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                                        {selectedGrantee.maskedPhone && <p>Mobile: <span className="font-mono">{selectedGrantee.maskedPhone}</span></p>}
                                        {selectedGrantee.maskedEmail && <p>Email: <span className="font-mono">{selectedGrantee.maskedEmail}</span></p>}
                                        <p>CareConnect ID: <span className="font-mono">{selectedGrantee.ccDisplayId}</span></p>
                                    </div>
                                )}
                                {!selectedGrantee && (
                                    <p className="mt-1 text-sm text-muted-foreground">External party (not a CareConnect user)</p>
                                )}
                            </CardContent>
                        </Card>
                        <div className="rounded-xl border border-border p-4 text-sm">
                            <p className="font-medium text-foreground">Scope: {SHARE_SCOPE_LABELS[scope]}</p>
                            {scope === 'DOCUMENT_TYPE' && scopeDocumentTypes.length > 0 && (
                                <p className="mt-1 text-muted-foreground">{scopeDocumentTypes.map(documentTypeLabel).join(', ')}</p>
                            )}
                            {scope === 'SPECIFIC_DOCUMENT' && scopeDocumentIdsRaw && (
                                <p className="mt-1 text-xs font-mono text-muted-foreground">{scopeDocumentIdsRaw}</p>
                            )}
                        </div>
                        {expiresAt && (
                            <p className="text-sm text-muted-foreground">
                                Expires: <span className="font-medium text-foreground">{formatDate(expiresAt)}</span>
                            </p>
                        )}
                    </div>
                ) : (
                    /* ── Configure step ── */
                    <div className="space-y-4">
                        {/* CareConnect user search */}
                        <div>
                            <Label>Share with a CareConnect user</Label>
                            <UserSearchSelector
                                selected={selectedGrantee}
                                onSelect={(u) => { setSelectedGrantee(u); if (u) setExternalLabel(''); }}
                                placeholder="Search by name or phone number"
                                className="mt-1.5"
                                disabled={externalLabel.trim().length > 0}
                            />
                        </div>

                        {/* OR divider */}
                        <div className="flex items-center gap-3">
                            <hr className="flex-1 border-border" />
                            <span className="text-xs font-medium text-muted-foreground">or share with an external party</span>
                            <hr className="flex-1 border-border" />
                        </div>

                        {/* External label — for doctors/labs not yet on CareConnect */}
                        <div>
                            <Label htmlFor="externalLabel">External grantee label</Label>
                            <Input
                                id="externalLabel"
                                value={externalLabel}
                                onChange={(e) => { setExternalLabel(e.target.value); if (e.target.value.trim()) setSelectedGrantee(null); }}
                                placeholder="e.g. Dr. Meera Nair, Apollo Cardiology"
                                disabled={selectedGrantee !== null}
                            />
                            <FieldHint>Use this only for parties not yet on CareConnect. Access cannot be verified the same way as a CareConnect account.</FieldHint>
                        </div>

                        {/* Scope */}
                        <div>
                            <Label htmlFor="scope">Scope</Label>
                            <Select id="scope" value={scope} onChange={(e) => setScope(e.target.value as ShareScope)}>
                                {Object.entries(SHARE_SCOPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </Select>
                        </div>

                        {scope === 'DOCUMENT_TYPE' && (
                            <div className="rounded-xl border border-border p-3">
                                <p className="mb-2 text-sm font-medium text-foreground">Document types to share</p>
                                <div className="flex flex-wrap gap-2">
                                    {HEALTH_DOCUMENT_TYPES.map((t) => {
                                        const checked = scopeDocumentTypes.includes(t);
                                        return (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setScopeDocumentTypes((prev) => checked ? prev.filter((x) => x !== t) : [...prev, t])}
                                                className="focus-visible:outline-none"
                                            >
                                                <Badge tone={checked ? 'brand' : 'outline'}>{documentTypeLabel(t)}</Badge>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {scope === 'SPECIFIC_DOCUMENT' && (
                            <div>
                                <Label htmlFor="scopeDocumentIds">Document IDs (comma-separated)</Label>
                                <Textarea id="scopeDocumentIds" value={scopeDocumentIdsRaw} onChange={(e) => setScopeDocumentIdsRaw(e.target.value)} rows={2} placeholder="65f0..., 65f1..." />
                                <FieldHint>Paste document IDs from your timeline.</FieldHint>
                            </div>
                        )}

                        <div>
                            <Label htmlFor="expiresAt">Expires on (optional)</Label>
                            <input
                                id="expiresAt"
                                type="date"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>
                )}
            </Dialog>

            {/* Revoke dialog */}
            <Dialog
                open={!!revokeTarget}
                onClose={() => !revoking && setRevokeTarget(null)}
                title="Revoke this share"
                description={revokeTarget ? `${granteeLabel(revokeTarget)} will immediately lose access to your shared records.` : undefined}
                footer={
                    <>
                        <Button variant="outline" onClick={() => setRevokeTarget(null)} disabled={revoking}>Cancel</Button>
                        <Button variant="danger" loading={revoking} onClick={submitRevoke}>Revoke</Button>
                    </>
                }
            />
        </div>
    );
}
