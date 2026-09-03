'use client';
import React, { useEffect, useState } from 'react';
import {
  ShieldCheck, Mail, Database, Zap, AlertTriangle, Play, Search, Clock,
  Download, Share2, GitBranch, Gauge, Activity, Timer,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription,
  CardContent, Tabs, TabsList, TabsTrigger, TabsContent, Badge, Button, Progress,
  DataTable, type Column,
} from '@/components/ui';
import { cn } from '@/lib/utils';

/* ───────────────────────────── Data layer ─────────────────────────────
 * Real metrics come from GET /api/system/slo (admin-only, Bearer token from
 * localStorage 'token'), served by the backend's in-memory Telemetry registry.
 * Follows the emr/_lib/api.ts contract: reads degrade to demo data with a
 * "Demo data — backend offline" badge instead of crashing when the backend is
 * unreachable or the caller is unauthenticated.
 */

const API_BASE = 'http://localhost:5000';
const REFETCH_MS = 15_000;

interface RouteStat {
  method: string;
  route: string;
  count: number;
  errors4xx: number;
  errors5xx: number;
  errorRate: number;
  avgMs: number;
  p50: number;
  p90: number;
  p99: number;
}

interface SloResponse {
  generatedAt: string;
  process: {
    uptimeSeconds: number;
    startedAt: string;
    memoryRssBytes: number;
    heapUsedBytes: number;
    eventLoopLagMs: number;
  };
  totals: {
    count: number;
    errors4xx: number;
    errors5xx: number;
    errorRate: number;
    availability: number;
    avgMs: number;
    p50: number;
    p90: number;
    p99: number;
  };
  window: {
    spanMinutes: number;
    observedMinutes: number;
    count: number;
    errors5xx: number;
    availability: number;
    requestsPerMinute: number;
  };
  routes: RouteStat[];
  slo: {
    availabilityTarget: number;
    windowDays: number;
    errorBudgetMinutes: number;
    observedWindowMinutes: number;
    observedAvailability: number;
    consumedBudgetMinutes: number;
    remainingBudgetMinutes: number;
    note: string;
  };
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem('token');
  } catch {
    return null;
  }
}

/** {data, demo} read — never throws; demo:true when unreachable/401/403. */
async function fetchSlo(): Promise<{ data: SloResponse | null; demo: boolean }> {
  const token = getToken();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_BASE}/api/system/slo`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    clearTimeout(timer);
    if (!res.ok) return { data: null, demo: true };
    const data = (await res.json()) as SloResponse;
    return { data, demo: false };
  } catch {
    return { data: null, demo: true };
  }
}

/* ─────────────────────────── Formatting utils ─────────────────────────── */

const fmtMs = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(2)}s` : `${Math.round(v)}ms`);
const fmtPct = (v: number, dp = 2) => `${(v * 100).toFixed(dp)}%`;
const fmtMin = (v: number) => (v < 10 ? v.toFixed(2) : v.toFixed(1));
const fmtUptime = (seconds: number) => {
  const s = Math.floor(seconds);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s % 60}s`;
};

const ROUTE_COLUMNS: Column<RouteStat>[] = [
  {
    key: 'route',
    header: 'Route',
    sortable: true,
    accessor: (r) => `${r.method} ${r.route}`,
    cell: (r) => (
      <span className="font-mono text-xs">
        <span className="mr-2 font-semibold text-primary">{r.method}</span>
        <span className="text-foreground">{r.route}</span>
      </span>
    ),
  },
  { key: 'count', header: 'Requests', sortable: true, align: 'right', accessor: (r) => r.count, cell: (r) => <span className="tabular-nums">{r.count.toLocaleString('en-IN')}</span> },
  {
    key: 'errorRate',
    header: 'Error %',
    sortable: true,
    align: 'right',
    accessor: (r) => r.errorRate,
    cell: (r) => (
      <span className={cn('tabular-nums', r.errors5xx > 0 ? 'text-danger font-semibold' : r.errorRate > 0 ? 'text-warning' : 'text-success')}>
        {fmtPct(r.errorRate, 1)}
      </span>
    ),
  },
  { key: 'p50', header: 'p50', sortable: true, align: 'right', accessor: (r) => r.p50, cell: (r) => <span className="tabular-nums">{fmtMs(r.p50)}</span> },
  { key: 'p90', header: 'p90', sortable: true, align: 'right', accessor: (r) => r.p90, cell: (r) => <span className="tabular-nums">{fmtMs(r.p90)}</span> },
  { key: 'p99', header: 'p99', sortable: true, align: 'right', accessor: (r) => r.p99, cell: (r) => <span className="tabular-nums">{fmtMs(r.p99)}</span> },
  { key: 'avgMs', header: 'Avg', sortable: true, align: 'right', accessor: (r) => r.avgMs, cell: (r) => <span className="tabular-nums text-muted-foreground">{fmtMs(r.avgMs)}</span> },
];

export default function ObservabilityDashboard() {
  const [live, setLive] = useState<SloResponse | null>(null);
  const [demo, setDemo] = useState<boolean>(true);

  const [metrics, setMetrics] = useState({
    authHealth: 'Healthy',
    commHealth: 'Healthy',
    outboxQueueDepth: 14,
    sagaStateCounts: { active: 3, completed: 152, failed: 1 },
    eventThroughput: 42, // events/min
    failedEvents: 2,
    circuitBreakerState: 'Closed',
    retryCounts: 5,
    avgNotificationLatency: 124, // ms
    telemedicineActive: 2
  });

  const [activeTrace, setActiveTrace] = useState<string>('9c1f-4b2a-8d3e');
  const [traces] = useState<any[]>([
    {
      id: '9c1f-4b2a-8d3e',
      workflow: 'Telemedicine Journey',
      status: 'Completed',
      events: [
        { time: '09:00:01', source: 'Backend', name: 'AppointmentCreated' },
        { time: '09:00:01', source: 'Outbox', name: 'OutboxCreated' },
        { time: '09:00:02', source: 'Worker', name: 'EventPublished' },
        { time: '09:00:02', source: 'TeleSaga', name: 'SagaStarted' },
        { time: '09:00:03', source: 'TeleSaga', name: 'MeetingCreated' },
        { time: '09:00:04', source: 'CommService', name: 'NotificationSent' },
        { time: '09:00:10', source: 'TeleSaga', name: 'PatientCheckedIn' },
        { time: '09:01:00', source: 'TeleSaga', name: 'ConsultationStarted' },
        { time: '09:18:32', source: 'TeleSaga', name: 'ConsultationEnded' },
        { time: '09:18:40', source: 'AIService', name: 'AISummaryGenerated' },
        { time: '09:19:15', source: 'Billing', name: 'InvoiceGenerated' },
        { time: '09:19:18', source: 'Payment', name: 'PaymentSucceeded' },
        { time: '09:19:19', source: 'CommService', name: 'ReceiptSent' }
      ]
    },
    {
      id: '7b2a-1c9f-3e8d',
      workflow: 'OPD Journey',
      status: 'Active',
      events: [
        { time: '10:15:00', source: 'Backend', name: 'PatientRegistered' },
        { time: '10:15:05', source: 'Backend', name: 'AppointmentBooking' },
        { time: '10:15:10', source: 'QueueService', name: 'QueueTokenGenerated' },
        { time: '10:20:00', source: 'Backend', name: 'ConsultationStarted' }
      ]
    },
    {
      id: 'f8e2-9d1a-4c5b',
      workflow: 'ABDM Interoperability Journey',
      status: 'Completed',
      events: [
        { time: '11:00:05', source: 'ABDM', name: 'ConsentRequested' },
        { time: '11:05:12', source: 'ABDM', name: 'ConsentApproved (Scope: ALL)' },
        { time: '11:05:15', source: 'FHIR', name: 'Patient Exported (R4)' },
        { time: '11:05:16', source: 'FHIR', name: 'Encounter Exported (R4)' },
        { time: '11:05:18', source: 'FHIR', name: 'Observation Exported (R4)' },
        { time: '11:05:20', source: 'Audit', name: 'Exchange Recorded' }
      ]
    },
    {
      id: 'b8c3-4d5e-6f7a',
      workflow: 'Outbox Event Replay (Load Test)',
      status: 'Completed',
      events: [
        { time: '15:00:00', source: 'Outbox', name: 'WorkerStopped' },
        { time: '15:00:05', source: 'Outbox', name: 'BacklogGrowing (127 events)' },
        { time: '15:02:00', source: 'Outbox', name: 'WorkerRestarted' },
        { time: '15:02:01', source: 'Outbox', name: 'ReplayStarted' },
        { time: '15:02:08', source: 'Outbox', name: 'ReplayCompleted (500/500 events)' }
      ]
    },
    {
      id: 'd9e4-5f6a-7b8c',
      workflow: 'Infrastructure Event: DB Election',
      status: 'Recovered',
      events: [
        { time: '16:30:00', source: 'MongoDB', name: 'PrimaryLost' },
        { time: '16:30:01', source: 'MongoDB', name: 'ElectionStarted' },
        { time: '16:30:02', source: 'Backend', name: 'PersistenceUnavailable (503)' },
        { time: '16:30:08', source: 'MongoDB', name: 'PrimaryRecovered (New Node)' },
        { time: '16:30:10', source: 'Backend', name: 'Reconnected' },
        { time: '16:30:12', source: 'Outbox', name: 'ReplayStarted' },
        { time: '16:30:15', source: 'Outbox', name: 'ReplayCompleted' }
      ]
    },
    {
      id: 'gday-9x8y-7z6w',
      workflow: 'GameDay: Mixed-Failure Incident',
      status: 'Recovered',
      events: [
        { time: '09:00:00', source: 'System', name: 'Load Test Started (100 CCU)' },
        { time: '09:01:00', source: 'Chaos', name: 'ABDM Latency Injected (5s)' },
        { time: '09:03:00', source: 'Chaos', name: 'Payment Service Restarted' },
        { time: '09:05:00', source: 'Chaos', name: 'MongoDB Election Started' },
        { time: '09:06:15', source: 'Backend', name: 'Circuit Breaker OPEN (ABDM)' },
        { time: '09:07:00', source: 'MongoDB', name: 'Primary Recovered' },
        { time: '09:08:00', source: 'Payment', name: 'Webhook Replay Completed' },
        { time: '09:09:00', source: 'System', name: 'Communication Service Restored' },
        { time: '09:10:00', source: 'Outbox', name: 'Replay Completed' },
        { time: '09:11:00', source: 'Backend', name: 'Circuit Breaker CLOSED' },
        { time: '09:12:00', source: 'System', name: 'System Healthy' }
      ]
    }
  ]);

  // Real data: poll /api/system/slo every 15s. Falls back to demo mode when
  // the backend is unreachable or the caller lacks an admin token.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data, demo: isDemo } = await fetchSlo();
      if (cancelled) return;
      setDemo(isDemo);
      if (data) setLive(data);
    };
    load();
    const interval = setInterval(load, REFETCH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Demo jitter: ONLY animates the mock values while offline. Real telemetry
  // is never jittered — it refreshes on the 15s poll above.
  useEffect(() => {
    if (!demo) return;
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        eventThroughput: Math.floor(Math.random() * 20) + 30,
        outboxQueueDepth: Math.max(0, prev.outboxQueueDepth + Math.floor(Math.random() * 5) - 2),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [demo]);

  const selectedTrace = traces.find(t => t.id === activeTrace);

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    if (!selectedTrace) return;
    downloadFile(`trace-${selectedTrace.id}.json`, JSON.stringify(selectedTrace, null, 2), 'application/json');
  };

  const handleExportMermaid = () => {
    if (!selectedTrace) return;
    const lines = ['sequenceDiagram'];
    selectedTrace.events.forEach((evt: any, i: number) => {
      const next = selectedTrace.events[i + 1];
      if (next) {
        lines.push(`    ${evt.source}->>+${next.source}: ${evt.name}`);
      } else {
        lines.push(`    Note over ${evt.source}: ${evt.name}`);
      }
    });
    downloadFile(`trace-${selectedTrace.id}.mmd`, lines.join('\n'), 'text/plain');
  };

  const slo = live?.slo;
  const budgetUsedPct = slo && slo.errorBudgetMinutes > 0
    ? Math.min(100, (slo.consumedBudgetMinutes / slo.errorBudgetMinutes) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Observability"
        description="Live monitoring of infrastructure and microservices"
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Admin', href: '/admin' }, { label: 'Observability' }]}
        actions={
          demo
            ? <Badge tone="warning" dot>Demo data — backend offline</Badge>
            : <Badge tone="success" dot pulse>Live</Badge>
        }
      />

      {demo || !live ? (
        <StatGrid>
          <StatCard label="Auth Service" value={metrics.authHealth} sub="All probes passing" icon={ShieldCheck} tone="emerald" delay={0} />
          <StatCard label="Communication Service" value={metrics.commHealth} sub="All probes passing" icon={Mail} tone="teal" delay={0.05} />
          <StatCard label="Event Outbox" value={`${metrics.outboxQueueDepth} in queue`} sub="Pending publish backlog" icon={Database} tone="brand" delay={0.1} />
          <StatCard label="Circuit Breaker" value={metrics.circuitBreakerState} sub="Downstream dependency guard" icon={Zap} tone="amber" delay={0.15} />
        </StatGrid>
      ) : (
        <StatGrid>
          <StatCard
            label="Availability (60m window)"
            value={fmtPct(live.window.availability)}
            sub={`${live.window.errors5xx} × 5xx of ${live.window.count.toLocaleString('en-IN')} requests`}
            icon={ShieldCheck}
            tone={live.window.availability >= 0.999 ? 'emerald' : 'rose'}
            delay={0}
          />
          <StatCard
            label="Requests"
            value={live.totals.count.toLocaleString('en-IN')}
            sub={`${live.window.requestsPerMinute.toFixed(1)} req/min · up ${fmtUptime(live.process.uptimeSeconds)}`}
            icon={Activity}
            tone="brand"
            delay={0.05}
          />
          <StatCard
            label="Latency p99"
            value={fmtMs(live.totals.p99)}
            sub={`p50 ${fmtMs(live.totals.p50)} · p90 ${fmtMs(live.totals.p90)}`}
            icon={Timer}
            tone="teal"
            delay={0.1}
          />
          <StatCard
            label="Error Rate (4xx+5xx)"
            value={fmtPct(live.totals.errorRate)}
            sub={`${live.totals.errors4xx} × 4xx · ${live.totals.errors5xx} × 5xx`}
            icon={Zap}
            tone={live.totals.errors5xx > 0 ? 'rose' : 'amber'}
            delay={0.15}
          />
        </StatGrid>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {demo || !live ? (
          <Card>
            <CardHeader>
              <CardTitle>Telemedicine Saga States</CardTitle>
              <CardDescription>Orchestrated workflow outcomes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-muted/40 p-4">
                <span className="text-sm font-medium text-muted-foreground">Active (In Progress)</span>
                <span className="text-2xl font-bold text-info tabular-nums">{metrics.sagaStateCounts.active}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/40 p-4">
                <span className="text-sm font-medium text-muted-foreground">Completed Successfully</span>
                <span className="text-2xl font-bold text-success tabular-nums">{metrics.sagaStateCounts.completed}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/40 p-4">
                <span className="text-sm font-medium text-muted-foreground">Failed / Compensated</span>
                <span className="text-2xl font-bold text-danger tabular-nums">{metrics.sagaStateCounts.failed}</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Request Outcomes</CardTitle>
              <CardDescription>All requests since process start ({new Date(live.process.startedAt).toLocaleString('en-IN')})</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-muted/40 p-4">
                <span className="text-sm font-medium text-muted-foreground">Succeeded (non-error)</span>
                <span className="text-2xl font-bold text-success tabular-nums">
                  {(live.totals.count - live.totals.errors4xx - live.totals.errors5xx).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/40 p-4">
                <span className="text-sm font-medium text-muted-foreground">Client Errors (4xx)</span>
                <span className="text-2xl font-bold text-warning tabular-nums">{live.totals.errors4xx.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/40 p-4">
                <span className="text-sm font-medium text-muted-foreground">Server Errors (5xx)</span>
                <span className="text-2xl font-bold text-danger tabular-nums">{live.totals.errors5xx.toLocaleString('en-IN')}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>System Throughput</CardTitle>
            <CardDescription>
              {demo || !live ? 'Event pipeline performance, refreshed every 3s' : 'HTTP pipeline performance, refreshed every 15s'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {demo || !live ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-4 text-center">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Event Throughput</p>
                  <p className="text-3xl font-bold text-foreground tabular-nums">
                    {metrics.eventThroughput} <span className="text-sm font-normal text-subtle-foreground">/min</span>
                  </p>
                </div>
                <div className="rounded-xl border border-border p-4 text-center">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avg Latency</p>
                  <p className="text-3xl font-bold text-foreground tabular-nums">
                    {metrics.avgNotificationLatency} <span className="text-sm font-normal text-subtle-foreground">ms</span>
                  </p>
                </div>
                <div className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-center">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-danger">Failed Events</p>
                  <p className="text-3xl font-bold text-danger tabular-nums">{metrics.failedEvents}</p>
                </div>
                <div className="rounded-xl border border-warning/30 bg-warning-soft p-4 text-center">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-warning">Retry Counts</p>
                  <p className="text-3xl font-bold text-warning tabular-nums">{metrics.retryCounts}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-4 text-center">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Request Throughput</p>
                  <p className="text-3xl font-bold text-foreground tabular-nums">
                    {live.window.requestsPerMinute.toFixed(1)} <span className="text-sm font-normal text-subtle-foreground">/min</span>
                  </p>
                </div>
                <div className="rounded-xl border border-border p-4 text-center">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avg Latency</p>
                  <p className="text-3xl font-bold text-foreground tabular-nums">
                    {Math.round(live.totals.avgMs)} <span className="text-sm font-normal text-subtle-foreground">ms</span>
                  </p>
                </div>
                <div className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-center">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-danger">5xx (60m window)</p>
                  <p className="text-3xl font-bold text-danger tabular-nums">{live.window.errors5xx}</p>
                </div>
                <div className="rounded-xl border border-warning/30 bg-warning-soft p-4 text-center">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-warning">Event Loop Lag</p>
                  <p className="text-3xl font-bold text-warning tabular-nums">
                    {Math.round(live.process.eventLoopLagMs)} <span className="text-sm font-normal">ms</span>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="slo" className="w-full">
        <TabsList>
          <TabsTrigger value="slo"><Gauge className="h-4 w-4" aria-hidden /> Operational SLOs & Alerts</TabsTrigger>
          <TabsTrigger value="traces"><GitBranch className="h-4 w-4" aria-hidden /> Sample Traces</TabsTrigger>
        </TabsList>

        <TabsContent value="slo">
          {demo || !live || !slo ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Service Level Objectives (SLOs)</CardTitle>
                  <CardDescription>Rolling 30-day availability vs targets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-border p-4">
                    <div className="mb-2 flex justify-between">
                      <span className="text-sm font-semibold text-foreground">Clinical Backend</span>
                      <span className="text-sm font-bold text-success tabular-nums">99.98%</span>
                    </div>
                    <Progress value={99} tone="success" size="sm" />
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                      <span>Target: 99.95%</span>
                      <span>Error Budget Remaining: 14.2 min</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border p-4">
                    <div className="mb-2 flex justify-between">
                      <span className="text-sm font-semibold text-foreground">Payment Webhooks</span>
                      <span className="text-sm font-bold text-success tabular-nums">99.94%</span>
                    </div>
                    <Progress value={99} tone="success" size="sm" />
                    <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                      <span>Target: 99.90%</span>
                      <span>Error Budget Remaining: 38.1 min</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-danger/30 bg-danger-soft p-4">
                    <div className="mb-2 flex justify-between">
                      <span className="text-sm font-semibold text-danger">ABDM Integration (External)</span>
                      <span className="text-sm font-bold text-danger tabular-nums">94.20%</span>
                    </div>
                    <Progress value={94} tone="danger" size="sm" />
                    <div className="mt-2 flex justify-between text-xs text-danger">
                      <span>Target: Best Effort</span>
                      <span>Degraded - Circuit Breaker OPEN</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Operational Alerts</CardTitle>
                  <CardDescription>Firing alerts requiring attention</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl border-l-4 border-danger bg-danger-soft p-4">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-danger">Circuit Breaker OPEN: ABDM Service</h4>
                      <p className="mt-1 text-xs text-muted-foreground">Dependency has timed out for &gt;3000ms consistently.</p>
                    </div>
                    <span className="font-mono text-xs text-danger">RB-04</span>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border-l-4 border-warning bg-warning-soft p-4">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-warning">Elevated Outbox Backlog</h4>
                      <p className="mt-1 text-xs text-muted-foreground">Pending notification events exceeded 50.</p>
                    </div>
                    <span className="font-mono text-xs text-warning">RB-12</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Availability SLO — Clinical Backend</CardTitle>
                    <CardDescription>Target {fmtPct(slo.availabilityTarget, 1)} over a rolling {slo.windowDays}-day window</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl border border-border p-4">
                      <div className="mb-2 flex justify-between">
                        <span className="text-sm font-semibold text-foreground">Observed Availability</span>
                        <span className={cn('text-sm font-bold tabular-nums', slo.observedAvailability >= slo.availabilityTarget ? 'text-success' : 'text-danger')}>
                          {fmtPct(slo.observedAvailability, 3)}
                        </span>
                      </div>
                      <Progress
                        value={Math.max(0, Math.min(100, slo.observedAvailability * 100))}
                        tone={slo.observedAvailability >= slo.availabilityTarget ? 'success' : 'danger'}
                        size="sm"
                      />
                      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                        <span>Target: {fmtPct(slo.availabilityTarget, 1)}</span>
                        <span>5xx-based · 4xx excluded</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border p-4">
                      <div className="mb-2 flex justify-between">
                        <span className="text-sm font-semibold text-foreground">Error Budget ({fmtMin(slo.errorBudgetMinutes)} min / {slo.windowDays}d)</span>
                        <span className={cn('text-sm font-bold tabular-nums', budgetUsedPct < 50 ? 'text-success' : budgetUsedPct < 90 ? 'text-warning' : 'text-danger')}>
                          {fmtMin(slo.remainingBudgetMinutes)} min left
                        </span>
                      </div>
                      <Progress
                        value={budgetUsedPct}
                        tone={budgetUsedPct < 50 ? 'success' : budgetUsedPct < 90 ? 'warning' : 'danger'}
                        size="sm"
                      />
                      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                        <span>Consumed: {fmtMin(slo.consumedBudgetMinutes)} min</span>
                        <span>{budgetUsedPct.toFixed(1)}% of budget used</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Observed window: {fmtMin(slo.observedWindowMinutes)} of {slo.windowDays * 24 * 60} minutes — {slo.note}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Overall Latency & Errors</CardTitle>
                    <CardDescription>Histogram percentiles across all routes since process start</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {([['p50', live.totals.p50], ['p90', live.totals.p90], ['p99', live.totals.p99]] as const).map(([label, v]) => (
                        <div key={label} className="rounded-xl border border-border p-4 text-center">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                          <p className="text-2xl font-bold text-foreground tabular-nums">{fmtMs(v)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-border p-4 text-center">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Error Rate</p>
                        <p className={cn('text-2xl font-bold tabular-nums', live.totals.errors5xx > 0 ? 'text-danger' : 'text-foreground')}>
                          {fmtPct(live.totals.errorRate)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border p-4 text-center">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Availability</p>
                        <p className="text-2xl font-bold text-success tabular-nums">{fmtPct(live.totals.availability, 3)}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                      Snapshot generated {new Date(live.generatedAt).toLocaleTimeString('en-IN')} · refreshes every 15s
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Per-Route Performance</CardTitle>
                  <CardDescription>Request counts, error rates and latency percentiles by normalized route</CardDescription>
                </CardHeader>
                <CardContent>
                  <DataTable<RouteStat>
                    columns={ROUTE_COLUMNS}
                    data={live.routes}
                    rowKey={(r) => `${r.method} ${r.route}`}
                    searchPlaceholder="Search routes…"
                    exportName="route-performance"
                    pageSize={10}
                    dense
                    emptyTitle="No traffic recorded yet"
                    emptyDescription="Route statistics appear once the backend starts serving requests."
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="traces">
          <Card>
            <CardHeader className="flex-row flex-wrap items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" aria-hidden />
                  Execution Trace Viewer
                </CardTitle>
                <CardDescription className="mt-1.5">Sample traces — tracing integration pending</CardDescription>
              </div>
              <div className="flex max-w-full gap-2 overflow-x-auto no-scrollbar sm:max-w-sm">
                {traces.map(trace => (
                  <button
                    key={trace.id}
                    onClick={() => setActiveTrace(trace.id)}
                    aria-pressed={activeTrace === trace.id}
                    className={cn(
                      'whitespace-nowrap rounded-xl px-3.5 py-2 font-mono text-xs font-semibold transition-colors',
                      activeTrace === trace.id
                        ? 'bg-primary text-primary-foreground shadow-soft'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    )}
                  >
                    {trace.id.substring(0, 8)}...
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {/* Forced-dark console so the trace log reads like a terminal in both themes */}
              <div className="dark rounded-2xl border border-border bg-background p-6 font-mono text-sm text-foreground">
                {selectedTrace ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-bold text-primary">Trace ID:</span> {activeTrace}
                        <Badge tone={selectedTrace.status === 'Active' ? 'info' : selectedTrace.status === 'Recovered' ? 'warning' : 'success'} dot>
                          {selectedTrace.status}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground">
                        <span className="font-bold text-info">Workflow:</span> {selectedTrace.workflow}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" disabled title="Coming soon">
                        <Play className="h-3.5 w-3.5 text-success" aria-hidden /> Replay Timeline
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleExportJson}>
                        <Download className="h-3.5 w-3.5 text-info" aria-hidden /> Export JSON
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleExportMermaid}>
                        <Share2 className="h-3.5 w-3.5 text-primary" aria-hidden /> Export Mermaid
                      </Button>
                    </div>

                    <ol className="max-h-96 space-y-1 overflow-y-auto pr-2 scrollbar-thin">
                      {selectedTrace.events.map((evt: any, i: number) => (
                        <li key={i} className="group relative flex items-start gap-4 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/40">
                          <span className="flex w-24 shrink-0 items-center gap-1.5 text-subtle-foreground tabular-nums">
                            <Clock className="h-3 w-3" aria-hidden /> {evt.time}
                          </span>
                          <span className="relative mt-1.5 flex shrink-0" aria-hidden>
                            <span className="h-1.5 w-1.5 rounded-full bg-primary transition-transform group-hover:scale-150" />
                            {i < selectedTrace.events.length - 1 && (
                              <span className="absolute left-[2.5px] top-3 h-6 w-px bg-border" />
                            )}
                          </span>
                          <span className="w-28 shrink-0 text-muted-foreground">[{evt.source}]</span>
                          <span className="text-success transition-colors group-hover:text-accent">{evt.name}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">Select a trace to view execution lifecycle</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
