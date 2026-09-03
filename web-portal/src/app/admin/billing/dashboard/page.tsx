'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';
import {
  IndianRupee, TrendingUp, AlertTriangle,
  FileText, Briefcase, Plus, ChevronRight, Activity,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription,
  CardContent, Button, Badge, DataTable, type Column, EmptyState, Skeleton,
} from '@/components/ui';
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts';
import { CHART_COLORS, chartGrid, chartAxis, chartTooltip } from '@/lib/chart-theme';

const STATUS_TONE: Record<string, 'success' | 'info' | 'warning'> = {
  PAID: 'success',
  PARTIALLY_PAID: 'info',
};

export default function RevenueDashboard() {
  const [liveInvoices, setLiveInvoices] = useState<any[]>([]);

  const { data: dashboardRes, refetch: refetchDash, isLoading: dashLoading } = useQuery({
    queryKey: ['billing_dashboard'],
    queryFn: () => fetch('http://localhost:5000/api/billing/dashboard').then(res => res.json())
  });

  const { data: invoicesRes, refetch: refetchInvoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['billing_invoices'],
    queryFn: () => fetch('http://localhost:5000/api/billing/invoices').then(res => res.json())
  });

  useEffect(() => {
    if (invoicesRes?.data) {
      setLiveInvoices(invoicesRes.data.slice(0, 10)); // Just show recent 10 on dash
    }
  }, [invoicesRes]);

  // Hook into Event Bus for live financial events
  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('INVOICE_CREATED', (data) => {
      refetchDash();
      setLiveInvoices(prev => [data.invoice, ...prev].slice(0, 10));
    });

    socket.on('PAYMENT_COMPLETED', (data) => {
      refetchDash();
      refetchInvoices();
    });

    return () => { socket.disconnect(); };
  }, []);

  const stats = dashboardRes?.data || { totalRevenue: 0, pendingDues: 0, collections: 0, totalInvoices: 0 };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  // Presentational only — chart series derived from the invoices already fetched.
  const chartData = useMemo(
    () =>
      [...liveInvoices]
        .reverse()
        .map((inv: any) => ({
          name: inv.invoiceNumber,
          billed: inv.totalAmount ?? 0,
          due: inv.amountDue ?? 0,
        })),
    [liveInvoices]
  );

  const collectionRate = stats.totalRevenue > 0
    ? Math.round((stats.collections / stats.totalRevenue) * 100)
    : 0;

  const columns: Column<any>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice',
      sortable: true,
      accessor: (inv: any) => inv.invoiceNumber ?? '',
      cell: (inv: any) => (
        <span className="font-mono text-sm font-semibold text-primary">{inv.invoiceNumber}</span>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      accessor: (inv: any) => inv.patient?.name ?? '',
      cell: (inv: any) => (
        <div>
          <p className="font-medium text-foreground">{inv.patient?.name || 'Unknown Patient'}</p>
          <p className="text-xs text-muted-foreground">{new Date(inv.issuedAt).toLocaleTimeString()}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      accessor: (inv: any) => inv.type ?? '',
      cell: (inv: any) => <Badge tone="neutral">{inv.type}</Badge>,
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      sortable: true,
      accessor: (inv: any) => inv.totalAmount ?? 0,
      cell: (inv: any) => (
        <div>
          <p className="font-semibold text-foreground tabular-nums">{formatCurrency(inv.totalAmount)}</p>
          {inv.amountDue > 0 && (
            <p className="text-xs font-medium text-warning">Due: {formatCurrency(inv.amountDue)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (inv: any) => inv.status ?? '',
      cell: (inv: any) => (
        <Badge tone={STATUS_TONE[inv.status] ?? 'warning'} dot>
          {inv.status}
        </Badge>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      cell: (inv: any) =>
        inv.status !== 'PAID' ? (
          <Button size="sm" disabled title="Coming soon">Collect Payment</Button>
        ) : (
          <Button size="sm" variant="ghost" disabled title="Coming soon">
            View Receipt <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Revenue Console"
        description="Real-time financial tracking integrated directly with clinical encounters (OPD, IPD, Telemedicine)."
        crumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Billing' },
          { label: 'Revenue Console' },
        ]}
        actions={
          <Button disabled title="Coming soon">
            <Plus className="h-4 w-4" aria-hidden /> Create Manual Invoice
          </Button>
        }
      />

      {dashLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[7.5rem] rounded-2xl" />
          ))}
        </div>
      ) : (
        <StatGrid>
          <StatCard
            label="Total Billed Revenue"
            value={formatCurrency(stats.totalRevenue)}
            sub="Across all encounter types"
            icon={TrendingUp}
            tone="emerald"
            delay={0}
          />
          <StatCard
            label="Actual Collections"
            value={formatCurrency(stats.collections)}
            sub={`${collectionRate}% of billed revenue`}
            icon={IndianRupee}
            tone="brand"
            delay={0.05}
          />
          <StatCard
            label="Pending Dues"
            value={formatCurrency(stats.pendingDues)}
            sub="Awaiting collection"
            icon={AlertTriangle}
            tone="amber"
            delay={0.1}
          />
          <StatCard
            label="Invoices Generated"
            value={stats.totalInvoices}
            sub="Lifetime total"
            icon={Briefcase}
            tone="violet"
            delay={0.15}
          />
        </StatGrid>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Main: recent invoices */}
        <motion.div
          className="xl:col-span-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <FileText className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <CardTitle>Recent Invoices</CardTitle>
                  <CardDescription>Latest 10 invoices, streamed live from the event bus.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="space-y-3" aria-busy>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <DataTable<any>
                  columns={columns}
                  data={liveInvoices}
                  rowKey={(inv: any) => inv._id}
                  searchPlaceholder="Filter invoices…"
                  exportName="recent-invoices"
                  emptyTitle="No invoices generated today"
                  emptyDescription="Invoices raised from OPD, IPD and telemedicine encounters will appear here in real time."
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Context rail: billing flow chart */}
        <motion.div
          className="xl:col-span-1"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                  <Activity className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <CardTitle>Billing Flow</CardTitle>
                  <CardDescription>Billed vs outstanding across recent invoices.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <Skeleton className="h-64 w-full rounded-2xl" />
              ) : chartData.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No billing activity yet"
                  description="The billed-vs-due trend will render once invoices start flowing."
                />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="ccBilled" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_COLORS[0]} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="ccDue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_COLORS[3]} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={CHART_COLORS[3]} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...chartGrid} />
                      <XAxis {...chartAxis} dataKey="name" hide />
                      <YAxis
                        {...chartAxis}
                        width={52}
                        tickFormatter={(v: number) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                      />
                      <Tooltip
                        {...chartTooltip}
                        formatter={(value: any, key: any) => [
                          formatCurrency(Number(value)),
                          key === 'billed' ? 'Billed' : 'Due',
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="billed"
                        stroke={CHART_COLORS[0]}
                        strokeWidth={2}
                        fill="url(#ccBilled)"
                      />
                      <Area
                        type="monotone"
                        dataKey="due"
                        stroke={CHART_COLORS[3]}
                        strokeWidth={2}
                        fill="url(#ccDue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[0] }} aria-hidden />
                  Billed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[3] }} aria-hidden />
                  Outstanding
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
