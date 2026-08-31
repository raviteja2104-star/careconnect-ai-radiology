'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Pill, AlertTriangle, Snowflake, CheckCircle, ShieldAlert,
  ScanBarcode, Printer, Clock, PackageSearch, Truck, ArrowRight,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Button, Badge, Card, CardHeader, CardTitle,
  CardContent, Tabs, TabsList, TabsTrigger, TabsContent, DataTable, type Column,
  EmptyState,
} from '@/components/ui';
import { DrugService } from '@/services/drugService';

type RxItem = {
  rxId: string; patient: string; doctor: string; time: string;
  status: string; items: number; aiFlag: boolean; aiMsg?: string;
};

type InventoryItem = ReturnType<typeof DrugService.getAllDrugs>[number] & {
  stock: number;
  status: string;
};

const RX_STATUS_TONE: Record<string, 'warning' | 'info' | 'success'> = {
  Verification: 'warning',
  Ready: 'info',
  Dispensed: 'success',
};

export default function PharmacyDashboard() {
  const [activeTab, setActiveTab] = useState('queue');

  // Mock Data for Dashboard
  const stats = [
    { label: "Today's Rx", value: '142', icon: Pill, tone: 'brand' as const, sub: 'Prescriptions received' },
    { label: 'Pending Dispense', value: '18', icon: Clock, tone: 'teal' as const, sub: 'In the dispensing queue' },
    { label: 'AI Alerts (Interactions)', value: '2', icon: ShieldAlert, tone: 'rose' as const, sub: 'Drug interaction flags' },
    { label: 'Low Stock Items', value: '14', icon: AlertTriangle, tone: 'amber' as const, sub: 'Below reorder threshold' },
  ];

  const rxQueue: RxItem[] = [
    { rxId: 'RX-2026-881', patient: 'Rohit Sharma', doctor: 'Dr. Raj Sharma', time: '10 mins ago', status: 'Verification', items: 4, aiFlag: false },
    { rxId: 'RX-2026-882', patient: 'Priya Patel', doctor: 'Dr. Anita Desai', time: '15 mins ago', status: 'Ready', items: 2, aiFlag: true, aiMsg: 'Potential duplicate therapy detected.' },
    { rxId: 'RX-2026-883', patient: 'Amit Singh', doctor: 'Dr. Raj Sharma', time: '1 hour ago', status: 'Dispensed', items: 1, aiFlag: false },
  ];

  const inventory: InventoryItem[] = DrugService.getAllDrugs().map(d => ({
    ...d,
    stock: Math.floor(Math.random() * 500) + 10,
    status: Math.random() > 0.8 ? 'Low Stock' : 'In Stock'
  }));

  const queueColumns: Column<RxItem>[] = [
    {
      key: 'rxId',
      header: 'Rx ID',
      sortable: true,
      accessor: r => r.rxId,
      cell: r => <span className="text-sm font-bold text-foreground">{r.rxId}</span>,
    },
    {
      key: 'patient',
      header: 'Patient',
      sortable: true,
      accessor: r => r.patient,
      cell: r => (
        <div>
          <p className="text-sm font-semibold text-foreground">{r.patient}</p>
          <p className="text-xs text-muted-foreground">{r.time}</p>
        </div>
      ),
    },
    {
      key: 'doctor',
      header: 'Doctor',
      accessor: r => r.doctor,
      cell: r => <span className="text-sm text-muted-foreground">{r.doctor}</span>,
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
      key: 'id',
      header: 'Item ID',
      accessor: item => item.id,
      cell: item => <span className="font-mono text-xs text-muted-foreground">{item.id}</span>,
    },
    {
      key: 'brandName',
      header: 'Brand Name',
      sortable: true,
      accessor: item => item.brandName,
      cell: item => <span className="text-sm font-bold text-foreground">{item.brandName}</span>,
    },
    {
      key: 'genericName',
      header: 'Generic Name',
      sortable: true,
      accessor: item => item.genericName,
      cell: item => <span className="text-sm text-muted-foreground">{item.genericName}</span>,
    },
    {
      key: 'strength',
      header: 'Strength',
      accessor: item => `${item.strength} ${item.form}`,
      cell: item => <span className="whitespace-nowrap text-sm text-muted-foreground">{item.strength} · {item.form}</span>,
    },
    {
      key: 'price',
      header: 'Price (MRP)',
      sortable: true,
      accessor: item => item.basePrice * (1 + item.gstRate / 100),
      cell: item => (
        <span className="text-sm font-medium text-foreground tabular-nums">
          ₹{(item.basePrice * (1 + item.gstRate / 100)).toFixed(2)}
        </span>
      ),
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
      key: 'tags',
      header: 'Tags',
      accessor: item => `${item.schedule ?? ''} ${item.requiresColdChain ? 'Cold' : ''}`,
      cell: item => (
        <div className="flex gap-1">
          {item.schedule && (
            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-500/20 dark:text-red-400" title="Controlled Substance">
              Rx ({item.schedule})
            </span>
          )}
          {item.requiresColdChain && (
            <span className="flex items-center gap-0.5 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
              <Snowflake className="h-3 w-3" aria-hidden /> Cold
            </span>
          )}
        </div>
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
          <StatGrid>
            {stats.map((s, i) => (
              <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} icon={s.icon} tone={s.tone} delay={i * 0.05} />
            ))}
          </StatGrid>

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
                  <div className="rounded-xl border border-danger/30 bg-danger-soft p-3">
                    <div className="mb-1 flex items-start justify-between">
                      <span className="text-xs font-bold text-danger">Severe Interaction</span>
                      <span className="font-mono text-xs text-danger/80">RX-2026-885</span>
                    </div>
                    <p className="mb-2 text-xs text-foreground">Patient prescribed Warfarin + Aspirin. High risk of bleeding.</p>
                    <button
                      onClick={() => setActiveTab('queue')}
                      className="text-xs font-semibold text-danger hover:underline"
                    >
                      Review &amp; Hold
                    </button>
                  </div>
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
                  <ul className="divide-y divide-border">
                    {rxQueue.filter(r => r.status === 'Ready').map((rx, i) => (
                      <li key={i} className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-muted/40">
                        <div>
                          <p className="text-sm font-bold text-foreground">{rx.rxId}</p>
                          <p className="text-xs text-muted-foreground">{rx.patient} · {rx.items} items</p>
                        </div>
                        <Button size="sm" disabled title="Coming soon">Dispense</Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="queue" className="mt-6">
          <DataTable<RxItem>
            columns={queueColumns}
            data={rxQueue}
            rowKey={(r, i) => `${r.rxId}-${i}`}
            searchPlaceholder="Search Rx ID or Patient..."
            exportName="prescription-queue"
            emptyTitle="No prescriptions in queue"
            emptyDescription="New prescriptions will appear here as they are received."
            rowActions={rx => (
              <div className="flex items-center justify-end gap-2">
                {rx.status === 'Verification' && <Button variant="secondary" size="sm" disabled title="Coming soon">Verify Rx</Button>}
                {rx.status === 'Ready' && <Button size="sm" disabled title="Coming soon">Dispense</Button>}
                <Button variant="ghost" size="icon-sm" aria-label={`Print ${rx.rxId}`} disabled title="Coming soon">
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
        </TabsContent>

        <TabsContent value="Inventory" className="mt-6">
          <DataTable<InventoryItem>
            columns={inventoryColumns}
            data={inventory}
            rowKey={(item, i) => `${item.id}-${i}`}
            searchPlaceholder="Search Brand, Generic, ID..."
            exportName="drug-inventory"
            emptyTitle="No inventory items"
            emptyDescription="The master drug inventory is empty."
          />
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
