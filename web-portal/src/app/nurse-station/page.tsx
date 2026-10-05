'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Clock, AlertTriangle, Activity, Pill,
  Droplet, ClipboardList, ScanBarcode, HeartPulse,
  Sparkles, ArrowUpRight, Thermometer, Wind, Brain,
  CheckCircle2, Circle, ChevronRight, Stethoscope, FileText,
  Beaker, BedDouble, ArrowLeftRight, Pencil, Loader2,
} from 'lucide-react';
import {
  PageHeader, Button, Badge, StatCard, StatGrid,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Tabs, TabsList, TabsTrigger, TabsContent,
  DataTable, type Column, EmptyState, ProgressRing, SkeletonCard, Skeleton,
} from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: 'Bearer ' + token } : {};
}

type Patient = {
  bed: string; name: string; age: number; gender: string; diagnosis: string;
  status: string; risk: string; ews: number; nextMed: string; nextVital: string; ivRunning: boolean;
};

type EmarTask = {
  patient: string; bed: string; drug: string; dose: string; route: string; time: string; status: string;
};

type NursingStats = {
  assignedPatients: number; criticalHighRisk: number; medsDue: number; vitalsDue: number;
};

type NursingResponse = {
  stats: NursingStats;
  patients: Patient[];
  tasks: EmarTask[];
};

type VitalRecord = {
  id: string; bed: string; patient: string; recordedAt: string;
  hr: number; systolic: number; diastolic: number; spo2: number;
  temp: number; rr: number; gcs: number; pain: number;
  status: 'OK' | 'DUE' | 'OVERDUE';
  intakeml: number; outputml: number;
};

type NursingTask = {
  id: string; bed: string; patient: string;
  type: 'ASSESSMENT' | 'WOUND' | 'MEDICATION' | 'PROCEDURE' | 'MONITORING' | 'POSITIONING';
  title: string; priority: 'URGENT' | 'ROUTINE';
  dueAt: string; status: 'PENDING' | 'OVERDUE' | 'DONE';
  assignedTo: string; notes: string;
};

const TAB_LABELS: Record<string, string> = {
  'dashboard': 'Dashboard',
  'patient list': 'Patient List',
  'eMAR': 'eMAR (Meds)',
  'vitals & IO': 'Vitals & IO',
  'tasks': 'Tasks',
  'handover': 'Handover',
};

export default function NurseStation() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

  const nursingQuery = useQuery<{ success: boolean; data: NursingResponse }>({
    queryKey: ['ward-nursing'],
    queryFn: () =>
      fetch(`${API_BASE}/api/ward/nursing`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 30_000,
  });

  const apiData = nursingQuery.data?.data;
  const apiStats = apiData?.stats;
  const patients: Patient[] = apiData?.patients ?? [];
  const emarTasks: EmarTask[] = apiData?.tasks ?? [];

  const { data: vitalsRes, isLoading: vitalsLoading } = useQuery({
    queryKey: ['ops', 'ward_vital'],
    queryFn: () => fetch(`${API_BASE}/api/admin/ops/ward_vital`, { headers: authHeaders() }).then(r => r.json()),
    enabled: activeTab === 'vitals & IO',
    staleTime: 60_000,
  });
  const vitals: VitalRecord[] = vitalsRes?.data ?? [];

  const { data: tasksRes, isLoading: tasksLoading } = useQuery({
    queryKey: ['ops', 'ward_task'],
    queryFn: () => fetch(`${API_BASE}/api/admin/ops/ward_task`, { headers: authHeaders() }).then(r => r.json()),
    enabled: activeTab === 'tasks' || activeTab === 'handover',
    staleTime: 60_000,
  });
  const wardTasks: NursingTask[] = tasksRes?.data ?? [];

  const [emarFilter, setEmarFilter] = useState<'ALL' | 'OVERDUE' | 'PENDING' | 'ADMINISTERED'>('ALL');
  const [tasksDone, setTasksDone] = useState<Set<string>>(new Set());
  const toggleTask = (id: string) => setTasksDone(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const [adminConfirm, setAdminConfirm] = useState<EmarTask | null>(null);
  const [adminDone, setAdminDone] = useState<Set<string>>(new Set());
  const eMarKey = (t: EmarTask) => `${t.bed}-${t.drug}-${t.time}`;

  const [vitalForm, setVitalForm] = useState<VitalRecord | null>(null);
  const [vitalDraft, setVitalDraft] = useState({ hr: '', sbp: '', dbp: '', spo2: '', rr: '', temp: '', gcs: '', pain: '' });
  const [vitalSaved, setVitalSaved] = useState<Set<string>>(new Set());

  function timeAgo(iso: string) {
    const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }
  function timeUntil(iso: string) {
    const diff = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
    if (diff < 0) return `${Math.abs(Math.floor(diff / 60))}m overdue`;
    if (diff < 60) return `in ${diff}s`;
    if (diff < 3600) return `in ${Math.floor(diff / 60)}m`;
    return `in ${Math.floor(diff / 3600)}h`;
  }

  const stats = [
    { label: 'Assigned Patients',  value: apiStats ? String(apiStats.assignedPatients)  : '—', icon: Users,         tone: 'brand'  as const },
    { label: 'Critical / High Risk', value: apiStats ? String(apiStats.criticalHighRisk) : '—', icon: AlertTriangle, tone: 'rose'   as const },
    { label: 'Meds Due (Next 2h)', value: apiStats ? String(apiStats.medsDue)           : '—', icon: Pill,          tone: 'violet' as const },
    { label: 'Vitals Due',         value: apiStats ? String(apiStats.vitalsDue)         : '—', icon: Activity,      tone: 'amber'  as const },
  ];

  // Find the highest-EWS patient for alert display
  const criticalPatient = patients.find(p => p.ews >= 5);
  const warningPatient  = patients.find(p => p.ews >= 3 && p.ews < 5);

  const patientColumns: Column<Patient>[] = [
    {
      key: 'bed', header: 'Bed', sortable: true,
      cell: (p) => <span className="font-bold text-foreground">{p.bed}</span>,
    },
    {
      key: 'name', header: 'Patient', sortable: true,
      cell: (p) => (
        <div>
          <p className="font-semibold text-foreground">{p.name}</p>
          <p className="text-xs text-muted-foreground">{p.age}y • {p.gender}</p>
        </div>
      ),
    },
    {
      key: 'diagnosis', header: 'Diagnosis & Status',
      cell: (p) => (
        <div>
          <p className="font-medium text-foreground">{p.diagnosis}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{p.status}</p>
        </div>
      ),
    },
    {
      key: 'ews', header: 'NEWS2', sortable: true, accessor: (p) => p.ews, align: 'center',
      cell: (p) => (
        <Badge tone={p.ews >= 5 ? 'danger' : p.ews >= 3 ? 'warning' : 'success'} dot pulse={p.ews >= 5}>
          {p.ews}
        </Badge>
      ),
    },
    {
      key: 'ivRunning', header: 'Infusions', accessor: (p) => (p.ivRunning ? 'Running' : '-'),
      cell: (p) => p.ivRunning ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-info">
          <Droplet className="h-4 w-4" aria-hidden /> Running
        </span>
      ) : (
        <span className="text-xs text-subtle-foreground">—</span>
      ),
    },
    {
      key: 'nextMed', header: 'Next Task',
      cell: (p) => (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Pill className="h-3 w-3" aria-hidden /> {p.nextMed}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Activity className="h-3 w-3" aria-hidden /> {p.nextVital}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nurse Station"
        description="Your patient ward assignments and active care queue."
        crumbs={[{ label: 'Clinical' }, { label: 'Nurse Station' }]}
        actions={
          <Button onClick={() => setActiveTab('eMAR')}>
            <ScanBarcode className="h-4 w-4" aria-hidden /> eMAR / Administer
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto max-w-full flex-wrap justify-start overflow-x-auto no-scrollbar">
          {Object.keys(TAB_LABELS).map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {TAB_LABELS[tab]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard" className="mt-6 space-y-6">
          {nursingQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : nursingQuery.isError ? (
            <p className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">Failed to load nursing data. Please refresh.</p>
          ) : (
            <StatGrid>
              {stats.map((stat, idx) => (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  icon={stat.icon}
                  tone={stat.tone}
                  delay={idx * 0.05}
                />
              ))}
            </StatGrid>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Early Warning Scores (EWS) Alerts */}
            <div className="space-y-6 xl:col-span-1">
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-danger" aria-hidden /> NEWS2 Alerts
                  </CardTitle>
                  <Badge tone="danger" dot pulse>{patients.filter(p => p.ews >= 5).length} Critical</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {criticalPatient && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className="rounded-2xl border border-danger/30 bg-danger-soft p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <ProgressRing value={Math.round(criticalPatient.ews / 20 * 100)} size={56} strokeWidth={5} tone="danger">
                            <span className="text-xs font-bold">{criticalPatient.ews}</span>
                          </ProgressRing>
                          <div>
                            <p className="text-sm font-bold text-foreground">{criticalPatient.bed} • {criticalPatient.name}</p>
                            <p className="text-xs font-semibold text-danger">NEWS2 Score: {criticalPatient.ews}</p>
                            <p className="mt-1 text-xs text-muted-foreground">High NEWS2 — immediate clinical assessment required.</p>
                          </div>
                        </div>
                        <Button variant="danger" size="sm" onClick={() => router.push('/messages')}>Escalate</Button>
                      </div>
                    </motion.div>
                  )}

                  {warningPatient && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: 0.05 }}
                      className="rounded-2xl border border-warning/30 bg-warning-soft p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-foreground">{warningPatient.bed} • {warningPatient.name}</p>
                          <p className="text-xs font-semibold text-warning">NEWS2 Score: {warningPatient.ews}</p>
                          <p className="mt-1 text-xs text-muted-foreground">NEWS2 score {warningPatient.ews} — monitor closely.</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => router.push('/emr')}>Review</Button>
                      </div>
                    </motion.div>
                  )}

                  {!nursingQuery.isLoading && !criticalPatient && !warningPatient && (
                    <p className="text-sm text-muted-foreground text-center py-4">No current EWS alerts.</p>
                  )}
                </CardContent>
              </Card>

              {/* AI Assistant */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="gradient-brand relative overflow-hidden rounded-3xl p-6 text-primary-foreground shadow-float"
              >
                <div className="absolute right-0 top-0 h-40 w-40 -translate-y-10 translate-x-10 rounded-full bg-white/10 blur-3xl" aria-hidden />
                <div className="relative z-10">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="rounded-lg bg-white/20 p-1.5 backdrop-blur-sm">
                      <Sparkles className="h-4 w-4" aria-hidden />
                    </span>
                    <h3 className="text-sm font-bold tracking-wide">AI Nursing Copilot</h3>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed opacity-90">
                    No active AI reminders for this shift. Reminders will appear here when the AI detects care-gap risks from your patient list and eMAR.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Pending Meds (eMAR Preview) */}
            <Card className="xl:col-span-2 self-start">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-muted-foreground" aria-hidden /> Pending eMAR (Next 2 Hours)
                </CardTitle>
                <Button variant="link" size="sm" onClick={() => setActiveTab('eMAR')}>
                  View Full eMAR <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {nursingQuery.isLoading ? (
                  <div className="space-y-2 p-4">
                    {[0, 1, 2].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {emarTasks.map((task, i) => (
                      <motion.li
                        key={`${task.bed}-${task.drug}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
                      >
                        <div className="w-32 min-w-0">
                          <p className="text-sm font-bold text-foreground">{task.bed}</p>
                          <p className="text-xs text-muted-foreground">{task.patient}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">{task.drug}</p>
                          <p className="text-xs text-muted-foreground">{task.dose} • {task.route}</p>
                        </div>
                        <Badge tone={task.status === 'Overdue' ? 'danger' : 'warning'}>
                          <Clock className="h-3 w-3" aria-hidden /> {task.time} ({task.status})
                        </Badge>
                        <Button size="sm" variant="secondary" disabled title="Coming soon">
                          <ScanBarcode className="h-3.5 w-3.5" aria-hidden /> Scan
                        </Button>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patient list" className="mt-6">
          <DataTable<Patient>
            columns={patientColumns}
            data={patients}
            rowKey={(p) => p.bed}
            searchPlaceholder="Search by name or bed..."
            exportName="ward4-patients"
            emptyTitle="No patients assigned"
            emptyDescription="Patients assigned to this ward will appear here."
            toolbar={
              <div className="flex items-center gap-2">
                <Badge tone="brand">My Patients ({patients.length})</Badge>
                <Badge tone="outline">Critical ({patients.filter(p => p.ews >= 5).length})</Badge>
                <Badge tone="outline">All Ward 4</Badge>
              </div>
            }
            rowActions={() => (
              <Button size="sm" variant="secondary" onClick={() => router.push('/emr')}>Open Chart</Button>
            )}
          />
        </TabsContent>

        {/* ── eMAR ── */}
        <TabsContent value="eMAR" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Electronic Medication Administration Record</h2>
              <p className="text-sm text-muted-foreground">All scheduled medications for your assigned patients this shift.</p>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {(['ALL','OVERDUE','PENDING','ADMINISTERED'] as const).map(f => (
                <button key={f} onClick={() => setEmarFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${emarFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                  {f === 'ALL' ? `All (${emarTasks.length})` : f === 'OVERDUE' ? `Overdue (${emarTasks.filter(t=>t.status==='Overdue').length})` : f === 'PENDING' ? `Pending (${emarTasks.filter(t=>t.status==='Due').length})` : `Administered (0)`}
                </button>
              ))}
            </div>
          </div>
          {nursingQuery.isLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_,i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : emarTasks.length === 0 ? (
            <EmptyState icon={Pill} title="No medications due" description="All scheduled medications for this shift have been administered." />
          ) : (
            <div className="space-y-2">
              {emarTasks
                .filter(t => emarFilter === 'ALL' || (emarFilter === 'OVERDUE' && t.status === 'Overdue') || (emarFilter === 'PENDING' && t.status === 'Due') || emarFilter === 'ADMINISTERED')
                .map((task, i) => (
                <motion.div key={`${task.bed}-${task.drug}-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card className={task.status === 'Overdue' ? 'border-danger/40 bg-danger/5' : ''}>
                    <CardContent className="flex flex-wrap items-center gap-4 py-3">
                      <div className="w-28 shrink-0">
                        <p className="font-bold text-foreground">{task.bed}</p>
                        <p className="text-xs text-muted-foreground truncate">{task.patient}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">{task.drug}</p>
                        <p className="text-xs text-muted-foreground">{task.dose} · {task.route}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge tone={task.status === 'Overdue' ? 'danger' : 'warning'}>
                          <Clock className="h-3 w-3 mr-1" aria-hidden />{task.time} · {task.status}
                        </Badge>
                        {adminDone.has(eMarKey(task)) ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Administered
                          </span>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => setAdminConfirm(task)}>
                            <ScanBarcode className="h-3.5 w-3.5" aria-hidden /> Administer
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ScanBarcode className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Barcode scanning required to administer — scan the patient wristband and medication label to confirm administration.
          </p>
        </TabsContent>

        {/* ── VITALS & IO ── */}
        <TabsContent value="vitals & IO" className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Vitals & Fluid Balance</h2>
              <p className="text-sm text-muted-foreground">Last recorded observations and cumulative intake/output per patient.</p>
            </div>
            <div className="flex gap-2">
              <Badge tone="danger" dot>{vitals.filter(v => v.status === 'OVERDUE').length} Overdue</Badge>
              <Badge tone="warning" dot>{vitals.filter(v => v.status === 'DUE').length} Due</Badge>
            </div>
          </div>
          {vitalsLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{[...Array(6)].map((_,i) => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}</div>
          ) : vitals.length === 0 ? (
            <EmptyState icon={Activity} title="No vitals recorded" description="Bedside vital signs will appear here once recorded." />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {vitals.map((v, i) => (
                  <motion.div key={v.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className={v.status === 'OVERDUE' ? 'border-danger/40' : v.status === 'DUE' ? 'border-warning/40' : ''}>
                      <CardContent className="pt-4 pb-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-foreground">{v.bed} · {v.patient}</p>
                            <p className="text-xs text-muted-foreground">Last recorded {timeAgo(v.recordedAt)}</p>
                          </div>
                          <Badge tone={v.status === 'OVERDUE' ? 'danger' : v.status === 'DUE' ? 'warning' : 'success'} dot>
                            {v.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          {[
                            { icon: HeartPulse, label: 'HR', value: `${v.hr}`, unit: 'bpm', alert: v.hr > 100 || v.hr < 50 },
                            { icon: Activity,   label: 'BP', value: `${v.systolic}/${v.diastolic}`, unit: 'mmHg', alert: v.systolic > 140 || v.systolic < 90 },
                            { icon: Wind,       label: 'SpO₂', value: `${v.spo2}`, unit: '%', alert: v.spo2 < 95 },
                            { icon: Thermometer,label: 'Temp', value: `${v.temp}`, unit: '°C', alert: v.temp > 38 },
                            { icon: Stethoscope,label: 'RR', value: `${v.rr}`, unit: '/min', alert: v.rr > 20 || v.rr < 10 },
                            { icon: Brain,      label: 'GCS', value: `${v.gcs}`, unit: '/15', alert: v.gcs < 14 },
                          ].map(({ icon: Icon, label, value, unit, alert }) => (
                            <div key={label} className={`rounded-lg p-2 ${alert ? 'bg-danger/10 text-danger' : 'bg-muted/50 text-foreground'}`}>
                              <Icon className="h-3 w-3 mx-auto mb-0.5 opacity-70" aria-hidden />
                              <p className="font-bold text-sm tabular-nums">{value}</p>
                              <p className="text-[10px] opacity-60">{label} {unit}</p>
                            </div>
                          ))}
                        </div>
                        {vitalSaved.has(v.id) ? (
                          <span className="flex w-full items-center justify-center gap-1 rounded-lg bg-success-soft py-1 text-xs font-semibold text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Vitals Recorded
                          </span>
                        ) : (
                          <Button size="sm" variant="outline" className="w-full" onClick={() => {
                            setVitalForm(v);
                            setVitalDraft({ hr: String(v.hr), sbp: String(v.systolic), dbp: String(v.diastolic), spo2: String(v.spo2), rr: String(v.rr), temp: String(v.temp), gcs: String(v.gcs), pain: String(v.pain) });
                          }}>
                            <Pencil className="h-3.5 w-3.5" aria-hidden /> Record New Vitals
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Beaker className="h-4 w-4 text-info" aria-hidden /> Fluid Balance — Shift Total</CardTitle>
                  <CardDescription>Cumulative intake vs. output per patient. Balance = In − Out.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {vitals.map(v => {
                      const balance = v.intakeml - v.outputml;
                      const pct = Math.min(100, Math.round(v.intakeml / Math.max(v.intakeml + v.outputml, 1) * 100));
                      return (
                        <div key={v.id} className="flex flex-wrap items-center gap-3">
                          <div className="w-32 shrink-0">
                            <p className="text-sm font-semibold text-foreground">{v.bed}</p>
                            <p className="text-xs text-muted-foreground truncate">{v.patient}</p>
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                              <div className="bg-info transition-all" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <div className="flex gap-3 text-xs tabular-nums shrink-0">
                            <span className="text-info font-medium">↑ {v.intakeml} mL</span>
                            <span className="text-muted-foreground">↓ {v.outputml} mL</span>
                            <span className={`font-bold ${balance > 500 ? 'text-warning' : balance < -200 ? 'text-danger' : 'text-success'}`}>
                              {balance >= 0 ? '+' : ''}{balance} mL
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── TASKS ── */}
        <TabsContent value="tasks" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Shift Task List</h2>
              <p className="text-sm text-muted-foreground">Nursing tasks for your assigned patients — tap to mark complete.</p>
            </div>
            <div className="flex gap-2">
              <Badge tone="danger">{wardTasks.filter(t => t.status === 'OVERDUE' && !tasksDone.has(t.id)).length} Overdue</Badge>
              <Badge tone="neutral">{tasksDone.size} Done</Badge>
            </div>
          </div>
          {tasksLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_,i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : wardTasks.length === 0 ? (
            <EmptyState icon={ClipboardList} title="No tasks assigned" description="Nursing tasks for this shift will appear here." />
          ) : (
            <div className="space-y-2">
              {[...wardTasks].sort((a,b) => {
                if (tasksDone.has(a.id) !== tasksDone.has(b.id)) return tasksDone.has(a.id) ? 1 : -1;
                if (a.priority !== b.priority) return a.priority === 'URGENT' ? -1 : 1;
                return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
              }).map((task, i) => {
                const done = tasksDone.has(task.id);
                const overdue = task.status === 'OVERDUE' && !done;
                const typeIcon: Record<NursingTask['type'], React.ElementType> = {
                  ASSESSMENT: Stethoscope, WOUND: Activity, MEDICATION: Pill,
                  PROCEDURE: Beaker, MONITORING: HeartPulse, POSITIONING: BedDouble,
                };
                const Icon = typeIcon[task.type] ?? ClipboardList;
                return (
                  <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card className={`transition-opacity ${done ? 'opacity-50' : ''} ${overdue ? 'border-danger/40' : ''}`}>
                      <CardContent className="flex items-start gap-3 py-3">
                        <button onClick={() => toggleTask(task.id)} className="mt-0.5 shrink-0 text-primary hover:scale-110 transition-transform" aria-label={done ? 'Mark incomplete' : 'Mark complete'}>
                          {done
                            ? <CheckCircle2 className="h-5 w-5 text-success" aria-hidden />
                            : <Circle className="h-5 w-5 text-muted-foreground" aria-hidden />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Icon className="h-3 w-3" aria-hidden />{task.type}
                            </span>
                            <Badge tone={overdue ? 'danger' : task.priority === 'URGENT' ? 'warning' : 'neutral'}>
                              {overdue ? 'OVERDUE' : task.priority}
                            </Badge>
                          </div>
                          <p className={`font-semibold text-sm ${done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{task.bed} · {task.patient} · {task.assignedTo}</p>
                          {task.notes && <p className="text-xs text-muted-foreground mt-1 italic">{task.notes}</p>}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`text-xs font-semibold tabular-nums ${overdue ? 'text-danger' : 'text-muted-foreground'}`}>{timeUntil(task.dueAt)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── HANDOVER ── */}
        <TabsContent value="handover" className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Shift Handover — SBAR</h2>
              <p className="text-sm text-muted-foreground">Situation · Background · Assessment · Recommendation summary for the incoming shift.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled title="AI summary requires nursing AI module">
                <Sparkles className="h-4 w-4" aria-hidden /> AI Summary
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                const win = window.open('', '_blank', 'width=800,height=900');
                if (!win) return;
                const rows = patients.map(p => {
                  const pv = vitals.find(v => v.bed === p.bed);
                  const pt = wardTasks.filter(t => t.bed === p.bed && !tasksDone.has(t.id));
                  const pm = emarTasks.filter(t => t.bed === p.bed);
                  return `<tr><td>${p.bed}</td><td>${p.name} (${p.age}y ${p.gender})</td><td>${p.diagnosis}</td><td>NEWS2 ${p.ews}</td><td>${pv ? `HR ${pv.hr}, BP ${pv.systolic}/${pv.diastolic}, SpO₂ ${pv.spo2}%` : 'Pending'}</td><td>${pt[0]?.title ?? pm[0] ? `Next med: ${pm[0].drug} ${pm[0].time}` : 'No pending actions'}</td></tr>`;
                }).join('');
                win.document.write(`<!doctype html><html><head><title>Shift Handover — ${new Date().toLocaleDateString('en-IN')}</title><style>body{font-family:system-ui,sans-serif;margin:40px;color:#111}h1{font-size:1.2rem;margin-bottom:4px}p.sub{color:#666;font-size:.85rem;margin-bottom:24px}table{border-collapse:collapse;width:100%}th,td{padding:8px 10px;border:1px solid #e5e7eb;font-size:.85rem;text-align:left}th{background:#f9fafb;font-weight:600}@media print{body{margin:20px}}</style></head><body><h1>Shift Handover — SBAR</h1><p class="sub">Generated ${new Date().toLocaleString('en-IN')} · CareConnect Nurse Station</p><table><thead><tr><th>Bed</th><th>Patient</th><th>Diagnosis</th><th>NEWS2</th><th>Vitals</th><th>Recommendation</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=()=>{window.print();window.close();}<\/script></body></html>`);
                win.document.close();
              }}>
                <FileText className="h-4 w-4" aria-hidden /> Export PDF
              </Button>
            </div>
          </div>

          {/* Handover stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total Patients', value: patients.length, tone: 'brand' as const },
              { label: 'Urgent Tasks', value: wardTasks.filter(t => t.priority === 'URGENT' && !tasksDone.has(t.id)).length, tone: 'warning' as const },
              { label: 'Meds Pending', value: emarTasks.filter(t => t.status !== 'Administered').length, tone: 'violet' as const },
              { label: 'Vitals Overdue', value: vitals.filter(v => v.status === 'OVERDUE').length, tone: 'danger' as const },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="rounded-2xl border border-border bg-card p-4 text-center">
                  <p className="text-2xl font-bold text-foreground tabular-nums">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Per-patient SBAR cards */}
          <div className="space-y-3">
            {patients.map((p, i) => {
              const pVitals = vitals.find(v => v.bed === p.bed);
              const pTasks = wardTasks.filter(t => t.bed === p.bed && !tasksDone.has(t.id));
              const pMeds = emarTasks.filter(t => t.bed === p.bed);
              return (
                <motion.div key={p.bed} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className={p.ews >= 5 ? 'border-danger/40' : p.ews >= 3 ? 'border-warning/40' : ''}>
                    <CardContent className="pt-4 pb-4 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-foreground">{p.bed} · {p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.age}y · {p.gender} · {p.diagnosis}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge tone={p.ews >= 5 ? 'danger' : p.ews >= 3 ? 'warning' : 'neutral'} dot={p.ews >= 3}>NEWS2 {p.ews}</Badge>
                          {p.ivRunning && <Badge tone="info" dot>IV Running</Badge>}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 text-sm">
                        <div className="rounded-lg bg-muted/40 p-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Situation</p>
                          <p className="text-foreground">{p.status}</p>
                        </div>
                        <div className="rounded-lg bg-muted/40 p-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Assessment</p>
                          <p className="text-foreground">
                            {pVitals ? `HR ${pVitals.hr}, BP ${pVitals.systolic}/${pVitals.diastolic}, SpO₂ ${pVitals.spo2}%` : 'Vitals pending'}
                          </p>
                        </div>
                        <div className="rounded-lg bg-muted/40 p-3">
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Recommendation</p>
                          <p className="text-foreground">
                            {pTasks.length > 0 ? pTasks[0].title : pMeds.length > 0 ? `Next med: ${pMeds[0].drug} ${pMeds[0].time}` : 'No pending actions'}
                          </p>
                        </div>
                      </div>
                      {pTasks.length > 1 && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <ChevronRight className="h-3 w-3" aria-hidden />
                          {pTasks.length - 1} more open task{pTasks.length > 2 ? 's' : ''} — review task list before handover
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            {patients.length === 0 && (
              <EmptyState icon={Users} title="No patients to hand over" description="Patient assignments will appear here once loaded." />
            )}
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
            AI-generated SBAR summaries are available once the nursing AI module is connected. Summaries will include auto-populated Situation, Background, Assessment and Recommendation fields from the patient&apos;s live chart.
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Administer Confirmation Modal ── */}
      {adminConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setAdminConfirm(null)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="mb-1 text-lg font-bold text-foreground">Confirm Administration</h2>
            <p className="mb-4 text-sm text-muted-foreground">Please confirm the following medication administration.</p>
            <div className="mb-6 space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span className="font-semibold text-foreground">{adminConfirm.patient} · {adminConfirm.bed}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Medication</span><span className="font-semibold text-foreground">{adminConfirm.drug}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Dose / Route</span><span className="font-semibold text-foreground">{adminConfirm.dose} · {adminConfirm.route}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Scheduled</span><span className="font-semibold text-foreground">{adminConfirm.time}</span></div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setAdminConfirm(null)}>Cancel</Button>
              <Button className="flex-1" onClick={() => {
                setAdminDone(prev => new Set([...prev, eMarKey(adminConfirm)]));
                setAdminConfirm(null);
              }}>
                <CheckCircle2 className="h-4 w-4" /> Confirm & Administer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Record Vitals Modal ── */}
      {vitalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setVitalForm(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="mb-1 text-lg font-bold text-foreground">Record Vitals</h2>
            <p className="mb-4 text-sm text-muted-foreground">{vitalForm.bed} · {vitalForm.patient}</p>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {([
                { key: 'hr', label: 'HR', unit: 'bpm' },
                { key: 'sbp', label: 'SBP', unit: 'mmHg' },
                { key: 'dbp', label: 'DBP', unit: 'mmHg' },
                { key: 'spo2', label: 'SpO₂', unit: '%' },
                { key: 'rr', label: 'RR', unit: '/min' },
                { key: 'temp', label: 'Temp', unit: '°C' },
                { key: 'gcs', label: 'GCS', unit: '/15' },
                { key: 'pain', label: 'Pain', unit: '/10' },
              ] as const).map(({ key, label, unit }) => (
                <div key={key} className="rounded-xl border border-border bg-muted/20 p-2">
                  <p className="mb-1 text-xs text-muted-foreground">{label}</p>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      value={vitalDraft[key]}
                      onChange={e => setVitalDraft(d => ({ ...d, [key]: e.target.value }))}
                      className="w-full bg-transparent text-sm font-bold text-foreground focus:outline-none"
                    />
                    <span className="text-[10px] text-muted-foreground">{unit}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setVitalForm(null)}>Cancel</Button>
              <Button className="flex-1" onClick={() => {
                setVitalSaved(prev => new Set([...prev, vitalForm.id]));
                setVitalForm(null);
              }}>
                <CheckCircle2 className="h-4 w-4" /> Save Vitals
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
