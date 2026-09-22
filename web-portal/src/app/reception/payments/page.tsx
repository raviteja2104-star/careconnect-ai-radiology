'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { IndianRupee, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardContent,
  Badge, DataTable, SkeletonTable, type Column, EmptyState,
} from '@/components/ui';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type InvoiceRow = {
  _id: string;
  invoiceNumber?: string;
  patientId?: { firstName?: string; lastName?: string } | null;
  patientName?: string;
  amountDue?: number;
  amountPaid?: number;
  status?: string;
  type?: string;
  issuedAt?: string;
};

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  PAID: 'success',
  PARTIALLY_PAID: 'warning',
  PENDING: 'warning',
  OVERDUE: 'danger',
  CANCELLED: 'neutral',
};

export default function PaymentsPage() {
  const { data: invoicesRes, isLoading } = useQuery({
    queryKey: ['reception_invoices'],
    queryFn: () =>
      fetch(`${API}/api/billing/invoices?limit=50`, { headers: authHeaders() }).then(r => r.json()),
    refetchInterval: 60_000,
  });

  const { data: statsRes } = useQuery({
    queryKey: ['reception_billing_stats'],
    queryFn: () =>
      fetch(`${API}/api/billing/stats`, { headers: authHeaders() }).then(r => r.json()),
    refetchInterval: 60_000,
  });

  const invoices: InvoiceRow[] = invoicesRes?.data ?? invoicesRes?.invoices ?? [];
  const stats = statsRes?.data ?? {};

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v ?? 0);

  const columns: Column<InvoiceRow>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      sortable: true,
      accessor: (inv) => inv.invoiceNumber ?? inv._id,
      cell: (inv) => (
        <span className="font-mono text-sm font-bold text-foreground">{inv.invoiceNumber ?? inv._id.slice(-8).toUpperCase()}</span>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      sortable: true,
      accessor: (inv) => {
        const p = inv.patientId;
        return [p?.firstName, p?.lastName].filter(Boolean).join(' ') || inv.patientName || '';
      },
      cell: (inv) => {
        const p = inv.patientId;
        const name = [p?.firstName, p?.lastName].filter(Boolean).join(' ') || inv.patientName || 'Unknown';
        return <p className="font-semibold text-foreground">{name}</p>;
      },
    },
    {
      key: 'type',
      header: 'Type',
      accessor: (inv) => inv.type ?? '',
      cell: (inv) => <span className="text-sm text-muted-foreground">{inv.type ?? 'OPD'}</span>,
    },
    {
      key: 'amountDue',
      header: 'Amount Due',
      sortable: true,
      accessor: (inv) => inv.amountDue ?? 0,
      cell: (inv) => (
        <span className="font-semibold tabular-nums text-foreground">{formatCurrency(inv.amountDue ?? 0)}</span>
      ),
    },
    {
      key: 'amountPaid',
      header: 'Paid',
      accessor: (inv) => inv.amountPaid ?? 0,
      cell: (inv) => (
        <span className="tabular-nums text-success font-medium">{formatCurrency(inv.amountPaid ?? 0)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (inv) => inv.status ?? '',
      cell: (inv) => (
        <Badge tone={STATUS_TONE[inv.status ?? ''] ?? 'neutral'} dot>
          {inv.status ?? 'PENDING'}
        </Badge>
      ),
    },
    {
      key: 'issuedAt',
      header: 'Date',
      sortable: true,
      accessor: (inv) => inv.issuedAt ?? '',
      cell: (inv) => (
        <span className="text-sm text-muted-foreground">
          {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString('en-IN') : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Payments & Cash"
        description="Today's billing summary and outstanding invoices."
        crumbs={[{ label: 'Reception', href: '/reception/dashboard' }, { label: 'Payments' }]}
      />

      <StatGrid>
        <StatCard
          label="Revenue Today"
          value={formatCurrency(stats.todayRevenue ?? 0)}
          sub="All payment modes"
          icon={IndianRupee}
          tone="emerald"
          delay={0}
        />
        <StatCard
          label="Pending Collection"
          value={formatCurrency(stats.pendingAmount ?? 0)}
          sub="Outstanding invoices"
          icon={Clock}
          tone="amber"
          delay={0.05}
        />
        <StatCard
          label="Paid Today"
          value={stats.paidCount ?? 0}
          sub="Invoices settled"
          icon={CheckCircle2}
          tone="teal"
          delay={0.1}
        />
        <StatCard
          label="Overdue"
          value={stats.overdueCount ?? 0}
          sub="Need follow-up"
          icon={AlertTriangle}
          tone="rose"
          delay={0.15}
        />
      </StatGrid>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Register</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable rows={8} />
          ) : invoices.length === 0 ? (
            <EmptyState icon={IndianRupee} title="No invoices found" description="Invoices will appear here once they are created." />
          ) : (
            <DataTable<InvoiceRow>
              columns={columns}
              data={invoices}
              rowKey={(inv) => inv._id}
              searchPlaceholder="Search by invoice, patient…"
              exportName="payments-register"
              emptyTitle="No results"
              emptyDescription="Adjust your search."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
