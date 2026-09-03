'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, HardDrive, GraduationCap, LifeBuoy, TrendingUp,
  GitBranch, Clock, Users, Plus, Award, Stethoscope, FileSignature, Star,
} from 'lucide-react';
import {
  enterpriseOperationsService, HospitalCustomerProject, DeviceInstallationRecord,
  SupportTicketRecord, LMSTrainingCourse, ReleaseEnvironmentStatus
} from '@/services/enterpriseOperationsService';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription, CardContent,
  Tabs, TabsList, TabsTrigger, TabsContent, Badge, Button, Input, Select, Label,
  Progress, DataTable, type Column,
} from '@/components/ui';

type OpsTab = 'PROJECTS' | 'DEVICES' | 'LMS' | 'SUPPORT' | 'ADOPTION' | 'RELEASES';

const sevTone: Record<SupportTicketRecord['severity'], 'neutral' | 'warning' | 'danger'> = {
  MINOR: 'neutral',
  MAJOR: 'warning',
  CRITICAL: 'danger',
};

export default function EnterpriseOperationsPage() {
  const [activeTab, setActiveTab] = useState<OpsTab>('PROJECTS');

  // States
  const [projects] = useState<HospitalCustomerProject[]>(enterpriseOperationsService.getProjects());
  const [devices] = useState<DeviceInstallationRecord[]>(enterpriseOperationsService.getDevices());
  const [tickets, setTickets] = useState<SupportTicketRecord[]>(enterpriseOperationsService.getTickets());
  const [courses] = useState<LMSTrainingCourse[]>(enterpriseOperationsService.getLMS());
  const [releases] = useState<ReleaseEnvironmentStatus[]>(enterpriseOperationsService.getReleases());
  const [adoption] = useState(enterpriseOperationsService.getCustomerAdoptionMetrics());

  // Ticket Form State
  const [newHosp, setNewHosp] = useState('Apollo Super Specialty Hospital Main');
  const [newTitle, setNewTitle] = useState('PACS DICOM Gateway WADO-RS connection latency check');
  const [newSev, setNewSev] = useState<'MINOR' | 'MAJOR' | 'CRITICAL'>('MINOR');

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    enterpriseOperationsService.createTicket(newHosp, newTitle, newSev);
    setTickets([...enterpriseOperationsService.getTickets()]);
  };

  const deviceColumns: Column<DeviceInstallationRecord>[] = [
    {
      key: 'deviceName',
      header: 'Device',
      sortable: true,
      cell: (d) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
            <HardDrive className="h-4 w-4" aria-hidden />
          </span>
          <span className="font-medium text-foreground">{d.deviceName}</span>
        </div>
      ),
    },
    { key: 'department', header: 'Department', sortable: true },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      cell: (d) => <Badge tone="outline">{d.category}</Badge>,
    },
    { key: 'certifiedBy', header: 'Certified By', cell: (d) => <span className="text-muted-foreground">{d.certifiedBy}</span> },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      cell: (d) => <Badge tone="success" dot>{d.status}</Badge>,
    },
  ];

  const ticketColumns: Column<SupportTicketRecord>[] = [
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      cell: (t) => <Badge tone={sevTone[t.severity]} dot pulse={t.severity === 'CRITICAL'}>{t.severity}</Badge>,
    },
    {
      key: 'title',
      header: 'Incident',
      sortable: true,
      cell: (t) => (
        <div className="min-w-0 max-w-md">
          <p className="truncate font-medium text-foreground">{t.title}</p>
          <p className="truncate text-xs text-muted-foreground">{t.hospitalName}</p>
        </div>
      ),
      accessor: (t) => t.title,
    },
    { key: 'assignedEngineer', header: 'Engineer', cell: (t) => <span className="text-muted-foreground">{t.assignedEngineer}</span> },
    { key: 'status', header: 'Status', cell: (t) => <Badge tone="warning">{t.status}</Badge> },
    {
      key: 'slaExpiresInMins',
      header: 'SLA',
      align: 'right',
      sortable: true,
      accessor: (t) => t.slaExpiresInMins,
      cell: (t) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold tabular-nums text-info">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {t.slaExpiresInMins} mins left
        </span>
      ),
    },
  ];

  const releaseColumns: Column<ReleaseEnvironmentStatus>[] = [
    {
      key: 'environment',
      header: 'Environment',
      sortable: true,
      cell: (rel) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
            <GitBranch className="h-4 w-4" aria-hidden />
          </span>
          <span className="font-medium text-foreground">{rel.environment}</span>
        </div>
      ),
    },
    { key: 'version', header: 'Version', cell: (rel) => <Badge tone="brand">{rel.version}</Badge> },
    { key: 'deployedAt', header: 'Deployed At', cell: (rel) => <span className="text-muted-foreground">{rel.deployedAt}</span> },
    {
      key: 'activeTrafficPct',
      header: 'Traffic',
      sortable: true,
      accessor: (rel) => rel.activeTrafficPct,
      cell: (rel) => (
        <div className="w-36">
          <Progress value={rel.activeTrafficPct} tone="brand" showValue label={`${rel.environment} traffic`} />
        </div>
      ),
    },
    { key: 'status', header: 'Status', align: 'right', cell: (rel) => <Badge tone="success" dot>{rel.status}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Delivery & Operations"
        description="Hospital onboarding, device certifications, LMS training, support and release rollouts."
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Operations' }]}
        actions={<Badge tone="brand" dot pulse>Phase 18 Active</Badge>}
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OpsTab)}>
        <TabsList className="h-auto max-w-full flex-wrap overflow-x-auto no-scrollbar">
          <TabsTrigger value="PROJECTS"><Building2 className="h-4 w-4" aria-hidden /> Implementation</TabsTrigger>
          <TabsTrigger value="DEVICES"><HardDrive className="h-4 w-4" aria-hidden /> Devices</TabsTrigger>
          <TabsTrigger value="LMS"><GraduationCap className="h-4 w-4" aria-hidden /> LMS Training</TabsTrigger>
          <TabsTrigger value="SUPPORT"><LifeBuoy className="h-4 w-4" aria-hidden /> Support</TabsTrigger>
          <TabsTrigger value="ADOPTION"><TrendingUp className="h-4 w-4" aria-hidden /> Customer Success</TabsTrigger>
          <TabsTrigger value="RELEASES"><GitBranch className="h-4 w-4" aria-hidden /> Release Canary</TabsTrigger>
        </TabsList>

        {/* TAB 1: HOSPITAL WORKSPACES */}
        <TabsContent value="PROJECTS" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Hospital Onboarding & Implementation Workspaces</h2>
            <p className="text-sm text-muted-foreground">Track project milestones, implementation progress, target go-lives and RAID logs.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {projects.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="h-full">
                  <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">{p.hospitalName}</CardTitle>
                      <CardDescription>PM: {p.assignedProjectManager} • Go-live {p.targetGoLiveDate}</CardDescription>
                    </div>
                    <Badge tone="info">{p.stage}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={p.implementationPct} tone="brand" label="Implementation progress" showValue />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-border bg-muted/40 p-3">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-subtle-foreground">Health Score</p>
                        <p className="mt-0.5 text-lg font-bold tabular-nums text-success">{p.healthScorePct}%</p>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/40 p-3">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-subtle-foreground">RAID Risks</p>
                        <p className="mt-0.5 text-lg font-bold tabular-nums text-warning">{p.raidRiskCount} open</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: DEVICE INSTALLATIONS */}
        <TabsContent value="DEVICES" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Device Installation & Calibration Manager</h2>
            <p className="text-sm text-muted-foreground">Certified readiness tracking for PACS, LIS analyzers, ICU monitors and barcode printers.</p>
          </div>
          <DataTable
            columns={deviceColumns}
            data={devices}
            rowKey={(d) => d.id}
            searchPlaceholder="Search devices…"
            exportName="device-installations"
            emptyTitle="No devices registered"
            emptyDescription="Installed and certified devices will appear here."
          />
        </TabsContent>

        {/* TAB 3: LMS TRAINING */}
        <TabsContent value="LMS" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Staff LMS Training & Certification Centre</h2>
            <p className="text-sm text-muted-foreground">Role-based interactive video courses for doctors, nurses, billers and administrators.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="flex h-full flex-col">
                  <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
                      <GraduationCap className="h-5 w-5" aria-hidden />
                    </span>
                    <Badge tone="brand">{c.role}</Badge>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <h3 className="text-sm font-semibold text-foreground">{c.courseName}</h3>
                    <Progress value={c.completionPct} tone="brand" label="Completion rate" showValue />
                    <p className="mt-auto flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                      <Award className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                      <strong className="text-foreground">{c.certifiedUsersCount}</strong> certified / {c.totalEnrolledCount} enrolled
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 4: SUPPORT & HYPERCARE */}
        <TabsContent value="SUPPORT" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Support & 24/7 Hypercare Incident Centre</h2>
            <p className="text-sm text-muted-foreground">Real-time ticketing, SLA countdown timers and engineer assignment telemetry.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Open a Hypercare Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTicket} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="ops-incident-title">Incident title</Label>
                  <Input
                    id="ops-incident-title"
                    type="text"
                    placeholder="Incident Title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>
                <div className="w-full space-y-1.5 sm:w-40">
                  <Label htmlFor="ops-incident-sev">Severity</Label>
                  <Select id="ops-incident-sev" value={newSev} onChange={(e) => setNewSev(e.target.value as any)}>
                    <option value="MINOR">MINOR</option>
                    <option value="MAJOR">MAJOR</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </Select>
                </div>
                <Button type="submit" className="shrink-0">
                  <Plus className="h-4 w-4" aria-hidden /> Open Ticket
                </Button>
              </form>
            </CardContent>
          </Card>

          <DataTable
            columns={ticketColumns}
            data={tickets}
            rowKey={(t) => t.id}
            searchPlaceholder="Search incidents…"
            exportName="hypercare-tickets"
            emptyTitle="No open tickets"
            emptyDescription="Hypercare incidents raised by hospitals will appear here."
          />
        </TabsContent>

        {/* TAB 5: CUSTOMER SUCCESS */}
        <TabsContent value="ADOPTION" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Customer Success & Clinical Adoption Analytics</h2>
            <p className="text-sm text-muted-foreground">Monthly active clinicians, AI scribe usage volume and satisfaction scores.</p>
          </div>

          <StatGrid>
            <StatCard
              label="Monthly Active Users"
              value={adoption.activeMonthlyUsers.toLocaleString()}
              sub="+18% growth this month"
              trend="up"
              trendPositive
              icon={Users}
              tone="brand"
              delay={0}
            />
            <StatCard
              label="AI Scribe Adoption"
              value={`${adoption.aiScribeAdoptionPct}%`}
              sub="Clinician usage"
              icon={Stethoscope}
              tone="violet"
              delay={0.05}
            />
            <StatCard
              label="30d EMR Prescriptions"
              value={adoption.emrPrescriptionVolume30d.toLocaleString()}
              sub="Prescriptions signed"
              icon={FileSignature}
              tone="emerald"
              delay={0.1}
            />
            <StatCard
              label="Customer CSAT"
              value={`${adoption.customerSatisfactionCSAT} / 5.0`}
              sub="CSAT survey score"
              icon={Star}
              tone="amber"
              delay={0.15}
            />
          </StatGrid>
        </TabsContent>

        {/* TAB 6: RELEASE CANARY */}
        <TabsContent value="RELEASES" className="mt-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Multi-Hospital Release & Blue-Green Canary Manager</h2>
            <p className="text-sm text-muted-foreground">Safely orchestrate canary rollouts across staging and production environments.</p>
          </div>
          <DataTable
            columns={releaseColumns}
            data={releases}
            rowKey={(rel) => rel.environment}
            searchable={false}
            emptyTitle="No release environments"
            emptyDescription="Environment rollout status will appear here."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
