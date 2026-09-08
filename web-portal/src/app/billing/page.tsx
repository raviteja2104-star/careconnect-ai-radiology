'use client';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard, Search, Download, DollarSign,
  Clock, CheckCircle2, AlertTriangle, FileText, ChevronRight,
  Receipt, ShieldCheck, X, Lock,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription,
  CardContent, Button, Badge, Input, DataTable, Timeline, TimelineItem,
  EmptyState, ErrorState, SkeletonCard, SkeletonTable,
  type Column,
} from '@/components/ui';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care'}/api`;

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

interface RazorpayInstance {
  open(): void;
  on(event: string, handler: () => void): void;
}

declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => RazorpayInstance;
  }
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

// ── Payment Modal ────────────────────────────────────────────────────────────

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface PaymentModalProps {
  invoice: Invoice;
  onClose(): void;
  onSuccess(): void;
}

function PaymentModal({ invoice, onClose, onSuccess }: PaymentModalProps) {
  const [step, setStep] = useState<'confirm' | 'paying' | 'success' | 'error'>('confirm');
  const [errorMsg, setErrorMsg] = useState('');

  const startPayment = useCallback(async () => {
    setStep('paying');
    setErrorMsg('');
    try {
      // Step 1: create Razorpay order
      const orderRes = await fetch(`${API_BASE}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ amount: invoice.amountDue, purpose: 'invoice_payment' }),
      });
      const orderJson = await orderRes.json();
      if (!orderRes.ok || !orderJson.success) throw new Error(orderJson.message ?? 'Could not create payment order.');

      const { orderId, amount, currency, key, user } = orderJson.data;

      const verifyAndMark = async (paymentId: string, signature?: string) => {
        const verifyRes = await fetch(`${API_BASE}/billing/invoices/${invoice._id}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: signature ?? '',
            amount,
          }),
        });
        const verifyJson = await verifyRes.json();
        if (!verifyRes.ok || !verifyJson.success) throw new Error(verifyJson.message ?? 'Payment verification failed.');
        setStep('success');
        onSuccess(); // Refresh invoice list immediately; modal stays open until user dismisses
      };

      // Step 2: open Razorpay checkout
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Could not load payment gateway. Check your connection.');

      const rzp = new window.Razorpay({
        key,
        amount,
        currency: currency ?? 'INR',
        order_id: orderId,
        name: 'CareConnect',
        description: `${invoice.invoiceNumber} — ${describeInvoice(invoice)}`,
        prefill: { name: user?.name ?? '', email: user?.email ?? '', contact: user?.phone ?? '' },
        theme: { color: '#0ea5e9' },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            await verifyAndMark(response.razorpay_payment_id, response.razorpay_signature);
          } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : 'Verification failed.');
            setStep('error');
          }
        },
        modal: { ondismiss: () => { if (step === 'paying') setStep('confirm'); } },
      });
      rzp.open();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setStep('error');
    }
  }, [invoice, onClose, onSuccess, step]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Pay invoice">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" aria-hidden />
            <h2 className="font-semibold text-foreground">Secure Payment</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {(step === 'confirm' || step === 'paying') && (
            <>
              <div className="mb-4 rounded-xl border border-border bg-muted/40 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Invoice</p>
                    <p className="mt-0.5 font-semibold text-foreground">{invoice.invoiceNumber}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{describeInvoice(invoice)}</p>
                  </div>
                  <StatusBadge status={invoice.status} />
                </div>
                <div className="mt-4 space-y-1 border-t border-border pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Invoice total</span>
                    <span className="tabular-nums text-foreground">{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                  {invoice.amountPaid > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Already paid</span>
                      <span className="tabular-nums text-success">−{formatCurrency(invoice.amountPaid)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                    <span className="text-foreground">Amount due</span>
                    <span className="tabular-nums text-danger">{formatCurrency(invoice.amountDue)}</span>
                  </div>
                </div>
              </div>
              <p className="mb-5 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3 shrink-0" aria-hidden />
                Payments are processed securely via Razorpay. CareConnect never stores your card details.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={onClose} disabled={step === 'paying'}>Cancel</Button>
                <Button className="flex-1" onClick={startPayment} loading={step === 'paying'} disabled={step === 'paying'}>
                  <DollarSign className="h-4 w-4" aria-hidden /> Pay {formatCurrency(invoice.amountDue)}
                </Button>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-8 w-8" aria-hidden />
              </span>
              <p className="text-lg font-semibold text-foreground">Payment successful!</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(invoice.amountDue)} paid for {invoice.invoiceNumber}. Your invoice has been updated.
              </p>
              <Button variant="outline" onClick={onClose}>Done</Button>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
                <AlertTriangle className="h-8 w-8" aria-hidden />
              </span>
              <p className="text-lg font-semibold text-foreground">Payment failed</p>
              <p className="text-sm text-danger">{errorMsg}</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>Close</Button>
                <Button onClick={() => setStep('confirm')}>Try Again</Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);

  // Close modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setPayingInvoice(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const { data: invoices = [], isLoading, isError, refetch } = useQuery<Invoice[]>({
    queryKey: ['billing-invoices'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/billing/invoices`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Failed to load invoices (${res.status})`);
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    },
    staleTime: 60_000,
  });

  const handlePaymentSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['billing-invoices'] });
  }, [queryClient]);

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
    () => [...invoices].sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()).slice(0, 5),
    [invoices],
  );

  const firstUnpaid = outstanding[0] ?? null;

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
    <>
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
              <Button
                onClick={() => firstUnpaid ? setPayingInvoice(firstUnpaid) : router.push('/patient/wallet')}
                disabled={outstanding.length === 0}
              >
                <DollarSign className="h-4 w-4" aria-hidden /> Pay Balance
              </Button>
            </>
          }
        />

        {isError ? (
          <ErrorState description="Could not load your invoices. Check your connection and try again." onRetry={refetch} />
        ) : isLoading ? (
          <div className="space-y-6">
            <StatGrid>{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={1} />)}</StatGrid>
            <SkeletonTable rows={5} />
          </div>
        ) : (
          <>
            <StatGrid>
              <StatCard label="Outstanding Balance" value={formatCurrency(totalOutstanding)} sub={outstanding.length ? `${outstanding.length} invoice${outstanding.length > 1 ? 's' : ''} awaiting payment` : 'No outstanding balance'} icon={CreditCard} tone="rose" delay={0} />
              <StatCard label="Last Payment" value={lastPaid ? formatCurrency(lastPaid.amountPaid) : '—'} sub={lastPaid ? `Paid on ${formatDate(lastPaid.issuedAt)}` : 'No payments yet'} icon={CheckCircle2} tone="emerald" delay={0.05} />
              <StatCard label="Insurance Claims" value={`${insuranceClaims.length} Applied`} sub={insuranceClaims.length ? 'Invoices with insurance' : 'No insurance claims'} icon={ShieldCheck} tone="brand" delay={0.1} />
              <StatCard label="Invoices Settled" value={`${paidInvoices.length} of ${invoices.length}`} sub="This billing period" icon={Receipt} tone="violet" delay={0.15} />
            </StatGrid>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                <Card variant="gradient" className="overflow-hidden">
                  <CardContent className="relative p-6">
                    <CreditCard className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 opacity-10" aria-hidden />
                    <p className="text-sm font-medium opacity-90">Total Outstanding Balance</p>
                    <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">{formatCurrency(totalOutstanding)}</p>
                    <div className="mt-6">
                      {firstUnpaid ? (
                        <Button variant="glass" size="sm" onClick={() => setPayingInvoice(firstUnpaid)}>
                          Pay Now <ChevronRight className="h-4 w-4" aria-hidden />
                        </Button>
                      ) : (
                        <Badge tone="success"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> All invoices settled</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  {invoices.length === 0 ? (
                    <EmptyState icon={FileText} title="No invoices yet" description="Invoices are generated when you visit a clinic, order labs, or fill a prescription." />
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
                            <Button size="sm" onClick={() => setPayingInvoice(row)}>
                              Pay Now
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => {
                              const blob = new Blob([JSON.stringify(row, null, 2)], { type: 'application/json' });
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
                          const isUnpaid = inv.status === 'UNPAID' || inv.status === 'PARTIALLY_PAID';
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

      {/* Payment Modal */}
      <AnimatePresence>
        {payingInvoice && (
          <PaymentModal
            invoice={payingInvoice}
            onClose={() => setPayingInvoice(null)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </AnimatePresence>
    </>
  );
}
