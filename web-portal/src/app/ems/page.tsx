'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Ambulance, MapPin, PhoneCall, AlertTriangle,
  Activity, Clock, Radio, Truck, FileText, Navigation, Map, Sparkles, Siren,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription,
  CardContent, Tabs, TabsList, TabsTrigger, TabsContent, Badge, Button,
  DataTable, type Column, EmptyState, SkeletonCard,
} from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: 'Bearer ' + token } : {};
}

type Incident = {
  id: string; priority: string; complaint: string; location: string;
  unit: string; status: string; eta: string; time: string;
};

type EMSStats = {
  activeIncidents: number; unitsEnRoute: number; avgResponseSecs: number; availableALS: string;
};

type EMSResponse = {
  stats: EMSStats;
  incidents: Incident[];
  units: Array<{ id: string; type: string; status: string; crew: string }>;
};

function PriorityBadge({ priority }: { priority: string }) {
  switch (priority) {
    case 'Code 3': return <Badge tone="danger" pulse>{priority}</Badge>;
    case 'Code 2': return <Badge tone="warning">{priority}</Badge>;
    case 'Code 1': return <Badge tone="info">{priority}</Badge>;
    default: return <Badge tone="neutral">{priority}</Badge>;
  }
}

function fmtAvgResponse(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

const MODULE_TABS = ['dispatch center', 'fleet tracking', 'epcr handovers', 'inter-facility', 'maintenance'];

export default function EMSDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dispatch center');

  const emsQuery = useQuery<{ success: boolean; data: EMSResponse }>({
    queryKey: ['ward-ems'],
    queryFn: () =>
      fetch(`${API_BASE}/api/ward/ems`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 15_000,
  });

  const apiData = emsQuery.data?.data;
  const apiStats = apiData?.stats;
  const dispatchQueue: Incident[] = apiData?.incidents ?? [];

  const stats = [
    { label: 'Active Incidents', value: apiStats ? String(apiStats.activeIncidents) : '—', icon: AlertTriangle, tone: 'rose'    as const, sub: 'Across the metro region' },
    { label: 'Units En Route',   value: apiStats ? String(apiStats.unitsEnRoute)    : '—', icon: Truck,         tone: 'brand'   as const, sub: 'Lights & sirens active' },
    { label: 'Avg Response',     value: apiStats ? fmtAvgResponse(apiStats.avgResponseSecs) : '—', icon: Clock, tone: 'violet'  as const, sub: 'Call to on-scene' },
    { label: 'Available ALS',    value: apiStats?.availableALS ?? '—',                       icon: Activity,      tone: 'emerald' as const, sub: 'Advanced life support units' },
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
          {emsQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : emsQuery.isError ? (
            <p className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">Failed to load EMS data. Please refresh.</p>
          ) : (
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
          )}

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
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden /> AI Dispatcher
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={Radio}
                  title="No active dispatch recommendations"
                  description="AI unit-assignment and hospital-routing recommendations will appear here when live incidents are connected to the dispatch engine."
                />
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

          <Card>
            <CardContent className="py-10">
              <EmptyState
                icon={FileText}
                title="No inbound ePCR records"
                description="When a paramedic crew opens an electronic patient care record en route, the patient's pre-hospital vitals, interventions, and ETA will appear here for ED preparation."
              />
            </CardContent>
          </Card>
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
