'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, Link2, RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react';
import {
    PageHeader, StatCard, StatGrid, Badge, Button, Card, CardContent,
    Select, Label, DataTable, type Column, SkeletonTable,
} from '@/components/ui';
import {
    AuditEntry, VerifyResult, fetchAuditLogs, verifyChain,
    actorName, actorIdOf, formatWhen,
} from './_lib/api';

const ACTIONS = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'SIGN', 'ORDER', 'LOGIN'] as const;
const RESOURCES = ['EMR', 'Teleradiology', 'Patient', 'Billing', 'Consent'] as const;

const ACTION_TONE: Record<string, 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'> = {
    READ: 'info',
    CREATE: 'brand',
    UPDATE: 'warning',
    DELETE: 'danger',
    SIGN: 'success',
    ORDER: 'brand',
    LOGIN: 'neutral',
};

function statusTone(code?: number): 'success' | 'warning' | 'danger' | 'neutral' {
    if (!code) return 'neutral';
    if (code < 400) return 'success';
    if (code === 401 || code === 403) return 'danger';
    if (code < 500) return 'warning';
    return 'danger';
}

export default function AuditLogPage() {
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [demo, setDemo] = useState(false);
    const [loading, setLoading] = useState(true);

    const [actionFilter, setActionFilter] = useState('');
    const [resourceFilter, setResourceFilter] = useState('');

    const [verify, setVerify] = useState<VerifyResult | null>(null);
    const [verifyDemo, setVerifyDemo] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verifyBanner, setVerifyBanner] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchAuditLogs({
                action: actionFilter || undefined,
                resource: resourceFilter || undefined,
                limit: 100,
            });
            setEntries(res.data.entries);
            setTotal(res.data.total);
            setDemo(res.demo);
        } finally {
            setLoading(false);
        }
    }, [actionFilter, resourceFilter]);

    useEffect(() => {
        load();
    }, [load]);

    // Silent verification on mount feeds the chain-integrity StatCard.
    useEffect(() => {
        let active = true;
        verifyChain()
            .then((res) => {
                if (!active) return;
                setVerify(res.data);
                setVerifyDemo(res.demo);
            })
            .catch(() => { /* card shows em-dash */ });
        return () => { active = false; };
    }, []);

    const handleVerify = async () => {
        setVerifying(true);
        try {
            const res = await verifyChain();
            setVerify(res.data);
            setVerifyDemo(res.demo);
            setVerifyBanner(true);
        } catch {
            setVerify(null);
            setVerifyBanner(true);
        } finally {
            setVerifying(false);
        }
    };

    const lastEventAt = entries.length ? entries[0].at : undefined;

    const columns: Column<AuditEntry>[] = [
        {
            key: 'at',
            header: 'Time',
            sortable: true,
            accessor: (e) => e.at,
            cell: (e) => <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">{formatWhen(e.at)}</span>,
        },
        {
            key: 'actor',
            header: 'Actor',
            sortable: true,
            accessor: (e) => actorName(e),
            cell: (e) => (
                <div className="min-w-0">
                    <p className="font-semibold text-foreground">{actorName(e)}</p>
                    <p className="font-mono text-xs text-subtle-foreground">{e.actorRole || '—'} · {actorIdOf(e)}</p>
                </div>
            ),
        },
        {
            key: 'action',
            header: 'Action',
            sortable: true,
            accessor: (e) => e.action,
            cell: (e) => <Badge tone={ACTION_TONE[e.action] || 'neutral'} className="font-mono">{e.action}</Badge>,
        },
        {
            key: 'resource',
            header: 'Resource',
            sortable: true,
            accessor: (e) => e.resource,
            cell: (e) => (
                <div className="min-w-0">
                    <p className="text-sm text-foreground">{e.resource}</p>
                    {e.resourceId && <p className="font-mono text-xs text-subtle-foreground">{e.resourceId}</p>}
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            accessor: (e) => e.statusCode ?? 0,
            cell: (e) => <Badge tone={statusTone(e.statusCode)} dot>{e.statusCode ?? '—'}</Badge>,
        },
        {
            key: 'traceId',
            header: 'Trace',
            cell: (e) => <span className="font-mono text-xs text-muted-foreground">{e.traceId || '—'}</span>,
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Audit Log"
                description="Append-only, hash-chained record of every authenticated access across EMR, teleradiology, billing, consent and patient data."
                crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Audit Log' }]}
                actions={
                    <div className="flex items-center gap-2">
                        {demo && <Badge tone="warning" dot>Demo data — backend offline</Badge>}
                        <Button variant="outline" size="sm" onClick={load} loading={loading}>
                            <RefreshCw className="h-4 w-4" aria-hidden /> Refresh
                        </Button>
                        <Button size="sm" onClick={handleVerify} loading={verifying}>
                            <ShieldCheck className="h-4 w-4" aria-hidden /> Verify chain integrity
                        </Button>
                    </div>
                }
            />

            <StatGrid>
                <StatCard
                    label="Total events"
                    value={total.toLocaleString('en-IN')}
                    sub={demo ? 'Demo dataset' : 'Matching current filters'}
                    icon={Activity}
                    tone="brand"
                    delay={0}
                />
                <StatCard
                    label="Chain integrity"
                    value={verify ? (verify.valid ? 'Verified' : 'BROKEN') : '—'}
                    sub={
                        verify
                            ? `${verify.checkedCount.toLocaleString('en-IN')} link(s) checked${verifyDemo ? ' · demo' : ''}`
                            : 'Run verification'
                    }
                    icon={Link2}
                    tone={verify && !verify.valid ? 'rose' : 'emerald'}
                    delay={0.05}
                />
                <StatCard
                    label="Last event"
                    value={lastEventAt ? formatWhen(lastEventAt) : '—'}
                    sub={entries.length ? `seq #${entries[0].seq}` : 'No events yet'}
                    icon={Clock}
                    tone="violet"
                    delay={0.1}
                />
            </StatGrid>

            {verifyBanner && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className={`flex flex-wrap items-center gap-2 rounded-2xl border p-4 ${
                        verify?.valid
                            ? 'border-success/30 bg-success-soft'
                            : 'border-danger/30 bg-danger-soft'
                    }`}
                    role="status"
                >
                    {verify?.valid ? (
                        <ShieldCheck className="h-5 w-5 text-success" aria-hidden />
                    ) : (
                        <ShieldAlert className="h-5 w-5 text-danger" aria-hidden />
                    )}
                    {verify ? (
                        verify.valid ? (
                            <p className="text-sm font-medium text-success">
                                Chain intact — {verify.checkedCount.toLocaleString('en-IN')} entries re-hashed with no breaks.
                                {verifyDemo && ' (Demo verification — backend offline.)'}
                            </p>
                        ) : (
                            <p className="text-sm font-medium text-danger">
                                Chain broken at seq #{verify.firstBrokenSeq} — {verify.checkedCount.toLocaleString('en-IN')} entries
                                verified before the first mismatch. Entries at and after this point cannot be trusted.
                            </p>
                        )
                    ) : (
                        <p className="text-sm font-medium text-danger">Verification failed — could not reach the backend.</p>
                    )}
                </motion.div>
            )}

            <Card>
                <CardContent className="pt-5 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <div className="w-full sm:w-56">
                            <Label htmlFor="audit-action">Action</Label>
                            <Select id="audit-action" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                                <option value="">All actions</option>
                                {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                            </Select>
                        </div>
                        <div className="w-full sm:w-56">
                            <Label htmlFor="audit-resource">Resource</Label>
                            <Select id="audit-resource" value={resourceFilter} onChange={(e) => setResourceFilter(e.target.value)}>
                                <option value="">All resources</option>
                                {RESOURCES.map((r) => <option key={r} value={r}>{r}</option>)}
                            </Select>
                        </div>
                    </div>

                    {loading ? (
                        <SkeletonTable rows={6} />
                    ) : (
                        <DataTable<AuditEntry>
                            columns={columns}
                            data={entries}
                            rowKey={(e) => e._id}
                            searchPlaceholder="Search audit events…"
                            exportName="audit-log"
                            emptyTitle="No audit events"
                            emptyDescription="Authenticated activity across EMR, teleradiology, billing, consent and patient routes will appear here."
                            dense
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
