'use client';
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard, Search, Download, DollarSign,
  Clock, CheckCircle2, AlertTriangle, FileText, ChevronRight,
  Receipt, ShieldCheck,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription,
  CardContent, Button, Badge, Input, DataTable, Timeline, TimelineItem,
  EmptyState, ErrorState, SkeletonCard, SkeletonTable,
  type Column,
} from '@/components/ui';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care'}/api`;

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  department?: string;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  type: 'OPD' | 'IPD' | 'PHARMACY' | 'LABORATORY' | 'EMERGENCY' | 'PACKAGE';
  items: InvoiceItem[];
  subTotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  status: 'DRAFT' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'REFUNDED';
  insuranceClaimId?: string;
  issuedAt: string;
  dueDate?: string;
}

function formatDate(d: string | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(n: number): string {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function describeInvoice(inv: Invoice): string {
  const depts = [...new Set(inv.items.map((it) => it.department).filter(Boolean))];
  if (depts.length > 0) return depts.join(', ');
  if (inv.items.length > 0) return inv.items[0].description;
  return inv.type.charAt(0) + inv.type.slice(1).toLowerCase();
}

function StatusBadge({ status, dueDate }: { status: Invoice['status']; dueDate?: string }) {
  if (status === 'PAID') return <Badge tone="success"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Paid</Badge>;
  if (status === 'UNPAID') return (
    <span className="inline-flex flex-col items-start gap-1">
      <Badge tone="danger" pulse dot>Unpaid</Badge>
      {dueDate && <span className="text-[11px] font-medium text-danger">Due: {formatDate(dueDate)}</span>}
    </span>
  );
  if (status === 'PARTIALLY_PAID') return <Badge tone="warning"><Clock className="h-3.5 w-3.5" aria-hidden /> Partial</Badge>;
  if (status === 'CANCELLED') return <Badge tone="neutral">Cancelled</Badge>;
  if (status === 'REFUNDED') return <Badge tone="info">Refunded</Badge>;
  return <Badge tone="info"><Clock className="h-3.5 w-3.5" aria-hidden /> Draft</Badge>;
}

export default function BillingPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data: invoices = [], isLoading, isError, refetch } = useQuery<Invoice[]>({
    queryKey: ['billing-invoices'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_BASE}/billing/invoices`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Failed to load invoices (${res.status})`);
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    },
    staleTime: 60_000,
  });

  const outstanding = useMemo(
    () => invoices.filter((i) => i.status === 'UNPAID' || i.status === 'PARTIALLY_PAID'),
    [invoices],
  );
  const totalOutstanding = useMemo(
    () => outstanding.reduce((sum, i) => sum + i.amountDue, 0),
    [outstanding],
  );
  const paidInvoices = useMemo(() => invoices.filter((i) => i.status === 'PAID'), [invoices]);
  const lastPaid = paidInvoices[0] ?? null;
  const insuranceClaims = useMemo(() => invoices.filter((i) => !!i.insuranceClaimId), [invoices]);

  const filtered = useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.toLowerCase();
    return invoices.filter(
      (i) =>
        i.invoiceNumber.toLowerCase().includes(q) ||
        describeInvoice(i).toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q),
    );
  }, [invoices, search]);

  const timelineEntries = useMemo(
    () =>
      [...invoices]
        .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
        .slice(0, 5),
    [invoices],
  );

  const columns: Column<Invoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice',
      sortable: true,
      accessor: (row) => row.invoiceNumber,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <FileText className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{row.invoiceNumber}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(row.issuedAt)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Service / Department',
      sortable: true,
      accessor: (row) => describeInvoice(row),
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{describeInvoice(row)}</p>
          {row.insuranceClaimId ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-info">
              <ShieldCheck className="h-3 w-3" aria-hidden /> Insurance Applied
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-subtle-foreground">Self-Pay</p>
          )}
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      sortable: true,
      align: 'right',
      accessor: (row) => row.totalAmount,
      cell: (row) => (
        <span className="font-bold tabular-nums text-foreground">{formatCurrency(row.totalAmount)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (row) => row.status,
      cell: (row) => <StatusBadge status={row.status} dueDate={row.dueDate} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Payments"
        description="View your invoices, pay outstanding balances, and track insurance claims."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Billing' }]}
        actions={
          <>
            <div className="hidden w-64 sm:block">
              <Input
                icon={<Search />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoices…"
                aria-label="Search invoices"
              />
            </div>
            <Button onClick={() => router.push('/patient/wallet')}>
              <DollarSign className="h-4 w-4" aria-hidden /> Pay Balance
            </Button>
          </>
        }
      />

      {isError ? (
        <ErrorState
          description="Could not load your invoices. Check your connection and try again."
          onRetry={refetch}
        />
      ) : isLoading ? (
        <div className="space-y-6">
          <StatGrid>{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={1} />)}</StatGrid>
          <SkeletonTable rows={5} />
        </div>
      ) : (
        <>
          <StatGrid>
            <StatCard
              label="Outstanding Balance"
              value={formatCurrency(totalOutstanding)}
              sub={
                outstanding.length
                  ? `${outstanding.length} invoice${outstanding.length > 1 ? 's' : ''} awaiting payment`
                  : 'No outstanding balance'
              }
              icon={CreditCard}
              tone="rose"
              delay={0}
            />
            <StatCard
              label="Last Payment"
              value={lastPaid ? formatCurrency(lastPaid.amountPaid) : '—'}
              sub={lastPaid ? `Paid on ${formatDate(lastPaid.issuedAt)}` : 'No payments yet'}
              icon={CheckCircle2}
              tone="emerald"
              delay={0.05}
            />
            <StatCard
              label="Insurance Claims"
              value={`${insuranceClaims.length} Applied`}
              sub={insuranceClaims.length ? 'Invoices with insurance' : 'No insurance claims'}
              icon={ShieldCheck}
              tone="brand"
              delay={0.1}
            />
            <StatCard
              label="Invoices Settled"
              value={`${paidInvoices.length} of ${invoices.length}`}
              sub="This billing period"
              icon={Receipt}
              tone="violet"
              delay={0.15}
            />
          </StatGrid>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <Card variant="gradient" className="overflow-hidden">
                <CardContent className="relative p-6">
                  <CreditCard
                    className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 opacity-10"
                    aria-hidden
                  />
                  <p className="text-sm font-medium opacity-90">Total Outstanding Balance</p>
                  <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">
                    {formatCurrency(totalOutstanding)}
                  </p>
                  <div className="mt-6">
                    <Button variant="glass" size="sm" onClick={() => router.push('/patient/wallet')}>
                      Make a Payment <ChevronRight className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                {invoices.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No invoices yet"
                    description="Invoices are generated when you visit a clinic, order labs, or fill a prescription."
                  />
                ) : (
                  <DataTable<Invoice>
                    columns={columns}
                    data={filtered}
                    rowKey={(row) => row._id}
                    searchable={false}
                    exportName="invoices"
                    emptyTitle="No invoices found"
                    emptyDescription={search ? `No invoices match "${search}".` : 'You have no invoices yet.'}
                    rowActions={(row) => (
                      <div className="flex items-center justify-end gap-2">
                        {(row.status === 'UNPAID' || row.status === 'PARTIALLY_PAID') && (
                          <Button size="sm" onClick={() => router.push('/patient/wallet')}>
                            Pay Now
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => {
                            const blob = new Blob([JSON.stringify(row, null, 2)], {
                              type: 'application/json',
                            });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${row.invoiceNumber}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          aria-label={`Download invoice ${row.invoiceNumber}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  />
                )}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="xl:col-span-1"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Payment Timeline</CardTitle>
                  <CardDescription>Recent billing activity on your account.</CardDescription>
                </CardHeader>
                <CardContent>
                  {timelineEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No billing activity yet.</p>
                  ) : (
                    <Timeline>
                      {timelineEntries.map((inv) => {
                        const isPaid = inv.status === 'PAID';
                        const isUnpaid =
                          inv.status === 'UNPAID' || inv.status === 'PARTIALLY_PAID';
                        return (
                          <TimelineItem
                            key={inv._id}
                            icon={isPaid ? CheckCircle2 : isUnpaid ? AlertTriangle : Clock}
                            tone={isPaid ? 'success' : isUnpaid ? 'danger' : 'brand'}
                            title={`${isPaid ? 'Payment received' : isUnpaid ? 'Invoice issued' : 'Claim processing'} — ${inv.invoiceNumber}`}
                            meta={formatDate(inv.issuedAt)}
                          >
                            {describeInvoice(inv)} · {formatCurrency(inv.totalAmount)}
                            {inv.dueDate && !isPaid && ` due by ${formatDate(inv.dueDate)}`}
                            {inv.insuranceClaimId ? ' with insurance.' : '.'}
                          </TimelineItem>
                        );
                      })}
                    </Timeline>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
