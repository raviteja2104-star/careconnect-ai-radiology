'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pill, AlertTriangle, Snowflake, CheckCircle, ShieldAlert,
  ScanBarcode, Printer, Clock, Truck, ArrowRight,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Button, Badge, Card, CardHeader, CardTitle,
  CardContent, Tabs, TabsList, TabsTrigger, TabsContent, DataTable, type Column,
  EmptyState, SkeletonCard,
} from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: 'Bearer ' + token } : {};
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) !== 1 ? 's' : ''} ago`;
}

type RxItem = {
  orderId: string;
  patientName: string;
  doctorName: string;
  createdAt: string;
  status: string;
  items: Array<{ name: string; strength: string; quantity: number; unit: string }>;
  aiFlag: boolean;
  aiMsg?: string;
};

type InventoryItem = {
  name: string;
  category: string;
  stock: number;
  reorderLevel: number;
  status: string;
};

type PharmacyStats = {
  todayRx: number;
  pendingDispense: number;
  aiAlerts: number;
  lowStock: number;
};

const RX_STATUS_TONE: Record<string, 'warning' | 'info' | 'success'> = {
  Verification: 'warning',
  Ready: 'info',
  Dispensed: 'success',
};

export default function PharmacyDashboard() {
  const [activeTab, setActiveTab] = useState('queue');
  const queryClient = useQueryClient();

  const statsQuery = useQuery<{ success: boolean; data: PharmacyStats }>({
    queryKey: ['pharmacy-stats'],
    queryFn: () =>
      fetch(`${API_BASE}/api/pharmacy/stats`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 30_000,
  });

  const queueQuery = useQuery<{ success: boolean; data: RxItem[] }>({
    queryKey: ['pharmacy-queue'],
    queryFn: () =>
      fetch(`${API_BASE}/api/pharmacy/queue`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 15_000,
  });

  const inventoryQuery = useQuery<{ success: boolean; data: InventoryItem[] }>({
    queryKey: ['pharmacy-inventory'],
    queryFn: () =>
      fetch(`${API_BASE}/api/pharmacy/inventory`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 60_000,
  });

  const dispenseMutation = useMutation({
    mutationFn: async (rxId: string) => {
      const res = await fetch(`${API_BASE}/api/pharmacy/queue/${rxId}/dispense`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
      });
      if (!res.ok) throw new Error('Dispense failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-queue'] });
      queryClient.invalidateQueries({ queryKey: ['pharmacy-stats'] });
    },
  });

  const apiStats = statsQuery.data?.data;
  const queue: RxItem[] = queueQuery.data?.data ?? [];
  const inventory: InventoryItem[] = inventoryQuery.data?.data ?? [];

  const statsDisplay = [
    {
      label: "Today's Rx",
      value: apiStats != null ? String(apiStats.todayRx) : '—',
      icon: Pill,
      tone: 'brand' as const,
      sub: 'Prescriptions received',
    },
    {
      label: 'Pending Dispense',
      value: apiStats != null ? String(apiStats.pendingDispense) : '—',
      icon: Clock,
      tone: 'teal' as const,
      sub: 'In the dispensing queue',
    },
    {
      label: 'AI Alerts (Interactions)',
      value: apiStats != null ? String(apiStats.aiAlerts) : '—',
      icon: ShieldAlert,
      tone: 'rose' as const,
      sub: 'Drug interaction flags',
    },
    {
      label: 'Low Stock Items',
      value: apiStats != null ? String(apiStats.lowStock) : '—',
      icon: AlertTriangle,
      tone: 'amber' as const,
      sub: 'Below reorder threshold',
    },
  ];

  const queueColumns: Column<RxItem>[] = [
    {
      key: 'orderId',
      header: 'Order ID',
      sortable: true,
      accessor: r => r.orderId,
      cell: r => <span className="text-sm font-bold text-foreground">{r.orderId}</span>,
    },
    {
      key: 'patient',
      header: 'Patient',
      sortable: true,
      accessor: r => r.patientName,
      cell: r => (
        <div>
          <p className="text-sm font-semibold text-foreground">{r.patientName}</p>
          <p className="text-xs text-muted-foreground">{relativeTime(r.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'doctor',
      header: 'Doctor',
      accessor: r => r.doctorName,
      cell: r => <span className="text-sm text-muted-foreground">{r.doctorName}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: r => r.status,
      cell: r => <Badge tone={RX_STATUS_TONE[r.status] ?? 'neutral'} dot>{r.status}</Badge>,
    },
    {
      key: 'aiFlag',
      header: 'AI Validation',
      accessor: r => (r.aiFlag ? 'Flagged' : 'Passed'),
      cell: r => r.aiFlag ? (
        <span className="flex items-center gap-1 text-xs font-semibold text-danger" title={r.aiMsg}>
          <ShieldAlert className="h-4 w-4" aria-hidden /> Flagged
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs font-semibold text-success">
          <CheckCircle className="h-4 w-4" aria-hidden /> Passed
        </span>
      ),
    },
  ];

  const inventoryColumns: Column<InventoryItem>[] = [
    {
      key: 'name',
      header: 'Drug Name',
      sortable: true,
      accessor: item => item.name,
      cell: item => <span className="text-sm font-bold text-foreground">{item.name}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      accessor: item => item.category,
      cell: item => <span className="text-sm text-muted-foreground">{item.category}</span>,
    },
    {
      key: 'stock',
      header: 'Stock Level',
      sortable: true,
      accessor: item => item.stock,
      cell: item => (
        <span className={`flex items-center gap-1.5 text-sm font-semibold ${item.status === 'Low Stock' ? 'text-danger' : 'text-success'}`}>
          <span className={`h-2 w-2 rounded-full ${item.status === 'Low Stock' ? 'bg-danger' : 'bg-success'}`} aria-hidden />
          {item.stock} Units
        </span>
      ),
    },
    {
      key: 'reorderLevel',
      header: 'Reorder At',
      sortable: true,
      accessor: item => item.reorderLevel,
      cell: item => <span className="text-sm text-muted-foreground tabular-nums">{item.reorderLevel} Units</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: item => item.status,
      cell: item => (
        <Badge tone={item.status === 'Low Stock' ? 'danger' : 'success'} dot>
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central Pharmacy"
        description="Enterprise Pharmacy Information System (PIS)"
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Pharmacy' }]}
        actions={
          <Button variant="secondary" disabled title="Coming soon">
            <ScanBarcode className="h-4 w-4" aria-hidden /> Scan Barcode
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap">
          {['Dashboard', 'queue', 'Inventory', 'Purchase Orders', 'Cold Chain'].map(tab => (
            <TabsTrigger key={tab} value={tab}>
              {tab === 'queue' ? 'Prescription Queue' : tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="Dashboard" className="mt-6 space-y-6">
          {statsQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : statsQuery.isError ? (
            <p className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
              Failed to load pharmacy stats. Please refresh.
            </p>
          ) : (
            <StatGrid>
              {statsDisplay.map((s, i) => (
                <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} icon={s.icon} tone={s.tone} delay={i * 0.05} />
              ))}
            </StatGrid>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* AI Safety Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="xl:col-span-1"
            >
              <Card className="flex h-full flex-col overflow-hidden">
                <CardHeader className="border-b border-border bg-danger-soft/40">
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-danger" aria-hidden /> AI Safety Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pt-4">
                  {queueQuery.isLoading ? (
                    <div className="h-20 animate-pulse rounded-xl bg-muted" />
                  ) : queue.filter(r => r.aiFlag).length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">No AI drug interaction flags at this time.</p>
                  ) : (
                    <div className="space-y-3">
                      {queue.filter(r => r.aiFlag).map(rx => (
                        <div key={rx.orderId} className="rounded-xl border border-danger/30 bg-danger-soft p-3">
                          <div className="mb-1 flex items-start justify-between">
                            <span className="text-xs font-bold text-danger">Drug Interaction Flag</span>
                            <span className="font-mono text-xs text-danger/80">{rx.orderId}</span>
                          </div>
                          <p className="mb-2 text-xs text-foreground">{rx.aiMsg ?? 'Potential drug interaction detected — pharmacist review required.'}</p>
                          <button
                            onClick={() => setActiveTab('queue')}
                            className="text-xs font-semibold text-danger hover:underline"
                          >
                            Review &amp; Hold
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Ready for Dispensing */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="xl:col-span-2"
            >
              <Card className="h-full overflow-hidden">
                <CardHeader className="flex-row items-center justify-between border-b border-border">
                  <CardTitle>Ready for Dispensing</CardTitle>
                  <Button variant="link" size="sm" onClick={() => setActiveTab('queue')}>
                    View Queue <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {queueQuery.isLoading ? (
                    <div className="space-y-2 p-4">
                      <div className="h-12 animate-pulse rounded-lg bg-muted" />
                      <div className="h-12 animate-pulse rounded-lg bg-muted" />
                    </div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {queue.filter(r => r.status === 'Ready').map((rx, i) => (
                        <li key={i} className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/40">
                          <div>
                            <p className="text-sm font-bold text-foreground">{rx.orderId}</p>
                            <p className="text-xs text-muted-foreground">{rx.patientName} · {rx.items.length} item{rx.items.length !== 1 ? 's' : ''}</p>
                          </div>
                          <Button
                            size="sm"
                            disabled={dispenseMutation.isPending}
                            onClick={() => dispenseMutation.mutate(rx.orderId)}
                          >
                            Dispense
                          </Button>
                        </li>
                      ))}
                      {!queueQuery.isLoading && queue.filter(r => r.status === 'Ready').length === 0 && (
                        <li className="px-6 py-8 text-center text-sm text-muted-foreground">No prescriptions ready for dispensing.</li>
                      )}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="queue" className="mt-6">
          {queueQuery.isError ? (
            <p className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
              Failed to load prescription queue. Please refresh.
            </p>
          ) : (
            <DataTable<RxItem>
              columns={queueColumns}
              data={queue}
              rowKey={(r) => r.orderId}
              searchPlaceholder="Search Rx ID or Patient..."
              exportName="prescription-queue"
              emptyTitle="No prescriptions in queue"
              emptyDescription="New prescriptions will appear here as they are received."
              rowActions={rx => (
                <div className="flex items-center justify-end gap-2">
                  {rx.status === 'Verification' && (
                    <Button variant="secondary" size="sm">Verify Rx</Button>
                  )}
                  {rx.status === 'Ready' && (
                    <Button
                      size="sm"
                      disabled={dispenseMutation.isPending}
                      onClick={() => dispenseMutation.mutate(rx.orderId)}
                    >
                      Dispense
                    </Button>
                  )}
                  <Button variant="ghost" size="icon-sm" aria-label={`Print ${rx.orderId}`} disabled title="Print">
                    <Printer className="h-4 w-4" />
                  </Button>
                </div>
              )}
            />
          )}
        </TabsContent>

        <TabsContent value="Inventory" className="mt-6">
          {inventoryQuery.isError ? (
            <p className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
              Failed to load inventory. Please refresh.
            </p>
          ) : (
            <DataTable<InventoryItem>
              columns={inventoryColumns}
              data={inventory}
              rowKey={(item) => item.name}
              searchPlaceholder="Search drug name or category..."
              exportName="drug-inventory"
              emptyTitle="No inventory items"
              emptyDescription="The master drug inventory is empty."
            />
          )}
        </TabsContent>

        <TabsContent value="Purchase Orders" className="mt-6">
          <EmptyState
            icon={Truck}
            title="No purchase orders yet"
            description="Purchase orders raised against suppliers will appear here for tracking and approval."
          />
        </TabsContent>

        <TabsContent value="Cold Chain" className="mt-6">
          <EmptyState
            icon={Snowflake}
            title="Cold chain monitoring"
            description="Temperature-controlled storage telemetry and excursion alerts will appear here."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
