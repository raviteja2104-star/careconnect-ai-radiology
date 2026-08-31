'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Activity, AlertTriangle, Inbox, Siren, Sparkles, TimerOff, UserCheck,
} from 'lucide-react';
import {
    Badge, Button, DataTable, PageHeader, Select, SkeletonTable, StatCard, StatGrid,
    type Column,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
    ApiHttpError, assignedName, claimStudy, fetchWorklist, isBreached, patientName,
    type Study, type WorklistFilters,
} from '../_lib/api';
import {
    AiFlagCell, DemoBadge, FilterChip, PriorityBadge, SlaCell, StatusBadge, StudyAgeCell,
} from '../_lib/shared';

const REFETCH_MS = 30_000;

const MODALITIES = ['CT', 'MRI', 'XR', 'US', 'MG'];
const STATUSES = ['ORDERED', 'RECEIVED', 'UNREAD', 'IN_PROGRESS', 'DRAFT', 'REVIEW', 'SIGNED', 'DELIVERED'];

export default function TeleradiologyWorklistPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [filters, setFilters] = React.useState<WorklistFilters>({});

    // Unfiltered list drives the KPI row; the filtered query drives the table
    // and exercises the real server-side filter params.
    const baseQuery = useQuery({
        queryKey: ['telerad', 'worklist', 'all'],
        queryFn: () => fetchWorklist({}),
        refetchInterval: REFETCH_MS,
    });
    const listQuery = useQuery({
        queryKey: ['telerad', 'worklist', filters],
        queryFn: () => fetchWorklist(filters),
        refetchInterval: REFETCH_MS,
    });

    const claim = useMutation({
        mutationFn: (studyId: string) => claimStudy(studyId),
        onSuccess: ({ data, demo }) => {
            toast('success', `Claimed ${data.accessionNumber}`, demo ? 'Demo mode — not persisted to backend' : undefined);
            queryClient.invalidateQueries({ queryKey: ['telerad'] });
        },
        onError: (err) => {
            toast('error', 'Could not claim study', err instanceof ApiHttpError ? err.message : 'Unexpected error');
        },
    });

    const all = React.useMemo(() => baseQuery.data?.data ?? [], [baseQuery.data]);
    const rows = listQuery.data?.data ?? [];
    const demo = Boolean(listQuery.data?.demo || baseQuery.data?.demo);

    const kpis = React.useMemo(() => ({
        unread: all.filter((s) => s.status === 'UNREAD').length,
        inProgress: all.filter((s) => s.status === 'IN_PROGRESS' || s.status === 'DRAFT' || s.status === 'REVIEW').length,
        statPending: all.filter(
            (s) => (s.priority === 'stat' || s.priority === 'emergency') && s.status !== 'SIGNED' && s.status !== 'DELIVERED'
        ).length,
        breaches: all.filter(isBreached).length,
    }), [all]);

    const toggle = (key: 'aiFlagged' | 'slaBreached' | 'assignedToMe') =>
        setFilters((f) => ({ ...f, [key]: f[key] ? undefined : true }));

    const togglePriority = (p: 'stat' | 'emergency') =>
        setFilters((f) => ({ ...f, priority: f.priority === p ? undefined : p }));

    const columns: Column<Study>[] = [
        {
            key: 'priority',
            header: 'Priority',
            sortable: true,
            accessor: (s) => ({ emergency: 0, stat: 1, urgent: 2, routine: 3 }[s.priority] ?? 9),
            cell: (s) => <PriorityBadge priority={s.priority} />,
        },
        {
            key: 'accessionNumber',
            header: 'Accession',
            sortable: true,
            cell: (s) => <span className="font-mono text-xs font-medium text-foreground">{s.accessionNumber}</span>,
        },
        {
            key: 'patient',
            header: 'Patient',
            sortable: true,
            accessor: (s) => patientName(s),
            cell: (s) => <span className="font-medium">{patientName(s)}</span>,
        },
        {
            key: 'modality',
            header: 'Modality',
            sortable: true,
            cell: (s) => (
                <Badge tone="outline" className="font-mono">
                    {s.modality}{s.contrast ? ' +C' : ''}
                </Badge>
            ),
        },
        {
            key: 'bodyPart',
            header: 'Body part',
            sortable: true,
            accessor: (s) => s.bodyPart ?? '',
            cell: (s) => <span className="text-muted-foreground">{s.bodyPart || '—'}</span>,
        },
        {
            key: 'age',
            header: 'Study age',
            sortable: true,
            accessor: (s) => -1 * (s.studyAgeMinutes ?? 0),
            cell: (s) => <StudyAgeCell study={s} />,
        },
        {
            key: 'ai',
            header: 'AI',
            align: 'center',
            accessor: (s) => (s.aiTriage?.flagged ? 'AI flagged' : ''),
            cell: (s) => <AiFlagCell study={s} />,
        },
        {
            key: 'sla',
            header: 'SLA remaining',
            cell: (s) => <SlaCell study={s} />,
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            cell: (s) => <StatusBadge status={s.status} />,
        },
        {
            key: 'radiologist',
            header: 'Radiologist',
            accessor: (s) => assignedName(s) ?? '',
            cell: (s) => {
                const name = assignedName(s);
                return name
                    ? <span className="text-sm text-muted-foreground">{name}</span>
                    : <span className="text-xs text-subtle-foreground">Unassigned</span>;
            },
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Radiologist Worklist"
                description="Live teleradiology queue — prioritized by acuity, SLA and AI triage."
                crumbs={[{ label: 'Teleradiology' }, { label: 'Worklist' }]}
                actions={
                    <div className="flex items-center gap-3">
                        <DemoBadge show={demo} />
                        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['telerad'] })}>
                            <Activity className="h-4 w-4" aria-hidden /> Refresh
                        </Button>
                    </div>
                }
            />

            <StatGrid>
                <StatCard label="Unread studies" value={kpis.unread} icon={Inbox} tone="brand" sub="Awaiting first read" delay={0} />
                <StatCard label="In progress" value={kpis.inProgress} icon={UserCheck} tone="teal" sub="Being read or drafted" delay={0.05} />
                <StatCard
                    label="STAT / emergency pending" value={kpis.statPending} icon={Siren} tone="rose"
                    sub="Unsigned high-acuity" delay={0.1}
                    trend={kpis.statPending > 0 ? 'up' : 'neutral'} trendPositive={false}
                />
                <StatCard
                    label="SLA breaches" value={kpis.breaches} icon={TimerOff} tone="amber"
                    sub="Past turnaround target" delay={0.15}
                    trend={kpis.breaches > 0 ? 'up' : 'neutral'} trendPositive={false}
                />
            </StatGrid>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-soft">
                <FilterChip active={filters.priority === 'stat'} onClick={() => togglePriority('stat')}>
                    <Siren className="h-3.5 w-3.5" aria-hidden /> STAT
                </FilterChip>
                <FilterChip active={filters.priority === 'emergency'} onClick={() => togglePriority('emergency')}>
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Emergency
                </FilterChip>
                <FilterChip active={Boolean(filters.aiFlagged)} onClick={() => toggle('aiFlagged')}>
                    <Sparkles className="h-3.5 w-3.5" aria-hidden /> AI-flagged
                </FilterChip>
                <FilterChip active={Boolean(filters.slaBreached)} onClick={() => toggle('slaBreached')}>
                    <TimerOff className="h-3.5 w-3.5" aria-hidden /> SLA breached
                </FilterChip>
                <FilterChip active={Boolean(filters.assignedToMe)} onClick={() => toggle('assignedToMe')}>
                    <UserCheck className="h-3.5 w-3.5" aria-hidden /> Assigned to me
                </FilterChip>

                <div className="ml-auto flex items-center gap-2">
                    <Select
                        aria-label="Filter by modality"
                        className="h-9 w-36"
                        value={filters.modality ?? ''}
                        onChange={(e) => setFilters((f) => ({ ...f, modality: e.target.value || undefined }))}
                    >
                        <option value="">All modalities</option>
                        {MODALITIES.map((m) => <option key={m} value={m}>{m}</option>)}
                    </Select>
                    <Select
                        aria-label="Filter by status"
                        className="h-9 w-36"
                        value={filters.status ?? ''}
                        onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
                    >
                        <option value="">All statuses</option>
                        {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </Select>
                    {(filters.priority || filters.modality || filters.status || filters.aiFlagged || filters.slaBreached || filters.assignedToMe) && (
                        <Button variant="ghost" size="sm" onClick={() => setFilters({})}>Clear</Button>
                    )}
                </div>
            </div>

            {listQuery.isLoading ? (
                <SkeletonTable rows={8} />
            ) : (
                <DataTable<Study>
                    columns={columns}
                    data={rows}
                    rowKey={(s) => s._id}
                    searchPlaceholder="Search accession, patient, body part…"
                    pageSize={12}
                    exportName="teleradiology-worklist"
                    emptyTitle="No studies match the current filters"
                    emptyDescription="Try clearing a filter, or check back — the worklist refreshes every 30 seconds."
                    onRowClick={(s) => router.push(`/teleradiology/workspace/${s._id}`)}
                    rowActions={(s) =>
                        !assignedName(s) && s.status !== 'SIGNED' && s.status !== 'DELIVERED' ? (
                            <Button
                                size="sm"
                                variant="outline"
                                loading={claim.isPending && claim.variables === s._id}
                                onClick={() => claim.mutate(s._id)}
                            >
                                Claim
                            </Button>
                        ) : null
                    }
                />
            )}
        </div>
    );
}
