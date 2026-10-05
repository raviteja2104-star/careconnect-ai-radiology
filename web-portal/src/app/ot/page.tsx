'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  otApi,
  type OTScheduleCase,
  type AnesthesiaRecordData,
  type IntraopEventRecord,
  type InstrumentCountRecord,
  type InstrumentRow,
} from '../emr/_lib/api';
import {
  Scissors, Calendar, Clock, Activity, CheckCircle,
  AlertTriangle, ShieldCheck, HeartPulse, UserPlus,
  FlaskConical, Syringe, Layers, ClipboardList, Plus,
  Timer, User, Check, X,
} from 'lucide-react';
import {
  PageHeader, Button, Badge, StatCard, StatGrid, EmptyState,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Tabs, TabsList, TabsTrigger, TabsContent,
  DataTable, type Column, ProgressRing, SkeletonCard,
} from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: 'Bearer ' + token } : {};
}

type Procedure = {
  _id?: string;
  room: string; patient: string; procedure: string; surgeon: string;
  anesthesiologist: string; time: string; status: string; end: string;
};

type OTStats = {
  todaySurgeries: number; runningNow: number; delayed: number; availableORs: number;
};

type OTResponse = {
  stats: OTStats;
  procedures: Procedure[];
  schedule: OTScheduleCase[];
};

const TABS = ['dashboard', 'calendar', 'who safety checklist', 'anesthesia', 'intraoperative', 'pacu (recovery)', 'instruments'];

const DEMO_SCHEDULE = [
  { time: '07:30', end: '09:30', room: 'OR-1', patient: 'Ramesh K. (M/58)', procedure: 'CABG (Off-Pump)', surgeon: 'Dr. A. Mehta', anesthesiologist: 'Dr. S. Kapoor', status: 'Completed' },
  { time: '08:00', end: '10:30', room: 'OR-2', patient: 'Smita J. (F/45)', procedure: 'Total Knee Replacement (R)', surgeon: 'Dr. P. Nair', anesthesiologist: 'Dr. R. Joshi', status: 'In Progress' },
  { time: '10:00', end: '12:00', room: 'OR-1', patient: 'Arjun S. (M/34)', procedure: 'Laparoscopic Cholecystectomy', surgeon: 'Dr. M. Sharma', anesthesiologist: 'Dr. S. Kapoor', status: 'Scheduled' },
  { time: '11:00', end: '13:00', room: 'OR-3', patient: 'Kavitha R. (F/52)', procedure: 'Mastectomy (Right)', surgeon: 'Dr. L. Deshpande', anesthesiologist: 'Dr. V. Rao', status: 'Scheduled' },
  { time: '13:00', end: '15:00', room: 'OR-2', patient: 'Mohammed A. (M/67)', procedure: 'TURP', surgeon: 'Dr. P. Nair', anesthesiologist: 'Dr. R. Joshi', status: 'Scheduled' },
  { time: '14:00', end: '16:30', room: 'OR-4', patient: 'Priya T. (F/28)', procedure: 'Myomectomy', surgeon: 'Dr. A. Sinha', anesthesiologist: 'Dr. V. Rao', status: 'Delayed' },
] as const;

type AnesthesiaDrug = { agent: string; dose: string; route: string; time: string; category: string };
type IntraopEvent  = { type: string; note: string; time: string };
type CountRow      = { name: string; category: string; initial: number; count1: number | null; final: number | null };

export default function OTDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

  const otQuery = useQuery<{ success: boolean; data: OTResponse }>({
    queryKey: ['ward-ot'],
    queryFn: () =>
      fetch(`${API_BASE}/api/ward/ot`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 30_000,
  });

  const qc = useQueryClient();
  const apiData = otQuery.data?.data;
  const apiStats = apiData?.stats;
  const runningProcedures: Procedure[] = apiData?.procedures ?? [];
  const scheduleFromApi: OTScheduleCase[] = apiData?.schedule ?? [];

  // Active case = first running procedure (has real _id from backend)
  const activeCaseId = runningProcedures[0]?._id ?? null;

  // ─── Per-case API queries (enabled only when we have a real case id) ──
  const anesthesiaQuery = useQuery<AnesthesiaRecordData>({
    queryKey: ['ot-anesthesia', activeCaseId],
    queryFn:  () => otApi.getAnesthesia(activeCaseId!),
    enabled:  !!activeCaseId,
    staleTime: 60_000,
  });
  const eventsQuery = useQuery<IntraopEventRecord[]>({
    queryKey: ['ot-events', activeCaseId],
    queryFn:  () => otApi.getEvents(activeCaseId!),
    enabled:  !!activeCaseId,
    staleTime: 10_000,
  });
  const instrumentsQuery = useQuery<InstrumentCountRecord>({
    queryKey: ['ot-instruments', activeCaseId],
    queryFn:  () => otApi.getInstruments(activeCaseId!),
    enabled:  !!activeCaseId,
    staleTime: 30_000,
  });

  // ─── Mutations ────────────────────────────────────────────────────────
  const patchAsaMut = useMutation({
    mutationFn: (asaClass: string) => otApi.patchAnesthesia(activeCaseId!, { asaClass }),
    onSuccess: (data) => qc.setQueryData(['ot-anesthesia', activeCaseId], data),
  });
  const addDrugMut = useMutation({
    mutationFn: (drug: { agent: string; dose: string; route: string; category: string }) =>
      otApi.addDrug(activeCaseId!, drug),
    onSuccess: (data) => qc.setQueryData(['ot-anesthesia', activeCaseId], data),
  });
  const logEventMut = useMutation({
    mutationFn: (ev: { type: string; note: string; time?: string }) =>
      otApi.logEvent(activeCaseId!, ev),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ot-events', activeCaseId] }),
  });
  const updateCountMut = useMutation({
    mutationFn: ({ rowId, body }: { rowId: string; body: { count1?: number | null; final?: number | null } }) =>
      otApi.updateCount(activeCaseId!, rowId, body),
    onSuccess: (data) => qc.setQueryData(['ot-instruments', activeCaseId], data),
  });
  const signOffMut = useMutation({
    mutationFn: (role: 'scrub' | 'circulator') => otApi.signOff(activeCaseId!, role),
    onSuccess: (data) => qc.setQueryData(['ot-instruments', activeCaseId], data),
  });

  const stats = [
    { label: "Today's Surgeries", value: apiStats ? String(apiStats.todaySurgeries) : '—', icon: Scissors,      tone: 'violet'  as const },
    { label: 'Running Now',       value: apiStats ? String(apiStats.runningNow)     : '—', icon: Activity,      tone: 'emerald' as const },
    { label: 'Delayed',           value: apiStats ? String(apiStats.delayed)        : '—', icon: Clock,         tone: 'amber'   as const },
    { label: 'Available ORs',     value: apiStats ? String(apiStats.availableORs)   : '—', icon: CheckCircle,   tone: 'brand'   as const },
  ];

  const [whoItemChecks, setWhoItemChecks] = useState<Record<string, Record<string, boolean>>>({});
  const [whoSigned, setWhoSigned] = useState<Record<string, boolean>>({});
  const [analgesiaGiven, setAnalgesiaGiven] = useState(false);

  const WHO_PHASES = [
    { phase: 'Sign In (Before Induction)', icon: UserPlus, iconClass: 'text-primary', items: ['Patient Identity Confirmed', 'Consent Verified', 'Site Marked', 'Anesthesia Safety Check', 'Allergies Known'] },
    { phase: 'Time Out (Before Incision)', icon: Clock, iconClass: 'text-warning', items: ['Team Introductions', 'Procedure Confirmation', 'Prophylactic Antibiotics <60m', 'Essential Imaging Displayed', 'Blood Available'] },
    { phase: 'Sign Out (Before Patient Leaves)', icon: CheckCircle, iconClass: 'text-success', items: ['Instrument/Sponge Count Correct', 'Specimens Labelled', 'Equipment Issues Addressed', 'Post-Op Recovery Plan'] },
  ];

  // ─── Anesthesia state ─────────────────────────────────────────────────
  const DEMO_DRUGS: AnesthesiaDrug[] = [
    { agent: 'Propofol',    dose: '2 mg/kg',   route: 'IV',         time: '08:05', category: 'Induction'   },
    { agent: 'Fentanyl',   dose: '2 mcg/kg',  route: 'IV',         time: '08:05', category: 'Analgesia'   },
    { agent: 'Rocuronium', dose: '0.6 mg/kg', route: 'IV',         time: '08:06', category: 'NMB'         },
    { agent: 'Sevoflurane', dose: '2%',        route: 'Inhalation', time: '08:10', category: 'Maintenance' },
  ];
  // Use API data when available, fall back to demo
  const asaClass    = anesthesiaQuery.data?.asaClass ?? 'II';
  const anesthesiaDrugs: AnesthesiaDrug[] = activeCaseId ? (anesthesiaQuery.data?.drugs ?? []) as AnesthesiaDrug[] : [];
  const [newDrug, setNewDrug] = useState<Omit<AnesthesiaDrug, 'time'>>({ agent: '', dose: '', route: 'IV', category: 'Induction' });
  const addDrug = () => {
    if (!newDrug.agent.trim()) return;
    if (activeCaseId) {
      addDrugMut.mutate(newDrug);
    }
    setNewDrug({ agent: '', dose: '', route: 'IV', category: 'Induction' });
  };

  // ─── Intraoperative state ─────────────────────────────────────────────
  const DEMO_EVENTS: IntraopEvent[] = [
    { type: 'Induction',  note: 'Propofol + Fentanyl + Rocuronium — smooth induction', time: '08:05' },
    { type: 'Intubation', note: 'Grade I laryngoscopy, 7.5 mm ETT at 21 cm',           time: '08:07' },
    { type: 'Incision',   note: 'Skin incision, haemostasis achieved',                  time: '08:22' },
    { type: 'Key Step',   note: 'Port insertion ×4, pneumoperitoneum 12 mmHg',          time: '08:28' },
    { type: 'Key Step',   note: 'Gallbladder dissected — Calot triangle clear',         time: '08:55' },
  ];
  const intraopEvents: IntraopEvent[] = activeCaseId ? (eventsQuery.data ?? []) as IntraopEvent[] : [];
  const [newEvent, setNewEvent] = useState({ type: 'Key Step', note: '' });
  const logEvent = () => {
    if (!newEvent.note.trim()) return;
    if (activeCaseId) {
      const now = new Date();
      const t = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      logEventMut.mutate({ ...newEvent, time: t });
    }
    setNewEvent({ type: 'Key Step', note: '' });
  };

  // ─── Instruments state ────────────────────────────────────────────────
  const DEMO_COUNTS: CountRow[] = [
    { name: 'Lap Sponge (4×4)',      category: 'Swabs',       initial: 10, count1: 10,   final: null },
    { name: 'Gauze (2×2)',           category: 'Swabs',       initial: 20, count1: 20,   final: null },
    { name: 'Abdominal Pack',        category: 'Swabs',       initial: 4,  count1: 4,    final: null },
    { name: '22G Needle',            category: 'Needles',     initial: 4,  count1: 4,    final: null },
    { name: 'Vicryl 2-0 (Suture)',   category: 'Needles',     initial: 3,  count1: null, final: null },
    { name: 'Retractor',             category: 'Instruments', initial: 2,  count1: 2,    final: null },
    { name: 'Metzenbaum Scissor',    category: 'Instruments', initial: 1,  count1: 1,    final: null },
    { name: 'Haemostat Forceps',     category: 'Instruments', initial: 4,  count1: 4,    final: null },
    { name: 'Blade #22',             category: 'Blades',      initial: 1,  count1: 1,    final: null },
  ];
  // Local editable state — synced from API when instrumentsQuery loads
  const [instrumentCounts, setInstrumentCounts] = useState<CountRow[]>([]);
  const syncedCaseRef = useRef<string | null>(null);
  useEffect(() => {
    if (instrumentsQuery.data && activeCaseId !== syncedCaseRef.current) {
      syncedCaseRef.current = activeCaseId;
      setInstrumentCounts(instrumentsQuery.data.rows as CountRow[]);
    }
  }, [instrumentsQuery.data, activeCaseId]);

  const scrubSigned       = activeCaseId ? !!instrumentsQuery.data?.scrubSignedAt       : false;
  const circulatorSigned  = activeCaseId ? !!instrumentsQuery.data?.circulatorSignedAt  : false;

  const updateCount = (idx: number, field: 'count1' | 'final', val: string) => {
    const n = val === '' ? null : Number(val);
    setInstrumentCounts(prev => prev.map((r, i) => i === idx ? { ...r, [field]: n } : r));
  };
  const flushCount = (idx: number, field: 'count1' | 'final') => {
    if (!activeCaseId) return;
    const row = instrumentCounts[idx] as CountRow & { _id?: string };
    if (!row._id) return;
    updateCountMut.mutate({ rowId: row._id, body: { [field]: instrumentCounts[idx][field] } });
  };

  const boardColumns: Column<Procedure>[] = [
    {
      key: 'room', header: 'Room', sortable: true,
      cell: (p) => <span className="font-bold text-primary">{p.room}</span>,
    },
    {
      key: 'patient', header: 'Patient',
      cell: (p) => <span className="font-semibold text-foreground">{p.patient}</span>,
    },
    {
      key: 'procedure', header: 'Procedure',
      cell: (p) => <span className="font-medium text-foreground">{p.procedure}</span>,
    },
    {
      key: 'surgeon', header: 'Surgeon / Anesthetist',
      cell: (p) => (
        <div className="text-xs">
          <p className="font-semibold text-foreground">{p.surgeon}</p>
          <p className="text-muted-foreground">{p.anesthesiologist}</p>
        </div>
      ),
    },
    {
      key: 'time', header: 'Timing',
      cell: (p) => (
        <div className="text-xs text-muted-foreground">
          <p>Start: {p.time}</p>
          <p>Est. End: {p.end}</p>
        </div>
      ),
    },
    {
      key: 'status', header: 'Status',
      cell: (p) => (
        <Badge
          tone={p.status.includes('Critical') ? 'danger' : p.status.includes('Closing') ? 'success' : 'info'}
          dot
          pulse={p.status.includes('Critical')}
        >
          {p.status.includes('Critical') && <AlertTriangle className="h-3 w-3" aria-hidden />}
          {p.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operation Theatre"
        description="Surgical Command Center & Perioperative Workflows"
        crumbs={[{ label: 'Clinical' }, { label: 'Operation Theatre' }]}
        actions={
          <Button onClick={() => setActiveTab('calendar')}>
            <Calendar className="h-4 w-4" aria-hidden /> Schedule Surgery
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto max-w-full flex-wrap justify-start overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="capitalize">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard" className="mt-6 space-y-6">
          {otQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : otQuery.isError ? (
            <p className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">Failed to load OT data. Please refresh.</p>
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

          <DataTable<Procedure>
            columns={boardColumns}
            data={runningProcedures}
            rowKey={(p) => p.room}
            searchPlaceholder="Search room, patient, procedure…"
            exportName="ot-live-board"
            emptyTitle="No procedures running"
            emptyDescription="Live surgeries in progress will appear on this board."
            toolbar={
              <Badge tone="success" dot pulse>Live OT Board</Badge>
            }
            rowActions={() => (
              <Button size="sm" variant="outline" onClick={() => router.push('/emr')}>Open Chart</Button>
            )}
          />
        </TabsContent>

        <TabsContent value="who safety checklist" className="mt-6">
          <div className="mx-auto max-w-4xl">
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ShieldCheck className="h-6 w-6 text-success" aria-hidden /> WHO Surgical Safety Checklist
                </CardTitle>
                <CardDescription>OR-2 • Patient: Smita J. • Procedure: TKR Right</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {WHO_PHASES.map((phase, idx) => {
                    const PhaseIcon = phase.icon;
                    const signed = !!whoSigned[phase.phase];
                    const checkedCount = phase.items.filter(item => whoItemChecks[phase.phase]?.[item]).length;
                    const allChecked = checkedCount === phase.items.length;
                    return (
                      <motion.div
                        key={phase.phase}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: idx * 0.05 }}
                        className={`rounded-2xl border p-4 ${signed ? 'border-success/30 bg-success-soft' : 'border-border bg-muted/40'}`}
                      >
                        <div className="mb-4 flex items-center gap-2 border-b border-border pb-2">
                          <PhaseIcon className={`h-5 w-5 ${phase.iconClass}`} aria-hidden />
                          <h3 className="text-sm font-bold text-foreground">{phase.phase}</h3>
                        </div>
                        <div className="space-y-3">
                          {phase.items.map((item) => (
                            <label key={item} className="flex cursor-pointer items-start gap-2">
                              <input
                                type="checkbox"
                                className="mt-0.5 rounded border-input bg-card text-primary focus:ring-primary"
                                checked={!!whoItemChecks[phase.phase]?.[item]}
                                disabled={signed}
                                onChange={(e) => setWhoItemChecks(prev => ({
                                  ...prev,
                                  [phase.phase]: { ...prev[phase.phase], [item]: e.target.checked },
                                }))}
                              />
                              <span className={`text-sm ${signed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{item}</span>
                            </label>
                          ))}
                        </div>
                        <Button
                          variant={signed ? 'primary' : 'outline'}
                          className="mt-6 w-full"
                          size="sm"
                          disabled={signed || !allChecked}
                          onClick={() => setWhoSigned(prev => ({ ...prev, [phase.phase]: true }))}
                        >
                          {signed ? (
                            <><CheckCircle className="h-4 w-4" aria-hidden /> Signed & Verified</>
                          ) : allChecked ? (
                            'Sign & Verify'
                          ) : (
                            `Check all items (${checkedCount}/${phase.items.length})`
                          )}
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pacu (recovery)" className="mt-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center gap-3 rounded-2xl border border-info/30 bg-info-soft p-4"
          >
            <HeartPulse className="h-8 w-8 text-info" aria-hidden />
            <div>
              <h3 className="text-lg font-bold text-foreground">Post-Anesthesia Care Unit (PACU)</h3>
              <p className="text-sm text-muted-foreground">Monitoring recovery and Aldrete scores for safe transfer.</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* PACU Patient Card */}
            <Card>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">Anita M. (F/42)</CardTitle>
                  <CardDescription className="mt-1">Laparoscopic Appendectomy • Dr. P. Nair</CardDescription>
                </div>
                <Badge tone="warning">Phase 1 Recovery</Badge>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3">
                    <ProgressRing value={80} size={52} strokeWidth={5} tone="brand">
                      <span className="text-xs font-bold">8</span>
                    </ProgressRing>
                    <div>
                      <span className="text-xs font-bold uppercase text-subtle-foreground">Aldrete Score</span>
                      <p className="text-lg font-bold tabular-nums text-primary">8 <span className="text-sm font-normal text-muted-foreground">/ 10</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3">
                    <ProgressRing value={40} size={52} strokeWidth={5} tone="warning">
                      <span className="text-xs font-bold">4</span>
                    </ProgressRing>
                    <div>
                      <span className="text-xs font-bold uppercase text-subtle-foreground">Pain Score</span>
                      <p className="text-lg font-bold tabular-nums text-warning">4 <span className="text-sm font-normal text-muted-foreground">/ 10</span></p>
                    </div>
                  </div>
                </div>

                <div className="mb-4 space-y-2 text-sm text-muted-foreground">
                  <p className="flex justify-between"><span>Activity:</span> <span className="font-medium text-foreground">Moves 2 extremities (1)</span></p>
                  <p className="flex justify-between"><span>Respiration:</span> <span className="font-medium text-foreground">Dyspnea / Shallow (1)</span></p>
                  <p className="flex justify-between"><span>Circulation:</span> <span className="font-medium text-foreground">BP +/- 20% normal (2)</span></p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={analgesiaGiven ? 'primary' : 'secondary'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setAnalgesiaGiven(a => !a)}
                  >
                    {analgesiaGiven ? <><CheckCircle className="h-4 w-4" aria-hidden /> Administered</> : 'Administer Analgesia'}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push('/adt')}>Transfer to Ward</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── CALENDAR ───────────────────────────────────────────── */}
        <TabsContent value="calendar" className="mt-6 space-y-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            {otQuery.isLoading ? (
              <SkeletonCard />
            ) : !scheduleFromApi.length ? (
              <EmptyState icon={Calendar} title="No cases scheduled today" description="No OT cases have been added to today's list. Check back after the schedule is confirmed by the OT coordinator." />
            ) : (
            <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Calendar className="h-5 w-5 text-primary" aria-hidden /> Today&apos;s OT List
                </h2>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {scheduleFromApi.length} cases
                </p>
              </div>
              <Badge tone="success" dot pulse>Live</Badge>
            </div>
            <div className="space-y-2">
              {scheduleFromApi.map((c, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                >
                  <Card className={c.status === 'Delayed' ? 'border-warning/40' : c.status === 'In Progress' ? 'border-primary/40' : ''}>
                    <CardContent className="flex items-center gap-4 py-3">
                      <div className="w-16 shrink-0 text-center">
                        <p className="text-sm font-bold tabular-nums text-foreground">{c.time}</p>
                        <p className="text-xs text-muted-foreground">→ {c.end}</p>
                      </div>
                      <div className="w-14 shrink-0">
                        <span className="inline-block rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold text-primary">{c.room}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{c.patient}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.procedure}</p>
                      </div>
                      <div className="hidden min-w-0 flex-1 md:block">
                        <p className="truncate text-xs font-medium text-foreground">{c.surgeon}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.anesthesiologist}</p>
                      </div>
                      <Badge
                        tone={c.status === 'Completed' ? 'success' : c.status === 'In Progress' ? 'info' : c.status === 'Delayed' ? 'warning' : 'brand'}
                        dot
                        pulse={c.status === 'In Progress'}
                      >{c.status}</Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            </>
            )}
          </motion.div>
        </TabsContent>

        {/* ── ANESTHESIA ─────────────────────────────────────────── */}
        <TabsContent value="anesthesia" className="mt-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
            {/* Active case header */}
            <Card className="border-primary/30">
              <CardContent className="py-4">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Case</p>
                    <p className="text-lg font-bold text-foreground">
                      {runningProcedures[0]?.patient ?? '—'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {runningProcedures[0]?.procedure ?? '—'} · {runningProcedures[0]?.room ?? '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">ASA</span>
                    <select
                      value={asaClass}
                      onChange={e => activeCaseId
                        ? patchAsaMut.mutate(e.target.value)
                        : undefined}
                      disabled={!activeCaseId}
                      className="rounded-lg border border-input bg-card px-3 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                    >
                      {['I', 'II', 'III', 'IV', 'V', 'VI'].map(c => <option key={c} value={c}>ASA {c}</option>)}
                    </select>
                    {!activeCaseId && <span className="text-xs text-muted-foreground">(demo)</span>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Pre-op Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ClipboardList className="h-4 w-4 text-primary" aria-hidden /> Pre-op Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {!activeCaseId ? (
                    <EmptyState icon={ClipboardList} title="No active case" description="Pre-operative assessment data will appear here once a procedure is in progress." />
                  ) : [
                    { label: 'Weight',          value: '72 kg'               },
                    { label: 'Height',          value: '163 cm'              },
                    { label: 'BMI',             value: '27.1'                },
                    { label: 'NPO Status',      value: 'Fasting ×8 h ✓'      },
                    { label: 'Allergies',       value: 'Penicillin'          },
                    { label: 'Mallampati',      value: 'Class II'            },
                    { label: 'Mouth Opening',   value: '> 3 cm ✓'            },
                    { label: 'Neck Mobility',   value: 'Full ROM ✓'          },
                    { label: 'Airway Risk',     value: 'Low'                 },
                    { label: 'Anaesthesia Plan', value: 'Spinal + sedation'  },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className="font-medium text-foreground">{r.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Drug Chart */}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Syringe className="h-4 w-4 text-primary" aria-hidden /> Drug Chart
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!activeCaseId ? (
                    <EmptyState icon={Syringe} title="No active case" description="Select a running procedure from the Dashboard to view and manage the drug chart." />
                  ) : (<>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs text-muted-foreground">
                          <th className="pb-2 text-left font-semibold">Agent</th>
                          <th className="pb-2 text-left font-semibold">Dose</th>
                          <th className="pb-2 text-left font-semibold">Route</th>
                          <th className="pb-2 text-left font-semibold">Time</th>
                          <th className="pb-2 text-left font-semibold">Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {anesthesiaDrugs.map((d, i) => (
                          <tr key={i} className="border-b border-border/50 last:border-0">
                            <td className="py-2 font-medium text-foreground">{d.agent}</td>
                            <td className="py-2 tabular-nums text-muted-foreground">{d.dose}</td>
                            <td className="py-2 text-muted-foreground">{d.route}</td>
                            <td className="py-2 tabular-nums text-muted-foreground">{d.time}</td>
                            <td className="py-2">
                              <Badge tone={d.category === 'Induction' ? 'info' : d.category === 'Maintenance' ? 'success' : d.category === 'NMB' ? 'warning' : 'brand'}>
                                {d.category}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 md:grid-cols-4">
                    <input
                      placeholder="Agent"
                      value={newDrug.agent}
                      onChange={e => setNewDrug(p => ({ ...p, agent: e.target.value }))}
                      className="col-span-2 rounded-lg border border-input bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      placeholder="Dose"
                      value={newDrug.dose}
                      onChange={e => setNewDrug(p => ({ ...p, dose: e.target.value }))}
                      className="rounded-lg border border-input bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <select
                      value={newDrug.category}
                      onChange={e => setNewDrug(p => ({ ...p, category: e.target.value }))}
                      className="rounded-lg border border-input bg-card px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {['Induction', 'Maintenance', 'NMB', 'Analgesia', 'Reversal', 'Emergency'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <Button
                    size="sm" variant="outline" onClick={addDrug} className="mt-2 w-full"
                    disabled={addDrugMut.isPending}
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    {addDrugMut.isPending ? 'Saving…' : 'Add Drug'}
                  </Button>
                  </>)}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </TabsContent>

        {/* ── INTRAOPERATIVE ─────────────────────────────────────── */}
        <TabsContent value="intraoperative" className="mt-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
            {/* Case timer bar */}
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-muted/40 p-4">
              <Timer className="h-8 w-8 shrink-0 text-primary" aria-hidden />
              <div className="flex-1">
                <p className="font-bold text-foreground">{runningProcedures[0]?.patient ?? '—'}</p>
                <p className="text-sm text-muted-foreground">
                  {runningProcedures[0]?.procedure ?? '—'} · {runningProcedures[0]?.surgeon ?? '—'}
                </p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold tabular-nums text-primary">01:34</p>
                  <p className="text-xs text-muted-foreground">Elapsed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold tabular-nums text-warning">00:56</p>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                </div>
              </div>
              <Badge tone="info" dot pulse>Surgery Active</Badge>
            </div>

            {/* Event timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4 text-primary" aria-hidden /> Intraoperative Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!activeCaseId ? (
                  <EmptyState icon={Activity} title="No active case" description="Intraoperative events are recorded here once a procedure is in progress." />
                ) : (<>
                <div className="space-y-0">
                  {intraopEvents.map((ev, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${ev.type === 'Incision' ? 'bg-danger' : ev.type === 'Induction' ? 'bg-info' : ev.type === 'Intubation' ? 'bg-warning' : 'bg-primary'}`} />
                        {idx < intraopEvents.length - 1 && <div className="my-1 w-px flex-1 bg-border" />}
                      </div>
                      <div className="pb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs tabular-nums text-muted-foreground">{ev.time}</span>
                          <Badge tone={ev.type === 'Incision' || ev.type === 'Complication' ? 'danger' : ev.type === 'Induction' ? 'info' : ev.type === 'Intubation' ? 'warning' : 'brand'}>
                            {ev.type}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-foreground">{ev.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Log event */}
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  <div className="flex gap-2">
                    <select
                      value={newEvent.type}
                      onChange={e => setNewEvent(p => ({ ...p, type: e.target.value }))}
                      className="rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {['Induction', 'Intubation', 'Incision', 'Key Step', 'Complication', 'Blood Loss', 'Closure', 'Extubation', 'Other'].map(t => <option key={t}>{t}</option>)}
                    </select>
                    <input
                      placeholder="Event note…"
                      value={newEvent.note}
                      onChange={e => setNewEvent(p => ({ ...p, note: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && logEvent()}
                      className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button size="sm" onClick={logEvent} disabled={logEventMut.isPending}>
                      <Plus className="h-4 w-4" aria-hidden />
                      {logEventMut.isPending ? '…' : 'Log'}
                    </Button>
                  </div>
                </div>
                </>)}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── INSTRUMENTS ────────────────────────────────────────── */}
        <TabsContent value="instruments" className="mt-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <Card>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Layers className="h-4 w-4 text-primary" aria-hidden /> Instrument Count Sheet
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {runningProcedures[0]?.patient ?? '—'} · {runningProcedures[0]?.procedure ?? '—'} · {runningProcedures[0]?.room ?? '—'}
                  </CardDescription>
                </div>
                {instrumentCounts.filter(r => r.final !== null).every(r => r.final === r.initial) && instrumentCounts.some(r => r.final !== null) ? (
                  <Badge tone="success" dot>Counts Match</Badge>
                ) : instrumentCounts.some(r => r.final !== null && r.final !== r.initial) ? (
                  <Badge tone="danger" dot pulse>COUNT DISCREPANCY</Badge>
                ) : (
                  <Badge tone="warning" dot>Counts Pending</Badge>
                )}
              </CardHeader>
              <CardContent>
                {!activeCaseId ? (
                  <EmptyState icon={Layers} title="No active case" description="Instrument count tracking starts once a procedure is in progress." />
                ) : (<>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="pb-3 text-left font-semibold">#</th>
                        <th className="pb-3 text-left font-semibold">Item</th>
                        <th className="pb-3 text-left font-semibold">Category</th>
                        <th className="pb-3 text-center font-semibold">Initial</th>
                        <th className="pb-3 text-center font-semibold">Count 1</th>
                        <th className="pb-3 text-center font-semibold">Final</th>
                        <th className="pb-3 text-center font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['Swabs', 'Needles', 'Instruments', 'Blades'] as const).map(cat => {
                        const rows = instrumentCounts.map((r, i) => ({ r, i })).filter(({ r }) => r.category === cat);
                        if (!rows.length) return null;
                        return (
                          <React.Fragment key={cat}>
                            <tr>
                              <td colSpan={7} className="pb-1 pt-4">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{cat}</span>
                              </td>
                            </tr>
                            {rows.map(({ r, i }) => {
                              const ok  = r.final !== null && r.final === r.initial;
                              const err = r.final !== null && r.final !== r.initial;
                              return (
                                <tr key={i} className={`border-b border-border/50 last:border-0 ${err ? 'bg-danger/5' : ok ? 'bg-success/5' : ''}`}>
                                  <td className="py-2 text-xs tabular-nums text-muted-foreground">{i + 1}</td>
                                  <td className="py-2 font-medium text-foreground">{r.name}</td>
                                  <td className="py-2 text-muted-foreground">{r.category}</td>
                                  <td className="py-2 text-center font-bold tabular-nums text-foreground">{r.initial}</td>
                                  <td className="py-2 text-center">
                                    <input
                                      type="number"
                                      value={r.count1 ?? ''}
                                      onChange={e => updateCount(i, 'count1', e.target.value)}
                                      onBlur={() => flushCount(i, 'count1')}
                                      className="w-16 rounded border border-input bg-card px-2 py-1 text-center text-sm tabular-nums text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                  </td>
                                  <td className="py-2 text-center">
                                    <input
                                      type="number"
                                      value={r.final ?? ''}
                                      onChange={e => updateCount(i, 'final', e.target.value)}
                                      onBlur={() => flushCount(i, 'final')}
                                      className={`w-16 rounded border px-2 py-1 text-center text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-primary ${err ? 'border-danger bg-danger/10 text-danger' : ok ? 'border-success bg-success/10 text-success' : 'border-input bg-card text-foreground'}`}
                                    />
                                  </td>
                                  <td className="py-2 text-center">
                                    {ok  ? <Check className="mx-auto h-4 w-4 text-success" aria-hidden /> :
                                     err ? <X     className="mx-auto h-4 w-4 text-danger"  aria-hidden /> :
                                     <span className="text-muted-foreground">—</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Sign-off */}
                <div className="mt-6 grid grid-cols-1 gap-4 border-t border-border pt-6 sm:grid-cols-2">
                  <div className={`rounded-2xl border p-4 text-center ${scrubSigned ? 'border-success/40 bg-success/5' : 'border-border'}`}>
                    <FlaskConical className="mx-auto mb-2 h-6 w-6 text-muted-foreground" aria-hidden />
                    <p className="text-sm font-semibold text-foreground">Scrub Nurse</p>
                    <p className="mb-3 text-xs text-muted-foreground">Confirms all counts are correct</p>
                    <Button
                      variant={scrubSigned ? 'primary' : 'outline'} size="sm"
                      onClick={() => activeCaseId ? signOffMut.mutate('scrub') : undefined}
                      disabled={scrubSigned || signOffMut.isPending}
                      className="w-full"
                    >
                      {scrubSigned ? <><Check className="h-4 w-4" aria-hidden /> Signed</> : 'Sign Count'}
                    </Button>
                  </div>
                  <div className={`rounded-2xl border p-4 text-center ${circulatorSigned ? 'border-success/40 bg-success/5' : 'border-border'}`}>
                    <User className="mx-auto mb-2 h-6 w-6 text-muted-foreground" aria-hidden />
                    <p className="text-sm font-semibold text-foreground">Circulator Nurse</p>
                    <p className="mb-3 text-xs text-muted-foreground">Witnesses and countersigns</p>
                    <Button
                      variant={circulatorSigned ? 'primary' : 'outline'} size="sm"
                      onClick={() => activeCaseId ? signOffMut.mutate('circulator') : undefined}
                      disabled={!scrubSigned || circulatorSigned || signOffMut.isPending}
                      className="w-full"
                    >
                      {circulatorSigned ? <><Check className="h-4 w-4" aria-hidden /> Countersigned</> : 'Countersign'}
                    </Button>
                  </div>
                </div>
                </>)}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
