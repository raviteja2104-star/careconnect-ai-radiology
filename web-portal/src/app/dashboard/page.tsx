'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users, Clock, AlertTriangle, IndianRupee, Video,
  Activity, Calendar, Bell,
  Stethoscope, FlaskConical,
  CheckCircle, XCircle, Heart, Pill, ChevronRight,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Badge, Button, Avatar,
  Card, CardHeader, CardTitle, CardContent,
} from '@/components/ui';

// ─── Types ────────────────────────────────────────────────────────────────────
interface QueuePatient {
  token: string; name: string; age: string; gender: string;
  type: 'OPD' | 'Telemedicine' | 'Follow-up';
  time: string; waitMins: number; risk: 'Low' | 'Medium' | 'High';
  status: 'Waiting' | 'Vitals Taken' | 'Scheduled' | 'In Consultation';
  mrn: string;
}

interface Task { title: string; patient: string; time: string; type: 'radiology' | 'prescription' | 'lab' | 'approval'; priority: 'normal' | 'urgent'; }
interface Alert { id: string; type: 'critical' | 'warning' | 'info'; message: string; patient: string; time: string; }

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const KPI_STATS = [
  { label: "Today's Appointments", value: '42', sub: '+5 from yesterday', icon: Users, tone: 'brand', trend: 'up' },
  { label: 'Waiting Queue', value: '12', sub: '3 waited > 30 min', icon: Clock, tone: 'amber', trend: 'neutral' },
  { label: 'Critical Alerts', value: '3', sub: '2 new since last login', icon: AlertTriangle, tone: 'rose', trend: 'up' },
  { label: 'Revenue (Today)', value: '₹45,200', sub: '↑ 12% vs last week', icon: IndianRupee, tone: 'emerald', trend: 'up' },
] as const;

const QUEUE: QueuePatient[] = [
  { token: 'A-01', name: 'Rohit Sharma', age: '32', gender: 'M', type: 'OPD', time: '10:00 AM', waitMins: 15, risk: 'Low', status: 'Waiting', mrn: 'MRN-2024-07241' },
  { token: 'A-02', name: 'Priya Patel', age: '45', gender: 'F', type: 'Follow-up', time: '10:15 AM', waitMins: 5, risk: 'High', status: 'Vitals Taken', mrn: 'MRN-2024-08912' },
  { token: 'A-03', name: 'Anil Kumar', age: '58', gender: 'M', type: 'Telemedicine', time: '10:30 AM', waitMins: 0, risk: 'Medium', status: 'Scheduled', mrn: 'MRN-2024-06133' },
  { token: 'A-04', name: 'Deepa Nair', age: '29', gender: 'F', type: 'OPD', time: '10:45 AM', waitMins: 32, risk: 'Low', status: 'Waiting', mrn: 'MRN-2024-09456' },
  { token: 'A-05', name: 'Mohammed Ali', age: '63', gender: 'M', type: 'Follow-up', time: '11:00 AM', waitMins: 0, risk: 'High', status: 'In Consultation', mrn: 'MRN-2024-04877' },
];

const TASKS: Task[] = [
  { title: 'Review MRI Brain — Possible Ischemia', patient: 'Suresh Verma', time: '2h ago', type: 'radiology', priority: 'urgent' },
  { title: 'Sign Prescription Refill (Metformin)', patient: 'Meena Gupta', time: '4h ago', type: 'prescription', priority: 'normal' },
  { title: 'Critical Lab: HbA1c 9.8% — Action Required', patient: 'Vikram Singh', time: '1h ago', type: 'lab', priority: 'urgent' },
  { title: 'Discharge Summary Approval', patient: 'Lakshmi Reddy', time: '30m ago', type: 'approval', priority: 'urgent' },
];

const ALERTS: Alert[] = [
  { id: '1', type: 'critical', message: 'Troponin I critically elevated — 4.82 ng/mL', patient: 'Ravi Kumar (MRN-2024-08742)', time: '09:52' },
  { id: '2', type: 'warning', message: 'Drug interaction: Warfarin + Aspirin flagged', patient: 'Deepa Nair (MRN-2024-09456)', time: '09:30' },
  { id: '3', type: 'info', message: 'Imaging complete: CT Chest report available', patient: 'Anil Kumar (MRN-2024-06133)', time: '08:45' },
];

const UPCOMING = [
  { time: '14:00', name: 'Kavitha Rajan', type: 'New Consult', specialty: 'Cardiology' },
  { time: '14:30', name: 'Raju Pillai', type: 'Follow-up', specialty: 'Neurology' },
  { time: '15:00', name: 'Sunita Sharma', type: 'Telemedicine', specialty: 'Endocrinology' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_TONE: Record<QueuePatient['status'], { tone: 'warning' | 'success' | 'neutral' | 'brand'; pulse?: boolean }> = {
  'Waiting': { tone: 'warning' },
  'Vitals Taken': { tone: 'success' },
  'Scheduled': { tone: 'neutral' },
  'In Consultation': { tone: 'brand', pulse: true },
};
const RISK_TONE: Record<QueuePatient['risk'], 'success' | 'warning' | 'danger'> = {
  Low: 'success', Medium: 'warning', High: 'danger',
};
const TASK_CONFIG = {
  radiology: { color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400', icon: Activity },
  prescription: { color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400', icon: Pill },
  lab: { color: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400', icon: FlaskConical },
  approval: { color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400', icon: CheckCircle },
};
const ALERT_STYLE: Record<Alert['type'], string> = {
  critical: 'border-danger/30 bg-danger-soft text-danger',
  warning: 'border-warning/30 bg-warning-soft text-warning',
  info: 'border-info/30 bg-info-soft text-info',
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [queueFilter, setQueueFilter] = useState<'All' | 'OPD' | 'Telemedicine' | 'Follow-up'>('All');
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const filteredQueue = QUEUE.filter(p => queueFilter === 'All' || p.type === queueFilter);
  const activeAlerts = ALERTS.filter(a => !dismissedAlerts.includes(a.id));

  // Computed after mount: locale-formatted dates differ between server and
  // client renders and trigger hydration errors if emitted during SSR.
  const [today, setToday] = React.useState('');
  React.useEffect(() => {
    setToday(new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Good Morning, Dr. Sharma"
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
        {KPI_STATS.map((stat, i) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            sub={stat.sub}
            icon={stat.icon}
            tone={stat.tone}
            trend={stat.trend}
            trendPositive={stat.label !== 'Critical Alerts'}
            delay={i * 0.05}
          />
        ))}
      </StatGrid>

      {/* ── Active Alerts Banner ── */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          {activeAlerts.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`flex items-center gap-3 rounded-2xl border p-3 text-sm ${ALERT_STYLE[alert.type]}`}
            >
              {alert.type === 'critical'
                ? <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                : <Bell className="h-4 w-4 shrink-0" aria-hidden />}
              <div className="min-w-0 flex-1">
                <span className="font-semibold">{alert.message}</span>
                <span className="ml-2 text-xs opacity-70">· {alert.patient} · {alert.time}</span>
              </div>
              <button
                onClick={() => setDismissedAlerts(p => [...p, alert.id])}
                className="shrink-0 rounded-lg p-1 transition-opacity hover:opacity-70"
                aria-label="Dismiss alert"
              >
                <XCircle className="h-4 w-4" aria-hidden />
              </button>
            </motion.div>
          ))}
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
                <Badge tone="brand">{QUEUE.length}</Badge>
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
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr className="border-b border-border">
                    {['Token', 'Patient', 'Type', 'Time', 'Wait', 'Risk', 'Status', 'Action'].map(h => (
                      <th key={h} scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredQueue.map((p) => {
                    const sc = STATUS_TONE[p.status];
                    return (
                      <tr
                        key={p.token}
                        className="group cursor-pointer transition-colors hover:bg-muted/40"
                        onClick={() => router.push('/doctor/queue')}
                      >
                        <td className="px-4 py-3.5 font-mono font-bold text-foreground">{p.token}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={p.name} size="sm" />
                            <div>
                              <p className="font-semibold text-foreground">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.age}y · {p.gender} · <span className="font-mono">{p.mrn}</span></p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge tone={p.type === 'Telemedicine' ? 'info' : 'brand'}>
                            {p.type === 'Telemedicine' && <Video className="h-3 w-3" aria-hidden />}
                            {p.type}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{p.time}</td>
                        <td className="px-4 py-3.5">
                          <span className={`font-semibold tabular-nums ${p.waitMins > 20 ? 'text-danger' : p.waitMins > 10 ? 'text-warning' : 'text-muted-foreground'}`}>
                            {p.waitMins > 0 ? `${p.waitMins}m` : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge tone={RISK_TONE[p.risk]}>{p.risk}</Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge tone={sc.tone} dot pulse={sc.pulse}>{p.status}</Badge>
                        </td>
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {p.type === 'Telemedicine' && (
                              <Link
                                href="/consultations"
                                title="Join Video"
                                aria-label={`Join video consult with ${p.name}`}
                                className="rounded-lg bg-info-soft p-1.5 text-info transition-colors hover:opacity-80"
                              >
                                <Video className="h-3.5 w-3.5" aria-hidden />
                              </Link>
                            )}
                            <Link href="/emr">
                              <Button variant="secondary" size="sm">Open Chart</Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-xs text-subtle-foreground">Showing {filteredQueue.length} of {QUEUE.length} patients</span>
              <Link href="/appointments" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                View Full Schedule <ChevronRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* ── Right: Context rail ── */}
        <div className="flex flex-col gap-6 xl:col-span-1">

          {/* Task Center */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Task Center</CardTitle>
              <Badge tone="danger" dot pulse>
                {TASKS.filter(t => t.priority === 'urgent').length} Urgent
              </Badge>
            </CardHeader>
            <CardContent className="p-2">
              {TASKS.map((task, i) => {
                const cfg = TASK_CONFIG[task.type];
                const Icon = cfg.icon;
                return (
                  <Link
                    key={i}
                    href={task.type === 'prescription' ? '/prescriptions' : task.type === 'lab' ? '/lab-orders' : '/emr'}
                    className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted/60"
                  >
                    <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cfg.color}`}>
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">{task.title}</p>
                        {task.priority === 'urgent' && <Badge tone="danger" className="shrink-0 text-[10px]">Urgent</Badge>}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{task.patient} · {task.time}</p>
                    </div>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          {/* Upcoming */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Upcoming (Afternoon)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-3">
              {UPCOMING.map((a, i) => (
                <Link key={i} href="/appointments" className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted/60">
                  <span className="w-14 text-center font-mono text-sm font-bold text-primary">{a.time}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.type} · {a.specialty}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-subtle-foreground" aria-hidden />
                </Link>
              ))}
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
                <span className="text-sm font-bold">AI Daily Briefing</span>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-white/85">
                You have <strong>3 high-risk patients</strong> today. <strong>Suresh Verma&apos;s</strong> MRI shows minor ischemia — review recommended before 12:00.
              </p>
              <Link
                href="/emr"
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
