'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CreditCard, Search, Download, Eye, DollarSign,
  Clock, CheckCircle2, AlertTriangle, FileText, ChevronRight,
  Receipt, ShieldCheck,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription,
  CardContent, Button, Badge, Input, DataTable, Timeline, TimelineItem,
  type Column,
} from '@/components/ui';

interface Invoice {
  id: string;
  date: string;
  department: string;
  amount: number;
  status: string;
  dueDate: string;
  coveredByInsurance: boolean;
}

export default function BillingPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const invoices = [
    {
      id: "INV-2026-0892",
      date: "28 Jul 2026",
      department: "Cardiology Consultation",
      amount: 150.00,
      status: "UNPAID",
      dueDate: "12 Aug 2026",
      coveredByInsurance: false
    },
    {
      id: "INV-2026-0850",
      date: "14 Jun 2026",
      department: "Laboratory (Lipid Panel)",
      amount: 85.00,
      status: "PAID",
      dueDate: "28 Jun 2026",
      coveredByInsurance: true
    },
    {
      id: "INV-2026-0711",
      date: "10 Apr 2026",
      department: "Orthopedics (X-Ray)",
      amount: 220.00,
      status: "PAID",
      dueDate: "24 Apr 2026",
      coveredByInsurance: true
    },
    {
      id: "INV-2026-0901",
      date: "29 Jul 2026",
      department: "Pharmacy (Prescription Refill)",
      amount: 45.50,
      status: "PROCESSING",
      dueDate: "15 Aug 2026",
      coveredByInsurance: true
    }
  ];

  const totalOutstanding = invoices
    .filter(i => i.status === 'UNPAID')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const filteredInvoices = invoices.filter(
    i =>
      i.id.toLowerCase().includes(search.toLowerCase()) ||
      i.department.toLowerCase().includes(search.toLowerCase())
  );

  const paidCount = invoices.filter(i => i.status === 'PAID').length;
  const pendingClaims = invoices.filter(i => i.status === 'PROCESSING').length;

  const statusBadge = (invoice: Invoice) => {
    if (invoice.status === 'PAID') {
      return (
        <Badge tone="success">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Paid
        </Badge>
      );
    }
    if (invoice.status === 'UNPAID') {
      return (
        <span className="inline-flex flex-col items-start gap-1">
          <Badge tone="danger" pulse dot>Unpaid</Badge>
          <span className="text-[11px] font-medium text-danger">Due: {invoice.dueDate}</span>
        </span>
      );
    }
    return (
      <Badge tone="info">
        <Clock className="h-3.5 w-3.5" aria-hidden /> Processing
      </Badge>
    );
  };

  const columns: Column<Invoice>[] = [
    {
      key: 'id',
      header: 'Invoice',
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
      key: 'department',
      header: 'Service / Department',
      sortable: true,
      accessor: (row) => row.department,
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{row.department}</p>
          {row.coveredByInsurance ? (
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
      key: 'amount',
      header: 'Amount',
      sortable: true,
      align: 'right',
      accessor: (row) => row.amount,
      cell: (row) => (
        <span className="font-bold tabular-nums text-foreground">${row.amount.toFixed(2)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (row) => row.status,
      cell: (row) => statusBadge(row),
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

      <StatGrid>
        <StatCard
          label="Outstanding Balance"
          value={`$${totalOutstanding.toFixed(2)}`}
          sub="1 invoice awaiting payment"
          icon={CreditCard}
          tone="rose"
          trend="up"
          trendPositive={false}
          delay={0}
        />
        <StatCard
          label="Last Payment"
          value="$220.00"
          sub="Paid on 24 Apr 2026"
          icon={CheckCircle2}
          tone="emerald"
          delay={0.05}
        />
        <StatCard
          label="Insurance Claims"
          value={`${pendingClaims} Pending`}
          sub="Aetna Standard Coverage"
          icon={ShieldCheck}
          tone="brand"
          delay={0.1}
        />
        <StatCard
          label="Invoices Settled"
          value={`${paidCount} of ${invoices.length}`}
          sub="This billing year"
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
                ${totalOutstanding.toFixed(2)}
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
            <DataTable<Invoice>
              columns={columns}
              data={filteredInvoices}
              rowKey={(row) => row.id}
              searchable={false}
              exportName="invoices"
              emptyTitle="No invoices found"
              emptyDescription={search ? `No invoices match “${search}”.` : 'You have no invoices yet.'}
              rowActions={(row) => (
                <div className="flex items-center justify-end gap-2">
                  {row.status === 'UNPAID' && (
                    <Button size="sm" onClick={() => router.push('/patient/wallet')}>Pay Now</Button>
                  )}
                  <Button variant="outline" size="icon-sm" disabled title="Invoice viewer coming soon" aria-label={`View invoice ${row.id}`}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(row, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${row.id}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    aria-label={`Download invoice ${row.id}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )}
            />
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
              <Timeline>
                <TimelineItem
                  icon={AlertTriangle}
                  tone="danger"
                  title="Invoice issued — INV-2026-0892"
                  meta="28 Jul 2026"
                >
                  Cardiology Consultation · $150.00 due by 12 Aug 2026.
                </TimelineItem>
                <TimelineItem
                  icon={Clock}
                  tone="brand"
                  title="Claim processing — INV-2026-0901"
                  meta="29 Jul 2026"
                >
                  Pharmacy (Prescription Refill) · $45.50 with Aetna Standard Coverage.
                </TimelineItem>
                <TimelineItem
                  icon={CheckCircle2}
                  tone="success"
                  title="Payment received — INV-2026-0850"
                  meta="28 Jun 2026"
                >
                  Laboratory (Lipid Panel) · $85.00 settled via insurance.
                </TimelineItem>
                <TimelineItem
                  icon={CheckCircle2}
                  tone="success"
                  title="Payment received — INV-2026-0711"
                  meta="24 Apr 2026"
                >
                  Orthopedics (X-Ray) · $220.00 settled via insurance.
                </TimelineItem>
              </Timeline>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
