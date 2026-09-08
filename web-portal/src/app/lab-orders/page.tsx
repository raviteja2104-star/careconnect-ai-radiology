'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FlaskConical, Plus, Search, AlertTriangle, CheckCircle, Clock,
  ChevronDown, TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Button, Badge, Input, Select, Textarea,
  Label, Dialog, EmptyState, Skeleton, SkeletonCard,
} from '@/components/ui';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';
function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type OrderStatus  = 'Pending' | 'Specimen Collected' | 'In Process' | 'Partial' | 'Final' | 'Verified';
type Priority     = 'Routine' | 'Urgent' | 'STAT';

interface LabResult {
  test: string; loincCode?: string;
  value: number | string; unit: string; referenceRange?: string;
  status: 'normal' | 'low' | 'high' | 'critical-low' | 'critical-high';
  delta?: number;
}

interface LabOrder {
  id: string; mrn: string; patientName: string; patientAge: number; patientGender: string;
  panelName: string; orderedBy: string; department: string;
  orderedAt: string; reportedAt?: string;
  status: OrderStatus; priority: Priority;
  results: LabResult[];
  specimenType: string;
}

const AVAILABLE_PANELS = [
  'Cardiac Markers (STAT) [Troponin I, CK-MB, BNP]',
  'Complete Blood Count (CBC) with Differential',
  'Comprehensive Metabolic Panel (CMP)',
  'HbA1c + Glycaemic Control Panel',
  'Lipid Profile (Fasted)',
  'Liver Function Tests (LFT)',
  'Renal Function Panel (KFT)',
  'Thyroid Profile (T3, T4, TSH)',
  'Coagulation Screen (PT/INR, aPTT)',
  'Arterial Blood Gas (ABG)',
  'Sepsis Panel (Blood Culture + Procalcitonin)',
];

const RESULT_CFG: Record<LabResult['status'], { label: string; textColor: string; rowBg: string }> = {
  normal:          { label: 'N',  textColor: 'text-success', rowBg: '' },
  low:             { label: 'L',  textColor: 'text-info',    rowBg: '' },
  high:            { label: 'H',  textColor: 'text-warning', rowBg: '' },
  'critical-low':  { label: 'LL', textColor: 'text-danger',  rowBg: 'bg-danger-soft/40' },
  'critical-high': { label: 'HH', textColor: 'text-danger',  rowBg: 'bg-danger-soft/40' },
};

const STATUS_TONE: Record<OrderStatus, { tone: 'neutral' | 'info' | 'warning' | 'success' | 'brand'; pulse?: boolean }> = {
  'Pending':            { tone: 'neutral' },
  'Specimen Collected': { tone: 'info' },
  'In Process':         { tone: 'warning', pulse: true },
  'Partial':            { tone: 'warning' },
  'Final':              { tone: 'success' },
  'Verified':           { tone: 'brand' },
};

const PRIORITY_TONE: Record<Priority, 'danger' | 'warning' | 'neutral'> = {
  STAT: 'danger',
  Urgent: 'warning',
  Routine: 'neutral',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapOrder(raw: any): LabOrder {
  return {
    id: String(raw.id ?? raw._id),
    mrn: raw.mrn ?? '',
    patientName: raw.patientName ?? '',
    patientAge: raw.patientAge ?? 0,
    patientGender: raw.patientGender ?? '',
    panelName: raw.panelName ?? '',
    orderedBy: raw.orderedBy ?? '',
    department: raw.department ?? '',
    orderedAt: raw.orderedAt
      ? new Date(raw.orderedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : '',
    reportedAt: raw.reportedAt
      ? new Date(raw.reportedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : undefined,
    status: raw.status ?? 'Pending',
    priority: raw.priority ?? 'Routine',
    specimenType: raw.specimenType ?? 'Serum',
    results: Array.isArray(raw.results) ? raw.results : [],
  };
}

export default function LabOrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [patientName, setPatientName] = useState('');
  const [mrn, setMrn] = useState('');
  const [selectedPanel, setSelectedPanel] = useState(AVAILABLE_PANELS[0]);
  const [priority, setPriority] = useState<Priority>('Urgent');
  const [specimenType, setSpecimenType] = useState('Serum');
  const [clinicalNotes, setClinicalNotes] = useState('');

  const { data: ordersRes, isLoading, isError } = useQuery({
    queryKey: ['lab-orders'],
    queryFn: () =>
      fetch(`${API}/api/lab/orders`, { headers: authHeaders() }).then(r => r.json()),
    refetchInterval: 30_000,
  });

  const orders: LabOrder[] = (() => {
    const list = ordersRes?.data;
    return Array.isArray(list) ? list.map(mapOrder) : [];
  })();

  const createMutation = useMutation({
    mutationFn: (payload: {
      mrn: string; patientName: string; panelName: string;
      priority: Priority; specimenType: string; clinicalNotes: string;
    }) =>
      fetch(`${API}/api/lab/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(payload),
      }).then(r => r.json()),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['lab-orders'] });
      if (res?.data?.id) setExpandedId(String(res.data.id));
      setIsModalOpen(false);
      setPatientName('');
      setMrn('');
      setClinicalNotes('');
    },
  });

  const filtered = orders.filter(o => {
    const matchSearch = [o.patientName, o.panelName, o.mrn, o.orderedBy].some(f =>
      f.toLowerCase().includes(search.toLowerCase())
    );
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mrn.trim() || !patientName.trim()) return;
    createMutation.mutate({
      mrn: mrn.trim(),
      patientName: patientName.trim(),
      panelName: selectedPanel.split(' [')[0],
      priority,
      specimenType,
      clinicalNotes,
    });
  };

  const summaryStats = [
    { label: 'Total Orders', value: orders.length, icon: FlaskConical, tone: 'brand' as const, sub: 'Across all departments' },
    { label: 'Critical Values', value: orders.flatMap(o => o.results).filter(r => r.status.startsWith('critical')).length, icon: AlertTriangle, tone: 'rose' as const, sub: 'Require immediate review' },
    { label: 'Pending / In Process', value: orders.filter(o => ['Pending','Specimen Collected','In Process'].includes(o.status)).length, icon: Clock, tone: 'amber' as const, sub: 'Awaiting lab results' },
    { label: 'Final / Verified', value: orders.filter(o => ['Final','Verified'].includes(o.status)).length, icon: CheckCircle, tone: 'emerald' as const, sub: 'Reports available' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lab Orders"
        description="Laboratory investigations and results"
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Lab Orders' }]}
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Order Labs
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <StatGrid>
          {summaryStats.map((s, i) => (
            <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} icon={s.icon} tone={s.tone} delay={i * 0.05} />
          ))}
        </StatGrid>
      )}

      {isError && (
        <p className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
          Failed to load lab orders. Please refresh.
        </p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-3 lg:flex-row lg:items-center"
      >
        <div className="flex-1">
          <Input
            icon={<Search />}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search panel, patient, or doctor..."
            aria-label="Search lab orders"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['All', 'Pending', 'In Process', 'Final', 'Verified'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              aria-pressed={statusFilter === f}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                statusFilter === f
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'border border-border bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Orders accordion list */}
      {!isLoading && filtered.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title={orders.length === 0 ? 'No lab orders yet' : 'No lab orders found'}
          description={orders.length === 0
            ? 'Lab orders placed by clinical staff will appear here once connected to the database.'
            : 'Try adjusting your search or filters, or create a new lab order.'}
          action={{ label: 'Order Labs', onClick: () => setIsModalOpen(true) }}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((order, idx) => {
            const sc = STATUS_TONE[order.status];
            const isCrit = order.results.some(r => r.status.startsWith('critical'));
            const isExpanded = expandedId === order.id;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.25), ease: [0.22, 1, 0.36, 1] }}
                className={`overflow-hidden rounded-2xl border bg-card shadow-soft transition-shadow hover:shadow-float ${
                  isCrit ? 'border-danger/40' : 'border-border'
                }`}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  aria-expanded={isExpanded}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/40"
                >
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FlaskConical className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{order.panelName}</span>
                      {isCrit && (
                        <Badge tone="danger" className="gap-1">
                          <AlertTriangle className="h-2.5 w-2.5" aria-hidden /> CRITICAL
                        </Badge>
                      )}
                      <Badge tone={PRIORITY_TONE[order.priority]}>{order.priority}</Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.patientName} · {order.mrn} · {order.specimenType} · Ordered: {order.orderedAt}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge tone={sc.tone} dot pulse={sc.pulse}>{order.status}</Badge>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      aria-hidden
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {order.results.length > 0 ? (
                        <div className="overflow-x-auto scrollbar-thin border-t border-border">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-border bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
                                {['Test', 'LOINC', 'Value', 'Reference Range', 'Delta', 'Flag'].map(h => (
                                  <th key={h} scope="col" className="px-5 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {order.results.map((r, i) => {
                                const rc = RESULT_CFG[r.status];
                                return (
                                  <tr key={i} className={`${rc.rowBg} transition-colors`}>
                                    <td className="px-5 py-3 font-medium text-foreground">{r.test}</td>
                                    <td className="px-5 py-3 font-mono text-xs text-subtle-foreground">{r.loincCode ?? '—'}</td>
                                    <td className={`px-5 py-3 font-mono font-bold tabular-nums ${rc.textColor}`}>
                                      {r.value} <span className="text-xs font-normal opacity-70">{r.unit}</span>
                                    </td>
                                    <td className="px-5 py-3 text-xs text-muted-foreground">{r.referenceRange ?? '—'}</td>
                                    <td className="px-5 py-3">
                                      {r.delta !== undefined ? (
                                        <span className={`flex items-center gap-1 text-xs font-medium tabular-nums ${
                                          r.delta > 0 ? 'text-danger' : r.delta < 0 ? 'text-info' : 'text-muted-foreground'
                                        }`}>
                                          {r.delta > 0 ? <TrendingUp className="h-3 w-3" aria-hidden /> : r.delta < 0 ? <TrendingDown className="h-3 w-3" aria-hidden /> : null}
                                          {r.delta > 0 ? '+' : ''}{r.delta}
                                        </span>
                                      ) : <span className="text-subtle-foreground">—</span>}
                                    </td>
                                    <td className={`px-5 py-3 text-xs font-bold ${rc.textColor}`}>{rc.label}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="border-t border-border px-6 py-5" aria-busy>
                          <div className="space-y-2.5">
                            <Skeleton className="h-3 w-3/4" />
                            <Skeleton className="h-3 w-2/3" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                          <p className="mt-4 text-center text-sm text-muted-foreground">
                            Specimen processing in laboratory. Results pending verification.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create lab order dialog */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Lab Order"
        description="Order laboratory investigations for a patient"
        size="lg"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="lab-patient">Patient Name</Label>
              <Input
                id="lab-patient"
                type="text"
                required
                placeholder="Full name"
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lab-mrn">MRN</Label>
              <Input
                id="lab-mrn"
                type="text"
                required
                placeholder="MRN-YYYY-XXXXX"
                value={mrn}
                onChange={e => setMrn(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="lab-panel">Investigation Panel</Label>
            <Select
              id="lab-panel"
              value={selectedPanel}
              onChange={e => setSelectedPanel(e.target.value)}
            >
              {AVAILABLE_PANELS.map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="lab-priority">Priority</Label>
              <Select
                id="lab-priority"
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
              >
                <option value="Routine">Routine</option>
                <option value="Urgent">Urgent</option>
                <option value="STAT">STAT (Immediate)</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="lab-specimen">Specimen Type</Label>
              <Select
                id="lab-specimen"
                value={specimenType}
                onChange={e => setSpecimenType(e.target.value)}
              >
                <option value="Serum">Serum</option>
                <option value="EDTA Whole Blood">EDTA Whole Blood</option>
                <option value="Urine">Urine</option>
                <option value="CSF">CSF</option>
                <option value="Swab / Culture">Swab / Culture</option>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="lab-notes">Clinical Indication / Notes</Label>
            <Textarea
              id="lab-notes"
              rows={3}
              placeholder="Enter reason for investigation or relevant symptoms..."
              value={clinicalNotes}
              onChange={e => setClinicalNotes(e.target.value)}
              className="resize-none"
            />
          </div>

          {createMutation.isError && (
            <p className="rounded-xl border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
              Failed to create lab order. Please try again.
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              <CheckCircle className="h-4 w-4" aria-hidden />
              {createMutation.isPending ? 'Submitting…' : 'Submit Lab Order'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
