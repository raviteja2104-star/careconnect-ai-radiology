'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Dialog, Input, Label, Select,
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

interface Org { _id?: string; name: string; region: string; plan: string; users: string; status: string }
interface User { _id?: string; name: string; email: string; role: string; org?: string; status: 'Active' | 'Suspended' | 'Invited'; lastLogin?: string; }
interface ComplianceControl { id: string; category: string; control: string; status: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT' | 'PENDING'; lastAudit?: string; owner?: string; }
interface Integration { id: string; name: string; type: string; status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR'; lastSync?: string; endpoint?: string; }
interface PlatformSetting { key: string; label: string; description: string; value: string | boolean; type: 'toggle' | 'text'; }
interface PendingApproval { _id: string; firstName?: string; lastName?: string; email: string; role?: string; createdAt?: string; authProviders?: string[]; }

const ROLES: { title: string; type: string; users: string | number; desc: string }[] = [
  { title: 'System Administrator', type: 'Global', users: '—', desc: 'Full access to all platform settings, infrastructure, and all tenant organizations.' },
  { title: 'Organization Admin', type: 'Tenant', users: '—', desc: 'Full access within their specific organization. Cannot view other organizations.' },
  { title: 'Chief Medical Officer', type: 'Clinical', users: '—', desc: 'View-all access to clinical records, analytics, and quality compliance across the organization.' },
  { title: 'Attending Physician', type: 'Clinical', users: '—', desc: 'Standard EMR access. Can create/edit clinical notes, prescribe, and order labs.' },
  { title: 'Billing Specialist', type: 'Financial', users: '—', desc: 'Access to RCM, claims, invoices, and payment gateways. No clinical note editing.' },
];

const TAB_ITEMS = [
  { value: 'Dashboard', label: 'Dashboard' },
  { value: 'Organizations', label: 'Organizations' },
  { value: 'Users', label: 'Users & Teams' },
  { value: 'Approvals', label: 'Pending Approvals' },
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
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Dashboard');

  // Add Organization
  const [addOrgOpen, setAddOrgOpen] = useState(false);
  const [orgDraft, setOrgDraft] = useState<{ name: string; type: string; domain: string }>({ name: '', type: 'Hospital', domain: '' });
  const [orgSubmitting, setOrgSubmitting] = useState(false);

  const handleCreateOrg = async () => {
    if (!orgDraft.name.trim()) return;
    setOrgSubmitting(true);
    try {
      const res = await fetch(`${API}/api/admin/organizations`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(orgDraft),
      });
      const json = await res.json();
      if (json.success !== false) {
        queryClient.invalidateQueries({ queryKey: ['admin_organizations'] });
        setAddOrgOpen(false);
        setOrgDraft({ name: '', type: 'Hospital', domain: '' });
      }
    } catch (err) {
      console.error('Failed to create organization:', err);
    } finally {
      setOrgSubmitting(false);
    }
  };

  // Org row actions
  const [orgDetailOpen, setOrgDetailOpen] = useState(false);
  const [orgEditOpen, setOrgEditOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);
  const [editOrgDraft, setEditOrgDraft] = useState<Org>({ name: '', region: '', plan: '', users: '', status: '' });
  const [editOrgSubmitting, setEditOrgSubmitting] = useState(false);

  const handleEditOrg = async () => {
    if (!editOrgDraft.name.trim()) return;
    setEditOrgSubmitting(true);
    try {
      const id = selectedOrg?._id ?? selectedOrg?.name;
      await fetch(`${API}/api/admin/organizations/${encodeURIComponent(id ?? '')}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(editOrgDraft),
      });
      queryClient.invalidateQueries({ queryKey: ['admin_organizations'] });
      setOrgEditOpen(false);
    } catch (err) {
      console.error('Failed to edit organization:', err);
    } finally {
      setEditOrgSubmitting(false);
    }
  };

  const handleSuspendOrg = async (org: Org) => {
    if (!window.confirm(`Suspend "${org.name}"? This will restrict access for all users in this organization.`)) return;
    try {
      const id = org._id ?? org.name;
      await fetch(`${API}/api/admin/organizations/${encodeURIComponent(id)}/suspend`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      });
      queryClient.invalidateQueries({ queryKey: ['admin_organizations'] });
    } catch (err) {
      console.error('Failed to suspend organization:', err);
    }
  };

  // Create Custom Role
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [roleDraft, setRoleDraft] = useState<{ name: string; type: string; description: string }>({ name: '', type: 'Custom', description: '' });
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [createdRoles, setCreatedRoles] = useState<typeof ROLES>([]);

  const handleCreateRole = async () => {
    if (!roleDraft.name.trim()) return;
    setRoleSubmitting(true);
    try {
      await fetch(`${API}/api/admin/rbac/roles`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(roleDraft),
      });
      setCreatedRoles(prev => [...prev, { title: roleDraft.name, type: roleDraft.type, users: '—', desc: roleDraft.description }]);
      setCreateRoleOpen(false);
      setRoleDraft({ name: '', type: 'Custom', description: '' });
    } catch (err) {
      console.error('Failed to create role:', err);
    } finally {
      setRoleSubmitting(false);
    }
  };

  // Edit Role
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [editRoleTitle, setEditRoleTitle] = useState('');
  const [editRoleDraft, setEditRoleDraft] = useState<{ title: string; type: string; desc: string }>({ title: '', type: '', desc: '' });
  const [editRoleSubmitting, setEditRoleSubmitting] = useState(false);

  const handleEditRole = async () => {
    if (!editRoleDraft.title.trim()) return;
    setEditRoleSubmitting(true);
    try {
      await fetch(`${API}/api/admin/rbac/roles/${encodeURIComponent(editRoleTitle)}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(editRoleDraft),
      });
      setEditRoleOpen(false);
    } catch (err) {
      console.error('Failed to update role:', err);
    } finally {
      setEditRoleSubmitting(false);
    }
  };

  // Invite User
  const [inviteUserOpen, setInviteUserOpen] = useState(false);
  const [userDraft, setUserDraft] = useState<{ name: string; email: string; role: string; org: string }>({ name: '', email: '', role: 'Attending Physician', org: '' });
  const [userSubmitting, setUserSubmitting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ name: string; email: string; tempPassword: string } | null>(null);
  const [inviteError, setInviteError] = useState('');

  const handleInviteUser = async () => {
    if (!userDraft.email.trim()) return;
    setUserSubmitting(true);
    setInviteError('');
    try {
      const res = await fetch(`${API}/api/admin/users/invite`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(userDraft),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setInviteError(json.message || 'Failed to create user.');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      setInviteResult({
        name: json.data?.name ?? userDraft.name,
        email: json.data?.email ?? userDraft.email,
        tempPassword: json.data?.tempPassword ?? '',
      });
      setUserDraft({ name: '', email: '', role: 'Attending Physician', org: '' });
    } catch (err) {
      setInviteError('Cannot reach the server. Check your connection.');
    } finally {
      setUserSubmitting(false);
    }
  };

  const handleSuspendUser = async (user: User) => {
    const action = user.status === 'Suspended' ? 'reactivate' : 'suspend';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} "${user.name || user.email}"?`)) return;
    try {
      const id = user._id ?? user.email;
      await fetch(`${API}/api/admin/users/${encodeURIComponent(id)}/${action}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      });
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
    }
  };

  // Pending Approvals
  const [approvalActionId, setApprovalActionId] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState('');

  const handleApprovalAction = async (id: string, action: 'approve' | 'reject') => {
    setApprovalActionId(id);
    setApprovalError('');
    try {
      const res = await fetch(`${API}/api/admin/users/${encodeURIComponent(id)}/${action}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        setApprovalError(json.message || `Failed to ${action} user.`);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['admin_pending_approvals'] });
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
    } catch {
      setApprovalError('Cannot reach the server. Check your connection.');
    } finally {
      setApprovalActionId(null);
    }
  };

  const handleToggleSetting = async (key: string, value: boolean) => {
    try {
      await fetch(`${API}/api/admin/platform-settings/${encodeURIComponent(key)}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      queryClient.invalidateQueries({ queryKey: ['admin_platform_settings_list'] });
    } catch (err) {
      console.error('Failed to update setting:', err);
    }
  };

  const { data: statsRes } = useQuery({
    queryKey: ['admin_platform_stats'],
    queryFn: () => fetch(`${API}/api/admin/platform-stats`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 30000,
  });
  const stats = statsRes?.data;

  const { data: healthRes, isLoading: healthLoading } = useQuery({
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

  const { data: usersRes } = useQuery({
    queryKey: ['admin_users'],
    queryFn: () => fetch(`${API}/api/admin/users`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 30000,
  });

  const { data: approvalsRes } = useQuery({
    queryKey: ['admin_pending_approvals'],
    queryFn: () => fetch(`${API}/api/admin/pending-approvals`, { headers: authHeaders() }).then(r => r.json()),
    enabled: activeTab === 'Approvals',
    staleTime: 30000,
  });

  const { data: complianceRes } = useQuery({
    queryKey: ['admin_compliance'],
    queryFn: () => fetch(`${API}/api/admin/compliance`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 60000,
  });

  const { data: integrationsRes } = useQuery({
    queryKey: ['admin_integrations'],
    queryFn: () => fetch(`${API}/api/admin/integrations`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 60000,
  });

  const { data: settingsRes } = useQuery({
    queryKey: ['admin_platform_settings_list'],
    queryFn: () => fetch(`${API}/api/admin/platform-settings/list`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 30000,
  });

  const healthItems: { service: string; status: string; message?: string; detail?: string }[] = healthRes?.data ?? [];
  const orgItems: Org[] = orgsRes?.data ?? [];
  const auditItems: { time: string; user: string; action: string; resource: string; ip: string }[] = auditRes?.data ?? [];
  const userItems: User[] = usersRes?.data ?? [];
  const pendingApprovals: PendingApproval[] = approvalsRes?.data ?? [];
  const complianceItems: ComplianceControl[] = complianceRes?.data ?? [];
  const integrationItems: Integration[] = integrationsRes?.data ?? [];
  const platformSettingItems: PlatformSetting[] = settingsRes?.data ?? [];

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

  const userColumns: Column<User>[] = [
    {
      key: 'name', header: 'User', sortable: true,
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{row.name || '—'}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    { key: 'role', header: 'Role', sortable: true, cell: (row) => <Badge tone="outline">{row.role}</Badge> },
    { key: 'org', header: 'Organization', sortable: true, cell: (row) => <span className="text-muted-foreground">{row.org ?? '—'}</span> },
    {
      key: 'status', header: 'Status', sortable: true,
      cell: (row) => (
        <Badge tone={row.status === 'Active' ? 'success' : row.status === 'Invited' ? 'info' : 'danger'} dot>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'lastLogin', header: 'Last Login',
      cell: (row) => <span className="font-mono text-xs text-muted-foreground">{row.lastLogin ?? '—'}</span>,
    },
  ];

  const approvalColumns: Column<PendingApproval>[] = [
    {
      key: 'firstName', header: 'User', sortable: true,
      cell: (row) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">
            {[row.firstName, row.lastName].filter(Boolean).join(' ') || '—'}
          </p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    { key: 'role', header: 'Role', sortable: true, cell: (row) => <Badge tone="outline">{row.role ?? 'patient'}</Badge> },
    {
      key: 'authProviders', header: 'Sign-in Method',
      cell: (row) => <Badge tone="info">{row.authProviders?.[0] ?? 'google'}</Badge>,
    },
    {
      key: 'createdAt', header: 'Requested',
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}
        </span>
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
            <Button size="sm" onClick={() => setAddOrgOpen(true)}>
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
                {healthLoading ? (
                  <div className="space-y-2">
                    {[0,1,2].map(i => <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />)}
                  </div>
                ) : healthItems.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">System health data unavailable.</p>
                ) : healthItems.map((h) => {
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
              <Button size="sm" onClick={() => setAddOrgOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden /> Add Organization
              </Button>
            }
            rowActions={(row: Org) => (
              <Dropdown
                trigger={
                  <Button variant="ghost" size="icon-sm" aria-label="Organization actions">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                }
              >
                <DropdownItem onClick={() => { setSelectedOrg(row); setOrgDetailOpen(true); }}>View details</DropdownItem>
                <DropdownItem onClick={() => { setSelectedOrg(row); setEditOrgDraft({ ...row }); setOrgEditOpen(true); }}>Edit organization</DropdownItem>
                <DropdownSeparator />
                <DropdownItem onClick={() => handleSuspendOrg(row)}>Suspend</DropdownItem>
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
              <Button variant="outline" size="sm" onClick={() => setCreateRoleOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden /> Create Custom Role
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...ROLES, ...createdRoles].map((r, i) => (
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
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label={`Edit ${r.title} role`}
                      onClick={() => { setEditRoleTitle(r.title); setEditRoleDraft({ title: r.title, type: r.type, desc: r.desc }); setEditRoleOpen(true); }}
                    >
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
              {auditItems.length === 0 ? (
                <EmptyState icon={FileText} title="No audit records" description="No platform activity has been logged yet. Events will appear here as users interact with the system." />
              ) : (
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
              )}
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
              {healthLoading ? (
                <div className="space-y-2">
                  {[0,1,2,3,4].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />)}
                </div>
              ) : healthItems.length === 0 ? (
                <EmptyState icon={Monitor} title="Health data unavailable" description="No service health data returned yet. Metrics will appear here once services report their status." />
              ) : healthItems.map((h) => {
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

        {/* ---------------- Users & Teams ---------------- */}
        <TabsContent value="Users" className="space-y-4">
          <DataTable<User>
            columns={userColumns}
            data={userItems}
            rowKey={(row) => row._id ?? row.email}
            searchPlaceholder="Search users…"
            exportName="platform-users"
            emptyTitle="No users found"
            emptyDescription="Invited users will appear here once they accept."
            toolbar={
              <Button size="sm" onClick={() => setInviteUserOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden /> Invite User
              </Button>
            }
            rowActions={(row: User) => (
              <Dropdown
                trigger={
                  <Button variant="ghost" size="icon-sm" aria-label="User actions">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                }
              >
                <DropdownItem onClick={() => handleSuspendUser(row)}>
                  {row.status === 'Suspended' ? 'Reactivate' : 'Suspend'}
                </DropdownItem>
              </Dropdown>
            )}
          />
        </TabsContent>

        {/* ---------------- Pending Approvals ---------------- */}
        <TabsContent value="Approvals" className="space-y-4">
          {approvalError && (
            <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">{approvalError}</p>
          )}
          <DataTable<PendingApproval>
            columns={approvalColumns}
            data={pendingApprovals}
            rowKey={(row) => row._id}
            searchPlaceholder="Search pending users…"
            exportName="pending-approvals"
            emptyTitle="No pending approvals"
            emptyDescription="Users who sign in via Google will appear here until approved."
            rowActions={(row: PendingApproval) => (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-danger/40 text-danger hover:bg-danger-soft"
                  loading={approvalActionId === row._id}
                  disabled={approvalActionId !== null}
                  onClick={() => handleApprovalAction(row._id, 'reject')}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  loading={approvalActionId === row._id}
                  disabled={approvalActionId !== null}
                  onClick={() => handleApprovalAction(row._id, 'approve')}
                >
                  Approve
                </Button>
              </div>
            )}
          />
        </TabsContent>

        {/* ---------------- Compliance ---------------- */}
        <TabsContent value="Compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compliance Controls</CardTitle>
              <CardDescription>HIPAA, SOC 2 and ISO 27001 posture across the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {complianceItems.length === 0 ? (
                <EmptyState icon={Shield} title="No compliance records" description="No compliance controls have been recorded yet. Results will appear here once the audit runs." />
              ) : complianceItems.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge tone="outline" className="text-[10px] uppercase tracking-wider">{c.category}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{c.control}</p>
                    {c.owner && <p className="text-xs text-muted-foreground">Owner: {c.owner}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    {c.lastAudit && <span className="font-mono text-xs text-muted-foreground">{c.lastAudit}</span>}
                    <Badge
                      tone={c.status === 'COMPLIANT' ? 'success' : c.status === 'NON_COMPLIANT' ? 'danger' : c.status === 'AT_RISK' ? 'warning' : 'neutral'}
                      dot
                    >
                      {c.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Integrations ---------------- */}
        <TabsContent value="Integrations" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Platform Integrations</CardTitle>
                <CardDescription>FHIR, HL7, third-party EMRs, payment gateways and data sources.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/enterprise')}>
                <Server className="h-4 w-4" aria-hidden /> Integration Hub
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {integrationItems.length === 0 ? (
                <EmptyState icon={Server} title="No integrations configured" description="Connect your EHR, lab, pharmacy and payment systems from the Enterprise Integration Hub." />
              ) : integrationItems.map((int) => (
                <div key={int.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{int.name}</p>
                      <Badge tone="outline" className="text-[10px]">{int.type}</Badge>
                    </div>
                    {int.endpoint && <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{int.endpoint}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    {int.lastSync && <span className="text-xs text-muted-foreground">{int.lastSync}</span>}
                    <Badge
                      tone={int.status === 'CONNECTED' ? 'success' : int.status === 'ERROR' ? 'danger' : 'neutral'}
                      dot pulse={int.status === 'ERROR'}
                    >
                      {int.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Platform Settings ---------------- */}
        <TabsContent value="Settings" className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Platform Settings</CardTitle>
                <CardDescription>Global feature flags, security policies and platform configuration.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/admin/master-data')}>
                <Database className="h-4 w-4" aria-hidden /> Master Data Hub
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {platformSettingItems.length === 0 ? (
                <EmptyState icon={Settings} title="No platform settings" description="Platform configuration settings will appear once the settings API is connected. Manage global feature flags in the Master Data Hub." />
              ) : platformSettingItems.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/40 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </div>
                  {s.type === 'toggle' ? (
                    <button
                      onClick={() => handleToggleSetting(s.key, !(s.value as boolean))}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${s.value ? 'bg-primary' : 'bg-border'}`}
                      aria-label={`Toggle ${s.label}`}
                    >
                      <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${s.value ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  ) : (
                    <span className="shrink-0 font-mono text-sm text-foreground">{String(s.value)}</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Organization modal */}
      <Dialog
        open={addOrgOpen}
        onClose={() => setAddOrgOpen(false)}
        title="Add Organization"
        description="Onboard a new hospital, clinic, or diagnostic center to the platform."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOrgOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateOrg} loading={orgSubmitting} disabled={!orgDraft.name.trim()}>
              Add Organization
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input id="org-name" value={orgDraft.name} onChange={e => setOrgDraft(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Apollo Hospitals Delhi" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org-type">Type</Label>
            <Select id="org-type" value={orgDraft.type} onChange={e => setOrgDraft(p => ({ ...p, type: e.target.value }))}>
              <option value="Hospital">Hospital</option>
              <option value="Clinic">Clinic</option>
              <option value="Lab">Lab</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Diagnostic Center">Diagnostic Center</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org-domain">Domain (optional)</Label>
            <Input id="org-domain" value={orgDraft.domain} onChange={e => setOrgDraft(p => ({ ...p, domain: e.target.value }))} placeholder="e.g. apollodelhi.careconnect.care" />
          </div>
        </div>
      </Dialog>

      {/* View Org Details modal */}
      <Dialog
        open={orgDetailOpen}
        onClose={() => setOrgDetailOpen(false)}
        title="Organization Details"
        description={selectedOrg?.name}
        size="sm"
        footer={
          <Button onClick={() => setOrgDetailOpen(false)}>Close</Button>
        }
      >
        {selectedOrg && (
          <dl className="space-y-3 text-sm">
            {[
              ['Name', selectedOrg.name],
              ['Region', selectedOrg.region || '—'],
              ['Plan', selectedOrg.plan || '—'],
              ['Users', selectedOrg.users || '—'],
              ['Status', selectedOrg.status || '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/40 px-4 py-3">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-semibold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </Dialog>

      {/* Edit Org modal */}
      <Dialog
        open={orgEditOpen}
        onClose={() => setOrgEditOpen(false)}
        title="Edit Organization"
        description="Update the organization's details."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setOrgEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditOrg} loading={editOrgSubmitting} disabled={!editOrgDraft.name.trim()}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-org-name">Name</Label>
            <Input id="edit-org-name" value={editOrgDraft.name} onChange={e => setEditOrgDraft(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-org-region">Region</Label>
            <Input id="edit-org-region" value={editOrgDraft.region} onChange={e => setEditOrgDraft(p => ({ ...p, region: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-org-plan">Plan</Label>
            <Input id="edit-org-plan" value={editOrgDraft.plan} onChange={e => setEditOrgDraft(p => ({ ...p, plan: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-org-status">Status</Label>
            <Select id="edit-org-status" value={editOrgDraft.status} onChange={e => setEditOrgDraft(p => ({ ...p, status: e.target.value }))}>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Pending">Pending</option>
            </Select>
          </div>
        </div>
      </Dialog>

      {/* Create Custom Role modal */}
      <Dialog
        open={createRoleOpen}
        onClose={() => setCreateRoleOpen(false)}
        title="Create Custom Role"
        description="Define a new custom RBAC role for this platform."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateRoleOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateRole} loading={roleSubmitting} disabled={!roleDraft.name.trim()}>
              Create Role
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="role-name">Role Name</Label>
            <Input id="role-name" value={roleDraft.name} onChange={e => setRoleDraft(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Radiology Manager" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-type">Role Type</Label>
            <Select id="role-type" value={roleDraft.type} onChange={e => setRoleDraft(p => ({ ...p, type: e.target.value }))}>
              <option value="Custom">Custom</option>
              <option value="Clinical">Clinical</option>
              <option value="Financial">Financial</option>
              <option value="Tenant">Tenant</option>
              <option value="Global">Global</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role-desc">Description</Label>
            <Input id="role-desc" value={roleDraft.description} onChange={e => setRoleDraft(p => ({ ...p, description: e.target.value }))} placeholder="What this role can do…" />
          </div>
        </div>
      </Dialog>

      {/* Edit Role modal */}
      <Dialog
        open={editRoleOpen}
        onClose={() => setEditRoleOpen(false)}
        title="Edit Role"
        description={`Editing: ${editRoleTitle}`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditRoleOpen(false)}>Cancel</Button>
            <Button onClick={handleEditRole} loading={editRoleSubmitting} disabled={!editRoleDraft.title.trim()}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-role-title">Role Name</Label>
            <Input id="edit-role-title" value={editRoleDraft.title} onChange={e => setEditRoleDraft(p => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-role-type">Type</Label>
            <Select id="edit-role-type" value={editRoleDraft.type} onChange={e => setEditRoleDraft(p => ({ ...p, type: e.target.value }))}>
              <option value="Custom">Custom</option>
              <option value="Clinical">Clinical</option>
              <option value="Financial">Financial</option>
              <option value="Tenant">Tenant</option>
              <option value="Global">Global</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-role-desc">Description</Label>
            <Input id="edit-role-desc" value={editRoleDraft.desc} onChange={e => setEditRoleDraft(p => ({ ...p, desc: e.target.value }))} />
          </div>
        </div>
      </Dialog>

      {/* Invite User modal */}
      <Dialog
        open={inviteUserOpen}
        onClose={() => { setInviteUserOpen(false); setInviteResult(null); setInviteError(''); }}
        title={inviteResult ? 'User Added' : 'Invite User'}
        description={inviteResult ? 'Share the temporary password with the user.' : 'Create an account for a new staff member.'}
        size="sm"
        footer={inviteResult ? (
          <Button onClick={() => { setInviteUserOpen(false); setInviteResult(null); }}>Done</Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => { setInviteUserOpen(false); setInviteError(''); }}>Cancel</Button>
            <Button onClick={handleInviteUser} loading={userSubmitting} disabled={!userDraft.email.trim()}>
              Add User
            </Button>
          </>
        )}
      >
        {inviteResult ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10 p-4">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              <div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">{inviteResult.name} added</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">{inviteResult.email}</p>
              </div>
            </div>
            {inviteResult.tempPassword && (
              <div className="space-y-1.5">
                <Label>Temporary Password</Label>
                <div className="flex gap-2">
                  <Input value={inviteResult.tempPassword} readOnly className="font-mono text-sm" />
                  <Button variant="outline" type="button" onClick={() => navigator.clipboard?.writeText(inviteResult.tempPassword)}>
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Share this with the user. They should change it after first sign-in.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {inviteError && (
              <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">{inviteError}</p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="user-name">Full Name</Label>
              <Input id="user-name" value={userDraft.name} onChange={e => setUserDraft(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Dr. Priya Nair" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-email">Email Address</Label>
              <Input id="user-email" type="email" value={userDraft.email} onChange={e => setUserDraft(p => ({ ...p, email: e.target.value }))} placeholder="e.g. priya@apollodelhi.in" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-role">Role</Label>
              <Select id="user-role" value={userDraft.role} onChange={e => setUserDraft(p => ({ ...p, role: e.target.value }))}>
                <option value="Attending Physician">Attending Physician</option>
                <option value="Nurse">Nurse</option>
                <option value="Organization Admin">Organization Admin</option>
                <option value="Billing Specialist">Billing Specialist</option>
                <option value="Lab Technician">Lab Technician</option>
                <option value="Radiologist">Radiologist</option>
                <option value="Pharmacist">Pharmacist</option>
                <option value="System Administrator">System Administrator</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-org">Organization (optional)</Label>
              <Input id="user-org" value={userDraft.org} onChange={e => setUserDraft(p => ({ ...p, org: e.target.value }))} placeholder="e.g. Apollo Hospitals Delhi" />
            </div>
          </div>
        )}
      </Dialog>
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
