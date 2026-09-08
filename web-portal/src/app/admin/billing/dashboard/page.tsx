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
  Dialog, Input, Label,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts';
import { CHART_COLORS, chartGrid, chartAxis, chartTooltip } from '@/lib/chart-theme';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage.getItem('token'); } catch { return null; }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

const STATUS_TONE: Record<string, 'success' | 'info' | 'warning'> = {
  PAID: 'success',
  PARTIALLY_PAID: 'info',
};

type Invoice = {
  _id: string;
  invoiceNumber: string;
  totalAmount: number;
  amountDue: number;
  patient?: { name?: string; _id?: string };
  issuedAt: string;
  type: string;
  status: string;
};

type InvoiceModalState = {
  open: boolean;
  prefillPatientId: string;
  prefillPatientName: string;
  prefillAmount: string;
};

const MODAL_CLOSED: InvoiceModalState = {
  open: false,
  prefillPatientId: '',
  prefillPatientName: '',
  prefillAmount: '',
};

export default function RevenueDashboard() {
  const { toast } = useToast();
  const [liveInvoices, setLiveInvoices] = useState<Invoice[]>([]);
  const [modal, setModal] = useState<InvoiceModalState>(MODAL_CLOSED);
  const [formPatientId, setFormPatientId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: dashboardRes, refetch: refetchDash, isLoading: dashLoading } = useQuery({
    queryKey: ['billing_dashboard'],
    queryFn: () =>
      fetch(`${API_BASE}/api/billing/dashboard`, { headers: authHeaders() }).then((res) => res.json()),
  });

  const { data: invoicesRes, refetch: refetchInvoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['billing_invoices'],
    queryFn: () =>
      fetch(`${API_BASE}/api/billing/invoices`, { headers: authHeaders() }).then((res) => res.json()),
  });

  useEffect(() => {
    if (invoicesRes?.data) {
      setLiveInvoices(invoicesRes.data.slice(0, 10));
    }
  }, [invoicesRes]);

  useEffect(() => {
    const socket = io(API_BASE);
    socket.on('INVOICE_CREATED', (data) => {
      refetchDash();
      setLiveInvoices((prev) => [data.invoice, ...prev].slice(0, 10));
    });
    socket.on('PAYMENT_COMPLETED', () => {
      refetchDash();
      refetchInvoices();
    });
    return () => { socket.disconnect(); };
  }, [refetchDash, refetchInvoices]);

  const stats = dashboardRes?.data || { totalRevenue: 0, pendingDues: 0, collections: 0, totalInvoices: 0 };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const chartData = useMemo(
    () =>
      [...liveInvoices]
        .reverse()
        .map((inv) => ({
          name: inv.invoiceNumber,
          billed: inv.totalAmount ?? 0,
          due: inv.amountDue ?? 0,
        })),
    [liveInvoices]
  );

  const collectionRate = stats.totalRevenue > 0
    ? Math.round((stats.collections / stats.totalRevenue) * 100)
    : 0;

  /* ---- Invoice modal handlers ---- */

  const openCollectModal = (inv: Invoice) => {
    setFormPatientId(inv.patient?._id ?? '');
    setFormAmount(String(inv.amountDue ?? inv.totalAmount ?? ''));
    setModal({
      open: true,
      prefillPatientId: inv.patient?._id ?? '',
      prefillPatientName: inv.patient?.name ?? '',
      prefillAmount: String(inv.amountDue ?? inv.totalAmount ?? ''),
    });
  };

  const openCreateModal = () => {
    setFormPatientId('');
    setFormAmount('');
    setModal({ open: true, prefillPatientId: '', prefillPatientName: '', prefillAmount: '' });
  };

  const closeModal = () => setModal(MODAL_CLOSED);

  const handleSubmitInvoice = async () => {
    if (!formPatientId.trim() || !formAmount.trim()) {
      toast('warning', 'Patient ID and amount are required.');
      return;
    }
    const totalAmount = parseFloat(formAmount);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      toast('warning', 'Enter a valid amount.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/invoices`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ patientId: formPatientId.trim(), totalAmount }),
      });
      const json = await res.json();
      if (json.success) {
        toast('success', 'Invoice created.', `Invoice ${json.data?.invoiceNumber ?? ''} has been raised.`);
        refetchDash();
        refetchInvoices();
        closeModal();
      } else {
        toast('error', 'Failed to create invoice.', json.message ?? json.error ?? 'Unknown error.');
      }
    } catch {
      toast('error', 'Network error', 'Could not reach the billing service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Invoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice',
      sortable: true,
      accessor: (inv) => inv.invoiceNumber ?? '',
      cell: (inv) => (
        <span className="font-mono text-sm font-semibold text-primary">{inv.invoiceNumber}</span>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      accessor: (inv) => inv.patient?.name ?? '',
      cell: (inv) => (
        <div>
          <p className="font-medium text-foreground">{inv.patient?.name || 'Unknown Patient'}</p>
          <p className="text-xs text-muted-foreground">{new Date(inv.issuedAt).toLocaleTimeString()}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      accessor: (inv) => inv.type ?? '',
      cell: (inv) => <Badge tone="neutral">{inv.type}</Badge>,
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      sortable: true,
      accessor: (inv) => inv.totalAmount ?? 0,
      cell: (inv) => (
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
      accessor: (inv) => inv.status ?? '',
      cell: (inv) => (
        <Badge tone={STATUS_TONE[inv.status] ?? 'warning'} dot>
          {inv.status}
        </Badge>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      cell: (inv) =>
        inv.status !== 'PAID' ? (
          <Button size="sm" onClick={() => openCollectModal(inv)}>Collect Payment</Button>
        ) : (
          <Button size="sm" variant="ghost" disabled>
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
          <Button onClick={openCreateModal}>
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
                <DataTable<Invoice>
                  columns={columns}
                  data={liveInvoices}
                  rowKey={(inv) => inv._id}
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
                        formatter={(value: unknown, key: unknown) => [
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

      {/* ---- Collect Payment / Create Invoice modal ---- */}
      <Dialog
        open={modal.open}
        onClose={closeModal}
        title={modal.prefillPatientId ? 'Collect Payment' : 'Create Manual Invoice'}
        description="Enter the patient ID and amount to raise an invoice."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmitInvoice} loading={isSubmitting}>
              {modal.prefillPatientId ? 'Collect Payment' : 'Create Invoice'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="inv-patient-id">Patient ID</Label>
            <Input
              id="inv-patient-id"
              value={formPatientId}
              onChange={(e) => setFormPatientId(e.target.value)}
              placeholder="MongoDB ObjectId or demo-patient-1"
              autoFocus={!modal.prefillPatientId}
            />
            {modal.prefillPatientName && (
              <p className="mt-1 text-xs text-muted-foreground">Patient: {modal.prefillPatientName}</p>
            )}
          </div>
          <div>
            <Label htmlFor="inv-amount">Amount (INR)</Label>
            <Input
              id="inv-amount"
              type="number"
              min={1}
              step={0.01}
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              placeholder="e.g. 2500"
              autoFocus={!!modal.prefillPatientId}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
