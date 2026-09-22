'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Users, CalendarCheck, IndianRupee, TrendingUp } from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardContent,
  Skeleton,
} from '@/components/ui';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function DailyReports() {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const { data: dashRes, isLoading: dashLoading } = useQuery({
    queryKey: ['reception_reports_dashboard'],
    queryFn: () =>
      fetch(`${API}/api/reception/dashboard`, { headers: authHeaders() }).then(r => r.json()),
  });

  const { data: billingRes, isLoading: billingLoading } = useQuery({
    queryKey: ['reception_reports_billing'],
    queryFn: () =>
      fetch(`${API}/api/billing/stats`, { headers: authHeaders() }).then(r => r.json()),
  });

  const { data: queueRes } = useQuery({
    queryKey: ['reception_reports_queue', 'General'],
    queryFn: () =>
      fetch(`${API}/api/queue/General`, { headers: authHeaders() }).then(r => r.json()),
  });

  const stats = dashRes?.data ?? {};
  const billing = billingRes?.data ?? {};
  const avgWait = queueRes?.avgWaitMins ?? null;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v ?? 0);

  const sections = [
    {
      title: 'Patient Flow',
      items: [
        { label: 'Total Appointments', value: stats.appointmentsToday ?? 0 },
        { label: 'Walk-ins', value: stats.walkInsToday ?? 0 },
        { label: 'Checked In', value: stats.checkedIn ?? 0 },
        { label: 'Consultations Completed', value: stats.completed ?? 0 },
        { label: 'Currently Waiting', value: stats.waiting ?? 0 },
        { label: 'Avg Wait Time', value: avgWait !== null ? `${avgWait} min` : 'N/A' },
      ],
    },
    {
      title: 'Revenue Summary',
      items: [
        { label: "Today's Revenue", value: formatCurrency(billing.todayRevenue ?? 0) },
        { label: 'Pending Collection', value: formatCurrency(billing.pendingAmount ?? 0) },
        { label: 'Invoices Raised', value: billing.totalInvoices ?? 0 },
        { label: 'Invoices Paid', value: billing.paidCount ?? 0 },
        { label: 'Overdue Invoices', value: billing.overdueCount ?? 0 },
      ],
    },
  ];

  const isLoading = dashLoading || billingLoading;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Daily Reports"
        description={`Summary for ${today}`}
        crumbs={[{ label: 'Reception', href: '/reception/dashboard' }, { label: 'Reports' }]}
      />

      <StatGrid>
        <StatCard label="Appointments" value={stats.appointmentsToday ?? 0} sub="Scheduled today" icon={CalendarCheck} tone="brand" delay={0} />
        <StatCard label="Consultations Done" value={stats.completed ?? 0} sub="Completed today" icon={Users} tone="emerald" delay={0.05} />
        <StatCard label="Revenue" value={formatCurrency(billing.todayRevenue ?? 0)} sub="Collected today" icon={IndianRupee} tone="teal" delay={0.1} />
        <StatCard label="Avg Wait" value={avgWait !== null ? `${avgWait}m` : '—'} sub="Minutes per patient" icon={TrendingUp} tone="amber" delay={0.15} />
      </StatGrid>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <dl className="divide-y divide-border">
                  {section.items.map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-3">
                      <dt className="text-sm text-muted-foreground">{label}</dt>
                      <dd className="font-semibold text-foreground tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Report</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Download today&apos;s operational report as a PDF or CSV for audit and management review.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Print / Save PDF
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
