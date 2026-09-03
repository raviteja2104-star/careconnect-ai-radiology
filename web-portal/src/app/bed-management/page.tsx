'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Bed, Users, Activity, Map as MapIcon, Grid, LayoutList,
  Search, Wrench, Brush, ShieldAlert, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardContent,
  Tabs, TabsList, TabsTrigger, TabsContent, Badge, Button, Select, Input,
  Progress, EmptyState,
} from '@/components/ui';

type BedStatus = 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance' | 'Reserved';

const STATUS_TONE: Record<BedStatus, 'success' | 'brand' | 'warning' | 'danger' | 'info'> = {
  Available: 'success',
  Occupied: 'brand',
  Cleaning: 'warning',
  Maintenance: 'danger',
  Reserved: 'info',
};

export default function BedManagement() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [search, setSearch] = useState('');

  // Mock Data
  const stats = [
    { label: 'Total Beds', value: '450', sub: 'across 12 wards', icon: Bed, tone: 'brand' as const },
    { label: 'Occupancy Rate', value: '82%', sub: '369 beds occupied', icon: Activity, tone: 'teal' as const },
    { label: 'Pending Cleaning', value: '14', sub: 'Housekeeping queue', icon: Brush, tone: 'amber' as const },
    { label: 'Under Maintenance', value: '5', sub: 'Biomedical / Repair', icon: Wrench, tone: 'rose' as const },
  ];

  const bedExplorerData = [
    { id: 'W1-101-A', type: 'General', status: 'Occupied' as BedStatus, patient: 'Rajesh Kumar', gender: 'M', admitDate: '2 Days ago', isolation: false },
    { id: 'W1-101-B', type: 'General', status: 'Available' as BedStatus, patient: null, gender: null, admitDate: null, isolation: false },
    { id: 'W1-102-A', type: 'Isolation', status: 'Occupied' as BedStatus, patient: 'Sunil Sharma', gender: 'M', admitDate: '5 Days ago', isolation: true },
    { id: 'W1-103-A', type: 'Private', status: 'Cleaning' as BedStatus, patient: null, gender: null, admitDate: null, isolation: false },
    { id: 'W1-104-A', type: 'Private', status: 'Maintenance' as BedStatus, patient: null, gender: null, admitDate: null, isolation: false },
    { id: 'W1-105-A', type: 'General', status: 'Reserved' as BedStatus, patient: 'Incoming ADT', gender: 'F', admitDate: 'ETA 2hrs', isolation: false },
    { id: 'W2-ICU-1', type: 'ICU', status: 'Occupied' as BedStatus, patient: 'Vikram Singh', gender: 'M', admitDate: '1 Day ago', isolation: false },
    { id: 'W2-ICU-2', type: 'ICU', status: 'Occupied' as BedStatus, patient: 'Meena Gupta', gender: 'F', admitDate: '12 Hours ago', isolation: true },
  ];

  const wards = [
    { name: 'Intensive Care Unit (ICU)', cap: 20, occ: 19, pct: 95 },
    { name: 'General Medical (Ward 4)', cap: 60, occ: 52, pct: 86 },
    { name: 'Maternity (Ward 2)', cap: 40, occ: 28, pct: 70 },
    { name: 'Pediatrics (Ward 3)', cap: 30, occ: 15, pct: 50 },
  ];

  const adtRequests = [
    {
      kind: 'Admission (ER)', kindTone: 'brand' as const, time: '10 mins ago',
      patient: 'Ramesh Kumar (45, M)', detail: 'Req: ICU Bed • Suspected MI • Isolation: No',
      cta: 'Allocate Bed (AI)', primary: true,
    },
    {
      kind: 'Transfer (Internal)', kindTone: 'warning' as const, time: '25 mins ago',
      patient: 'Sunita Rao (65, F)', detail: 'From: ICU-1 • To: General Ward • Oxygen required',
      cta: 'Review Request', primary: false,
    },
  ];

  const q = search.trim().toLowerCase();
  const visibleBeds = bedExplorerData.filter(
    (b) => !q || b.id.toLowerCase().includes(q) || (b.patient || '').toLowerCase().includes(q) || b.type.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bed & Ward Management"
        description="Enterprise capacity management — live occupancy, allocation, and housekeeping."
        crumbs={[{ label: 'Clinical', href: '/dashboard' }, { label: 'Bed Management' }]}
        actions={
          <Button onClick={() => setActiveTab('bed explorer')}>
            <Users className="h-4 w-4" aria-hidden /> AI Bed Allocation
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="bed explorer">Bed Explorer</TabsTrigger>
          <TabsTrigger value="live floor map">Live Floor Map</TabsTrigger>
          <TabsTrigger value="housekeeping queue">Housekeeping Queue</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6 space-y-6">
          <StatGrid>
            {stats.map((s, i) => (
              <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} icon={s.icon} tone={s.tone} delay={i * 0.05} />
            ))}
          </StatGrid>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Pending ADT Requests */}
            <Card className="xl:col-span-1">
              <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border">
                <CardTitle>Pending ADT Requests</CardTitle>
                <Badge tone="warning">3 Requests</Badge>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {adtRequests.map((req, i) => (
                  <motion.div
                    key={req.patient}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="rounded-xl border border-border bg-muted/40 p-3.5"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <Badge tone={req.kindTone}>{req.kind}</Badge>
                      <span className="text-xs text-subtle-foreground whitespace-nowrap">{req.time}</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{req.patient}</p>
                    <p className="mt-0.5 mb-3 text-xs text-muted-foreground">{req.detail}</p>
                    <Button
                      variant={req.primary ? 'primary' : 'outline'}
                      size="sm"
                      className="w-full"
                      onClick={() => (req.primary ? setActiveTab('bed explorer') : router.push('/adt'))}
                    >
                      {req.primary && <Sparkles className="h-3.5 w-3.5" aria-hidden />}
                      {req.cta}
                    </Button>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Ward Occupancy */}
            <Card className="xl:col-span-2">
              <CardHeader className="border-b border-border">
                <CardTitle>Ward Occupancy Heatmap</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col justify-center gap-6 pt-6">
                {wards.map((ward) => (
                  <Progress
                    key={ward.name}
                    label={ward.name}
                    value={ward.pct}
                    tone={ward.pct > 90 ? 'danger' : ward.pct > 75 ? 'warning' : 'success'}
                    showValue
                  />
                ))}
                <p className="text-xs text-subtle-foreground">
                  Occupied / capacity: ICU 19/20 · General 52/60 · Maternity 28/40 · Pediatrics 15/30
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bed explorer" className="mt-6">
          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b border-border">
              <div className="flex gap-2">
                <Select className="h-9 w-40" aria-label="Filter by building">
                  <option>All Buildings</option>
                  <option>Main Tower</option>
                  <option>East Wing</option>
                </Select>
                <Select className="h-9 w-36" aria-label="Filter by ward">
                  <option>All Wards</option>
                  <option>General W1</option>
                  <option>ICU W2</option>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-64">
                  <Input
                    icon={<Search />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search bed, patient…"
                    aria-label="Search beds"
                    className="h-9"
                  />
                </div>
                <div className="flex rounded-lg border border-border bg-muted p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                    aria-pressed={viewMode === 'grid'}
                    className={cn('rounded-md p-1.5 transition-colors', viewMode === 'grid' ? 'bg-card text-primary shadow-soft' : 'text-muted-foreground')}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                    aria-pressed={viewMode === 'list'}
                    className={cn('rounded-md p-1.5 transition-colors', viewMode === 'list' ? 'bg-card text-primary shadow-soft' : 'text-muted-foreground')}
                  >
                    <LayoutList className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {visibleBeds.length === 0 ? (
                <EmptyState icon={Bed} title="No beds match" description={`No results for “${search}”.`} action={{ label: 'Clear search', onClick: () => setSearch('') }} />
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {visibleBeds.map((bed, i) => (
                    <motion.div
                      key={bed.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                      className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-float"
                    >
                      {bed.isolation && (
                        <div className="absolute right-0 top-0 z-10 flex items-center gap-1 rounded-bl-xl bg-warning px-2 py-0.5 text-[10px] font-bold text-white">
                          <ShieldAlert className="h-3 w-3" aria-hidden /> Isolation
                        </div>
                      )}
                      <div className="mb-4 flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{bed.id}</h3>
                          <p className="text-xs font-medium text-muted-foreground">{bed.type}</p>
                        </div>
                        <Badge tone={STATUS_TONE[bed.status]} dot pulse={bed.status === 'Occupied'}>
                          {bed.status}
                        </Badge>
                      </div>
                      {bed.patient ? (
                        <div className="border-t border-border pt-3">
                          <p className="text-sm font-semibold text-foreground">{bed.patient} ({bed.gender})</p>
                          <p className="mt-1 text-xs text-muted-foreground">{bed.admitDate}</p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center border-t border-border py-2.5 pt-3 opacity-60">
                          <span className="text-xs font-medium text-subtle-foreground">— Empty —</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/60">
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th scope="col" className="px-5 py-3.5 font-semibold">Bed ID</th>
                        <th scope="col" className="px-5 py-3.5 font-semibold">Type</th>
                        <th scope="col" className="px-5 py-3.5 font-semibold">Status</th>
                        <th scope="col" className="px-5 py-3.5 font-semibold">Patient</th>
                        <th scope="col" className="px-5 py-3.5 font-semibold">Duration</th>
                        <th scope="col" className="px-5 py-3.5 font-semibold">Tags</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {visibleBeds.map((bed) => (
                        <tr key={bed.id} className="transition-colors hover:bg-muted/40">
                          <td className="px-5 py-3.5 font-bold text-foreground">{bed.id}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{bed.type}</td>
                          <td className="px-5 py-3.5"><Badge tone={STATUS_TONE[bed.status]} dot>{bed.status}</Badge></td>
                          <td className="px-5 py-3.5 font-medium text-foreground">{bed.patient || <span className="text-subtle-foreground">–</span>}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{bed.admitDate || <span className="text-subtle-foreground">–</span>}</td>
                          <td className="px-5 py-3.5">{bed.isolation && <Badge tone="warning">Isolation</Badge>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live floor map" className="mt-6">
          <EmptyState
            icon={MapIcon}
            title="Live Interactive Floor Map"
            description="The 2D visual floor plan rendering engine is loading. This feature allows spatial visualization of ward capacities, isolation zones, and nurse routes."
          />
        </TabsContent>

        <TabsContent value="housekeeping queue" className="mt-6">
          <EmptyState
            icon={Brush}
            title="Housekeeping Queue"
            description="Turnaround tasks will appear here as beds are released for cleaning."
          />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6">
          <EmptyState
            icon={Wrench}
            title="Maintenance"
            description="Biomedical and repair work orders for out-of-service beds will appear here."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
