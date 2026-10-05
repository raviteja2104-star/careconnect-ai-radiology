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

type Transfer = { id: string; patientName: string; from: string; to: string; status: string; scheduledAt?: string; reason?: string };
type MaintenanceJob = { id: string; unitId: string; type: string; status: string; scheduledAt?: string; technician?: string; notes?: string };

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
  const [showNewCall, setShowNewCall] = useState(false);
  const [callDraft, setCallDraft] = useState({ location: '', complaint: '', priority: 'Code 2' });
  const [localIncidents, setLocalIncidents] = useState<Incident[]>([]);
  const [managingIncident, setManagingIncident] = useState<Incident | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});

  const emsQuery = useQuery<{ success: boolean; data: EMSResponse }>({
    queryKey: ['ward-ems'],
    queryFn: () =>
      fetch(`${API_BASE}/api/ward/ems`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 15_000,
  });

  const interFacilityQuery = useQuery<{ data?: Transfer[]; transfers?: Transfer[] } | Transfer[]>({
    queryKey: ['ems-inter-facility'],
    queryFn: () => fetch(`${API_BASE}/api/ems/inter-facility`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 30_000,
  });

  const maintenanceQuery = useQuery<{ data?: MaintenanceJob[]; jobs?: MaintenanceJob[] } | MaintenanceJob[]>({
    queryKey: ['ems-maintenance'],
    queryFn: () => fetch(`${API_BASE}/api/ems/maintenance`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 30_000,
  });

  const apiData = emsQuery.data?.data;
  const apiStats = apiData?.stats;
  const dispatchQueue: Incident[] = [...(apiData?.incidents ?? []), ...localIncidents];
  const units = apiData?.units ?? [];

  const interFacilityRaw = interFacilityQuery.data;
  const transfers: Transfer[] = Array.isArray(interFacilityRaw)
    ? interFacilityRaw
    : (interFacilityRaw as { data?: Transfer[]; transfers?: Transfer[] } | undefined)?.data
      ?? (interFacilityRaw as { data?: Transfer[]; transfers?: Transfer[] } | undefined)?.transfers
      ?? [];

  const maintenanceRaw = maintenanceQuery.data;
  const maintenanceJobs: MaintenanceJob[] = Array.isArray(maintenanceRaw)
    ? maintenanceRaw
    : (maintenanceRaw as { data?: MaintenanceJob[]; jobs?: MaintenanceJob[] } | undefined)?.data
      ?? (maintenanceRaw as { data?: MaintenanceJob[]; jobs?: MaintenanceJob[] } | undefined)?.jobs
      ?? [];

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

  const unitColumns: Column<{ id: string; type: string; status: string; crew: string }>[] = [
    { key: 'id', header: 'Unit ID', cell: (r) => <span className="font-mono text-sm font-semibold text-foreground">{r.id}</span> },
    { key: 'type', header: 'Type', cell: (r) => <span className="text-sm text-foreground">{r.type}</span> },
    {
      key: 'status', header: 'Status',
      cell: (r) => <Badge tone={r.status === 'Available' ? 'success' : r.status === 'En Route' ? 'warning' : 'neutral'} dot>{r.status}</Badge>,
    },
    { key: 'crew', header: 'Crew', cell: (r) => <span className="text-sm text-foreground">{r.crew}</span> },
  ];

  const transferColumns: Column<Transfer>[] = [
    { key: 'id', header: 'Transfer ID', cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
    { key: 'patientName', header: 'Patient', cell: (r) => <span className="text-sm font-semibold text-foreground">{r.patientName}</span> },
    { key: 'from', header: 'From', cell: (r) => <span className="text-sm text-foreground">{r.from}</span> },
    { key: 'to', header: 'To', cell: (r) => <span className="text-sm text-foreground">{r.to}</span> },
    { key: 'status', header: 'Status', cell: (r) => <Badge tone={r.status === 'Completed' ? 'success' : r.status === 'In Transit' ? 'warning' : 'neutral'} dot>{r.status}</Badge> },
    { key: 'reason', header: 'Reason', cell: (r) => <span className="text-sm text-muted-foreground">{r.reason ?? '—'}</span> },
  ];

  const maintenanceColumns: Column<MaintenanceJob>[] = [
    { key: 'unitId', header: 'Unit', cell: (r) => <span className="font-mono text-sm font-semibold text-foreground">{r.unitId}</span> },
    { key: 'type', header: 'Job Type', cell: (r) => <span className="text-sm text-foreground">{r.type}</span> },
    { key: 'status', header: 'Status', cell: (r) => <Badge tone={r.status === 'Completed' ? 'success' : r.status === 'In Progress' ? 'warning' : 'neutral'} dot>{r.status}</Badge> },
    { key: 'technician', header: 'Technician', cell: (r) => <span className="text-sm text-muted-foreground">{r.technician ?? '—'}</span> },
    { key: 'scheduledAt', header: 'Scheduled', cell: (r) => <span className="text-sm text-muted-foreground">{r.scheduledAt ?? '—'}</span> },
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
          <Button variant="danger" onClick={() => setShowNewCall(true)}>
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
                  rowActions={(row) => <Button variant="outline" size="sm" onClick={() => setManagingIncident(row)}>Manage</Button>}
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
                {dispatchQueue.length === 0 ? (
                  <EmptyState icon={Radio} title="No active incidents" description="Unit-assignment recommendations will appear here when live incidents are logged." />
                ) : (
                  <ul className="space-y-2">
                    {dispatchQueue.slice(0, 5).map((incident) => (
                      <li key={incident.id} className="rounded-xl border border-border bg-muted/30 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <PriorityBadge priority={incident.priority} />
                          <span className="font-mono text-xs text-muted-foreground">{incident.eta}</span>
                        </div>
                        <p className="mt-1.5 text-sm font-semibold text-foreground">{incident.complaint}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{incident.location}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Unit: <span className="font-mono font-semibold text-foreground">{incident.unit}</span>
                          {' · '}
                          <Badge tone={incident.status === 'Awaiting Dispatch' ? 'warning' : 'neutral'}>{incident.status}</Badge>
                        </p>
                      </li>
                    ))}
                    {dispatchQueue.length > 5 && (
                      <p className="text-center text-xs text-muted-foreground">+{dispatchQueue.length - 5} more incidents in queue</p>
                    )}
                  </ul>
                )}
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

        <TabsContent value="fleet tracking" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" aria-hidden /> Fleet Status
              </CardTitle>
              <CardDescription>Live status of all ambulance and response units.</CardDescription>
            </CardHeader>
            <CardContent>
              {emsQuery.isLoading ? (
                <SkeletonCard />
              ) : units.length === 0 ? (
                <EmptyState icon={Truck} title="No units registered" description="Fleet units will appear here once they are added to the system." />
              ) : (
                <DataTable<{ id: string; type: string; status: string; crew: string }>
                  columns={unitColumns}
                  data={units}
                  rowKey={(r) => r.id}
                  searchPlaceholder="Search unit ID, type, crew…"
                  emptyTitle="No units found"
                  emptyDescription="No matching units in the fleet."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inter-facility" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" aria-hidden /> Inter-Facility Transfers
              </CardTitle>
              <CardDescription>Active and scheduled patient transfers between facilities.</CardDescription>
            </CardHeader>
            <CardContent>
              {interFacilityQuery.isLoading ? (
                <SkeletonCard />
              ) : transfers.length === 0 ? (
                <EmptyState icon={Map} title="No transfers recorded" description="Active and scheduled inter-facility transfers will appear here." />
              ) : (
                <DataTable<Transfer>
                  columns={transferColumns}
                  data={transfers}
                  rowKey={(r) => r.id}
                  searchPlaceholder="Search patient, facility…"
                  emptyTitle="No transfers found"
                  emptyDescription="No matching transfers."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-primary" aria-hidden /> Vehicle Maintenance
              </CardTitle>
              <CardDescription>Scheduled and in-progress maintenance jobs for the fleet.</CardDescription>
            </CardHeader>
            <CardContent>
              {maintenanceQuery.isLoading ? (
                <SkeletonCard />
              ) : maintenanceJobs.length === 0 ? (
                <EmptyState icon={Navigation} title="No maintenance records" description="Scheduled and active vehicle maintenance jobs will appear here." />
              ) : (
                <DataTable<MaintenanceJob>
                  columns={maintenanceColumns}
                  data={maintenanceJobs}
                  rowKey={(r) => r.id}
                  searchPlaceholder="Search unit, job type…"
                  emptyTitle="No jobs found"
                  emptyDescription="No matching maintenance jobs."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── New Emergency Call Modal ── */}
      {showNewCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowNewCall(false)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-danger-soft text-danger"><Siren className="h-5 w-5" /></span>
              <div><h2 className="text-lg font-bold text-foreground">New Emergency Call</h2><p className="text-xs text-muted-foreground">Log and dispatch a new incident</p></div>
            </div>
            <div className="space-y-3 mb-6">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location / Address</label>
                <input type="text" value={callDraft.location} onChange={e => setCallDraft(d => ({ ...d, location: e.target.value }))} placeholder="Street address or landmark" className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chief Complaint</label>
                <input type="text" value={callDraft.complaint} onChange={e => setCallDraft(d => ({ ...d, complaint: e.target.value }))} placeholder="e.g. Chest pain, Trauma, Unconscious" className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</label>
                <select value={callDraft.priority} onChange={e => setCallDraft(d => ({ ...d, priority: e.target.value }))} className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="Code 3">Code 3 — Life threatening (lights & sirens)</option>
                  <option value="Code 2">Code 2 — Urgent (no lights)</option>
                  <option value="Code 1">Code 1 — Non-urgent</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewCall(false)}>Cancel</Button>
              <Button variant="danger" className="flex-1" disabled={!callDraft.location.trim() || !callDraft.complaint.trim()} onClick={() => {
                const now = new Date();
                const t = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
                const newIncident: Incident = {
                  id: `INC-${Date.now().toString(36).toUpperCase().slice(-5)}`,
                  priority: callDraft.priority, complaint: callDraft.complaint,
                  location: callDraft.location, unit: 'Awaiting Assignment',
                  status: 'Awaiting Dispatch', eta: '—', time: t,
                };
                setLocalIncidents(prev => [newIncident, ...prev]);
                setCallDraft({ location: '', complaint: '', priority: 'Code 2' });
                setShowNewCall(false);
              }}>
                <Radio className="h-4 w-4" /> Dispatch Call
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage Incident Modal ── */}
      {managingIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setManagingIncident(null)}>
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">{managingIncident.id}</h2>
                <p className="text-xs text-muted-foreground">{managingIncident.complaint} · {managingIncident.location}</p>
              </div>
              <PriorityBadge priority={managingIncident.priority} />
            </div>
            <div className="mb-6 space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Unit</span><span className="font-semibold text-foreground">{managingIncident.unit}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">ETA</span><span className="font-semibold text-foreground">{managingIncident.eta}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Time logged</span><span className="font-semibold text-foreground">{managingIncident.time}</span></div>
            </div>
            <div className="mb-6">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Update Status</label>
              <select
                value={statusOverrides[managingIncident.id] ?? managingIncident.status}
                onChange={e => setStatusOverrides(prev => ({ ...prev, [managingIncident.id]: e.target.value }))}
                className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option>Awaiting Dispatch</option>
                <option>En Route</option>
                <option>On Scene</option>
                <option>Transporting</option>
                <option>Available</option>
                <option>Closed</option>
              </select>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setManagingIncident(null)}>Close</Button>
              <Button className="flex-1" onClick={() => setManagingIncident(null)}>
                <Activity className="h-4 w-4" /> Save Status
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
