'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Clock, AlertTriangle, IndianRupee, Video,
  Activity, Calendar, Bell,
  Stethoscope, FlaskConical,
  CheckCircle, XCircle, Heart, Pill, ChevronRight,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Badge, Button, Avatar,
  Card, CardHeader, CardTitle, CardContent, EmptyState, SkeletonCard,
} from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

const getAuthHeader = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const apiFetch = (path: string) =>
  fetch(`${API_BASE}${path}`, { headers: getAuthHeader() }).then(r => r.json());

// ─── Types ────────────────────────────────────────────────────────────────────
interface QueuePatient {
  _id: string; tokenNumber: string; patientName: string;
  type: string; status: string; createdAt: string;
}

const TASK_CONFIG = {
  radiology: { color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400', icon: Activity },
  prescription: { color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400', icon: Pill },
  lab: { color: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400', icon: FlaskConical },
  approval: { color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400', icon: CheckCircle },
} as const;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [queueFilter, setQueueFilter] = useState<'All' | 'OPD' | 'Telemedicine' | 'Follow-up'>('All');
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const userName = React.useMemo(() => {
    if (typeof window === 'undefined') return 'Doctor';
    try {
      const u = JSON.parse(localStorage.getItem('cc-user') ?? '{}');
      return u.name || u.email?.split('@')[0] || 'Doctor';
    } catch { return 'Doctor'; }
  }, []);

  const [today, setToday] = React.useState('');
  React.useEffect(() => {
    setToday(new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);

  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => apiFetch('/api/dashboard/overview'),
    refetchInterval: 30000,
  });

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['queue', 'OPD'],
    queryFn: () => apiFetch('/api/queue/OPD'),
    refetchInterval: 15000,
  });

  const { data: upcomingData } = useQuery({
    queryKey: ['dashboard-appointments'],
    queryFn: () => apiFetch('/api/dashboard/appointments'),
    refetchInterval: 60000,
  });

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiFetch('/api/notifications'),
    refetchInterval: 30000,
  });

  const overview = overviewData?.data ?? {};
  const kpiStats = [
    {
      label: "Today's Appointments",
      value: overviewLoading ? '—' : String(overview.casesToday ?? '—'),
      sub: 'Scans and consultations',
      icon: Users, tone: 'brand' as const, trend: 'neutral' as const,
    },
    {
      label: 'Pending Scans',
      value: overviewLoading ? '—' : String(overview.pendingScans ?? '—'),
      sub: `${overview.statPriority ?? 0} STAT priority`,
      icon: Clock, tone: 'amber' as const, trend: 'neutral' as const,
    },
    {
      label: 'Active SOS',
      value: overviewLoading ? '—' : String(overview.sosAlerts ?? '—'),
      sub: `${overview.sosDispatched ?? 0} dispatched`,
      icon: AlertTriangle, tone: 'rose' as const, trend: 'up' as const,
    },
    {
      label: 'Active Patients',
      value: overviewLoading ? '—' : String(overview.activePatients ?? '—'),
      sub: `${overview.criticalPatients ?? 0} critical`,
      icon: IndianRupee, tone: 'emerald' as const, trend: 'up' as const,
    },
  ];

  const allTokens: QueuePatient[] = queueData?.data ?? [];
  const filteredQueue = allTokens.filter(t =>
    queueFilter === 'All' || t.type === queueFilter
  );

  const rawNotifs: any[] = notifData?.data ?? notifData?.notifications ?? [];
  const activeAlerts = rawNotifs
    .filter(n => !n.read && !n.isRead && !dismissedAlerts.includes(n._id ?? n.id))
    .slice(0, 4);

  const upcomingAppts: any[] = upcomingData?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good Morning, ${userName}`}
        description={today}
        actions={
          <>
            <Link href="/appointments">
              <Button variant="outline">
                <Calendar className="h-4 w-4" aria-hidden /> Manage Schedule
              </Button>
            </Link>
            <Link href="/emr">
              <Button>
                <Stethoscope className="h-4 w-4" aria-hidden /> Start Next Consult
              </Button>
            </Link>
          </>
        }
      />

      {/* ── KPI Row ── */}
      <StatGrid>
        {kpiStats.map((stat, i) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            sub={stat.sub}
            icon={stat.icon}
            tone={stat.tone}
            trend={stat.trend}
            delay={i * 0.05}
          />
        ))}
      </StatGrid>

      {/* ── Unread Notifications Banner ── */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          {activeAlerts.map((alert: any, i: number) => {
            const id = alert._id ?? alert.id;
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning-soft p-3 text-sm text-warning"
              >
                <Bell className="h-4 w-4 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <span className="font-semibold">{alert.title || alert.subject || 'New notification'}</span>
                  {alert.body || alert.message
                    ? <span className="ml-2 text-xs opacity-70">· {alert.body || alert.message}</span>
                    : null}
                </div>
                <button
                  onClick={() => setDismissedAlerts(p => [...p, id])}
                  className="shrink-0 rounded-lg p-1 transition-opacity hover:opacity-70"
                  aria-label="Dismiss alert"
                >
                  <XCircle className="h-4 w-4" aria-hidden />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ── Left: Queue ── */}
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2">
                Patient Queue
                <Badge tone="brand">{allTokens.length}</Badge>
              </CardTitle>
            </div>
            <div className="flex gap-1" role="group" aria-label="Filter queue by visit type">
              {(['All', 'OPD', 'Telemedicine', 'Follow-up'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setQueueFilter(f)}
                  aria-pressed={queueFilter === f}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${queueFilter === f
                    ? 'bg-primary text-primary-foreground shadow-soft'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {queueLoading ? (
              <div className="p-4"><SkeletonCard /></div>
            ) : filteredQueue.length === 0 ? (
              <EmptyState icon={Users} title="Queue is empty" description="No patients waiting in this department." className="py-12" />
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60">
                    <tr className="border-b border-border">
                      {['Token', 'Patient', 'Type', 'Status', 'Action'].map(h => (
                        <th key={h} scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredQueue.map((p) => (
                      <tr
                        key={p._id}
                        className="group cursor-pointer transition-colors hover:bg-muted/40"
                        onClick={() => router.push('/doctor/queue')}
                      >
                        <td className="px-4 py-3.5 font-mono font-bold text-foreground">{p.tokenNumber}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={p.patientName} size="sm" />
                            <p className="font-semibold text-foreground">{p.patientName}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge tone={p.type === 'Telemedicine' ? 'info' : 'brand'}>
                            {p.type === 'Telemedicine' && <Video className="h-3 w-3" aria-hidden />}
                            {p.type || 'OPD'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            tone={p.status === 'WAITING' ? 'warning' : p.status === 'CALLED' ? 'brand' : p.status === 'IN_PROGRESS' ? 'success' : 'neutral'}
                            dot={p.status === 'IN_PROGRESS'}
                            pulse={p.status === 'IN_PROGRESS'}
                          >
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {p.type === 'Telemedicine' && (
                              <Link href="/consultations" title="Join Video" aria-label={`Join video consult with ${p.patientName}`}
                                className="rounded-lg bg-info-soft p-1.5 text-info transition-colors hover:opacity-80">
                                <Video className="h-3.5 w-3.5" aria-hidden />
                              </Link>
                            )}
                            <Link href="/doctor/queue">
                              <Button variant="secondary" size="sm">Open Queue</Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-xs text-subtle-foreground">Showing {filteredQueue.length} of {allTokens.length} patients</span>
              <Link href="/doctor/queue" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                Full Queue Workspace <ChevronRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* ── Right: Context rail ── */}
        <div className="flex flex-col gap-6 xl:col-span-1">

          {/* Quick Links replacing Tasks */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Quick Access</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              {[
                { href: '/emr', type: 'radiology' as const, title: 'Review pending scans & reports', sub: 'Radiology · EMR' },
                { href: '/prescriptions', type: 'prescription' as const, title: 'Manage prescriptions', sub: 'Medication orders' },
                { href: '/lab-orders', type: 'lab' as const, title: 'Lab orders & results', sub: 'Pathology · LIS' },
                { href: '/appointments', type: 'approval' as const, title: 'Appointment schedule', sub: 'Today & upcoming' },
              ].map((task, i) => {
                const cfg = TASK_CONFIG[task.type];
                const Icon = cfg.icon;
                return (
                  <Link key={i} href={task.href} className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted/60">
                    <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.color}`}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">{task.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{task.sub}</p>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* Upcoming appointments from API */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Upcoming Today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-3">
              {upcomingAppts.length === 0 ? (
                <EmptyState icon={Calendar} title="No upcoming appointments" description="Your schedule for today is clear." className="py-6" />
              ) : (
                upcomingAppts.map((a: any, i: number) => (
                  <Link key={a._id ?? i} href="/appointments" className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted/60">
                    <span className="w-14 text-center font-mono text-sm font-bold text-primary">{a.time}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.type}{a.specialty ? ` · ${a.specialty}` : ''}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-subtle-foreground" aria-hidden />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* AI Briefing */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="gradient-brand relative overflow-hidden rounded-2xl p-5 text-white shadow-float"
          >
            <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden />
            <div className="relative z-10">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded-lg bg-white/20 p-1.5 backdrop-blur-sm"><Activity className="h-4 w-4" aria-hidden /></span>
                <span className="text-sm font-bold">AI Health Assistant</span>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-white/85">
                Ask clinical questions, get document summaries, and use AI-powered decision support for your patients.
              </p>
              <Link
                href="/ai-assistant"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-xs font-bold text-primary shadow-soft transition-colors hover:bg-white/90"
              >
                <Heart className="h-3.5 w-3.5" aria-hidden /> Open AI Copilot
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
