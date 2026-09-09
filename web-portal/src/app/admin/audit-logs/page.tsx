'use client';

import * as React from 'react';
import {
    Activity,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    RefreshCw,
    Search,
    Shield,
} from 'lucide-react';
import {
    Badge,
    Button,
    Card,
    CardContent,
    Input,
    Label,
    PageHeader,
    Select,
    SkeletonTable,
    StatCard,
    StatGrid,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import {
    actorId,
    actorName,
    fetchAuditLogs,
    formatWhen,
    type AuditLogEntry,
} from './_lib/api';

/* ─── constants ─────────────────────────────────────────────────── */

const ACTIONS = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'SIGN', 'ORDER', 'LOGIN'] as const;
const LIMIT = 50;

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

/* ─── sub-components ────────────────────────────────────────────── */

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <th className={cn('px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground', className)}>
            {children}
        </th>
    );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <td className={cn('px-3 py-2.5 align-top text-sm', className)}>
            {children}
        </td>
    );
}

function ExpandedDetail({ entry }: { entry: AuditLogEntry }) {
    return (
        <tr>
            <td colSpan={8} className="bg-muted/40 px-6 py-4 border-b border-border">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Method & Path</p>
                        <p className="font-mono text-xs text-foreground">
                            <span className="font-bold">{entry.method ?? '—'}</span>{' '}
                            {entry.path ?? '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Response Code</p>
                        <Badge tone={statusTone(entry.responseCode ?? entry.statusCode)} dot>
                            {entry.responseCode ?? entry.statusCode ?? '—'}
                        </Badge>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Duration</p>
                        <p className="text-sm text-foreground">
                            {entry.durationMs != null ? `${entry.durationMs} ms` : '—'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Trace ID</p>
                        <p className="font-mono text-xs text-muted-foreground break-all">{entry.traceId ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Actor ID</p>
                        <p className="font-mono text-xs text-muted-foreground break-all">{actorId(entry)}</p>
                    </div>
                    {entry.resourceId && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Resource ID</p>
                            <p className="font-mono text-xs text-muted-foreground break-all">{entry.resourceId}</p>
                        </div>
                    )}
                    {entry.requestBody && (
                        <div className="sm:col-span-2 lg:col-span-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Request Body</p>
                            <pre className="overflow-x-auto rounded-lg bg-card border border-border p-3 text-xs text-foreground">
                                {JSON.stringify(entry.requestBody, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
}

/* ─── page ──────────────────────────────────────────────────────── */

export default function AuditLogsPage() {
    const [entries, setEntries] = React.useState<AuditLogEntry[] | null>(null);
    const [total, setTotal] = React.useState(0);
    const [totalPages, setTotalPages] = React.useState(1);
    const [demo, setDemo] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(false);

    /* filters */
    const [page, setPage] = React.useState(1);
    const [actionFilter, setActionFilter] = React.useState('');
    const [userSearch, setUserSearch] = React.useState('');
    const [userSearchInput, setUserSearchInput] = React.useState('');
    const [from, setFrom] = React.useState('');
    const [to, setTo] = React.useState('');

    /* expanded row */
    const [expandedId, setExpandedId] = React.useState<string | null>(null);

    const load = React.useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError(false);
        try {
            const res = await fetchAuditLogs({
                page,
                limit: LIMIT,
                action: actionFilter || undefined,
                userId: userSearch || undefined,
                from: from || undefined,
                to: to || undefined,
            });
            setEntries(res.data.entries);
            setTotal(res.data.total);
            setTotalPages(res.data.totalPages);
            setDemo(res.demo);
        } catch {
            setError(true);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [page, actionFilter, userSearch, from, to]);

    React.useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        load();
    }, [load]);

    function applyUserSearch() {
        setUserSearch(userSearchInput.trim());
        setPage(1);
    }

    function clearFilters() {
        setActionFilter('');
        setUserSearchInput('');
        setUserSearch('');
        setFrom('');
        setTo('');
        setPage(1);
    }

    const failCount = React.useMemo(
        () => (entries ?? []).filter((e) => !e.success && (e.statusCode ?? 0) >= 400).length,
        [entries],
    );

    const latestAt = entries?.[0]?.at;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Audit Logs"
                description="Paginated, filterable record of every authenticated action across the platform."
                crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Audit Logs' }]}
                actions={
                    <div className="flex items-center gap-2">
                        {demo && <Badge tone="warning" dot>Demo data — backend offline</Badge>}
                        <Button variant="outline" size="sm" onClick={() => load()} loading={loading}>
                            <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Refresh
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
                    label="Failures on this page"
                    value={failCount}
                    sub={failCount > 0 ? 'Status 4xx / 5xx' : 'All successful'}
                    icon={Shield}
                    tone={failCount > 0 ? 'rose' : 'emerald'}
                    delay={0.05}
                />
                <StatCard
                    label="Latest event"
                    value={latestAt ? formatWhen(latestAt).split(' · ')[1] ?? '—' : '—'}
                    sub={latestAt ? formatWhen(latestAt).split(' · ')[0] ?? '' : 'No events yet'}
                    icon={Activity}
                    tone="violet"
                    delay={0.1}
                />
            </StatGrid>

            <Card>
                <CardContent className="pt-5 space-y-4">
                    {/* ── Filter bar ── */}
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="min-w-[180px]">
                            <Label htmlFor="al-action">Action</Label>
                            <Select
                                id="al-action"
                                value={actionFilter}
                                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                            >
                                <option value="">All actions</option>
                                {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                            </Select>
                        </div>
                        <div className="min-w-[140px]">
                            <Label htmlFor="al-from">From</Label>
                            <Input
                                id="al-from"
                                type="date"
                                value={from}
                                onChange={(e) => { setFrom(e.target.value); setPage(1); }}
                            />
                        </div>
                        <div className="min-w-[140px]">
                            <Label htmlFor="al-to">To</Label>
                            <Input
                                id="al-to"
                                type="date"
                                value={to}
                                onChange={(e) => { setTo(e.target.value); setPage(1); }}
                            />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <Label htmlFor="al-user">Search by user</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="al-user"
                                    placeholder="Name, email, or ID…"
                                    value={userSearchInput}
                                    onChange={(e) => setUserSearchInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') applyUserSearch(); }}
                                />
                                <Button variant="outline" size="sm" onClick={applyUserSearch} aria-label="Search">
                                    <Search className="h-4 w-4" aria-hidden />
                                </Button>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Clear
                        </Button>
                    </div>

                    {/* ── Table ── */}
                    {loading ? (
                        <SkeletonTable rows={8} />
                    ) : error && !entries ? (
                        <div className="py-12 text-center text-muted-foreground text-sm">
                            Failed to load audit logs.{' '}
                            <button
                                type="button"
                                onClick={() => load()}
                                className="underline text-primary"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-border">
                            <table className="w-full border-collapse text-sm">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <Th>Timestamp</Th>
                                        <Th>User</Th>
                                        <Th>Role</Th>
                                        <Th>Action</Th>
                                        <Th>Resource</Th>
                                        <Th>IP Address</Th>
                                        <Th>Status</Th>
                                        <Th className="w-8">{null}</Th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {(entries ?? []).length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="py-12 text-center text-muted-foreground text-sm"
                                            >
                                                No audit events match the current filters.
                                            </td>
                                        </tr>
                                    ) : (entries ?? []).flatMap((entry) => {
                                        const isExpanded = expandedId === entry._id;
                                        return [
                                            <tr
                                                key={entry._id}
                                                onClick={() => setExpandedId(isExpanded ? null : entry._id)}
                                                className={cn(
                                                    'cursor-pointer transition-colors',
                                                    isExpanded
                                                        ? 'bg-muted/60'
                                                        : 'hover:bg-muted/30',
                                                )}
                                                aria-expanded={isExpanded}
                                            >
                                                <Td className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatWhen(entry.at)}
                                                </Td>
                                                <Td>
                                                    <p className="font-medium text-foreground">{actorName(entry)}</p>
                                                </Td>
                                                <Td>
                                                    <span className="text-muted-foreground capitalize">
                                                        {(entry.userRole ?? '—').toLowerCase().replace(/_/g, ' ')}
                                                    </span>
                                                </Td>
                                                <Td>
                                                    <Badge tone={ACTION_TONE[entry.action] ?? 'neutral'} className="font-mono text-xs">
                                                        {entry.action}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    <p className="text-foreground">{entry.resource ?? '—'}</p>
                                                </Td>
                                                <Td>
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {entry.ip ?? '—'}
                                                    </span>
                                                </Td>
                                                <Td>
                                                    <Badge tone={statusTone(entry.statusCode)} dot>
                                                        {entry.statusCode ?? '—'}
                                                    </Badge>
                                                </Td>
                                                <Td>
                                                    {isExpanded
                                                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden />
                                                        : <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
                                                    }
                                                </Td>
                                            </tr>,
                                            ...(isExpanded
                                                ? [<ExpandedDetail key={`${entry._id}-detail`} entry={entry} />]
                                                : []),
                                        ];
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ── Pagination ── */}
                    {!loading && (entries ?? []).length > 0 && (
                        <div className="flex items-center justify-between gap-4 pt-1">
                            <p className="text-xs text-muted-foreground">
                                Page {page} of {totalPages} &middot; {total.toLocaleString('en-IN')} total event{total !== 1 ? 's' : ''}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                    <ChevronLeft className="h-4 w-4" aria-hidden /> Prev
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                >
                                    Next <ChevronRight className="h-4 w-4" aria-hidden />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
