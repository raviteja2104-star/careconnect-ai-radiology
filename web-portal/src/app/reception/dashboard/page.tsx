'use client';
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, UserPlus, CalendarCheck, IndianRupee, Clock, CheckCircle2, TicketCheck,
  Tv, MonitorSmartphone, Stethoscope,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription,
  CardContent, Badge, Avatar, Button, EmptyState, Skeleton,
} from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
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

  const stats = statsRes?.data ?? { appointmentsToday: 0, walkInsToday: 0, checkedIn: 0, waiting: 0, completed: 0, revenueCollected: 0 };
  const doctors: { id: string; name: string; dept: string; status: string }[] = doctorsRes?.data ?? [];

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
              <Badge tone="neutral">Activity Feed</Badge>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Users}
                title="Activity feed not yet connected"
                description="Real-time front-desk events will appear here once the activity stream API is wired to queue and check-in webhooks."
              />
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
                    Status derived from live OPD queue and today's appointments.
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
