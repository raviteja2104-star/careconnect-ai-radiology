'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Activity, CheckCircle2, FileSignature, Gauge, Inbox, ScanLine, Siren,
    Sparkles, TimerOff, Users,
} from 'lucide-react';
import {
    Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState,
    PageHeader, Progress, SkeletonCard, StatCard, StatGrid, Avatar,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import {
    assignedName, fetchStats, fetchWorklist, humanizeMin, isBreached,
    isSignedOrLater, patientName, type Study, type WorklistStats,
} from '../_lib/api';
import { DemoBadge, PriorityBadge } from '../_lib/shared';

const REFETCH_MS = 30_000;

const num = (v: unknown): number | null => (typeof v === 'number' && !Number.isNaN(v) ? v : null);

export default function TeleradiologyCommandCenterPage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const statsQuery = useQuery({
        queryKey: ['telerad', 'stats'],
        queryFn: () => fetchStats(),
        refetchInterval: REFETCH_MS,
    });
    const worklistQuery = useQuery({
        queryKey: ['telerad', 'worklist', 'all'],
        queryFn: () => fetchWorklist({}),
        refetchInterval: REFETCH_MS,
    });

    const stats: WorklistStats = statsQuery.data?.data ?? {};
    const studies = worklistQuery.data?.data ?? [];
    const demo = Boolean(statsQuery.data?.demo || worklistQuery.data?.demo);
    const loading = statsQuery.isLoading || worklistQuery.isLoading;

    /* ─────────── Aggregates (stats endpoint first, worklist fallback) ─────────── */

    const today = new Date();
    const isToday = (iso?: string) => {
        if (!iso) return false;
        const d = new Date(iso);
        return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
    };

    const studiesToday = num(stats.count) ?? studies.length;
    const pending = studies.filter((s) => !isSignedOrLater(s)).length;
    const statPending = studies.filter(
        (s) => (s.priority === 'stat' || s.priority === 'emergency') && !isSignedOrLater(s)
    ).length;
    const aiFlagged = studies.filter((s) => s.aiTriage?.flagged).length;
    const breaches = num(stats.breaches) ?? studies.filter(isBreached).length;
    const signedToday = studies.filter((s) => isSignedOrLater(s) && isToday(s.tat?.signedAt)).length
        || studies.filter(isSignedOrLater).length;

    const byPriority: Record<string, number> = stats.byPriority && Object.keys(stats.byPriority).length > 0
        ? stats.byPriority
        : studies.reduce<Record<string, number>>((acc, s) => { acc[s.priority] = (acc[s.priority] || 0) + 1; return acc; }, {});

    const byModality = studies.reduce<Record<string, number>>((acc, s) => {
        acc[s.modality] = (acc[s.modality] || 0) + 1;
        return acc;
    }, {});
    const modalityTotal = Object.values(byModality).reduce((a, b) => a + b, 0) || 1;
    const priorityTotal = Object.values(byPriority).reduce((a, b) => a + b, 0) || 1;

    const byStatus: Record<string, number> = stats.byStatus && Object.keys(stats.byStatus).length > 0
        ? stats.byStatus
        : studies.reduce<Record<string, number>>((acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {});

    const criticals = studies
        .filter((s) => s.criticalFinding?.flagged)
        .sort((a, b) => Number(Boolean(a.criticalFinding?.acknowledgedAt)) - Number(Boolean(b.criticalFinding?.acknowledgedAt)));

    const radiologists = Array.isArray(stats.radiologists) ? stats.radiologists : [];
    let pool = radiologists;
    if (pool.length === 0) {
        const map = new Map<string, number>();
        for (const s of studies) {
            const n = assignedName(s);
            if (n) map.set(n, (map.get(n) || 0) + 1);
        }
        pool = [...map.entries()].map(([name, assigned]) => ({ name, assigned, active: true }));
    }

    const PRIORITY_ORDER = ['emergency', 'stat', 'urgent', 'routine'];
    const priorityTone: Record<string, 'danger' | 'warning' | 'success'> = {
        emergency: 'danger', stat: 'danger', urgent: 'warning', routine: 'success',
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Teleradiology Command Center"
                description="Fleet-wide reading throughput, turnaround performance and critical results at a glance."
                crumbs={[{ label: 'Teleradiology' }, { label: 'Command Center' }]}
                actions={
                    <div className="flex items-center gap-3">
                        <DemoBadge show={demo} />
                        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ['telerad'] })}>
                            <Activity className="h-4 w-4" aria-hidden /> Refresh
                        </Button>
                        <Button size="sm" onClick={() => router.push('/teleradiology/worklist')}>
                            Open worklist
                        </Button>
                    </div>
                }
            />

            {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} lines={2} />)}
                </div>
            ) : (
                <>
                    {/* Volume + risk row */}
                    <StatGrid>
                        <StatCard label="Studies on worklist" value={studiesToday} icon={ScanLine} tone="brand" sub="Across all connected sites" delay={0} />
                        <StatCard label="Pending reads" value={pending} icon={Inbox} tone="teal" sub={`${statPending} STAT / emergency`} delay={0.05} />
                        <StatCard
                            label="AI flagged" value={aiFlagged} icon={Sparkles} tone="violet"
                            sub="Prioritized by AI triage" delay={0.1}
                        />
                        <StatCard
                            label="SLA breaches" value={breaches} icon={TimerOff} tone="rose"
                            sub="Past turnaround target" delay={0.15}
                            trend={breaches > 0 ? 'up' : 'neutral'} trendPositive={false}
                        />
                    </StatGrid>

                    {/* TAT percentile row */}
                    <StatGrid>
                        <StatCard label="TAT p50" value={humanizeMin(num(stats.p50))} icon={Gauge} tone="emerald" sub="Median order-to-sign" delay={0.05} />
                        <StatCard label="TAT p90 / p95" value={`${humanizeMin(num(stats.p90))} / ${humanizeMin(num(stats.p95))}`} icon={Gauge} tone="amber" sub={`p99 ${humanizeMin(num(stats.p99))}`} delay={0.1} />
                        <StatCard label="STAT avg TAT" value={humanizeMin(num(stats.statAvg))} icon={Siren} tone="rose" sub={`Routine avg ${humanizeMin(num(stats.routineAvg))}`} delay={0.15} />
                        <StatCard label="Reports signed" value={signedToday} icon={FileSignature} tone="brand" sub="Signed or delivered" delay={0.2} />
                    </StatGrid>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                        {/* Breakdown column */}
                        <div className="space-y-6 xl:col-span-1">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">By modality</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {Object.keys(byModality).length === 0 && (
                                        <p className="text-sm text-muted-foreground">No studies on the worklist.</p>
                                    )}
                                    {Object.entries(byModality)
                                        .sort(([, a], [, b]) => b - a)
                                        .map(([mod, count]) => (
                                            <div key={mod}>
                                                <div className="mb-1 flex items-center justify-between text-sm">
                                                    <span className="font-medium text-foreground">{mod}</span>
                                                    <span className="tabular-nums text-muted-foreground">{count}</span>
                                                </div>
                                                <Progress size="sm" tone="brand" value={(count / modalityTotal) * 100} />
                                            </div>
                                        ))}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">By priority</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {PRIORITY_ORDER.filter((p) => byPriority[p]).map((p) => (
                                        <div key={p}>
                                            <div className="mb-1 flex items-center justify-between text-sm">
                                                <span className="font-medium capitalize text-foreground">{p}</span>
                                                <span className="tabular-nums text-muted-foreground">{byPriority[p]}</span>
                                            </div>
                                            <Progress size="sm" tone={priorityTone[p] ?? 'brand'} value={(byPriority[p] / priorityTotal) * 100} />
                                        </div>
                                    ))}
                                    {Object.keys(byPriority).length === 0 && (
                                        <p className="text-sm text-muted-foreground">No priority data.</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Pipeline by status</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-2">
                                    {['ORDERED', 'RECEIVED', 'UNREAD', 'IN_PROGRESS', 'DRAFT', 'REVIEW', 'SIGNED', 'DELIVERED']
                                        .filter((s) => byStatus[s])
                                        .map((s) => (
                                            <Badge key={s} tone={s === 'SIGNED' || s === 'DELIVERED' ? 'success' : s === 'UNREAD' ? 'info' : 'neutral'}>
                                                {s.replace('_', ' ')} · {byStatus[s]}
                                            </Badge>
                                        ))}
                                    {Object.keys(byStatus).length === 0 && (
                                        <p className="text-sm text-muted-foreground">No status data.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Critical findings */}
                        <Card className="xl:col-span-1">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Siren className="h-4 w-4 text-danger" aria-hidden /> Recent critical findings
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {criticals.length === 0 ? (
                                    <EmptyState
                                        icon={CheckCircle2}
                                        title="No open critical findings"
                                        description="Critical results flagged by radiologists appear here with their acknowledgement status."
                                    />
                                ) : (
                                    <ul className="space-y-3">
                                        {criticals.map((s: Study) => {
                                            const acked = Boolean(s.criticalFinding?.acknowledgedAt);
                                            return (
                                                <li key={s._id}>
                                                    <Link
                                                        href={`/teleradiology/workspace/${s._id}`}
                                                        className={cn(
                                                            'block rounded-xl border p-3 transition-colors hover:bg-muted/50',
                                                            acked ? 'border-border' : 'border-danger/40 bg-danger-soft'
                                                        )}
                                                    >
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <span className="font-mono text-xs font-semibold text-foreground">{s.accessionNumber}</span>
                                                            <Badge tone={acked ? 'success' : 'danger'} dot pulse={!acked}>
                                                                {acked ? 'Acknowledged' : 'Awaiting ack'}
                                                            </Badge>
                                                        </div>
                                                        <p className="mt-1 text-sm font-medium text-foreground">{s.criticalFinding?.description || '—'}</p>
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {patientName(s)} · {s.modality} {s.bodyPart || ''} · {assignedName(s) ?? 'Unassigned'}
                                                        </p>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                        {/* Radiologist pool + high-acuity queue */}
                        <div className="space-y-6 xl:col-span-1">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Users className="h-4 w-4 text-primary" aria-hidden /> Radiologist pool
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {pool.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No radiologist activity reported.</p>
                                    ) : (
                                        <ul className="space-y-3">
                                            {pool.map((r, i) => (
                                                <li key={r.name ?? i} className="flex items-center gap-3">
                                                    <Avatar name={r.name || 'Radiologist'} size="sm" status={r.active === false ? 'offline' : 'online'} />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium text-foreground">{r.name || 'Radiologist'}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {typeof r.assigned === 'number' ? `${r.assigned} assigned` : 'Assigned —'}
                                                            {typeof r.signed === 'number' ? ` · ${r.signed} signed` : ''}
                                                        </p>
                                                    </div>
                                                    <Badge tone={r.active === false ? 'neutral' : 'success'} dot>
                                                        {r.active === false ? 'Off shift' : 'Active'}
                                                    </Badge>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">High-acuity queue</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {studies.filter((s) => (s.priority === 'stat' || s.priority === 'emergency') && !isSignedOrLater(s)).length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No unsigned STAT or emergency studies. Queue is clear.</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {studies
                                                .filter((s) => (s.priority === 'stat' || s.priority === 'emergency') && !isSignedOrLater(s))
                                                .slice(0, 6)
                                                .map((s) => (
                                                    <li key={s._id}>
                                                        <Link
                                                            href={`/teleradiology/workspace/${s._id}`}
                                                            className="flex items-center justify-between gap-2 rounded-xl border border-border p-2.5 transition-colors hover:bg-muted/50"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="truncate font-mono text-xs font-semibold text-foreground">{s.accessionNumber}</p>
                                                                <p className="truncate text-xs text-muted-foreground">{s.modality} · {s.bodyPart || '—'} · {patientName(s)}</p>
                                                            </div>
                                                            <PriorityBadge priority={s.priority} />
                                                        </Link>
                                                    </li>
                                                ))}
                                        </ul>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
