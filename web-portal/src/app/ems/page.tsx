'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Ambulance, MapPin, PhoneCall, AlertTriangle,
  Activity, Clock, Radio, Truck, FileText, Navigation, Map, Sparkles, Siren,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription,
  CardContent, Tabs, TabsList, TabsTrigger, TabsContent, Badge, Button,
  DataTable, type Column, EmptyState,
} from '@/components/ui';

type Incident = {
  id: string; priority: string; complaint: string; location: string;
  unit: string; status: string; eta: string; time: string;
};

function PriorityBadge({ priority }: { priority: string }) {
  switch (priority) {
    case 'Code 3': return <Badge tone="danger" pulse>{priority}</Badge>;
    case 'Code 2': return <Badge tone="warning">{priority}</Badge>;
    case 'Code 1': return <Badge tone="info">{priority}</Badge>;
    default: return <Badge tone="neutral">{priority}</Badge>;
  }
}

const MODULE_TABS = ['dispatch center', 'fleet tracking', 'epcr handovers', 'inter-facility', 'maintenance'];

export default function EMSDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dispatch center');

  // KPI Stats
  const stats = [
    { label: 'Active Incidents', value: '8', icon: AlertTriangle, tone: 'rose' as const, sub: 'Across the metro region' },
    { label: 'Units En Route', value: '4', icon: Truck, tone: 'brand' as const, sub: 'Lights & sirens active' },
    { label: 'Avg Response', value: '8m 42s', icon: Clock, tone: 'violet' as const, sub: 'Call to on-scene' },
    { label: 'Available ALS', value: '2 / 5', icon: Activity, tone: 'emerald' as const, sub: 'Advanced life support units' },
  ];

  const dispatchQueue: Incident[] = [
    { id: 'INC-9912', priority: 'Code 3', complaint: 'Cardiac Arrest', location: '124 MG Road, Indiranagar', unit: 'ALS-04', status: 'On Scene', eta: '-', time: '14:22' },
    { id: 'INC-9913', priority: 'Code 2', complaint: 'MVA, Severe Trauma', location: 'Ring Road Junction', unit: 'ALS-01', status: 'En Route', eta: '4m', time: '14:35' },
    { id: 'INC-9914', priority: 'Code 2', complaint: 'Suspected Stroke', location: 'Block B, Koramangala', unit: 'BLS-08', status: 'Transporting', eta: '12m (To ED)', time: '14:10' },
    { id: 'INC-9915', priority: 'Code 1', complaint: 'Fall, Hip Pain', location: 'Sunrise Apts, HSR', unit: 'Pending', status: 'Awaiting Dispatch', eta: '-', time: '14:40' },
  ];

  const incidentColumns: Column<Incident>[] = [
    {
      key: 'id', header: 'Incident', sortable: true,
      accessor: (row) => `${row.id} ${row.priority}`,
      cell: (row) => (
        <div className="space-y-1">
          <PriorityBadge priority={row.priority} />
          <span className="block font-mono text-xs text-muted-foreground">{row.id} • {row.time}</span>
        </div>
      ),
    },
    {
      key: 'location', header: 'Location',
      cell: (row) => (
        <div className="flex items-start gap-1.5 text-sm font-medium text-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-subtle-foreground" aria-hidden />
          <span>{row.location}</span>
        </div>
      ),
    },
    {
      key: 'complaint', header: 'Complaint', sortable: true,
      cell: (row) => <span className="text-sm font-semibold text-foreground">{row.complaint}</span>,
    },
    {
      key: 'unit', header: 'Unit / ETA',
      accessor: (row) => `${row.unit} ${row.eta}`,
      cell: (row) => (
        <div>
          <div className="text-sm font-bold text-primary">{row.unit}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden /> {row.eta}
          </div>
        </div>
      ),
    },
    {
      key: 'status', header: 'Status',
      cell: (row) => (
        <Badge tone={row.status === 'Awaiting Dispatch' ? 'warning' : 'neutral'}>{row.status}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2.5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-danger-soft text-danger">
              <Ambulance className="h-5 w-5" aria-hidden />
            </span>
            Ambulance &amp; EMS Command
          </span>
        }
        description="Computer-Aided Dispatch & Pre-Hospital Care"
        crumbs={[{ label: 'Home', href: '/' }, { label: 'EMS' }]}
        actions={
          <Button variant="danger" disabled title="Coming soon">
            <PhoneCall className="h-4 w-4" aria-hidden /> New Emergency Call
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto max-w-full flex-wrap overflow-x-auto no-scrollbar">
          {MODULE_TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="capitalize">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dispatch center" className="mt-6 space-y-6">
          <StatGrid>
            {stats.map((stat, idx) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                sub={stat.sub}
                icon={stat.icon}
                tone={stat.tone}
                delay={idx * 0.05}
              />
            ))}
          </StatGrid>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Dispatch Grid */}
            <Card className="xl:col-span-2">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="h-5 w-5 text-danger" aria-hidden /> Active Incidents
                  </CardTitle>
                  <CardDescription>Live dispatch queue, newest calls first.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('fleet tracking')}>
                  <Map className="h-4 w-4" aria-hidden /> View Map
                </Button>
              </CardHeader>
              <CardContent>
                <DataTable<Incident>
                  columns={incidentColumns}
                  data={dispatchQueue}
                  rowKey={(row) => row.id}
                  searchPlaceholder="Search incident, location, unit…"
                  exportName="ems-dispatch-queue"
                  emptyTitle="No active incidents"
                  emptyDescription="New emergency calls will appear here as they are logged."
                  rowActions={() => <Button variant="outline" size="sm" disabled title="Coming soon">Manage</Button>}
                />
              </CardContent>
            </Card>

            {/* AI Dispatcher Panel */}
            <Card variant="glass" className="h-full">
              <CardHeader className="flex-row items-center gap-2 space-y-0">
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden /> AI Dispatcher
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.1 }}
                  className="rounded-2xl border border-primary/20 bg-info-soft p-4"
                >
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-info">Recommendation</p>
                  <p className="mb-3 text-sm text-foreground">
                    For INC-9915 (Fall, Hip Pain), dispatch <strong>BLS-02</strong>. Unit is currently 1.2km away at Fuel Station.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" disabled title="Coming soon">Assign BLS-02</Button>
                    <Button size="sm" variant="outline" className="flex-1" disabled title="Coming soon">Review</Button>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.18 }}
                  className="rounded-2xl border border-danger/20 bg-danger-soft p-4"
                >
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-danger">
                    <Siren className="h-3.5 w-3.5" aria-hidden /> Hospital Reroute Alert
                  </p>
                  <p className="mb-3 text-sm text-foreground">
                    City Hospital ED is currently at capacity. Reroute INC-9914 (Stroke) to Central Stroke Center (ETA +4m).
                  </p>
                  <Button size="sm" variant="danger" className="w-full" disabled title="Coming soon">Notify Crew &amp; Reroute</Button>
                </motion.div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="epcr handovers" className="mt-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-info-soft p-4"
          >
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
              <FileText className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h3 className="text-lg font-bold text-foreground">Electronic Patient Care Records (ePCR)</h3>
              <p className="text-sm text-muted-foreground">Inbound patient telemetery and digital handovers to the Emergency Department.</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Inbound ePCR Alert */}
            <Card>
              <CardHeader className="flex-row items-start justify-between space-y-0 border-b border-border pb-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Badge tone="warning">Inbound</Badge>
                    <CardTitle className="text-lg">Suspected Stroke • ETA: 12m</CardTitle>
                  </div>
                  <CardDescription>Unit: BLS-08 • Paramedic: John D.</CardDescription>
                </div>
                <Button size="sm" onClick={() => router.push('/emergency')}>Alert Stroke Team</Button>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <div>
                  <h5 className="mb-2 text-xs font-bold uppercase tracking-wider text-subtle-foreground">
                    Vitals (Last updated 2m ago)
                  </h5>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'HR', value: '88', alert: false },
                      { label: 'BP', value: '160/95', alert: true },
                      { label: 'SpO2', value: '97%', alert: false },
                      { label: 'GCS', value: '13', alert: false },
                    ].map((vital) => (
                      <div
                        key={vital.label}
                        className={`rounded-xl border p-2.5 ${
                          vital.alert ? 'border-danger/30 bg-danger-soft' : 'border-border bg-muted'
                        }`}
                      >
                        <div className={`text-[10px] font-semibold uppercase ${vital.alert ? 'text-danger' : 'text-muted-foreground'}`}>
                          {vital.label}
                        </div>
                        <div className={`text-sm font-bold tabular-nums ${vital.alert ? 'text-danger' : 'text-foreground'}`}>
                          {vital.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="mb-1.5 text-xs font-bold uppercase tracking-wider text-subtle-foreground">
                    Pre-Hospital Interventions
                  </h5>
                  <ul className="list-inside list-disc space-y-1 text-sm text-foreground">
                    <li>O2 administered via nasal cannula (2L/min)</li>
                    <li>IV access established (18G Left AC)</li>
                    <li>Blood glucose: 110 mg/dL</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {['fleet tracking', 'inter-facility', 'maintenance'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <Card>
              <CardContent className="py-10">
                <EmptyState
                  icon={Navigation}
                  title={tab.replace(/\b\w/g, (c) => c.toUpperCase())}
                  description={`The ${tab} view requires active GIS and fleet tracking integrations.`}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
