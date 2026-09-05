'use client';

import * as React from 'react';
import {
    Building2, CheckCircle2, Clock, UserCheck, ShieldCheck, ShieldQuestion, ShieldAlert, ShieldX,
    Stethoscope, Copy, MessageSquareWarning, Merge, Search,
} from 'lucide-react';
import {
    Badge, Button, Card, CardContent, CardHeader, CardTitle, DataTable, Dialog, EmptyState, ErrorState,
    Input, PageHeader, Select, SkeletonCard, SkeletonTable, StatCard, StatGrid, Tabs, TabsContent, TabsList,
    TabsTrigger, type Column,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
    ApiOfflineError, demoApplyMerge, demoApplyProviderUpdate, demoApplyVerify, fetchAdminProviders,
    fetchAllDoctors, findDuplicateCandidates, formatDate, mergeProviders, updateProviderCore, verifyProvider,
    PROVIDER_TYPE_LABELS, VERIFICATION_LABELS, VERIFICATION_TONE,
    type Doctor, type DuplicateCandidate, type Provider, type VerificationStatus,
} from './_lib/api';
import { EditProviderDialog } from './_components/edit-provider-dialog';

type ConfirmState = {
    title: string;
    description: React.ReactNode;
    confirmLabel: string;
    tone?: 'danger';
    onConfirm: () => void | Promise<void>;
};

const QUEUE_STATUSES: VerificationStatus[] = ['UNVERIFIED', 'CLAIMED'];

export default function NearbyAdminConsolePage() {
    const { toast } = useToast();

    const [providers, setProviders] = React.useState<Provider[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [demo, setDemo] = React.useState(false);
    const [refreshKey, setRefreshKey] = React.useState(0);
    const refresh = React.useCallback(() => setRefreshKey((k) => k + 1), []);

    const [doctors, setDoctors] = React.useState<Doctor[]>([]);
    const [doctorsLoading, setDoctorsLoading] = React.useState(true);

    const [search, setSearch] = React.useState('');
    const [typeFilter, setTypeFilter] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('');

    const [editOpen, setEditOpen] = React.useState(false);
    const [editTarget, setEditTarget] = React.useState<Provider | null>(null);
    const [savingEdit, setSavingEdit] = React.useState(false);

    const [confirm, setConfirm] = React.useState<ConfirmState | null>(null);
    const [confirmLoading, setConfirmLoading] = React.useState(false);

    const [mergeKeepId, setMergeKeepId] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetchAdminProviders()
            .then((res) => { if (!cancelled) { setProviders(res.data); setDemo(res.demo); } })
            .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load providers'))
            .finally(() => !cancelled && setLoading(false));
        return () => { cancelled = true; };
    }, [refreshKey]);

    React.useEffect(() => {
        if (providers.length === 0) { setDoctors([]); setDoctorsLoading(false); return; }
        let cancelled = false;
        setDoctorsLoading(true);
        fetchAllDoctors(providers)
            .then((res) => !cancelled && setDoctors(res.data))
            .catch(() => !cancelled && setDoctors([]))
            .finally(() => !cancelled && setDoctorsLoading(false));
        return () => { cancelled = true; };
    }, [providers]);

    const stats = React.useMemo(() => ({
        total: providers.length,
        verified: providers.filter((p) => p.verificationStatus === 'VERIFIED').length,
        pending: providers.filter((p) => p.verificationStatus === 'UNVERIFIED' || p.verificationStatus === 'CLAIMED').length,
        claimed: providers.filter((p) => !!p.claimedByUserId).length,
    }), [providers]);

    const queue = React.useMemo(() => providers.filter((p) => QUEUE_STATUSES.includes(p.verificationStatus)), [providers]);

    const filteredAll = React.useMemo(() => {
        let rows = providers;
        if (typeFilter) rows = rows.filter((p) => p.type === typeFilter);
        if (statusFilter) rows = rows.filter((p) => p.verificationStatus === statusFilter);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            rows = rows.filter((p) => [p.name, p.locality, p.city, p.phone].filter(Boolean).some((h) => String(h).toLowerCase().includes(q)));
        }
        return rows;
    }, [providers, typeFilter, statusFilter, search]);

    const duplicates = React.useMemo<DuplicateCandidate[]>(() => findDuplicateCandidates(providers), [providers]);

    /* ── Verification transitions ── */
    const applyVerify = async (provider: Provider, status: VerificationStatus) => {
        try {
            await verifyProvider(provider._id, status);
            toast('success', `${provider.name} → ${VERIFICATION_LABELS[status]}`, status === 'VERIFIED' ? 'Verification timestamp recorded.' : undefined);
            refresh();
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                demoApplyVerify(provider._id, status);
                setProviders((prev) => prev.map((p) => (p._id === provider._id ? { ...p, verificationStatus: status, careconnectVerified: status === 'VERIFIED' ? true : p.careconnectVerified, lastVerifiedAt: status === 'VERIFIED' ? new Date().toISOString() : p.lastVerifiedAt } : p)));
                toast('info', 'Applied to demo data', 'Backend offline — this state change is session-only, not silently faked as a real approval.');
            } else {
                toast('error', 'Status change failed', err instanceof Error ? err.message : undefined);
            }
        }
    };

    const confirmVerify = (provider: Provider, status: VerificationStatus, label: string, tone?: 'danger') => {
        const descriptions: Record<VerificationStatus, string> = {
            VERIFIED: `Approves ${provider.name} for the CareConnect Nearby directory and stamps today's date as the last-verified date.`,
            CLAIMED: `Reverts ${provider.name} to Claimed, awaiting another verification pass.`,
            UNVERIFIED: `Sends ${provider.name} back to Unverified — use this for reject / request-more-info outcomes. The provider owner will need to resubmit for review.`,
            SUSPENDED: `Marks ${provider.name} as temporarily unavailable and pauses online appointment booking.`,
            CLOSED: `Marks ${provider.name} as permanently closed and pauses online appointment booking.`,
        };
        setConfirm({
            title: label,
            description: descriptions[status],
            confirmLabel: label,
            tone,
            onConfirm: () => applyVerify(provider, status),
        });
    };

    /* ── Core field edit ── */
    const saveEdit = async (patch: Partial<Provider>) => {
        if (!editTarget) return;
        setSavingEdit(true);
        try {
            await updateProviderCore(editTarget._id, patch);
            toast('success', 'Provider updated', editTarget.name);
            setEditOpen(false);
            refresh();
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                demoApplyProviderUpdate(editTarget._id, patch);
                setProviders((prev) => prev.map((p) => (p._id === editTarget._id ? { ...p, ...patch } : p)));
                toast('info', 'Saved to demo data', 'Backend offline — this change is session-only.');
                setEditOpen(false);
            } else {
                toast('error', 'Save failed', err instanceof Error ? err.message : undefined);
            }
        } finally {
            setSavingEdit(false);
        }
    };

    const confirmDeactivate = (provider: Provider) => {
        confirmVerify(provider, 'CLOSED', 'Deactivate provider', 'danger');
    };

    /* ── Merge ── */
    const doMerge = async (keepId: string, mergeId: string) => {
        try {
            await mergeProviders(keepId, mergeId);
            toast('success', 'Providers merged', 'Doctors, services and appointments were moved to the kept record.');
            refresh();
        } catch (err) {
            if (err instanceof ApiOfflineError) {
                demoApplyMerge(keepId, mergeId);
                setProviders((prev) => prev.filter((p) => p._id !== mergeId));
                toast('info', 'Merged in demo data', 'Backend offline — this change is session-only.');
            } else {
                toast('error', 'Merge failed', err instanceof Error ? err.message : undefined);
            }
        }
    };

    const confirmMerge = (group: DuplicateCandidate) => {
        const keepId = mergeKeepId[group.key] ?? group.providers[0]._id;
        const mergeId = group.providers.find((p) => p._id !== keepId)?._id;
        if (!mergeId) return;
        const keep = group.providers.find((p) => p._id === keepId)!;
        const merge = group.providers.find((p) => p._id === mergeId)!;
        setConfirm({
            title: 'Merge duplicate providers',
            description: (
                <>
                    <span className="font-medium text-foreground">{merge.name}</span> will be merged into{' '}
                    <span className="font-medium text-foreground">{keep.name}</span>. Its doctors, services and appointments move to the
                    kept record, and the duplicate listing is removed. This cannot be undone from this console.
                </>
            ),
            confirmLabel: 'Merge',
            tone: 'danger',
            onConfirm: () => doMerge(keepId, mergeId),
        });
    };

    /* ── Columns ── */
    const queueColumns: Column<Provider>[] = [
        { key: 'name', header: 'Provider', sortable: true, cell: (p) => (
            <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.locality}{p.city ? `, ${p.city}` : ''}</p>
            </div>
        ) },
        { key: 'type', header: 'Type', cell: (p) => PROVIDER_TYPE_LABELS[p.type] ?? p.type },
        { key: 'status', header: 'Status', cell: (p) => <Badge tone={VERIFICATION_TONE[p.verificationStatus]}>{VERIFICATION_LABELS[p.verificationStatus]}</Badge> },
        { key: 'claimed', header: 'Claimed', cell: (p) => p.claimedByUserId ? <Badge tone="brand">Claimed</Badge> : <span className="text-muted-foreground">—</span> },
        { key: 'submitted', header: 'Added', cell: (p) => formatDate(p.createdAt) },
    ];

    const allColumns: Column<Provider>[] = [
        ...queueColumns,
        { key: 'appts', header: 'Booking', cell: (p) => p.appointmentEnabled ? <Badge tone="success">Enabled</Badge> : <Badge tone="neutral">Disabled</Badge> },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Nearby — Provider Directory Admin"
                description="Review, verify and maintain the CareConnect Nearby provider directory. This is a sample seed directory — not a claim of complete real-world onboarding."
                crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Nearby Directory' }]}
                actions={demo ? <Badge tone="warning" dot pulse>Demo data — backend offline</Badge> : undefined}
            />

            {error ? (
                <ErrorState onRetry={refresh} description={error} />
            ) : loading ? (
                <StatGrid>{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={1} />)}</StatGrid>
            ) : (
                <StatGrid>
                    <StatCard label="Total providers" value={stats.total} icon={Building2} tone="brand" delay={0} />
                    <StatCard label="Verified" value={stats.verified} icon={ShieldCheck} tone="emerald" delay={0.05} />
                    <StatCard label="Pending / unverified" value={stats.pending} icon={Clock} tone="amber" delay={0.1} />
                    <StatCard label="Claimed" value={stats.claimed} icon={UserCheck} tone="violet" delay={0.15} />
                </StatGrid>
            )}

            <Tabs defaultValue="queue">
                <div className="overflow-x-auto no-scrollbar">
                    <TabsList>
                        <TabsTrigger value="queue"><ShieldQuestion className="h-4 w-4" aria-hidden /> Verification Queue</TabsTrigger>
                        <TabsTrigger value="all"><Building2 className="h-4 w-4" aria-hidden /> All Providers</TabsTrigger>
                        <TabsTrigger value="doctors"><Stethoscope className="h-4 w-4" aria-hidden /> Doctors</TabsTrigger>
                        <TabsTrigger value="duplicates"><Copy className="h-4 w-4" aria-hidden /> Duplicates</TabsTrigger>
                        <TabsTrigger value="reports"><MessageSquareWarning className="h-4 w-4" aria-hidden /> Reports / Complaints</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="queue" className="space-y-3">
                    {loading ? <SkeletonTable rows={4} /> : (
                        <DataTable<Provider>
                            columns={queueColumns}
                            data={queue}
                            rowKey={(p) => p._id}
                            exportName="nearby-verification-queue"
                            emptyTitle="Queue is clear"
                            emptyDescription="No providers are waiting on verification right now."
                            rowActions={(p) => (
                                <div className="flex flex-wrap justify-end gap-1.5">
                                    <Button size="sm" onClick={() => confirmVerify(p, 'VERIFIED', 'Approve')}>
                                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Approve
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => confirmVerify(p, 'UNVERIFIED', 'Reject / request info')}>
                                        Reject / info
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => confirmVerify(p, 'SUSPENDED', 'Mark temporarily unavailable')}>
                                        <ShieldAlert className="h-3.5 w-3.5" aria-hidden /> Unavailable
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => confirmVerify(p, 'CLOSED', 'Mark closed', 'danger')}>
                                        <ShieldX className="h-3.5 w-3.5" aria-hidden /> Closed
                                    </Button>
                                </div>
                            )}
                        />
                    )}
                </TabsContent>

                <TabsContent value="all" className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="w-full max-w-xs">
                            <Input icon={<Search />} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, locality, phone…" aria-label="Search providers" className="h-9" />
                        </div>
                        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by type" className="h-9 w-auto min-w-40">
                            <option value="">All types</option>
                            {Object.entries(PROVIDER_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </Select>
                        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status" className="h-9 w-auto min-w-44">
                            <option value="">All statuses</option>
                            {Object.entries(VERIFICATION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </Select>
                    </div>
                    {loading ? <SkeletonTable rows={6} /> : (
                        <DataTable<Provider>
                            columns={allColumns}
                            data={filteredAll}
                            rowKey={(p) => p._id}
                            searchable={false}
                            exportName="nearby-providers"
                            onRowClick={(p) => { setEditTarget(p); setEditOpen(true); }}
                            emptyTitle="No providers match"
                            emptyDescription="Try clearing the search or filters."
                            rowActions={(p) => (
                                <Button size="sm" variant="ghost" onClick={() => confirmDeactivate(p)} disabled={p.verificationStatus === 'CLOSED'}>
                                    Deactivate
                                </Button>
                            )}
                        />
                    )}
                </TabsContent>

                <TabsContent value="doctors" className="space-y-3">
                    {doctorsLoading ? <SkeletonTable rows={4} /> : (
                        <DataTable<Doctor>
                            columns={[
                                { key: 'name', header: 'Doctor', sortable: true, cell: (d) => <span className="font-medium text-foreground">{d.name}</span> },
                                { key: 'specialty', header: 'Specialty', cell: (d) => d.specialty ?? '—' },
                                { key: 'qualification', header: 'Qualification', cell: (d) => <span className="text-muted-foreground">{d.qualification ?? '—'}</span> },
                                { key: 'provider', header: 'Provider', cell: (d) => providers.find((p) => p._id === d.providerId)?.name ?? d.providerId },
                                { key: 'active', header: 'Active', align: 'center', cell: (d) => d.active ? <Badge tone="success">Active</Badge> : <Badge tone="neutral">Inactive</Badge> },
                            ]}
                            data={doctors}
                            rowKey={(d) => d._id}
                            exportName="nearby-doctors"
                            emptyTitle="No doctors found"
                        />
                    )}
                </TabsContent>

                <TabsContent value="duplicates" className="space-y-3">
                    {loading ? <SkeletonTable rows={2} /> : duplicates.length === 0 ? (
                        <EmptyState icon={Copy} title="No likely duplicates found" description="Providers are grouped by normalized name + locality. Nothing matches right now." />
                    ) : (
                        <div className="space-y-4">
                            {duplicates.map((group) => {
                                const keepId = mergeKeepId[group.key] ?? group.providers[0]._id;
                                return (
                                    <Card key={group.key}>
                                        <CardHeader><CardTitle className="text-base">Possible duplicate — {group.providers.length} listings</CardTitle></CardHeader>
                                        <CardContent className="space-y-3 pt-0">
                                            {group.providers.map((p) => (
                                                <label key={p._id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 cursor-pointer hover:bg-muted/40">
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="radio"
                                                            name={`keep-${group.key}`}
                                                            checked={keepId === p._id}
                                                            onChange={() => setMergeKeepId((prev) => ({ ...prev, [group.key]: p._id }))}
                                                            className="h-4 w-4 accent-primary"
                                                            aria-label={`Keep ${p.name}`}
                                                        />
                                                        <div>
                                                            <p className="font-medium text-foreground">{p.name}</p>
                                                            <p className="text-xs text-muted-foreground">{p.locality} · {p.phone ?? 'no phone on file'} · Added {formatDate(p.createdAt)}</p>
                                                        </div>
                                                    </div>
                                                    <Badge tone={VERIFICATION_TONE[p.verificationStatus]}>{VERIFICATION_LABELS[p.verificationStatus]}</Badge>
                                                </label>
                                            ))}
                                            <div className="flex justify-end">
                                                <Button size="sm" variant="danger" onClick={() => confirmMerge(group)}>
                                                    <Merge className="h-3.5 w-3.5" aria-hidden /> Merge into selected
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="reports">
                    <EmptyState
                        icon={MessageSquareWarning}
                        title="No reporting pipeline yet"
                        description="User-reported issues will appear here once reporting is enabled. This tab intentionally shows no sample data."
                    />
                </TabsContent>
            </Tabs>

            <EditProviderDialog open={editOpen} onClose={() => setEditOpen(false)} provider={editTarget} saving={savingEdit} onSave={saveEdit} />

            <Dialog
                open={!!confirm}
                onClose={() => setConfirm(null)}
                title={confirm?.title}
                description={confirm?.description}
                footer={
                    <>
                        <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
                        <Button
                            variant={confirm?.tone === 'danger' ? 'danger' : 'primary'}
                            loading={confirmLoading}
                            onClick={async () => {
                                if (!confirm) return;
                                setConfirmLoading(true);
                                try {
                                    await confirm.onConfirm();
                                } finally {
                                    setConfirmLoading(false);
                                    setConfirm(null);
                                }
                            }}
                        >
                            {confirm?.confirmLabel}
                        </Button>
                    </>
                }
            />
        </div>
    );
}
