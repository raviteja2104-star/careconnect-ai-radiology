'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
    AlertTriangle,
    FlaskConical,
    Microscope,
    RefreshCw,
    Send,
    ShieldCheck,
    TestTubes,
} from 'lucide-react';
import {
    Badge,
    Button,
    DataTable,
    ErrorState,
    PageHeader,
    SkeletonTable,
    StatCard,
    StatGrid,
    type Column,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import {
    fetchWorklist,
    formatWhen,
    isToday,
    PRIORITY_META,
    STATUS_META,
    unackedCriticals,
    type LabPriority,
    type LabStatus,
    type WorklistItem,
} from '../_lib/api';

const REFETCH_MS = 30_000;

const STATUS_CHIPS: Array<{ value: LabStatus | ''; label: string }> = [
    { value: '', label: 'All statuses' },
    { value: 'ORDERED', label: 'Ordered' },
    { value: 'SAMPLE_COLLECTED', label: 'Collected' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'RESULT_PENDING', label: 'Result pending' },
    { value: 'VERIFICATION_PENDING', label: 'Verification' },
    { value: 'VERIFIED', label: 'Verified' },
    { value: 'RELEASED', label: 'Released' },
    { value: 'REJECTED', label: 'Rejected' },
];

const PRIORITY_CHIPS: Array<{ value: LabPriority | ''; label: string }> = [
    { value: '', label: 'All priorities' },
    { value: 'routine', label: 'Routine' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'stat', label: 'STAT' },
    { value: 'emergency', label: 'Emergency' },
];

function Chip({ active, onClick, children, danger }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    danger?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                active
                    ? danger
                        ? 'border-danger bg-danger text-white'
                        : 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
        >
            {children}
        </button>
    );
}

export default function LabWorklistPage() {
    const router = useRouter();
    const [items, setItems] = React.useState<WorklistItem[] | null>(null);
    const [demo, setDemo] = React.useState(false);
    const [error, setError] = React.useState(false);
    const [status, setStatus] = React.useState<LabStatus | ''>('');
    const [priority, setPriority] = React.useState<LabPriority | ''>('');
    const [refreshing, setRefreshing] = React.useState(false);

    const load = React.useCallback(async (background = false) => {
        if (!background) setRefreshing(true);
        try {
            const res = await fetchWorklist();
            setItems(res.data);
            setDemo(res.demo);
            setError(false);
        } catch {
            setError(true);
        } finally {
            if (!background) setRefreshing(false);
        }
    }, []);

    React.useEffect(() => {
        load();
        const t = setInterval(() => load(true), REFETCH_MS);
        return () => clearInterval(t);
    }, [load]);

    const all = React.useMemo(() => items ?? [], [items]);

    const stats = React.useMemo(() => ({
        pendingSamples: all.filter((i) => i.status === 'ORDERED').length,
        processing: all.filter((i) => i.status === 'SAMPLE_COLLECTED' || i.status === 'PROCESSING').length,
        awaitingVerification: all.filter((i) => i.status === 'RESULT_PENDING' || i.status === 'VERIFICATION_PENDING').length,
        releasedToday: all.filter((i) => i.status === 'RELEASED' && isToday(i.releasedAt)).length,
        criticalUnacked: all.reduce((n, i) => n + unackedCriticals(i).length, 0),
    }), [all]);

    const filtered = React.useMemo(() => {
        let out = all;
        if (status) out = out.filter((i) => i.status === status);
        if (priority) out = out.filter((i) => i.priority === priority);
        return out;
    }, [all, status, priority]);

    const columns = React.useMemo<Column<WorklistItem>[]>(() => [
        {
            key: 'labNumber',
            header: 'Lab No',
            sortable: true,
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums">{row.labNumber}</span>
                    {unackedCriticals(row).length > 0 && (
                        <Badge tone="danger" dot pulse>Critical</Badge>
                    )}
                </div>
            ),
            accessor: (row) => row.labNumber,
        },
        {
            key: 'patient',
            header: 'Patient',
            sortable: true,
            cell: (row) => <span className="font-medium">{row.patientId?.name || '—'}</span>,
            accessor: (row) => row.patientId?.name || '',
        },
        {
            key: 'tests',
            header: 'Tests',
            cell: (row) => (
                <span className="block max-w-56 truncate text-muted-foreground" title={row.tests.map((t) => t.name).join(', ')}>
                    {row.tests.map((t) => t.name).join(', ') || '—'}
                </span>
            ),
            accessor: (row) => row.tests.map((t) => `${t.name} ${t.code}`).join(' '),
        },
        {
            key: 'specimen',
            header: 'Specimen',
            cell: (row) => {
                const specimens = Array.from(new Set(row.tests.map((t) => t.specimen).filter(Boolean)));
                return <span className="text-muted-foreground">{specimens.join(', ') || '—'}</span>;
            },
            accessor: (row) => row.tests.map((t) => t.specimen || '').join(' '),
        },
        {
            key: 'priority',
            header: 'Priority',
            sortable: true,
            cell: (row) => {
                const meta = PRIORITY_META[row.priority] ?? PRIORITY_META.routine;
                return <Badge tone={meta.tone} dot={meta.pulse} pulse={meta.pulse}>{meta.label}</Badge>;
            },
            accessor: (row) => row.priority,
        },
        {
            key: 'collected',
            header: 'Collected',
            sortable: true,
            cell: (row) => <span className="text-muted-foreground tabular-nums">{formatWhen(row.sample?.collectedAt)}</span>,
            accessor: (row) => row.sample?.collectedAt || '',
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            cell: (row) => {
                const meta = STATUS_META[row.status] ?? { label: row.status, tone: 'neutral' as const };
                return <Badge tone={meta.tone} dot>{meta.label}</Badge>;
            },
            accessor: (row) => row.status,
        },
        {
            key: 'doctor',
            header: 'Ordering doctor',
            cell: (row) => <span className="text-muted-foreground">{row.orderingDoctorId?.name || '—'}</span>,
            accessor: (row) => row.orderingDoctorId?.name || '',
        },
    ], []);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Laboratory Worklist"
                description="Track samples from collection through verification and release."
                crumbs={[{ label: 'Laboratory' }, { label: 'Worklist' }]}
                actions={
                    <div className="flex items-center gap-3">
                        {demo && <Badge tone="warning" dot>Demo data — backend offline</Badge>}
                        <Button variant="outline" size="sm" onClick={() => load()} loading={refreshing}>
                            <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Refresh
                        </Button>
                    </div>
                }
            />

            <StatGrid className="xl:grid-cols-5">
                <StatCard label="Pending samples" value={stats.pendingSamples} sub="Awaiting collection" icon={TestTubes} tone="brand" delay={0} />
                <StatCard label="Processing" value={stats.processing} sub="Collected & on analysers" icon={FlaskConical} tone="teal" delay={0.05} />
                <StatCard label="Awaiting verification" value={stats.awaitingVerification} sub="Entry & sign-off queue" icon={Microscope} tone="violet" delay={0.1} />
                <StatCard label="Released today" value={stats.releasedToday} sub="Reports sent out" icon={Send} tone="emerald" delay={0.15} />
                <StatCard
                    label="Critical unacknowledged"
                    value={stats.criticalUnacked}
                    sub={stats.criticalUnacked > 0 ? 'Needs immediate notification' : 'All acknowledged'}
                    icon={stats.criticalUnacked > 0 ? AlertTriangle : ShieldCheck}
                    tone={stats.criticalUnacked > 0 ? 'rose' : 'emerald'}
                    delay={0.2}
                />
            </StatGrid>

            <div className="flex flex-wrap items-center gap-2">
                {STATUS_CHIPS.map((c) => (
                    <Chip key={c.value || 'all'} active={status === c.value} onClick={() => setStatus(c.value)} danger={c.value === 'REJECTED'}>
                        {c.label}
                    </Chip>
                ))}
                <span className="mx-1 hidden h-4 w-px bg-border sm:block" aria-hidden />
                {PRIORITY_CHIPS.map((c) => (
                    <Chip
                        key={c.value || 'all'}
                        active={priority === c.value}
                        onClick={() => setPriority(c.value)}
                        danger={c.value === 'stat' || c.value === 'emergency'}
                    >
                        {c.label}
                    </Chip>
                ))}
            </div>

            {error && items === null ? (
                <ErrorState onRetry={() => load()} />
            ) : items === null ? (
                <SkeletonTable />
            ) : (
                <DataTable<WorklistItem>
                    columns={columns}
                    data={filtered}
                    rowKey={(row) => row._id}
                    searchPlaceholder="Search lab no, patient, test…"
                    exportName="lab-worklist"
                    onRowClick={(row) => router.push(`/lab/results/${row._id}`)}
                    emptyTitle="No worklist items"
                    emptyDescription="No lab orders match the current filters."
                />
            )}
        </div>
    );
}
