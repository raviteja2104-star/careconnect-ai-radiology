'use client';

import React, { useState } from 'react';
import {
  IndianRupee, Users, Activity, Bed, Download, Calendar, Filter,
  CreditCard, FlaskConical, Pill, Building2, Landmark, Banknote, Smartphone,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription,
  CardContent, Tabs, TabsList, TabsTrigger, TabsContent, Button, Select, Badge,
  Progress, EmptyState,
} from '@/components/ui';
import { CHART_COLORS, chartGrid, chartAxis, chartTooltip } from '@/lib/chart-theme';

const DEPT_REVENUE = [
  { dept: 'Cardiology & Catheterization', rev: '₹ 44,50,000', pct: 30 },
  { dept: 'Orthopedics & Joint Replacement', rev: '₹ 32,80,000', pct: 22 },
  { dept: 'ICU & Emergency Care', rev: '₹ 26,40,000', pct: 18 },
  { dept: 'Pharmacy & Drug Sales', rev: '₹ 18,20,000', pct: 12 },
  { dept: 'Laboratory & Radiology Services', rev: '₹ 14,80,000', pct: 10 },
  { dept: 'General Surgery & Day Care', rev: '₹ 11,80,000', pct: 8 },
];

const PAYMENT_MODES = [
  { label: 'TPA / Health Insurance', amount: '₹ 82,40,000 (55.5%)', badge: '540 Claims', tone: 'info' as const, icon: Landmark },
  { label: 'UPI / Card / NetBanking', amount: '₹ 48,10,000 (32.4%)', badge: 'Digital', tone: 'success' as const, icon: Smartphone },
  { label: 'Cash Receipts', amount: '₹ 18,00,000 (12.1%)', badge: 'Desk Counter', tone: 'warning' as const, icon: Banknote },
];

const WARD_OCCUPANCY = [
  { ward: 'Intensive Care Unit (ICU)', value: 92, stat: '23 / 25 Beds (92%)', note: '2 Ventilators Available', tone: 'danger' as const },
  { ward: 'Cardiac Care Unit (CCU)', value: 93.3, stat: '14 / 15 Beds (93.3%)', note: '1 Bed Available', tone: 'warning' as const },
  { ward: 'Private & Deluxe Rooms', value: 88.5, stat: '62 / 70 Beds (88.5%)', note: '8 Beds Available', tone: 'brand' as const },
  { ward: 'General Ward', value: 83.5, stat: '117 / 140 Beds (83.5%)', note: '23 Beds Available', tone: 'success' as const },
];

const LAB_VOLUME = [
  { name: 'Complete Blood Count (CBC)', value: '1,420 Tests' },
  { name: 'HbA1c & Fasting Blood Glucose', value: '980 Tests' },
  { name: 'Lipid Profile & Renal Function Test', value: '740 Tests' },
];

const PHARMACY_VOLUME = [
  { name: 'Telmisartan 40mg (Antihypertensive)', value: '4,200 Tablets' },
  { name: 'Metformin 500mg SR (Antidiabetic)', value: '3,850 Tablets' },
  { name: 'Amoxicillin + Clavulanic Acid 625mg', value: '1,940 Strips' },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'financial' | 'occupancy' | 'clinical' | 'opd-ipd'>('financial');
  const [dateRange, setDateRange] = useState('This Month (Jul 2026)');
  const [selectedDept, setSelectedDept] = useState('All Departments');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Analytics & Reports"
        description="Real-time operational, financial, bed utilization, & medico-legal compliance analytics."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Reports' }]}
        actions={
          <Button onClick={() => alert(`Exporting CareConnect Executive Report (${dateRange}) as PDF & CSV...`)}>
            <Download className="h-4 w-4" aria-hidden /> Export Report (PDF/CSV)
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
          <Select
            aria-label="Date range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-auto min-w-48"
          >
            <option>Today (25 Jul 2026)</option>
            <option>This Week</option>
            <option>This Month (Jul 2026)</option>
            <option>Q3 2026</option>
            <option>Financial Year 2026-27</option>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" aria-hidden />
          <Select
            aria-label="Department"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-auto min-w-44"
          >
            <option>All Departments</option>
            <option>Cardiology</option>
            <option>Pediatrics</option>
            <option>Orthopedics</option>
            <option>Neurology</option>
            <option>General Surgery</option>
            <option>ICU & Emergency</option>
          </Select>
        </div>
      </div>

      {/* Executive KPIs */}
      <StatGrid>
        <StatCard
          label="Gross Revenue (Jul 2026)"
          value="₹ 1,48,50,000"
          sub="+14.2% · OPD: ₹42.5L | IPD: ₹88.0L | Pharmacy: ₹18.0L"
          icon={IndianRupee}
          trend="up"
          trendPositive
          tone="emerald"
          delay={0}
        />
        <StatCard
          label="Bed Occupancy Rate"
          value="86.4%"
          sub="+5.1% · 216 of 250 Beds Occupied (ICU: 92%)"
          icon={Bed}
          trend="up"
          trendPositive
          tone="brand"
          delay={0.05}
        />
        <StatCard
          label="Total Patient Footfall"
          value="3,842 Patients"
          sub="+8.7% · OPD: 3,120 | IPD Admissions: 722"
          icon={Users}
          trend="up"
          trendPositive
          tone="violet"
          delay={0.1}
        />
        <StatCard
          label="Avg Length of Stay (ALOS)"
          value="3.8 Days"
          sub="-0.4 Days · Readmission Rate: 2.1% (Low)"
          icon={Activity}
          trend="down"
          trendPositive
          tone="amber"
          delay={0.15}
        />
      </StatGrid>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="max-w-full overflow-x-auto no-scrollbar">
          <TabsTrigger value="financial">
            <CreditCard className="h-4 w-4" aria-hidden /> Financial & Revenue
          </TabsTrigger>
          <TabsTrigger value="occupancy">
            <Bed className="h-4 w-4" aria-hidden /> Bed Occupancy & ADT
          </TabsTrigger>
          <TabsTrigger value="clinical">
            <FlaskConical className="h-4 w-4" aria-hidden /> Clinical, Lab & Pharmacy
          </TabsTrigger>
          <TabsTrigger value="opd-ipd">
            <Building2 className="h-4 w-4" aria-hidden /> OPD vs IPD & Demographics
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: FINANCIAL & REVENUE ANALYTICS */}
        <TabsContent value="financial">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>Departmental Revenue Breakdown</CardTitle>
                  <CardDescription className="mt-1.5">Jul 2026 · share of gross revenue by service line</CardDescription>
                </div>
                <Badge tone="brand">Total: ₹ 1.48 Cr</Badge>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={DEPT_REVENUE} layout="vertical" margin={{ left: 8, right: 24 }}>
                    <CartesianGrid {...chartGrid} horizontal={false} vertical />
                    <XAxis {...chartAxis} type="number" unit="%" domain={[0, 35]} />
                    <YAxis {...chartAxis} type="category" dataKey="dept" width={220} />
                    <Tooltip
                      {...chartTooltip}
                      formatter={(value: any, _name: any, entry: any) => [
                        `${entry?.payload?.rev} (${value}%)`,
                        'Revenue',
                      ]}
                    />
                    <Bar dataKey="pct" radius={[0, 8, 8, 0]} barSize={18}>
                      {DEPT_REVENUE.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Collection Modes</CardTitle>
                <CardDescription>How this month&apos;s revenue was collected</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {PAYMENT_MODES.map((mode) => (
                  <div
                    key={mode.label}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/40 p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <mode.icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-muted-foreground">{mode.label}</p>
                        <p className="text-sm font-bold text-foreground tabular-nums">{mode.amount}</p>
                      </div>
                    </div>
                    <Badge tone={mode.tone}>{mode.badge}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: BED OCCUPANCY */}
        <TabsContent value="occupancy">
          <Card>
            <CardHeader>
              <CardTitle>Ward & ICU Bed Occupancy Breakdown</CardTitle>
              <CardDescription>Live utilization across critical and general wards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {WARD_OCCUPANCY.map((ward, i) => (
                  <div
                    key={ward.ward}
                    className="animate-fade-up rounded-2xl border border-border bg-muted/30 p-4"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{ward.ward}</p>
                    <p className="mt-1.5 text-xl font-bold text-foreground tabular-nums">{ward.stat}</p>
                    <Progress value={ward.value} tone={ward.tone} size="sm" className="mt-3" />
                    <p className="mt-2 text-xs text-subtle-foreground">{ward.note}</p>
                  </div>
                ))}
              </div>
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
                  <CardTitle>Laboratory & Diagnostic Test Volume</CardTitle>
                  <CardDescription className="mt-1">Highest-volume investigations this period</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {LAB_VOLUME.map((row) => (
                  <div key={row.name} className="flex items-center justify-between rounded-xl bg-muted/40 px-3.5 py-2.5 text-sm">
                    <span className="text-muted-foreground">{row.name}</span>
                    <span className="font-semibold text-foreground tabular-nums">{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <Pill className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <CardTitle>Pharmacy Top Dispensed Medications</CardTitle>
                  <CardDescription className="mt-1">Most-issued formulations this period</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {PHARMACY_VOLUME.map((row) => (
                  <div key={row.name} className="flex items-center justify-between rounded-xl bg-muted/40 px-3.5 py-2.5 text-sm">
                    <span className="text-muted-foreground">{row.name}</span>
                    <span className="font-semibold text-foreground tabular-nums">{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 4: OPD vs IPD */}
        <TabsContent value="opd-ipd">
          <EmptyState
            icon={Building2}
            title="OPD vs IPD report in preparation"
            description="Footfall and demographic comparisons for this period are still being compiled. Check back shortly or export the executive report meanwhile."
            action={{
              label: 'Export Report (PDF/CSV)',
              onClick: () => alert(`Exporting CareConnect Executive Report (${dateRange}) as PDF & CSV...`),
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
