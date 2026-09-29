'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  HeartPulse, Activity, AlertTriangle, Wind,
  Droplets, Stethoscope, Siren, ActivitySquare, Clipboard,
  TrendingUp, TrendingDown, Minus, FlaskConical, LayoutDashboard,
} from 'lucide-react';
import {
  PageHeader, Button, Badge, StatCard, StatGrid,
  Card, CardHeader, CardTitle, CardContent, CardDescription,
  Tabs, TabsList, TabsTrigger, TabsContent,
  ProgressRing, SkeletonCard, Skeleton,
} from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: 'Bearer ' + token } : {};
}

function opsUrl(type: string) {
  return `${API_BASE}/api/admin/ops/${type}`;
}

type Monitor = {
  bed: string; patient: string; age: number; status: string;
  hr: number; bp: string; map: number; spo2: number; rr: number; temp: number;
  vent: string | null; pressor: string | null;
};

type ICUStats = { census: string; onVentilator: number; onVasopressors: number; criticalAlerts: number; };
type ICUResponse = { stats: ICUStats; patients: Monitor[]; };

type VentRecord = {
  id: string; bed: string; patient: string; mode: string;
  fio2Pct: number; peep: number; pip: number; vt: number;
  rrSet: number; rrTotal: number; etco2: number; spo2: number;
  status: 'STABLE' | 'CONCERN' | 'CRITICAL' | 'WEANING';
};

type InfusionRecord = {
  id: string; bed: string; patient: string; drug: string;
  concentration: string; rateMLph: number; doseUgkgmin: number | null;
  titration: string; site: string;
};

type SeverityRecord = {
  id: string; bed: string; patient: string; dx: string; los: number;
  sofaScore: number; apacheII: number; gcs: number; predictedMortPct: number;
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
};

type RoundRecord = {
  id: string; bed: string; patient: string; roundedAt: string; consultant: string;
  situation: string; background: string; assessment: string; recommendation: string; plan: string;
};

const TABS = ['dashboard', 'central monitor', 'ventilators', 'infusions', 'severity scores', 'rounds'];

export default function ICUDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('central monitor');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const icuQuery = useQuery<{ success: boolean; data: ICUResponse }>({
    queryKey: ['ward-icu'],
    queryFn: () => fetch(`${API_BASE}/api/ward/icu`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const ventQuery = useQuery<{ success: boolean; data: VentRecord[] }>({
    queryKey: ['ops', 'icu_vent'],
    queryFn: () => fetch(opsUrl('icu_vent'), { headers: authHeaders() }).then(r => r.json()),
    enabled: activeTab === 'ventilators',
    staleTime: 60_000,
  });

  const infusionQuery = useQuery<{ success: boolean; data: InfusionRecord[] }>({
    queryKey: ['ops', 'icu_infusion'],
    queryFn: () => fetch(opsUrl('icu_infusion'), { headers: authHeaders() }).then(r => r.json()),
    enabled: activeTab === 'infusions',
    staleTime: 60_000,
  });

  const severityQuery = useQuery<{ success: boolean; data: SeverityRecord[] }>({
    queryKey: ['ops', 'icu_severity'],
    queryFn: () => fetch(opsUrl('icu_severity'), { headers: authHeaders() }).then(r => r.json()),
    enabled: activeTab === 'severity scores' || activeTab === 'dashboard',
    staleTime: 60_000,
  });

  const roundQuery = useQuery<{ success: boolean; data: RoundRecord[] }>({
    queryKey: ['ops', 'icu_round'],
    queryFn: () => fetch(opsUrl('icu_round'), { headers: authHeaders() }).then(r => r.json()),
    enabled: activeTab === 'rounds',
    staleTime: 60_000,
  });

  const apiData = icuQuery.data?.data;
  const apiStats = apiData?.stats;
  const monitors: Monitor[] = apiData?.patients ?? [];
  const vents: VentRecord[] = ventQuery.data?.data ?? [];
  const infusions: InfusionRecord[] = infusionQuery.data?.data ?? [];
  const severity: SeverityRecord[] = severityQuery.data?.data ?? [];
  const rounds: RoundRecord[] = roundQuery.data?.data ?? [];

  const stats = [
    { label: 'ICU Census',      value: apiStats?.census ?? '—',                        icon: HeartPulse,    tone: 'violet' as const },
    { label: 'On Ventilator',   value: apiStats ? String(apiStats.onVentilator) : '—',  icon: Wind,          tone: 'brand'  as const },
    { label: 'On Vasopressors', value: apiStats ? String(apiStats.onVasopressors) : '—',icon: Droplets,      tone: 'violet' as const },
    { label: 'Critical Alerts', value: apiStats ? String(apiStats.criticalAlerts) : '—',icon: AlertTriangle, tone: 'rose'   as const },
  ];

  const getAlertClasses = (status: string) => {
    switch (status) {
      case 'Critical': return 'border-danger/60 ring-1 ring-danger/20';
      case 'Warning':  return 'border-warning/60 ring-1 ring-warning/20';
      default:         return 'border-border';
    }
  };

  const statusTone = (status: string): 'danger' | 'warning' | 'success' =>
    status === 'Critical' ? 'danger' : status === 'Warning' ? 'warning' : 'success';

  const sofaTone = (s: number): string =>
    s >= 12 ? 'text-danger' : s >= 8 ? 'text-warning' : 'text-success';

  const apacheTone = (s: number): string =>
    s >= 25 ? 'text-danger' : s >= 15 ? 'text-warning' : 'text-success';

  const trendIcon = (t: string) =>
    t === 'IMPROVING' ? <TrendingUp className="h-3.5 w-3.5" /> :
    t === 'WORSENING' ? <TrendingDown className="h-3.5 w-3.5" /> :
    <Minus className="h-3.5 w-3.5" />;

  const trendTone = (t: string): 'success' | 'danger' | 'neutral' =>
    t === 'IMPROVING' ? 'success' : t === 'WORSENING' ? 'danger' : 'neutral';

  const ventStatusBorder = (s: string) =>
    s === 'CRITICAL' ? 'border-danger/60 ring-1 ring-danger/20' :
    s === 'CONCERN'  ? 'border-warning/60 ring-1 ring-warning/20' :
    s === 'WEANING'  ? 'border-info/60 ring-1 ring-info/20' :
    'border-border';

  const ventStatusTone = (s: string): 'danger' | 'warning' | 'info' | 'success' =>
    s === 'CRITICAL' ? 'danger' : s === 'CONCERN' ? 'warning' : s === 'WEANING' ? 'info' : 'success';

  // Group infusions by bed
  const infusionsByBed = infusions.reduce<Record<string, InfusionRecord[]>>((acc, inf) => {
    if (!acc[inf.bed]) acc[inf.bed] = [];
    acc[inf.bed].push(inf);
    return acc;
  }, {});

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m ago` : `${m}m ago`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Critical Care (ICU)"
        description={
          <span className="inline-flex items-center gap-2">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Live Command Center • <span className="tabular-nums">{currentTime.toLocaleTimeString()}</span>
          </span>
        }
        crumbs={[{ label: 'Clinical' }, { label: 'Critical Care' }]}
        actions={
          <>
            <Button variant="secondary" onClick={() => setActiveTab('rounds')}>
              <Stethoscope className="h-4 w-4" aria-hidden /> Start Rounds
            </Button>
            <Button variant="danger" className="animate-pulse" onClick={() => router.push('/emergency')}>
              <Siren className="h-4 w-4" aria-hidden /> Code Blue
            </Button>
          </>
        }
      />

      {icuQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : icuQuery.isError ? (
        <p className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">Failed to load ICU data. Please refresh.</p>
      ) : (
        <StatGrid>
          {stats.map((stat, idx) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} tone={stat.tone} delay={idx * 0.05} />
          ))}
        </StatGrid>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto max-w-full flex-wrap justify-start overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="capitalize">{tab}</TabsTrigger>
          ))}
        </TabsList>

        {/* ── DASHBOARD ─────────────────────────────────────────────────── */}
        <TabsContent value="dashboard" className="mt-6">
          {severityQuery.isLoading ? (
            <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <LayoutDashboard className="h-4 w-4 text-primary" /> Patient Summary — {severity.length} ICU Beds
                </CardTitle>
                <CardDescription>SOFA · APACHE II · Predicted Mortality · LOS trend</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <th className="px-4 py-2.5">Bed</th>
                        <th className="px-4 py-2.5">Patient</th>
                        <th className="px-4 py-2.5">Diagnosis</th>
                        <th className="px-4 py-2.5 text-center">LOS</th>
                        <th className="px-4 py-2.5 text-center">SOFA</th>
                        <th className="px-4 py-2.5 text-center">APACHE II</th>
                        <th className="px-4 py-2.5 text-center">Pred. Mortality</th>
                        <th className="px-4 py-2.5 text-center">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {severity.map((s, i) => (
                        <motion.tr
                          key={s.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.04 }}
                          className="border-b border-border last:border-0 hover:bg-muted/30"
                        >
                          <td className="px-4 py-3 font-mono text-sm font-bold text-primary">{s.bed}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">{s.patient}</td>
                          <td className="px-4 py-3 text-muted-foreground">{s.dx}</td>
                          <td className="px-4 py-3 text-center tabular-nums">{s.los}d</td>
                          <td className={`px-4 py-3 text-center font-bold tabular-nums ${sofaTone(s.sofaScore)}`}>{s.sofaScore}</td>
                          <td className={`px-4 py-3 text-center font-bold tabular-nums ${apacheTone(s.apacheII)}`}>{s.apacheII}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold tabular-nums ${s.predictedMortPct >= 40 ? 'text-danger' : s.predictedMortPct >= 20 ? 'text-warning' : 'text-success'}`}>
                              {s.predictedMortPct}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge tone={trendTone(s.trend)} className="inline-flex items-center gap-1 text-[10px]">
                              {trendIcon(s.trend)} {s.trend}
                            </Badge>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── CENTRAL MONITOR ───────────────────────────────────────────── */}
        <TabsContent value="central monitor" className="mt-6">
          {icuQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="h-56 animate-pulse rounded-2xl bg-muted" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {monitors.map((m, i) => (
                <motion.div
                  key={m.bed}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex flex-col overflow-hidden rounded-2xl border-2 bg-card shadow-soft ${getAlertClasses(m.status)}`}
                >
                  <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-muted/60 px-4 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-lg font-bold text-primary">{m.bed}</span>
                      <span className="truncate text-sm font-semibold text-foreground">{m.patient}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge tone={statusTone(m.status)} dot pulse={m.status === 'Critical'}>{m.status}</Badge>
                      {m.vent && <Badge tone="info"><Wind className="h-3 w-3" aria-hidden /> {m.vent}</Badge>}
                      {m.pressor && <Badge tone="brand"><Droplets className="h-3 w-3" aria-hidden /> {m.pressor}</Badge>}
                    </div>
                  </div>
                  <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-5 p-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-wider text-success">HR (bpm)</span>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className={`font-mono text-4xl font-bold tabular-nums ${m.hr > 100 ? 'animate-pulse text-danger' : 'text-success'}`}>{m.hr}</span>
                        <Activity className="h-5 w-5 text-success opacity-50" aria-hidden />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-danger">NIBP (mmHg)</span>
                        <span className="font-mono text-[10px] text-subtle-foreground">MAP: {m.map}</span>
                      </div>
                      <div className="mt-1 flex items-baseline">
                        <span className={`font-mono text-3xl font-bold tabular-nums text-danger ${(m.map < 65 || m.map > 105) ? 'animate-pulse' : ''}`}>{m.bp}</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-wider text-info">SpO2 (%)</span>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className={`font-mono text-4xl font-bold tabular-nums ${m.spo2 < 94 ? 'animate-pulse text-danger' : 'text-info'}`}>{m.spo2}</span>
                        <ProgressRing value={m.spo2} size={44} strokeWidth={4} tone={m.spo2 < 94 ? 'danger' : 'brand'}>
                          <span className="sr-only">{m.spo2}% oxygen saturation</span>
                          <span aria-hidden className="text-[10px] font-bold">{m.spo2}</span>
                        </ProgressRing>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-wider text-warning">RR (rpm)</span>
                      <div className="mt-1 flex items-baseline">
                        <span className={`font-mono text-4xl font-bold tabular-nums ${m.rr > 25 ? 'text-danger' : 'text-warning'}`}>{m.rr}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── VENTILATORS ───────────────────────────────────────────────── */}
        <TabsContent value="ventilators" className="mt-6">
          {ventQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[0, 1, 2].map(i => <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {vents.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className={`overflow-hidden rounded-2xl border-2 bg-card ${ventStatusBorder(v.status)}`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/60 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Wind className="h-4 w-4 text-info" />
                      <span className="font-mono text-sm font-bold text-primary">{v.bed}</span>
                      <span className="truncate text-sm font-semibold text-foreground">{v.patient}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge tone="info" className="font-mono text-[10px]">{v.mode}</Badge>
                      <Badge tone={ventStatusTone(v.status)}>{v.status}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-px bg-border p-0">
                    {[
                      { label: 'FiO₂', value: `${v.fio2Pct}%`, alert: v.fio2Pct > 60 },
                      { label: 'PEEP',  value: `${v.peep} cmH₂O`, alert: false },
                      { label: 'PIP',   value: `${v.pip} cmH₂O`, alert: v.pip > 30 },
                      { label: 'Vt',    value: `${v.vt} mL`, alert: false },
                      { label: 'RR Set',  value: `${v.rrSet} /min`, alert: false },
                      { label: 'RR Total',value: `${v.rrTotal} /min`, alert: v.rrTotal > v.rrSet + 4 },
                      { label: 'EtCO₂', value: `${v.etco2} mmHg`, alert: v.etco2 > 45 || v.etco2 < 30 },
                      { label: 'SpO₂',  value: `${v.spo2}%`, alert: v.spo2 < 94 },
                    ].map(({ label, value, alert }) => (
                      <div key={label} className="flex flex-col items-center bg-card p-3">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                        <span className={`mt-0.5 font-mono text-base font-bold tabular-nums ${alert ? 'animate-pulse text-danger' : 'text-foreground'}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── INFUSIONS ─────────────────────────────────────────────────── */}
        <TabsContent value="infusions" className="mt-6 space-y-4">
          {infusionQuery.isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
          ) : (
            Object.entries(infusionsByBed).map(([bed, drips], i) => (
              <motion.div key={bed} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.06 }}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <FlaskConical className="h-4 w-4 text-brand" />
                      <span className="font-mono text-primary">{bed}</span>
                      <span className="text-muted-foreground">—</span>
                      <span className="font-semibold text-foreground">{drips[0].patient}</span>
                      <Badge tone="neutral" className="ml-auto text-[10px]">{drips.length} active drip{drips.length > 1 ? 's' : ''}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/40 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <th className="px-4 py-2">Drug</th>
                            <th className="px-4 py-2">Concentration</th>
                            <th className="px-4 py-2 text-center">Rate</th>
                            <th className="px-4 py-2 text-center">Dose</th>
                            <th className="px-4 py-2">Titration Target</th>
                            <th className="px-4 py-2">IV Site</th>
                          </tr>
                        </thead>
                        <tbody>
                          {drips.map((d) => (
                            <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                              <td className="px-4 py-2.5 font-semibold text-foreground">{d.drug}</td>
                              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{d.concentration}</td>
                              <td className="px-4 py-2.5 text-center font-mono font-bold text-info tabular-nums">{d.rateMLph} mL/h</td>
                              <td className="px-4 py-2.5 text-center font-mono text-xs tabular-nums text-foreground">
                                {d.doseUgkgmin !== null ? `${d.doseUgkgmin} μg/kg/min` : '—'}
                              </td>
                              <td className="px-4 py-2.5 text-xs text-muted-foreground">{d.titration}</td>
                              <td className="px-4 py-2.5 font-mono text-xs text-foreground">{d.site}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>

        {/* ── SEVERITY SCORES ───────────────────────────────────────────── */}
        <TabsContent value="severity scores" className="mt-6">
          {severityQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => <div key={i} className="h-52 animate-pulse rounded-2xl bg-muted" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {severity.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-sm font-bold text-primary">{s.bed}</span>
                            <Badge tone={trendTone(s.trend)} className="inline-flex items-center gap-1 text-[10px]">
                              {trendIcon(s.trend)} {s.trend}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-sm font-semibold text-foreground">{s.patient}</p>
                          <p className="text-xs text-muted-foreground">{s.dx}</p>
                        </div>
                        <ProgressRing value={s.predictedMortPct} size={52} strokeWidth={5} tone={s.predictedMortPct >= 40 ? 'danger' : s.predictedMortPct >= 20 ? 'warning' : 'success'}>
                          <span className="text-[10px] font-bold">{s.predictedMortPct}%</span>
                        </ProgressRing>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg border border-border bg-muted/40 p-2">
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">SOFA</span>
                          <span className={`block font-mono text-xl font-bold tabular-nums ${sofaTone(s.sofaScore)}`}>{s.sofaScore}</span>
                          <span className="text-[9px] text-muted-foreground">/ 24</span>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/40 p-2">
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">APACHE II</span>
                          <span className={`block font-mono text-xl font-bold tabular-nums ${apacheTone(s.apacheII)}`}>{s.apacheII}</span>
                          <span className="text-[9px] text-muted-foreground">/ 71</span>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/40 p-2">
                          <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">GCS</span>
                          <span className={`block font-mono text-xl font-bold tabular-nums ${s.gcs <= 12 ? 'text-danger' : s.gcs <= 14 ? 'text-warning' : 'text-success'}`}>{s.gcs}</span>
                          <span className="text-[9px] text-muted-foreground">/ 15</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs">
                        <span className="text-muted-foreground">LOS</span>
                        <span className="font-semibold tabular-nums">{s.los} day{s.los !== 1 ? 's' : ''}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── ROUNDS ────────────────────────────────────────────────────── */}
        <TabsContent value="rounds" className="mt-6 space-y-4">
          {roundQuery.isLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}</div>
          ) : (
            rounds.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <span className="font-mono text-primary">{r.bed}</span>
                          <span>—</span>
                          <span>{r.patient}</span>
                        </CardTitle>
                        <CardDescription className="mt-0.5">{r.consultant} · Rounded {timeAgo(r.roundedAt)}</CardDescription>
                      </div>
                      <Badge tone="neutral" className="shrink-0 text-[10px]">SBAR</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {[
                      { label: 'S — Situation',       text: r.situation,      color: 'text-danger' },
                      { label: 'B — Background',      text: r.background,     color: 'text-muted-foreground' },
                      { label: 'A — Assessment',      text: r.assessment,     color: 'text-warning' },
                      { label: 'R — Recommendation',  text: r.recommendation, color: 'text-info' },
                    ].map(({ label, text, color }) => (
                      <div key={label} className="flex gap-3">
                        <span className={`w-36 shrink-0 text-[10px] font-bold uppercase tracking-wider ${color} mt-0.5`}>{label}</span>
                        <p className="text-sm text-foreground">{text}</p>
                      </div>
                    ))}
                    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-primary">Plan</span>
                      <p className="mt-0.5 text-sm text-foreground">{r.plan}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
