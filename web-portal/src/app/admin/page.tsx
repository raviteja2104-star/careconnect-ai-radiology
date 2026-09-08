'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Building, Users, Shield, Settings, Server, FileText,
  Activity, Plus, MoreVertical, Edit2,
  CheckCircle, AlertTriangle, Bell, Database,
  Monitor, GitMerge, Sparkles, Code2, ShieldCheck, Building2, DollarSign, FolderKanban,
  ArrowUpRight, type LucideIcon,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription, CardContent,
  Tabs, TabsList, TabsTrigger, TabsContent, Badge, Button, DataTable, EmptyState,
  Timeline, TimelineItem, Dropdown, DropdownItem, DropdownSeparator, type Column,
} from '@/components/ui';

/* ------------------------------------------------------------------ */
/* Static data (unchanged values)                                      */
/* ------------------------------------------------------------------ */

const MODULES: { href: string; label: string; tag: string; icon: LucideIcon; tile: string }[] = [
  { href: '/admin/workflow-builder', label: 'Workflow Builder (No-Code OS)', tag: 'Launch', icon: GitMerge, tile: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400' },
  { href: '/admin/production', label: 'Production Hardening & QA', tag: 'v1.1', icon: ShieldCheck, tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' },
  { href: '/admin/operations', label: 'Delivery & Operations OS', tag: 'Ops', icon: Building2, tile: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400' },
  { href: '/admin/commercial', label: 'Commercial SaaS & Revenue', tag: 'Monetize', icon: DollarSign, tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' },
  { href: '/admin/program', label: 'Enterprise Program & PMO', tag: 'DevSecOps', icon: FolderKanban, tile: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400' },
  { href: '/admin/ai-platform', label: 'Enterprise AI Platform', tag: 'Studio', icon: Sparkles, tile: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400' },
  { href: '/admin/developer', label: 'Developer Platform & SDK', tag: 'HPaaS', icon: Code2, tile: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400' },
  { href: '/admin/data-platform', label: 'Enterprise Data Platform & Twin', tag: 'EDP', icon: Database, tile: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400' },
  { href: '/admin/command-center', label: 'Hospital Command Center', tag: 'Live', icon: Activity, tile: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400' },
  { href: '/admin/enterprise', label: 'Enterprise Integration Hub', tag: 'FHIR/HL7', icon: Server, tile: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400' },
  { href: '/admin/master-data', label: 'Master Data & Config Hub', tag: 'Manage', icon: Database, tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400' },
];

const HEALTH: { service: string; status: 'Operational' | 'Degraded' | 'Down'; message?: string }[] = [
  { service: 'Primary Database Cluster (AWS RDS)', status: 'Operational' },
  { service: 'Event Broker (Kafka)', status: 'Operational' },
  { service: 'AI Copilot Inference API', status: 'Degraded', message: 'High latency detected in US-East-1' },
  { service: 'Payment Gateway (Stripe)', status: 'Operational' },
  { service: 'FHIR Interoperability Layer', status: 'Operational' },
];

interface Org { name: string; region: string; plan: string; users: string; status: string }
const ORGS: Org[] = [
  { name: 'Apollo Hospitals Enterprise', region: 'APAC (India)', plan: 'Enterprise', users: '5,240', status: 'Active' },
  { name: 'Mayo Clinic Network', region: 'US-East', plan: 'Enterprise+', users: '12,050', status: 'Active' },
  { name: 'CityCare Clinics', region: 'EMEA (UK)', plan: 'Professional', users: '120', status: 'Active' },
  { name: 'TeleMed Global', region: 'Global', plan: 'Enterprise', users: '850', status: 'Suspended' },
];

const ROLES: { title: string; type: string; users: string | number; desc: string }[] = [
  { title: 'System Administrator', type: 'Global', users: 12, desc: 'Full access to all platform settings, infrastructure, and all tenant organizations.' },
  { title: 'Organization Admin', type: 'Tenant', users: 450, desc: 'Full access within their specific organization. Cannot view other organizations.' },
  { title: 'Chief Medical Officer', type: 'Clinical', users: 120, desc: 'View-all access to clinical records, analytics, and quality compliance across the organization.' },
  { title: 'Attending Physician', type: 'Clinical', users: '4,200', desc: 'Standard EMR access. Can create/edit clinical notes, prescribe, and order labs.' },
  { title: 'Billing Specialist', type: 'Financial', users: '1,150', desc: 'Access to RCM, claims, invoices, and payment gateways. No clinical note editing.' },
];

const AUDIT: { time: string; user: string; action: string; resource: string; ip: string }[] = [
  { time: 'Just Now', user: 'sysadmin@careconnect.com', action: 'Updated Feature Flag', resource: 'telemedicine_enabled (Apollo Hospitals)', ip: '192.168.1.42' },
  { time: '2 mins ago', user: 'billing@mayoclinic.org', action: 'Downloaded Report', resource: 'Q3_Revenue_Summary.pdf', ip: '203.0.113.15' },
  { time: '15 mins ago', user: 'dr.sharma@apollo.com', action: 'Viewed Record', resource: 'Patient #PT-992384', ip: '198.51.100.2' },
  { time: '1 hour ago', user: 'api_service_acct', action: 'Data Sync', resource: 'FHIR Endpoint (HDFC Ergo)', ip: '10.0.0.5' },
];

const TAB_ITEMS = [
  { value: 'Dashboard', label: 'Dashboard' },
  { value: 'Organizations', label: 'Organizations' },
  { value: 'Users', label: 'Users & Teams' },
  { value: 'RBAC', label: 'RBAC & Roles' },
  { value: 'Audit', label: 'Audit Logs' },
  { value: 'Compliance', label: 'Compliance' },
  { value: 'Health', label: 'Health & Metrics' },
  { value: 'Integrations', label: 'Integrations' },
  { value: 'Settings', label: 'Platform Settings' },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';
function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Dashboard');

  const { data: statsRes } = useQuery({
    queryKey: ['admin_platform_stats'],
    queryFn: () => fetch(`${API}/api/admin/platform-stats`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 30000,
  });
  const stats = statsRes?.data;

  const { data: healthRes } = useQuery({
    queryKey: ['admin_system_health'],
    queryFn: () => fetch(`${API}/api/admin/system-health`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 30000,
  });

  const { data: orgsRes } = useQuery({
    queryKey: ['admin_organizations'],
    queryFn: () => fetch(`${API}/api/admin/organizations`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 30000,
  });

  const { data: auditRes } = useQuery({
    queryKey: ['admin_audit_logs'],
    queryFn: () => fetch(`${API}/api/admin/audit-logs?limit=20`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 30000,
  });

  const healthItems: { service: string; status: string; message?: string; detail?: string }[] = healthRes?.data ?? HEALTH;
  const orgItems: Org[] = orgsRes?.data ?? ORGS;
  const auditItems: { time: string; user: string; action: string; resource: string; ip: string }[] = auditRes?.data ?? AUDIT;

  const orgColumns: Column<Org>[] = [
    {
      key: 'name', header: 'Organization Name', sortable: true,
      cell: (row) => <span className="font-semibold text-foreground">{row.name}</span>,
    },
    { key: 'region', header: 'Region', sortable: true, cell: (row) => <span className="text-muted-foreground">{row.region}</span> },
    { key: 'plan', header: 'Plan', sortable: true, cell: (row) => <Badge tone="outline">{row.plan}</Badge> },
    { key: 'users', header: 'Users', sortable: true, align: 'right', cell: (row) => <span className="tabular-nums">{row.users}</span> },
    {
      key: 'status', header: 'Status', sortable: true,
      cell: (row) => (
        <Badge tone={row.status === 'Active' ? 'success' : 'danger'} dot>
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin"
        description="Platform-wide administration — organizations, security, and system operations."
        crumbs={[{ label: 'Admin' }, { label: 'Overview' }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.push('/admin/observability')}>
              <Bell className="h-4 w-4" aria-hidden /> Alerts
            </Button>
            <Button size="sm" disabled title="Coming soon">
              <Plus className="h-4 w-4" aria-hidden /> Add Organization
            </Button>
          </>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto flex-wrap justify-start">
          {TAB_ITEMS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
          ))}
        </TabsList>

        {/* ---------------- Dashboard ---------------- */}
        <TabsContent value="Dashboard" className="space-y-6">
          <StatGrid>
            <StatCard label="Registered Users" value={stats ? stats.totalUsers.toLocaleString() : '—'} sub={stats?.dbConnected ? 'All roles' : 'DB offline'} trend="up" icon={Building} tone="brand" delay={0} />
            <StatCard label="Active Users" value={stats ? stats.activeUsers.toLocaleString() : '—'} sub="Currently active accounts" trend="up" icon={Users} tone="emerald" delay={0.05} />
            <StatCard label="Today's Appointments" value={stats ? stats.todayAppointments.toLocaleString() : '—'} sub="Booked for today" trend="neutral" icon={Activity} tone="violet" delay={0.1} />
            <StatCard label="Server Uptime" value={stats ? `${Math.floor((stats.uptimeSeconds ?? 0) / 3600)}h ${Math.floor(((stats.uptimeSeconds ?? 0) % 3600) / 60)}m` : '—'} sub="Since last deploy" trend="neutral" icon={Database} tone="amber" delay={0.15} />
          </StatGrid>

          {/* Module launcher */}
          <section aria-labelledby="module-launcher">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="module-launcher" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Platform Modules
              </h2>
              <Badge tone="brand">{MODULES.length} modules</Badge>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {MODULES.map((m, i) => {
                const Icon = m.icon;
                return (
                  <motion.a
                    key={m.href}
                    href={m.href}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                    className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${m.tile}`}>
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-foreground">{m.label}</span>
                      <Badge tone="outline" className="mt-1 font-mono text-[10px]">{m.tag}</Badge>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-subtle-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" aria-hidden />
                  </motion.a>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* System health */}
            <Card className="xl:col-span-2">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-muted-foreground" aria-hidden />
                  <CardTitle>System Health Status</CardTitle>
                </div>
                <Button variant="link" size="sm" onClick={() => router.push('/admin/system/dashboard')}>View All</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {healthItems.map((h) => {
                  const isOp = h.status === 'Operational';
                  const detail = h.detail ?? h.message;
                  return (
                    <div key={h.service} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {isOp
                          ? <CheckCircle className="h-4 w-4 shrink-0 text-success" aria-hidden />
                          : <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden />}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{h.service}</p>
                          {detail && <p className="truncate text-xs text-muted-foreground">{detail}</p>}
                        </div>
                      </div>
                      <Badge tone={isOp ? 'success' : h.status === 'Down' ? 'danger' : 'warning'} dot pulse={!isOp}>
                        {h.status}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative shortcuts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <QuickAction icon={Building} iconClass="text-primary" label="Onboard New Organization" onClick={() => setActiveTab('Organizations')} />
                <QuickAction icon={Users} iconClass="text-success" label="Invite Super Admin" onClick={() => setActiveTab('Users')} />
                <QuickAction icon={Shield} iconClass="text-warning" label="Review Compliance Alerts" badge="2" onClick={() => setActiveTab('Compliance')} />
                <QuickAction icon={Settings} iconClass="text-muted-foreground" label="Global Feature Flags" onClick={() => router.push('/admin/master-data')} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------------- Organizations ---------------- */}
        <TabsContent value="Organizations">
          <DataTable<Org>
            columns={orgColumns}
            data={orgItems}
            rowKey={(row) => row.name}
            searchPlaceholder="Search organizations…"
            exportName="organizations"
            emptyTitle="No organizations found"
            toolbar={
              <Button size="sm" disabled title="Coming soon">
                <Plus className="h-4 w-4" aria-hidden /> Add Organization
              </Button>
            }
            rowActions={() => (
              <Dropdown
                trigger={
                  <Button variant="ghost" size="icon-sm" aria-label="Organization actions">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                }
              >
                <DropdownItem disabled title="Coming soon" className="opacity-50">View details</DropdownItem>
                <DropdownItem disabled title="Coming soon" className="opacity-50">Edit organization</DropdownItem>
                <DropdownSeparator />
                <DropdownItem disabled title="Coming soon" className="opacity-50">Suspend</DropdownItem>
              </Dropdown>
            )}
          />
        </TabsContent>

        {/* ---------------- RBAC ---------------- */}
        <TabsContent value="RBAC">
          <Card>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Enterprise Role Matrix</CardTitle>
                <CardDescription className="mt-1">Manage global roles, permissions, and inheritance mapping.</CardDescription>
              </div>
              <Button variant="outline" size="sm" disabled title="Coming soon">
                <Plus className="h-4 w-4" aria-hidden /> Create Custom Role
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {ROLES.map((r, i) => (
                <motion.div
                  key={r.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="group flex flex-col justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:border-primary/40 md:flex-row md:items-center"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="mb-1 flex items-center gap-3">
                      <h4 className="font-semibold text-foreground">{r.title}</h4>
                      <Badge tone="neutral" className="uppercase tracking-wider text-[10px]">{r.type}</Badge>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm font-bold tabular-nums text-foreground">{r.users}</div>
                      <div className="text-xs text-subtle-foreground">Assigned</div>
                    </div>
                    <Button variant="outline" size="icon-sm" aria-label={`Edit ${r.title} role`} disabled title="Coming soon">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Audit ---------------- */}
        <TabsContent value="Audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Global Audit Logs</CardTitle>
              <CardDescription>Immutable records of all platform activity for HIPAA and SOC2 compliance.</CardDescription>
            </CardHeader>
            <CardContent>
              <Timeline>
                {auditItems.map((a) => (
                  <TimelineItem
                    key={`${a.time}-${a.user}`}
                    icon={FileText}
                    tone="brand"
                    title={<span>{a.user} <span className="font-normal text-muted-foreground">{a.action}</span></span>}
                    meta={a.time}
                  >
                    <span className="font-medium text-primary">{a.resource}</span>
                    <span className="ml-3 font-mono text-xs text-subtle-foreground">IP: {a.ip}</span>
                  </TimelineItem>
                ))}
              </Timeline>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Health & Metrics ---------------- */}
        <TabsContent value="Health">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Health &amp; Metrics</CardTitle>
              <CardDescription>Real-time status for all platform services and infrastructure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {healthItems.map((h) => {
                const isOp = h.status === 'Operational';
                const detail = h.detail ?? h.message;
                return (
                  <div key={h.service} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      {isOp
                        ? <CheckCircle className="h-5 w-5 shrink-0 text-success" aria-hidden />
                        : <AlertTriangle className="h-5 w-5 shrink-0 text-warning" aria-hidden />}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{h.service}</p>
                        {detail && <p className="truncate text-xs text-muted-foreground">{detail}</p>}
                      </div>
                    </div>
                    <Badge tone={isOp ? 'success' : h.status === 'Down' ? 'danger' : 'warning'} dot pulse={!isOp}>
                      {h.status}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Placeholder modules ---------------- */}
        {['Users', 'Compliance', 'Integrations', 'Settings'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <EmptyState
              icon={Settings}
              title={`${TAB_ITEMS.find((t) => t.value === tab)?.label ?? tab} module`}
              description={`The ${tab} module will be rendered here dynamically.`}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Local pieces                                                        */
/* ------------------------------------------------------------------ */

function QuickAction({ icon: Icon, iconClass, label, badge, onClick }: { icon: LucideIcon; iconClass: string; label: string; badge?: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} aria-hidden />
      <span className="flex-1">{label}</span>
      {badge && <Badge tone="warning">{badge}</Badge>}
    </button>
  );
}
