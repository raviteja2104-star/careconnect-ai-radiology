'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  IndianRupee, Users, Activity, Bed, Download, Calendar, Filter,
  CreditCard, FlaskConical, Pill, Building2, Landmark, Banknote, Smartphone,
  User, Search, Clock, FileText, Heart,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription,
  CardContent, Tabs, TabsList, TabsTrigger, TabsContent, Button, Select, Badge,
  Progress, EmptyState, Input, SkeletonCard,
} from '@/components/ui';
import { useCallback } from 'react';
import { CHART_COLORS, chartGrid, chartAxis, chartTooltip } from '@/lib/chart-theme';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';
function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type RangeKey = 'today' | 'week' | 'month' | 'quarter' | 'year';

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: 'today',   label: 'Today' },
  { value: 'week',    label: 'This Week' },
  { value: 'month',   label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year',    label: 'Financial Year' },
];

function inrFmt(n: number): string {
  if (n >= 10_000_000) return `₹ ${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹ ${(n / 100_000).toFixed(2)} L`;
  return `₹ ${Math.round(n).toLocaleString('en-IN')}`;
}

interface ReportData {
  kpis: {
    grossRevenue: number;
    bedOccupancyPct: number;
    totalBeds: number;
    occupiedBeds: number;
    patientFootfall: number;
    avgLosDays: number | null;
    opdRevenue: number;
    ipdRevenue: number;
    pharmacyRevenue: number;
  };
  deptRevenue:     { dept: string; total: number; pct: number }[];
  paymentModes:    { label: string; total: number; badge: string }[];
  wardOccupancy:   { ward: string; total: number; occupied: number; pct: number }[];
  labVolume:       { name: string; count: number }[];
  pharmacyVolume:  { name: string; count: number }[];
  range: string;
  generatedAt: string;
}

interface PatientSummary {
  demographics?: { name?: string; age?: number; gender?: string; bloodGroup?: string };
  allergies?: string[];
  chronicDiseases?: string[];
  medications?: { name: string; dosage?: string; frequency?: string }[];
  surgeries?: string[];
  documentCounts?: Record<string, number>;
}

function PatientReportTab() {
  const [patientId, setPatientId] = useState('');
  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    if (!patientId.trim()) return;
    setLoading(true); setError(null); setSummary(null);
    try {
      const r = await fetch(`${API}/api/health-records/patients/${patientId.trim()}/summary`, {
        headers: authHeaders(),
      });
      const data = await r.json();
      if (!r.ok || !data.success) { setError(data.message || `HTTP ${r.status}`); return; }
      setSummary(data.data ?? data);
    } catch { setError('Could not reach server.'); }
    finally { setLoading(false); }
  }, [patientId]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" aria-hidden /> Patient Clinical Summary</CardTitle>
          <CardDescription>Enter a patient&apos;s database ID to fetch their real clinical health record summary from the backend.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Patient MongoDB _id"
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetch_()}
              className="max-w-sm font-mono text-sm"
            />
            <Button onClick={fetch_} disabled={!patientId.trim() || loading}>
              <Search className="h-4 w-4" aria-hidden /> {loading ? 'Loading…' : 'Fetch Summary'}
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        </CardContent>
      </Card>

      {summary && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {summary.demographics && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><User className="h-4 w-4" /> Demographics</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                {summary.demographics.name      && <p><span className="text-muted-foreground">Name:</span> <strong>{summary.demographics.name}</strong></p>}
                {summary.demographics.age       && <p><span className="text-muted-foreground">Age:</span> {summary.demographics.age} yrs</p>}
                {summary.demographics.gender    && <p><span className="text-muted-foreground">Gender:</span> {summary.demographics.gender}</p>}
                {summary.demographics.bloodGroup && <p><span className="text-muted-foreground">Blood Group:</span> {summary.demographics.bloodGroup}</p>}
              </CardContent>
            </Card>
          )}
          {summary.chronicDiseases && summary.chronicDiseases.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Heart className="h-4 w-4" /> Chronic Conditions</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {summary.chronicDiseases.map((d, i) => <Badge key={i} tone="warning" className="mr-1 mb-1">{d}</Badge>)}
              </CardContent>
            </Card>
          )}
          {summary.allergies && summary.allergies.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Activity className="h-4 w-4" /> Allergies</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {summary.allergies.map((a, i) => <Badge key={i} tone="danger" className="mr-1 mb-1">{a}</Badge>)}
              </CardContent>
            </Card>
          )}
          {summary.medications && summary.medications.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Pill className="h-4 w-4" /> Current Medications</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {summary.medications.map((m, i) => (
                  <div key={i} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <p className="font-medium">{m.name}</p>
                    {(m.dosage || m.frequency) && <p className="text-xs text-muted-foreground">{m.dosage}{m.frequency ? ` · ${m.frequency}` : ''}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {summary.documentCounts && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4" /> Record Counts</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {Object.entries(summary.documentCounts).map(([key, count]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="capitalize text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <Badge tone="info">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {summary.surgeries && summary.surgeries.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4" /> Surgical History</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                {summary.surgeries.map((s, i) => <p key={i} className="text-muted-foreground">• {s}</p>)}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

const PAYMENT_ICONS = [Landmark, Smartphone, Banknote];
const PAYMENT_TONES = ['info', 'success', 'warning'] as const;

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'financial' | 'occupancy' | 'clinical' | 'opd-ipd' | 'patient'>('financial');
  const [range, setRange] = useState<RangeKey>('month');

  const { data: reportRes, isLoading } = useQuery({
    queryKey: ['executive-report', range],
    queryFn: () =>
      fetch(`${API}/api/reports/executive?range=${range}`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const report: ReportData | null = reportRes?.data ?? null;
  const kpis = report?.kpis;

  const grossRevenue     = kpis?.grossRevenue ?? 0;
  const opdRevenue       = kpis?.opdRevenue ?? 0;
  const ipdRevenue       = kpis?.ipdRevenue ?? 0;
  const pharmacyRevenue  = kpis?.pharmacyRevenue ?? 0;
  const occupancyPct     = kpis?.bedOccupancyPct ?? 0;
  const occupiedBeds     = kpis?.occupiedBeds ?? 0;
  const totalBeds        = kpis?.totalBeds ?? 0;
  const footfall         = kpis?.patientFootfall ?? 0;
  const avgLos           = kpis?.avgLosDays;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Analytics & Reports"
        description="Operational, financial, bed utilization & clinical analytics — live from the database."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Reports' }]}
        actions={
          <Button variant="outline" disabled title="Export requires Data Lakehouse integration">
            <Download className="h-4 w-4" aria-hidden /> Export Report
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
          <Select
            aria-label="Date range"
            value={range}
            onChange={(e) => setRange(e.target.value as RangeKey)}
            className="w-auto min-w-40"
          >
            {RANGE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
        {report && (
          <span className="text-xs text-muted-foreground">
            Generated {new Date(report.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Executive KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <StatGrid>
          <StatCard
            label="Gross Revenue"
            value={grossRevenue > 0 ? inrFmt(grossRevenue) : '—'}
            sub={grossRevenue > 0 ? `OPD: ${inrFmt(opdRevenue)} · IPD: ${inrFmt(ipdRevenue)} · Pharmacy: ${inrFmt(pharmacyRevenue)}` : 'No invoices in period'}
            icon={IndianRupee}
            tone="emerald"
            delay={0}
          />
          <StatCard
            label="Bed Occupancy Rate"
            value={totalBeds > 0 ? `${occupancyPct}%` : '—'}
            sub={totalBeds > 0 ? `${occupiedBeds} of ${totalBeds} Beds Occupied` : 'No bed records'}
            icon={Bed}
            tone="brand"
            delay={0.05}
          />
          <StatCard
            label="Patient Footfall"
            value={footfall > 0 ? footfall.toLocaleString('en-IN') : '—'}
            sub={footfall > 0 ? 'Appointments in period' : 'No appointments in period'}
            icon={Users}
            tone="violet"
            delay={0.1}
          />
          <StatCard
            label="Avg Length of Stay"
            value={avgLos !== null ? `${avgLos} Days` : '—'}
            sub={avgLos !== null ? 'Current occupied beds average' : 'No occupied beds with admit date'}
            icon={Activity}
            tone="amber"
            delay={0.15}
          />
        </StatGrid>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="max-w-full overflow-x-auto no-scrollbar">
          <TabsTrigger value="financial"><CreditCard className="h-4 w-4" aria-hidden /> Financial & Revenue</TabsTrigger>
          <TabsTrigger value="occupancy"><Bed className="h-4 w-4" aria-hidden /> Bed Occupancy & ADT</TabsTrigger>
          <TabsTrigger value="clinical"><FlaskConical className="h-4 w-4" aria-hidden /> Clinical, Lab & Pharmacy</TabsTrigger>
          <TabsTrigger value="opd-ipd"><Building2 className="h-4 w-4" aria-hidden /> OPD vs IPD & Demographics</TabsTrigger>
          <TabsTrigger value="patient"><User className="h-4 w-4" aria-hidden /> Patient Clinical Report</TabsTrigger>
        </TabsList>

        {/* TAB 1: FINANCIAL */}
        <TabsContent value="financial">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>Departmental Revenue Breakdown</CardTitle>
                  <CardDescription className="mt-1.5">Revenue by invoice type for selected period</CardDescription>
                </div>
                {grossRevenue > 0 && <Badge tone="brand">Total: {inrFmt(grossRevenue)}</Badge>}
              </CardHeader>
              <CardContent>
                {!report || report.deptRevenue.length === 0 ? (
                  <EmptyState icon={CreditCard} title="No revenue data" description="No paid invoices found for the selected period." />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={report.deptRevenue} layout="vertical" margin={{ left: 8, right: 24 }}>
                      <CartesianGrid {...chartGrid} horizontal={false} vertical />
                      <XAxis {...chartAxis} type="number" unit="%" domain={[0, 100]} />
                      <YAxis {...chartAxis} type="category" dataKey="dept" width={200} />
                      <Tooltip
                        {...chartTooltip}
                        formatter={(value, _name, entry: { payload?: { total?: number } }) => [
                          `${inrFmt(entry?.payload?.total ?? 0)} (${value}%)`,
                          'Revenue',
                        ]}
                      />
                      <Bar dataKey="pct" radius={[0, 8, 8, 0]} barSize={18}>
                        {report.deptRevenue.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Collection Modes</CardTitle>
                <CardDescription>How revenue was collected</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!report || report.paymentModes.every(m => m.total === 0) ? (
                  <EmptyState icon={CreditCard} title="No payment data" description="No paid invoices in this period." />
                ) : (
                  report.paymentModes.filter(m => m.total > 0).map((mode, i) => {
                    const Icon = PAYMENT_ICONS[i % PAYMENT_ICONS.length];
                    const tone = PAYMENT_TONES[i % PAYMENT_TONES.length];
                    const pct = grossRevenue > 0 ? Math.round((mode.total / grossRevenue) * 100) : 0;
                    return (
                      <div key={mode.label} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-muted-foreground">{mode.label}</p>
                            <p className="text-sm font-bold text-foreground tabular-nums">{inrFmt(mode.total)} ({pct}%)</p>
                          </div>
                        </div>
                        <Badge tone={tone}>{mode.badge}</Badge>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: BED OCCUPANCY */}
        <TabsContent value="occupancy">
          <Card>
            <CardHeader>
              <CardTitle>Ward & ICU Bed Occupancy</CardTitle>
              <CardDescription>Current utilisation across all wards</CardDescription>
            </CardHeader>
            <CardContent>
              {!report || report.wardOccupancy.length === 0 ? (
                <EmptyState icon={Bed} title="No bed records" description="No BedRecord data found in the database." />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {report.wardOccupancy.map((ward, i) => {
                    const tone = ward.pct >= 90 ? 'danger' : ward.pct >= 80 ? 'warning' : ward.pct >= 60 ? 'brand' : 'success';
                    return (
                      <div
                        key={ward.ward}
                        className="animate-fade-up rounded-2xl border border-border bg-muted/30 p-4"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{ward.ward}</p>
                        <p className="mt-1.5 text-xl font-bold text-foreground tabular-nums">
                          {ward.occupied} / {ward.total} Beds ({ward.pct}%)
                        </p>
                        <Progress value={ward.pct} tone={tone} size="sm" className="mt-3" />
                        <p className="mt-2 text-xs text-subtle-foreground">{ward.total - ward.occupied} Bed{ward.total - ward.occupied !== 1 ? 's' : ''} Available</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: CLINICAL & PHARMACY */}
        <TabsContent value="clinical">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                  <FlaskConical className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <CardTitle>Lab Order Volume</CardTitle>
                  <CardDescription className="mt-1">Most-ordered investigation panels this period</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {!report || report.labVolume.length === 0 ? (
                  <EmptyState icon={FlaskConical} title="No lab orders" description="No lab orders placed in this period." />
                ) : (
                  report.labVolume.map((row) => (
                    <div key={row.name} className="flex items-center justify-between rounded-xl bg-muted/40 px-3.5 py-2.5 text-sm">
                      <span className="text-muted-foreground">{row.name}</span>
                      <span className="font-semibold text-foreground tabular-nums">{row.count.toLocaleString('en-IN')} Orders</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <Pill className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <CardTitle>Top Dispensed Medications</CardTitle>
                  <CardDescription className="mt-1">Most-issued formulations this period</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {!report || report.pharmacyVolume.length === 0 ? (
                  <EmptyState icon={Pill} title="No pharmacy data" description="No pharmacy orders placed in this period." />
                ) : (
                  report.pharmacyVolume.map((row) => (
                    <div key={row.name} className="flex items-center justify-between rounded-xl bg-muted/40 px-3.5 py-2.5 text-sm">
                      <span className="text-muted-foreground">{row.name}</span>
                      <span className="font-semibold text-foreground tabular-nums">{row.count.toLocaleString('en-IN')} Dispensed</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 4: OPD vs IPD */}
        <TabsContent value="opd-ipd">
          <EmptyState
            icon={Building2}
            title="OPD vs IPD report in preparation"
            description="Footfall and demographic comparisons for this period are being compiled."
          />
        </TabsContent>

        {/* TAB 5: PATIENT CLINICAL REPORT */}
        <TabsContent value="patient" className="mt-6">
          <PatientReportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
