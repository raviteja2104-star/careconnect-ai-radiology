'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ShieldCheck, FileText, Download, Phone, CheckCircle2, Clock,
  Stethoscope, Pill, FlaskConical, HeartPulse, Wallet, CalendarClock,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription,
  CardContent, Button, Badge, Progress, DataTable, type Column,
} from '@/components/ui';

interface Claim {
  id: string;
  date: string;
  service: string;
  billed: number;
  covered: number;
  status: 'APPROVED' | 'PROCESSING';
}

const claims: Claim[] = [
  { id: 'CLM-2026-1204', date: '29 Jul 2026', service: 'Pharmacy (Prescription Refill)', billed: 45.5, covered: 36.4, status: 'PROCESSING' },
  { id: 'CLM-2026-1150', date: '14 Jun 2026', service: 'Laboratory (Lipid Panel)', billed: 85.0, covered: 68.0, status: 'APPROVED' },
  { id: 'CLM-2026-1042', date: '10 Apr 2026', service: 'Orthopedics (X-Ray)', billed: 220.0, covered: 176.0, status: 'APPROVED' },
  { id: 'CLM-2026-0988', date: '02 Mar 2026', service: 'Cardiology (ECG Screening)', billed: 130.0, covered: 104.0, status: 'APPROVED' },
];

const coverage = [
  { label: 'Outpatient Consultations', icon: Stethoscope, pct: 80, note: '80% after deductible' },
  { label: 'Prescription Drugs', icon: Pill, pct: 80, note: '80% generic & branded' },
  { label: 'Diagnostics & Laboratory', icon: FlaskConical, pct: 80, note: '80% in-network labs' },
  { label: 'Emergency & Hospitalization', icon: HeartPulse, pct: 100, note: '100% in-network ER' },
];

export default function insurancePage() {
  const router = useRouter();
  const claimColumns: Column<Claim>[] = [
    {
      key: 'id',
      header: 'Claim',
      sortable: true,
      accessor: (row) => row.id,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <FileText className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{row.id}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{row.date}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'service',
      header: 'Service',
      sortable: true,
      accessor: (row) => row.service,
      cell: (row) => <span className="font-medium text-foreground">{row.service}</span>,
    },
    {
      key: 'billed',
      header: 'Billed',
      sortable: true,
      align: 'right',
      accessor: (row) => row.billed,
      cell: (row) => <span className="tabular-nums text-muted-foreground">${row.billed.toFixed(2)}</span>,
    },
    {
      key: 'covered',
      header: 'Covered',
      sortable: true,
      align: 'right',
      accessor: (row) => row.covered,
      cell: (row) => <span className="font-semibold tabular-nums text-foreground">${row.covered.toFixed(2)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (row) => row.status,
      cell: (row) =>
        row.status === 'APPROVED' ? (
          <Badge tone="success">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Approved
          </Badge>
        ) : (
          <Badge tone="info">
            <Clock className="h-3.5 w-3.5" aria-hidden /> Processing
          </Badge>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insurance"
        description="Your active policy, coverage benefits, and claim history in one place."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Insurance' }]}
        actions={
          <>
            <Button variant="outline" disabled title="Coming soon">
              <Download className="h-4 w-4" aria-hidden /> Download Card
            </Button>
            <Button onClick={() => router.push('/support')}>
              <Phone className="h-4 w-4" aria-hidden /> Contact Insurer
            </Button>
          </>
        }
      />

      <StatGrid>
        <StatCard
          label="Plan Status"
          value="Active"
          sub="Renews 01 Jan 2027"
          icon={ShieldCheck}
          tone="emerald"
          delay={0}
        />
        <StatCard
          label="Deductible Used"
          value="$340 / $500"
          sub="68% of annual deductible"
          icon={Wallet}
          tone="brand"
          delay={0.05}
        />
        <StatCard
          label="Claims This Year"
          value={claims.length}
          sub="3 approved · 1 processing"
          icon={FileText}
          tone="violet"
          delay={0.1}
        />
        <StatCard
          label="Covered This Year"
          value="$384.40"
          sub="Across all approved claims"
          icon={CalendarClock}
          tone="amber"
          delay={0.15}
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card variant="gradient" className="overflow-hidden rounded-3xl">
              <CardContent className="relative p-6 sm:p-8">
                <ShieldCheck
                  className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 opacity-10"
                  aria-hidden
                />
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
                      Aetna Standard Coverage
                    </p>
                    <p className="mt-1 text-2xl font-bold tracking-tight">Health Guard Plus</p>
                  </div>
                  <Badge tone="outline" className="border-white/40 bg-white/10 text-white">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden /> Active
                  </Badge>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider opacity-70">Member</p>
                    <p className="mt-0.5 text-sm font-semibold">Rajendra Kumar</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider opacity-70">Policy No.</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums">AET-9284-5521-01</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider opacity-70">Group</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums">GRP-40122</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider opacity-70">Valid Thru</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums">12 / 2026</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Claim History</CardTitle>
                <CardDescription>Claims filed against this policy in 2026.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <DataTable<Claim>
                  columns={claimColumns}
                  data={claims}
                  rowKey={(row) => row.id}
                  searchPlaceholder="Search claims…"
                  exportName="insurance-claims"
                  emptyTitle="No claims yet"
                  emptyDescription="Claims you file will appear here."
                  className="rounded-none border-0 shadow-none"
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-6 xl:col-span-1"
        >
          <Card>
            <CardHeader>
              <CardTitle>Coverage Benefits</CardTitle>
              <CardDescription>What your plan pays for in-network care.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {coverage.map((c) => (
                <div key={c.label} className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <c.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{c.label}</p>
                      <span className="text-xs font-bold tabular-nums text-foreground">{c.pct}%</span>
                    </div>
                    <Progress value={c.pct} className="mt-1.5" />
                    <p className="mt-1 text-xs text-muted-foreground">{c.note}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Annual Deductible</CardTitle>
              <CardDescription>Resets on 01 Jan 2027.</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={68} tone="brand" label="$340 of $500 used" showValue />
              <p className="mt-3 text-xs text-muted-foreground">
                After your deductible is met, the plan covers eligible services at the rates listed above.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
