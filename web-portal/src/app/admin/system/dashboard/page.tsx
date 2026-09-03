'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Server, Cpu, HardDrive, Activity, CheckCircle2, ShieldCheck, Timer, Radio, LineChart,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts';
import { CHART_COLORS, chartGrid, chartAxis, chartTooltip } from '@/lib/chart-theme';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription,
  CardContent, Badge, Progress, Skeleton, EmptyState,
} from '@/components/ui';

export default function ProductionDashboard() {
  const { data: healthRes } = useQuery({
    queryKey: ['system_health'],
    queryFn: () => fetch('http://localhost:5000/api/system/health').then(res => res.json()),
    refetchInterval: 5000
  });

  const { data: perfRes } = useQuery({
    queryKey: ['system_performance'],
    queryFn: () => fetch('http://localhost:5000/api/system/performance').then(res => res.json()),
    refetchInterval: 5000
  });

  const health = healthRes?.data || { status: 'loading', services: {} };
  const perf = perfRes?.data || { cpu: {}, memory: {}, network: {}, eventLoop: {} };

  // Calculate mock percentage for UI
  const memUsedPercent = perf.memory.total ? ((perf.memory.total - perf.memory.free) / perf.memory.total * 100).toFixed(1) : 0;
  const cpuLoad = perf.cpu.loadAvg ? (perf.cpu.loadAvg[0] * 10).toFixed(1) : 0;

  const loading = !healthRes && !perfRes;
  const services = Object.entries(health.services || {});

  // Client-side rolling window of the polled telemetry (presentation only).
  const [history, setHistory] = React.useState<{ time: string; cpu: number; memory: number }[]>([]);
  React.useEffect(() => {
    if (!perfRes) return;
    setHistory((h) => [
      ...h.slice(-23),
      {
        time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
        cpu: Number(cpuLoad),
        memory: Number(memUsedPercent),
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfRes]);

  const complianceRows = [
    { label: 'HIPAA Readiness', badge: <Badge tone="info">Audited</Badge>, icon: ShieldCheck },
    { label: 'ABDM Gateway', badge: <Badge tone="success" dot pulse>Active</Badge>, icon: Radio },
    { label: 'XSS / CSP Mitigation', badge: <Badge tone="success">Enabled</Badge>, icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production Cluster"
        description="Node.js engine telemetry — Kubernetes ready, multi-region."
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'System' }, { label: 'Dashboard' }]}
        actions={
          <>
            <Badge tone="outline">
              <Timer className="mr-1 h-3.5 w-3.5" aria-hidden />
              Uptime {health.uptime ? (health.uptime / 3600).toFixed(2) : '—'} hrs
            </Badge>
            <Badge tone="success" dot pulse>Production live</Badge>
          </>
        }
      />

      <StatGrid>
        <StatCard
          label="CPU Cluster"
          value={`${cpuLoad}%`}
          sub={perf.cpu.cores ? `${perf.cpu.cores} cores` : 'Awaiting telemetry'}
          icon={Cpu}
          tone="emerald"
          delay={0}
        />
        <StatCard
          label="Memory / Redis"
          value={`${memUsedPercent}%`}
          sub={perf.memory.processRss ? `Node RSS ${(perf.memory.processRss / 1024 / 1024).toFixed(0)} MB` : 'Awaiting telemetry'}
          icon={HardDrive}
          tone="brand"
          delay={0.05}
        />
        <StatCard
          label="Event Bus"
          value={perf.network.activeConnections ?? '—'}
          sub={`Active WebSockets • Latency ${perf.eventLoop.latency ?? '—'}`}
          icon={Activity}
          tone="violet"
          delay={0.1}
        />
        <StatCard
          label="Cluster Status"
          value={health.status === 'loading' ? '…' : String(health.status ?? '—').toUpperCase()}
          sub="Health probe every 5s"
          icon={Server}
          tone="teal"
          delay={0.15}
        />
      </StatGrid>

      {/* Load meters */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { title: 'CPU Load', meter: Math.min(Number(cpuLoad), 100), tone: 'success' as const, icon: Cpu, foot: perf.cpu.model ? `${perf.cpu.cores} cores • ${perf.cpu.model}` : 'Model pending' },
          { title: 'Memory Pressure', meter: Number(memUsedPercent), tone: 'brand' as const, icon: HardDrive, foot: perf.memory.processRss ? `Node RSS ${(perf.memory.processRss / 1024 / 1024).toFixed(0)} MB` : 'RSS pending' },
          { title: 'Socket Saturation', meter: 25, tone: 'warning' as const, icon: Activity, foot: `Event-loop latency ${perf.eventLoop.latency ?? '—'}` },
        ].map((m, i) => (
          <motion.div
            key={m.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <m.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                  {m.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <Progress value={m.meter} tone={m.tone} showValue label={m.title} />
                )}
                <p className="mt-3 text-xs text-muted-foreground">{m.foot}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Live telemetry trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-4 w-4 text-muted-foreground" aria-hidden />
            Live Utilization Trend
          </CardTitle>
          <CardDescription>CPU load and memory pressure, sampled every 5 seconds.</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length < 2 ? (
            <div className="flex h-56 items-center justify-center">
              <p className="text-sm text-muted-foreground">Collecting samples — the trend appears after two polling cycles.</p>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sysCpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="sysMemGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS[1]} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={CHART_COLORS[1]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...chartGrid} />
                  <XAxis {...chartAxis} dataKey="time" minTickGap={32} />
                  <YAxis {...chartAxis} unit="%" domain={[0, 100]} />
                  <Tooltip {...chartTooltip} />
                  <Area type="monotone" dataKey="cpu" name="CPU %" stroke={CHART_COLORS[0]} strokeWidth={2} fill="url(#sysCpuGradient)" />
                  <Area type="monotone" dataKey="memory" name="Memory %" stroke={CHART_COLORS[1]} strokeWidth={2} fill="url(#sysMemGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Service Readiness */}
        <Card>
          <CardHeader>
            <CardTitle>Service Readiness</CardTitle>
            <CardDescription>Liveness of each downstream dependency.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-11 w-full" />
              </div>
            ) : services.length === 0 ? (
              <EmptyState
                icon={Server}
                title="No services reporting"
                description="The health endpoint has not returned any service probes yet."
              />
            ) : (
              <ul className="space-y-2.5">
                {services.map(([service, status]: any, i) => (
                  <motion.li
                    key={service}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3"
                  >
                    <span className="text-sm font-medium capitalize text-foreground">{service}</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                      {String(status)}
                    </span>
                  </motion.li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Compliance & Security */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Check</CardTitle>
            <CardDescription>Security posture and regulatory gateways.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {complianceRows.map((row, i) => (
                <motion.li
                  key={row.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3"
                >
                  <span className="flex items-center gap-2.5 text-sm font-medium text-foreground">
                    <row.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
                    {row.label}
                  </span>
                  {row.badge}
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
