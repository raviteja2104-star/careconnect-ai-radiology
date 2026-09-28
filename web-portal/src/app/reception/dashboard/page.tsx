'use client';
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, UserPlus, CalendarCheck, IndianRupee, Clock, CheckCircle2, TicketCheck,
  Tv, MonitorSmartphone, Stethoscope, Ticket, PhoneCall, CircleCheck, CircleX,
  ArrowRightLeft, CreditCard, RefreshCw,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription,
  CardContent, Badge, Avatar, Button, EmptyState, Skeleton,
} from '@/components/ui';
import type { LucideIcon } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type ActivityEvent = {
  id: string;
  kind: 'checkin' | 'walkin' | 'called' | 'in_progress' | 'completed' | 'missed' | 'cancelled' | 'payment' | 'transferred';
  title: string;
  detail: string;
  at: string;
  priorityReason: string | null;
};

const KIND_META: Record<string, { icon: LucideIcon; dot: string }> = {
  walkin:      { icon: UserPlus,       dot: 'bg-violet-500' },
  checkin:     { icon: TicketCheck,    dot: 'bg-blue-500' },
  called:      { icon: PhoneCall,      dot: 'bg-amber-500' },
  in_progress: { icon: Stethoscope,   dot: 'bg-blue-600' },
  completed:   { icon: CircleCheck,    dot: 'bg-emerald-500' },
  missed:      { icon: CircleX,        dot: 'bg-rose-400' },
  cancelled:   { icon: CircleX,        dot: 'bg-slate-400' },
  transferred: { icon: ArrowRightLeft, dot: 'bg-cyan-500' },
  payment:     { icon: CreditCard,     dot: 'bg-emerald-600' },
};

function timeAgo(iso: string): string {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const doctorStatusMeta: Record<string, { avatar: 'online' | 'busy' | 'away' | 'offline'; tone: 'success' | 'info' | 'warning' | 'neutral' }> = {
  Consulting: { avatar: 'busy', tone: 'info' },
  Available:  { avatar: 'online', tone: 'success' },
  Break:      { avatar: 'away', tone: 'warning' },
  Offline:    { avatar: 'offline', tone: 'neutral' },
};

export default function ReceptionDashboard() {
  const { data: statsRes, isLoading } = useQuery({
    queryKey: ['reception_dashboard'],
    queryFn: () =>
      fetch(`${API_BASE}/api/reception/dashboard`, { headers: authHeaders() }).then(r => r.json()),
    refetchInterval: 30_000,
  });

  const { data: doctorsRes, isLoading: doctorsLoading } = useQuery({
    queryKey: ['reception_doctors_status'],
    queryFn: () =>
      fetch(`${API_BASE}/api/reception/doctors-status`, { headers: authHeaders() }).then(r => r.json()),
    refetchInterval: 30_000,
  });

  const { data: activityRes, isLoading: activityLoading, dataUpdatedAt } = useQuery({
    queryKey: ['reception_activity'],
    queryFn: () =>
      fetch(`${API_BASE}/api/reception/activity`, { headers: authHeaders() }).then(r => r.json()),
    refetchInterval: 20_000,
  });

  const stats = statsRes?.data ?? { appointmentsToday: 0, walkInsToday: 0, checkedIn: 0, waiting: 0, completed: 0, revenueCollected: 0 };
  const doctors: { id: string; name: string; dept: string; status: string }[] = doctorsRes?.data ?? [];
  const activity: ActivityEvent[] = activityRes?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Command Centre"
        description="Real-time overview of front office operations."
        crumbs={[{ label: 'Reception' }, { label: 'Dashboard' }]}
        actions={
          <>
            <Link href="/display">
              <Button variant="outline"><Tv className="h-4 w-4" aria-hidden /> Queue display</Button>
            </Link>
            <Link href="/kiosk">
              <Button variant="outline"><MonitorSmartphone className="h-4 w-4" aria-hidden /> Kiosk</Button>
            </Link>
            <Link href="/reception/checkin">
              <Button variant="outline"><TicketCheck className="h-4 w-4" aria-hidden /> Check-in</Button>
            </Link>
            <Link href="/reception/walkin">
              <Button><UserPlus className="h-4 w-4" aria-hidden /> New walk-in</Button>
            </Link>
          </>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3" aria-busy>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      ) : (
        <StatGrid>
          <StatCard
            label="Total Appointments"
            value={stats.appointmentsToday}
            sub="Scheduled for today"
            icon={CalendarCheck}
            tone="brand"
            delay={0}
          />
          <StatCard
            label="Walk-ins Today"
            value={stats.walkInsToday}
            sub={`${stats.checkedIn} checked in total`}
            icon={UserPlus}
            tone="violet"
            delay={0.05}
          />
          <StatCard
            label="Currently Waiting"
            value={stats.waiting}
            sub="In queue"
            icon={Clock}
            tone="amber"
            delay={0.1}
          />
          <StatCard
            label="Revenue Collected"
            value={`₹${stats.revenueCollected.toLocaleString()}`}
            sub={`${stats.completed} visits completed`}
            icon={IndianRupee}
            tone="emerald"
            delay={0.15}
          />
        </StatGrid>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Live Activity Stream */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="xl:col-span-2"
        >
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Live Activity Stream</CardTitle>
                <CardDescription>Latest front-desk events as they happen.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {dataUpdatedAt > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    Updated {timeAgo(new Date(dataUpdatedAt).toISOString())}
                  </span>
                )}
                <Badge tone="neutral"><RefreshCw className="h-3 w-3 mr-1" aria-hidden />Live</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {activityLoading && (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-7 w-7 rounded-full shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-56" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                      <Skeleton className="h-3 w-12 shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {!activityLoading && activity.length === 0 && (
                <EmptyState
                  icon={Ticket}
                  title="No activity yet today"
                  description="Check-ins, token calls, and payments will appear here as they happen."
                />
              )}

              {!activityLoading && activity.length > 0 && (
                <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                  {activity.map((event, i) => {
                    const meta = KIND_META[event.kind] ?? KIND_META.checkin;
                    const Icon = meta.icon;
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/40"
                      >
                        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.dot} text-white`}>
                          <Icon className="h-3.5 w-3.5" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground leading-snug">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{event.detail}</p>
                          {event.priorityReason && (
                            <span className="mt-0.5 inline-block rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                              {event.priorityReason}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{timeAgo(event.at)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Doctor Status Board */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Doctor Status</CardTitle>
              <CardDescription>Consultation availability right now.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {doctorsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : doctors.length === 0 ? (
                <EmptyState
                  icon={Stethoscope}
                  title="No doctors on record"
                  description="Doctor accounts will appear here once staff profiles are created in the system."
                />
              ) : (
                <>
                  {doctors.map((doc) => {
                    const meta = doctorStatusMeta[doc.status] ?? doctorStatusMeta['Offline'];
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/40"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={doc.name} status={meta.avatar} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold leading-tight text-foreground">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.dept}</p>
                          </div>
                        </div>
                        <Badge tone={meta.tone} dot pulse={doc.status === 'Consulting'}>
                          {doc.status}
                        </Badge>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden />
                    Status derived from live OPD queue and today&apos;s appointments.
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
