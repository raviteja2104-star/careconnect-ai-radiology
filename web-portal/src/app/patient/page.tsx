'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Heart, Activity, Calendar, FileText, Pill,
  Sparkles, CheckCircle, AlertTriangle, Moon, Zap,
  ChevronRight, Clock, Video, Shield, Send, FlaskConical,
  WifiOff, MapPin, ExternalLink, CreditCard, CheckCircle2,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription,
  CardContent, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent,
  Drawer, Avatar, Skeleton, SkeletonCard, Input, EmptyState, ErrorState,
} from '@/components/ui';
import { useSession } from '@/components/providers/SessionProvider';
import {
  fetchSummary, formatDate, RECORD_STATUS_TONE,
} from '@/app/health-records/_lib/api';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care'}/api`;

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function useAppointments() {
  return useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/appointments`, { headers: authHeaders() });
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
    },
    staleTime: 30_000,
  });
}

function useInvoices() {
  return useQuery({
    queryKey: ['billing-invoices'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/billing/invoices`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    },
    staleTime: 60_000,
  });
}

interface MappedAppt {
  id: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  date: string;
  time: string;
  type: 'Video Call' | 'In-Person';
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  image: string;
}

function formatCurrency(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function mapStatus(raw: string): 'Upcoming' | 'Completed' | 'Cancelled' {
  const s = String(raw).toLowerCase();
  if (['scheduled', 'confirmed', 'upcoming'].includes(s)) return 'Upcoming';
  if (['completed', 'done'].includes(s)) return 'Completed';
  return 'Cancelled';
}

export default function PatientPortal() {
  const router = useRouter();
  const { session } = useSession();
  const patientId = session.userId;
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const tabs = [
    { value: 'Dashboard',     label: 'Dashboard',          icon: Activity },
    { value: 'Appointments',  label: 'Appointments',        icon: Calendar },
    { value: 'Telemedicine',  label: 'Telemedicine',        icon: Video },
    { value: 'Timeline',      label: 'Timeline',            icon: Clock },
    { value: 'Medications',   label: 'Medications',         icon: Pill },
    { value: 'Labs',          label: 'Lab Reports',         icon: FileText },
    { value: 'Billing',       label: 'Insurance & Billing', icon: Shield },
    { value: 'Wellness',      label: 'Wellness',            icon: Zap },
  ];

  const { data: rawAppts = [], isLoading: apptLoading, isError: apptError, refetch: apptRefetch } = useAppointments();
  const { data: result, isLoading: summaryLoading, isError: summaryError, refetch: summaryRefetch } = useQuery({
    queryKey: ['health-summary', patientId],
    queryFn: () => fetchSummary(patientId),
    staleTime: 60_000,
  });
  const { data: invoices = [], isLoading: invoiceLoading, isError: invoiceError, refetch: invoiceRefetch } = useInvoices();

  const appointments = useMemo<MappedAppt[]>(() =>
    rawAppts.map((r: Record<string, unknown>) => ({
      id: (r._id ?? r.id ?? '') as string,
      doctorName: (r.doctorName ?? (r.doctor as Record<string,string>|undefined)?.name ?? 'Doctor') as string,
      specialty: (r.specialty ?? (r.doctor as Record<string,string>|undefined)?.specialty ?? '') as string,
      hospital: (r.hospital ?? (r.doctor as Record<string,string>|undefined)?.hospital ?? 'CareConnect') as string,
      date: r.date ? new Date(r.date as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
      time: (r.timeSlot ?? r.time ?? '') as string,
      type: ((r.visitType === 'Video Call' || r.type === 'Video Call') ? 'Video Call' : 'In-Person') as 'Video Call' | 'In-Person',
      status: mapStatus(String(r.status ?? '')),
      image: ((r.doctor as Record<string,string>|undefined)?.image ?? '') as string,
    })),
  [rawAppts]);

  const upcoming = appointments.filter(a => a.status === 'Upcoming');
  const videoUpcoming = upcoming.filter(a => a.type === 'Video Call');
  const nextAppt = upcoming[0] ?? null;

  const labReports = result?.data?.labReports ?? [];
  const prescriptions = result?.data?.prescriptions ?? [];
  const medications = useMemo(() => {
    const flat: Array<{ id: string; name: string; strength: string; frequency: string; doctor: string; date: string }> = [];
    prescriptions.forEach((rx) => {
      rx.medications.forEach((med, i) => {
        if (!med.name) return;
        flat.push({ id: `${rx._id}-${i}`, name: med.name, strength: med.strength ?? '', frequency: med.frequency ?? '', doctor: rx.doctorName ?? '', date: rx.prescriptionDate ?? '' });
      });
    });
    return flat;
  }, [prescriptions]);

  const timeline = useMemo(() => {
    const events: Array<{ id: string; type: 'lab' | 'rx'; title: string; sub: string; date: string }> = [];
    labReports.forEach(r => events.push({ id: `lab-${r._id}`, type: 'lab', title: r.labName ?? 'Lab Report', sub: `${r.results.length} test${r.results.length !== 1 ? 's' : ''}`, date: r.reportDate ?? '' }));
    prescriptions.forEach(r => events.push({ id: `rx-${r._id}`, type: 'rx', title: `Prescription — ${r.doctorName ?? 'Doctor'}`, sub: r.diagnosis.slice(0, 2).join(', ') || `${r.medications.length} medication(s)`, date: r.prescriptionDate ?? '' }));
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [labReports, prescriptions]);

  const outstanding = invoices.filter((i: { status: string }) => i.status === 'UNPAID' || i.status === 'PARTIALLY_PAID');
  const totalDue = outstanding.reduce((s: number, i: { amountDue: number }) => s + i.amountDue, 0);

  const isOffline = result?.demo === true && !result?.data;

  const firstName = session.name.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Portal"
        description="Your health at a glance — appointments, medications, records, and wellness."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Patient' }]}
        actions={
          <>
            <Button variant="outline" onClick={() => setShowAIAssistant(!showAIAssistant)}>
              <Sparkles className="h-4 w-4" aria-hidden /> Ask AI
            </Button>
            <Button variant="danger" onClick={() => router.push('/support')}>
              <AlertTriangle className="h-4 w-4" aria-hidden /> Emergency
            </Button>
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto no-scrollbar">
          <TabsList>
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                <t.icon className="h-4 w-4" aria-hidden /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ── Dashboard ── */}
        <TabsContent value="Dashboard" className="mt-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
            <Card variant="gradient" className="overflow-hidden rounded-3xl">
              <CardContent className="relative p-6 md:p-8">
                <span className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/3 rounded-full bg-white opacity-5" aria-hidden />
                <div className="relative">
                  <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{greeting}, {firstName}!</h2>
                  <p className="mt-2 max-w-lg text-sm opacity-90 md:text-base">
                    {nextAppt
                      ? `You have an upcoming appointment with ${nextAppt.doctorName} on ${nextAppt.date}${nextAppt.time ? ` at ${nextAppt.time}` : ''}.`
                      : 'No upcoming appointments. Book one to stay on top of your health.'}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button variant="secondary" size="sm" onClick={() => router.push('/telemedicine')}>
                      <Video className="h-4 w-4" aria-hidden /> Join Teleconsultation
                    </Button>
                    <Button variant="glass" size="sm" onClick={() => router.push('/lab-reports')}>
                      View Lab Results
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <StatGrid>
            <StatCard label="Health Score" value="88 /100" sub="Excellent" trend="up" trendPositive icon={Heart} tone="rose" delay={0} />
            <StatCard label="Blood Pressure" value="118/78" sub="Normal · mmHg" trend="neutral" icon={Activity} tone="brand" delay={0.05} />
            <StatCard label="Resting Heart Rate" value="68 bpm" sub="Optimal" trend="neutral" icon={Activity} tone="emerald" delay={0.1} />
            <StatCard label="Sleep Quality" value="7h 12m" sub="Needs improvement" trend="down" trendPositive={false} icon={Moon} tone="violet" delay={0.15} />
          </StatGrid>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Upcoming Appointments</CardTitle>
                    <CardDescription className="mt-1">Your next scheduled visits.</CardDescription>
                  </div>
                  <Button variant="link" size="sm" onClick={() => router.push('/appointments')}>View All</Button>
                </CardHeader>
                <CardContent>
                  {apptLoading ? (
                    <Skeleton className="h-20 rounded-2xl" />
                  ) : nextAppt ? (
                    <div className="group flex flex-col justify-between gap-4 rounded-2xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-4">
                        <Avatar name={nextAppt.doctorName} src={nextAppt.image} size="lg" />
                        <div>
                          <h4 className="font-semibold text-foreground">{nextAppt.doctorName}</h4>
                          <p className="mt-0.5 text-sm text-muted-foreground">{nextAppt.specialty}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-subtle-foreground">
                            {nextAppt.type === 'Video Call' ? <Video className="h-3 w-3" aria-hidden /> : <MapPin className="h-3 w-3" aria-hidden />}
                            {nextAppt.hospital} · {nextAppt.date}{nextAppt.time ? ` · ${nextAppt.time}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.push('/appointments')}>Reschedule</Button>
                        {nextAppt.type === 'Video Call'
                          ? <Button size="sm" onClick={() => router.push('/telemedicine')}><Video className="h-4 w-4" aria-hidden /> Join Video</Button>
                          : <Button size="sm" onClick={() => router.push('/appointments')}>Pre-Check In</Button>}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-8 text-center">
                      <Calendar className="h-8 w-8 text-muted-foreground" aria-hidden />
                      <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
                      <Button size="sm" onClick={() => router.push('/appointments/book')}>Book Appointment</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Medications</CardTitle>
                    <CardDescription className="mt-1">{medications.length} medication{medications.length !== 1 ? 's' : ''} on record.</CardDescription>
                  </div>
                  <Button variant="link" size="sm" onClick={() => router.push('/medications')}>Manage</Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {summaryLoading ? (
                    [1, 2].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)
                  ) : medications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No medications extracted yet. Capture a prescription to get started.</p>
                  ) : (
                    medications.slice(0, 3).map((med) => (
                      <div key={med.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <Pill className="h-4 w-4" aria-hidden />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{med.name} {med.strength && <span className="font-normal text-muted-foreground">{med.strength}</span>}</p>
                          <p className="text-xs text-muted-foreground truncate">{med.frequency || 'Frequency not specified'}</p>
                        </div>
                        <Badge tone="neutral">{med.doctor || 'Prescribed'}</Badge>
                      </div>
                    ))
                  )}
                  {medications.length > 3 && (
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => router.push('/medications')}>
                      View {medications.length - 3} more medications <ChevronRight className="h-4 w-4" aria-hidden />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 xl:col-span-1">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" aria-hidden /> AI Health Insight
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {labReports.length > 0
                      ? `Your most recent lab report from ${formatDate(labReports[0].reportDate)} has ${labReports[0].results.filter((r) => r.flag).length} flagged result${labReports[0].results.filter((r) => r.flag).length !== 1 ? 's' : ''}. Tap below to ask a question about your results.`
                      : 'Upload your lab reports and prescriptions to get AI-powered health insights tailored to your records.'}
                  </p>
                  <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setShowAIAssistant(true)}>
                    Ask Copilot about Labs
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Records</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {summaryLoading ? (
                    [1, 2].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)
                  ) : timeline.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No records yet. Capture a document to get started.</p>
                  ) : (
                    timeline.slice(0, 3).map((ev) => (
                      <button key={ev.id} onClick={() => router.push('/health-records')} className="group flex w-full items-center gap-3 rounded-xl border border-transparent p-2 text-left transition-colors hover:border-border hover:bg-muted/40">
                        <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ev.type === 'lab' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400'}`}>
                          {ev.type === 'lab' ? <FlaskConical className="h-5 w-5" aria-hidden /> : <FileText className="h-5 w-5" aria-hidden />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-foreground">{ev.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{ev.sub}{ev.date ? ` · ${formatDate(ev.date)}` : ''}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 text-subtle-foreground transition-colors group-hover:text-primary" aria-hidden />
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ── Appointments ── */}
        <TabsContent value="Appointments" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Upcoming Appointments</h3>
              <p className="text-sm text-muted-foreground">{upcoming.length} scheduled visit{upcoming.length !== 1 ? 's' : ''}.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/appointments"><Button variant="outline" size="sm"><ExternalLink className="h-4 w-4" aria-hidden /> Full View</Button></Link>
              <Link href="/appointments/book"><Button size="sm">Book New</Button></Link>
            </div>
          </div>
          {apptError ? (
            <ErrorState description="Could not load appointments." onRetry={apptRefetch} />
          ) : apptLoading ? (
            <div className="space-y-4">{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
          ) : upcoming.length === 0 ? (
            <EmptyState icon={Calendar} title="No upcoming appointments" description="You have no scheduled visits." action={{ label: 'Book Appointment', onClick: () => router.push('/appointments/book') }} />
          ) : (
            <div className="space-y-4">
              {upcoming.slice(0, 5).map((apt) => (
                <Card key={apt.id} variant="interactive" className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar name={apt.doctorName} src={apt.image} size="lg" />
                      <div>
                        <h4 className="font-semibold text-foreground">{apt.doctorName}</h4>
                        <p className="text-sm text-muted-foreground">{apt.specialty}</p>
                        <p className="mt-1 flex items-center gap-2 text-xs text-subtle-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" aria-hidden />{apt.date}</span>
                          {apt.time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden />{apt.time}</span>}
                          <span className="flex items-center gap-1">
                            {apt.type === 'Video Call' ? <Video className="h-3 w-3" aria-hidden /> : <MapPin className="h-3 w-3" aria-hidden />}
                            {apt.type}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {apt.type === 'Video Call'
                        ? <Button size="sm" onClick={() => router.push('/telemedicine')}><Video className="h-4 w-4" aria-hidden /> Join Video</Button>
                        : <Button size="sm" variant="secondary" onClick={() => router.push('/appointments')}>View Details</Button>}
                    </div>
                  </div>
                </Card>
              ))}
              {appointments.length > 5 && (
                <Button variant="ghost" className="w-full" onClick={() => router.push('/appointments')}>
                  View all {appointments.length} appointments <ChevronRight className="h-4 w-4" aria-hidden />
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Telemedicine ── */}
        <TabsContent value="Telemedicine" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Video Consultations</h3>
              <p className="text-sm text-muted-foreground">{videoUpcoming.length} upcoming video appointment{videoUpcoming.length !== 1 ? 's' : ''}.</p>
            </div>
            <Link href="/telemedicine"><Button variant="outline" size="sm"><ExternalLink className="h-4 w-4" aria-hidden /> Open Telemedicine</Button></Link>
          </div>
          {apptLoading ? (
            <div className="space-y-4">{[1,2].map(i => <SkeletonCard key={i} />)}</div>
          ) : videoUpcoming.length === 0 ? (
            <EmptyState icon={Video} title="No upcoming video consultations" description="Book a video appointment to see a doctor from home." action={{ label: 'Book Video Appointment', onClick: () => router.push('/appointments/book') }} />
          ) : (
            <div className="space-y-4">
              {videoUpcoming.map((apt) => (
                <Card key={apt.id} variant="interactive" className="p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar name={apt.doctorName} src={apt.image} size="lg" />
                      <div>
                        <h4 className="font-semibold text-foreground">{apt.doctorName}</h4>
                        <p className="text-sm text-muted-foreground">{apt.specialty}</p>
                        <p className="mt-1 flex items-center gap-2 text-xs text-subtle-foreground">
                          <Calendar className="h-3 w-3" aria-hidden />{apt.date}
                          {apt.time && <><Clock className="h-3 w-3" aria-hidden />{apt.time}</>}
                        </p>
                      </div>
                    </div>
                    <Badge tone="info" pulse dot>Upcoming</Badge>
                    <Button size="sm" onClick={() => router.push('/telemedicine')}><Video className="h-4 w-4" aria-hidden /> Join Now</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Timeline ── */}
        <TabsContent value="Timeline" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Health Timeline</h3>
              <p className="text-sm text-muted-foreground">Lab reports and prescriptions, most recent first.</p>
            </div>
            <Link href="/health-records"><Button variant="outline" size="sm"><ExternalLink className="h-4 w-4" aria-hidden /> Health Records</Button></Link>
          </div>
          {summaryError ? (
            <ErrorState description="Could not load health timeline." onRetry={summaryRefetch} />
          ) : summaryLoading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
          ) : isOffline ? (
            <EmptyState icon={WifiOff} title="Backend offline" description="Timeline requires a live backend connection." action={{ label: 'Retry', onClick: () => summaryRefetch() }} />
          ) : timeline.length === 0 ? (
            <EmptyState icon={Clock} title="No health events yet" description="Capture lab reports and prescriptions to build your health timeline." action={{ label: 'Capture Document', onClick: () => router.push('/health-records/capture') }} />
          ) : (
            <div className="relative space-y-0 pl-6">
              <span className="absolute left-[9px] top-0 h-full w-px bg-border" aria-hidden />
              {timeline.map((ev) => (
                <div key={ev.id} className="relative pb-6 last:pb-0">
                  <span className={`absolute -left-[19px] top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-background ${ev.type === 'lab' ? 'bg-rose-500' : 'bg-brand-500'}`} aria-hidden>
                    {ev.type === 'lab' ? <FlaskConical className="h-2.5 w-2.5 text-white" /> : <FileText className="h-2.5 w-2.5 text-white" />}
                  </span>
                  <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{ev.title}</p>
                        <p className="text-xs text-muted-foreground">{ev.sub}</p>
                      </div>
                      {ev.date && <span className="shrink-0 text-xs text-subtle-foreground">{formatDate(ev.date)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Medications ── */}
        <TabsContent value="Medications" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">My Medications</h3>
              <p className="text-sm text-muted-foreground">{medications.length} medication{medications.length !== 1 ? 's' : ''} across {prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''}.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/health-records/capture"><Button variant="outline" size="sm">Add Prescription</Button></Link>
              <Link href="/medications"><Button size="sm"><ExternalLink className="h-4 w-4" aria-hidden /> Full View</Button></Link>
            </div>
          </div>
          {summaryError ? (
            <ErrorState description="Could not load medications." onRetry={summaryRefetch} />
          ) : summaryLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : isOffline ? (
            <EmptyState icon={WifiOff} title="Backend offline" description="Medication data requires a live backend connection." action={{ label: 'Retry', onClick: () => summaryRefetch() }} />
          ) : medications.length === 0 ? (
            <EmptyState icon={Pill} title="No medications on record" description="Capture a prescription to have your medications extracted here." action={{ label: 'Capture Prescription', onClick: () => router.push('/health-records/capture') }} />
          ) : (
            <div className="space-y-3">
              {medications.map((med) => (
                <div key={med.id} className="flex items-center gap-4 rounded-xl border border-border p-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Pill className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{med.name} {med.strength && <span className="font-normal text-sm text-muted-foreground">{med.strength}</span>}</p>
                    <p className="text-xs text-muted-foreground">{med.frequency || '—'}{med.doctor ? ` · ${med.doctor}` : ''}</p>
                  </div>
                  {med.date && <span className="shrink-0 text-xs text-subtle-foreground">{formatDate(med.date)}</span>}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Labs ── */}
        <TabsContent value="Labs" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Laboratory Reports</h3>
              <p className="text-sm text-muted-foreground">{labReports.length} report{labReports.length !== 1 ? 's' : ''} on file.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/health-records/capture?type=LAB_REPORT"><Button variant="outline" size="sm">Add Report</Button></Link>
              <Link href="/lab-reports"><Button size="sm"><ExternalLink className="h-4 w-4" aria-hidden /> Full View</Button></Link>
            </div>
          </div>
          {summaryError ? (
            <ErrorState description="Could not load lab reports." onRetry={summaryRefetch} />
          ) : summaryLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : isOffline ? (
            <EmptyState icon={WifiOff} title="Backend offline" description="Lab report data requires a live backend connection." action={{ label: 'Retry', onClick: () => summaryRefetch() }} />
          ) : labReports.length === 0 ? (
            <EmptyState icon={FlaskConical} title="No lab reports yet" description="Upload a lab report to have it read and indexed here." action={{ label: 'Capture Lab Report', onClick: () => router.push('/health-records/capture?type=LAB_REPORT') }} />
          ) : (
            <div className="space-y-3">
              {labReports.map((r) => {
                const flagCount = r.results.filter((res) => !!res.flag).length;
                return (
                  <div key={r._id} className="flex items-center gap-4 rounded-xl border border-border p-4">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <FlaskConical className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{r.labName ?? 'Lab Report'}</p>
                      <p className="text-xs text-muted-foreground">{r.results.length} test{r.results.length !== 1 ? 's' : ''}{r.reportDate ? ` · ${formatDate(r.reportDate)}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {flagCount > 0 && <Badge tone="danger"><AlertTriangle className="h-3.5 w-3.5" aria-hidden />{flagCount} flagged</Badge>}
                      <Badge tone={RECORD_STATUS_TONE[r.status]}>{r.status === 'VERIFIED' ? 'Verified' : r.status === 'REVIEW_REQUIRED' ? 'Review' : 'Processing'}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Billing ── */}
        <TabsContent value="Billing" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Insurance &amp; Billing</h3>
              <p className="text-sm text-muted-foreground">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} on file.</p>
            </div>
            <Link href="/billing"><Button size="sm"><ExternalLink className="h-4 w-4" aria-hidden /> Full View</Button></Link>
          </div>
          {invoiceError ? (
            <ErrorState description="Could not load billing information." onRetry={invoiceRefetch} />
          ) : invoiceLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : invoices.length === 0 ? (
            <EmptyState icon={Shield} title="No invoices yet" description="Invoices appear here after clinic visits, lab orders, or pharmacy fills." />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-danger">{formatCurrency(totalDue)}</p>
                  <p className="text-xs text-muted-foreground">{outstanding.length} unpaid invoice{outstanding.length !== 1 ? 's' : ''}</p>
                  {totalDue > 0 && <Button size="sm" className="mt-3" onClick={() => router.push('/patient/wallet')}>Pay Now</Button>}
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Settled Invoices</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-success">
                    {invoices.filter((i: { status: string }) => i.status === 'PAID').length} / {invoices.length}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(invoices.filter((i: { status: string }) => i.status === 'PAID').reduce((s: number, i: { amountPaid: number }) => s + i.amountPaid, 0))} paid total
                  </p>
                </Card>
              </div>
              <div className="space-y-3">
                {invoices.slice(0, 5).map((inv: { _id: string; invoiceNumber: string; type: string; totalAmount: number; amountDue: number; status: string; issuedAt: string }) => (
                  <div key={inv._id} className="flex items-center gap-4 rounded-xl border border-border p-4">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <CreditCard className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{inv.type}{inv.issuedAt ? ` · ${formatDate(inv.issuedAt)}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold tabular-nums text-foreground">{formatCurrency(inv.totalAmount)}</span>
                      <Badge tone={inv.status === 'PAID' ? 'success' : inv.status === 'UNPAID' ? 'danger' : inv.status === 'PARTIALLY_PAID' ? 'warning' : 'neutral'}>
                        {inv.status === 'PAID' ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : inv.status === 'UNPAID' ? <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> : <Clock className="h-3.5 w-3.5" aria-hidden />}
                        {inv.status === 'PAID' ? 'Paid' : inv.status === 'UNPAID' ? 'Unpaid' : inv.status === 'PARTIALLY_PAID' ? 'Partial' : inv.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* ── Wellness ── */}
        <TabsContent value="Wellness" className="mt-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { icon: Activity, title: 'Activity Tracker', desc: 'Daily steps, calories burned, and workout logs will sync here from your wearable or health app.', tone: 'emerald' },
              { icon: Moon, title: 'Sleep Analysis', desc: 'Sleep duration, quality scores, and REM cycle trends tracked over time.', tone: 'violet' },
              { icon: Heart, title: 'Vitals Monitoring', desc: 'Blood pressure, heart rate, SpO₂, and glucose readings from connected devices.', tone: 'rose' },
              { icon: Zap, title: 'Nutrition Log', desc: 'Macro and micro nutrient tracking, meal history, and dietary recommendations from your care team.', tone: 'amber' },
              { icon: CheckCircle, title: 'Wellness Goals', desc: 'Set and track personal health goals with your provider — weight, exercise, diet, and stress.', tone: 'brand' },
              { icon: Sparkles, title: 'AI Wellness Coach', desc: 'Personalized daily health tips and nudges powered by your actual health data and care plan.', tone: 'violet' },
            ].map((item) => (
              <Card key={item.title} className="p-5">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-${item.tone}-50 text-${item.tone}-600 dark:bg-${item.tone}-500/15 dark:text-${item.tone}-400 mb-4`}>
                  <item.icon className="h-6 w-6" aria-hidden />
                </div>
                <h4 className="font-semibold text-foreground">{item.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                <p className="mt-3 text-xs font-medium text-primary">Coming soon</p>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* AI Health Assistant */}
      <Drawer
        open={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        title={<span className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" aria-hidden /> AI Health Assistant</span>}
        description="Understand your labs, medications, and health questions."
        footer={
          <div className="relative w-full">
            <Input placeholder="Type a question…" aria-label="Ask the AI assistant" className="pr-11" />
            <Button size="icon-sm" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full" aria-label="Send question" onClick={() => router.push('/ai-assistant')}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        }
      >
        <div className="mb-4 flex gap-2 rounded-xl border border-warning/30 bg-warning-soft p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
          <p className="text-[11px] font-medium leading-tight text-warning">
            AI guidance is for informational purposes only and does not replace professional medical advice. In an emergency, call your local emergency services.
          </p>
        </div>
        <div className="space-y-4">
          <ChatBubble from="ai">
            Hello {firstName}! I&apos;m your CareConnect Health Assistant. I can help you understand your lab reports, medication schedules, or answer general health questions. What can I help you with today?
          </ChatBubble>
        </div>
      </Drawer>
    </div>
  );
}

function ChatBubble({ from, children }: { from: 'ai' | 'user'; children: React.ReactNode }) {
  const isUser = from === 'user';
  return (
    <div className={`flex max-w-[90%] gap-3 ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
      {isUser ? (
        <Avatar name="You" size="sm" />
      ) : (
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
      )}
      <div className={`rounded-2xl p-3 text-sm shadow-soft ${isUser ? 'rounded-tr-none bg-primary text-primary-foreground' : 'rounded-tl-none border border-border bg-card text-muted-foreground'}`}>
        {children}
      </div>
    </div>
  );
}
