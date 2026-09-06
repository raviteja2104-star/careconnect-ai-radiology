'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Shield, Users, ChevronDown, ChevronUp, Plus, Search,
    CheckCircle2, XCircle, AlertCircle, Lock, PlayCircle,
    Eye, Ban, Info,
} from 'lucide-react';
import {
    PageHeader, Card, CardContent, CardHeader, CardTitle, Button, Badge, Input,
} from '@/components/ui';
import { usePermissions } from '@/contexts/PermissionContext';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function getAuthHeader(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        ...opts,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);
    return json.data as T;
}

interface Role {
    _id: string; name: string; displayName: string; description: string;
    workspaces: string[]; permissions: string[]; isSystem: boolean; isActive: boolean;
}

interface UserWithRoles {
    _id: string; firstName?: string; lastName?: string; email?: string;
    role: string; isActive: boolean;
    rbacRoles: Array<{ _id: string; name: string; displayName: string }>;
}

interface PermissionCatalogue {
    permissions: Record<string, string>; workspaces: string[];
}

interface AnnotatedPermission {
    permission: string; status: 'ALLOW' | 'DENY';
    sources: Array<{ type: string; name?: string; reason?: string }>;
}

interface EffectivePermissions {
    permissions: string[]; workspaces: string[];
    annotated: AnnotatedPermission[];
}

interface SimulateResult {
    userId: string; permission: string;
    result: 'ALLOWED' | 'DENIED'; reason: string;
}

type ActiveTab = 'users' | 'roles' | 'catalogue' | 'simulator' | 'effective';

// ─── Guard ────────────────────────────────────────────────────────────────────

export default function PermissionsPage() {
    const { hasPermission } = usePermissions();
    const qc = useQueryClient();
    const [activeTab, setActiveTab] = React.useState<ActiveTab>('users');
    const [userSearch, setUserSearch] = React.useState('');
    const [expandedUser, setExpandedUser] = React.useState<string | null>(null);

    if (!hasPermission('ADMIN.MANAGE_PERMISSIONS')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Lock className="h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-semibold text-foreground">Access Denied</p>
                <p className="text-sm text-muted-foreground">You do not have permission to manage access controls.</p>
            </div>
        );
    }

    return (
        <PermissionsPageInner
            activeTab={activeTab} setActiveTab={setActiveTab}
            userSearch={userSearch} setUserSearch={setUserSearch}
            expandedUser={expandedUser} setExpandedUser={setExpandedUser}
            qc={qc}
        />
    );
}

// ─── Inner page (rendered once guard passes) ──────────────────────────────────

function PermissionsPageInner({
    activeTab, setActiveTab, userSearch, setUserSearch,
    expandedUser, setExpandedUser, qc,
}: {
    activeTab: ActiveTab; setActiveTab: (t: ActiveTab) => void;
    userSearch: string; setUserSearch: (s: string) => void;
    expandedUser: string | null; setExpandedUser: (id: string | null) => void;
    qc: ReturnType<typeof useQueryClient>;
}) {
    const { data: catalogue } = useQuery<PermissionCatalogue>({
        queryKey: ['rbac', 'catalogue'],
        queryFn: () => apiFetch<PermissionCatalogue>('/api/rbac/permissions'),
        staleTime: 300_000,
    });

    const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
        queryKey: ['rbac', 'roles'],
        queryFn: () => apiFetch<Role[]>('/api/rbac/roles'),
        staleTime: 60_000,
    });

    const { data: users = [], isLoading: usersLoading } = useQuery<UserWithRoles[]>({
        queryKey: ['rbac', 'users'],
        queryFn: () => apiFetch<UserWithRoles[]>('/api/rbac/users'),
        staleTime: 30_000,
    });

    const assignRoleMutation = useMutation({
        mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
            apiFetch('/api/rbac/users/assign-role', { method: 'POST', body: JSON.stringify({ userId, roleId }) }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['rbac', 'users'] }),
    });

    const revokeRoleMutation = useMutation({
        mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
            apiFetch('/api/rbac/users/revoke-role', { method: 'POST', body: JSON.stringify({ userId, roleId }) }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['rbac', 'users'] }),
    });

    const filteredUsers = users.filter(u => {
        const q = userSearch.toLowerCase();
        return !q || (u.firstName || '').toLowerCase().includes(q) ||
            (u.lastName || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            u.role.toLowerCase().includes(q);
    });

    const permsByWorkspace = React.useMemo(() => {
        if (!catalogue?.permissions) return {};
        const groups: Record<string, Array<{ key: string; label: string }>> = {};
        for (const [key, label] of Object.entries(catalogue.permissions)) {
            const prefix = key.split('.')[0];
            if (!groups[prefix]) groups[prefix] = [];
            groups[prefix].push({ key, label: label as string });
        }
        return groups;
    }, [catalogue]);

    const TABS: Array<{ id: ActiveTab; label: string; icon: React.ElementType }> = [
        { id: 'users',     label: 'Users & Roles',       icon: Users      },
        { id: 'roles',     label: 'Role Definitions',    icon: Shield     },
        { id: 'catalogue', label: 'Permission Catalogue', icon: Lock       },
        { id: 'simulator', label: 'Access Simulator',    icon: PlayCircle },
        { id: 'effective', label: 'Effective Access',    icon: Eye        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Access Control"
                description="Manage roles, permissions, and workspace access for every user."
                crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Permissions' }]}
            />

            {/* Tab bar */}
            <div className="flex flex-wrap gap-1 rounded-xl bg-surface-2 p-1 w-fit">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === t.id
                                ? 'bg-surface text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <t.icon className="h-4 w-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Users & Roles ─────────────────────────────────────────────────── */}
            {activeTab === 'users' && (
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle className="text-base">Users</CardTitle>
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, email or role…"
                                    value={userSearch}
                                    onChange={e => setUserSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {usersLoading ? (
                            <p className="text-sm text-muted-foreground">Loading users…</p>
                        ) : filteredUsers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No users found.</p>
                        ) : (
                            <div className="divide-y divide-border">
                                {filteredUsers.map(user => {
                                    const isExpanded = expandedUser === user._id;
                                    const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || user._id;
                                    const assignedRoleIds = new Set(user.rbacRoles.map(r => r._id));
                                    return (
                                        <div key={user._id} className="py-3">
                                            <button
                                                onClick={() => setExpandedUser(isExpanded ? null : user._id)}
                                                className="flex w-full items-center justify-between gap-3 text-left"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                        {(displayName[0] || '?').toUpperCase()}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <Badge tone="neutral" className="capitalize">{user.role}</Badge>
                                                    {user.rbacRoles.length > 0 && (
                                                        <Badge tone="brand">{user.rbacRoles.length} role{user.rbacRoles.length !== 1 ? 's' : ''}</Badge>
                                                    )}
                                                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                                </div>
                                            </button>
                                            {isExpanded && (
                                                <div className="mt-3 rounded-xl border border-border bg-surface-2 p-4 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assigned Roles</p>
                                                        <button
                                                            onClick={() => { setExpandedUser(null); setActiveTab('effective'); }}
                                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                                        >
                                                            <Eye className="h-3 w-3" /> View Effective Access
                                                        </button>
                                                    </div>
                                                    {user.rbacRoles.length === 0 && (
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <AlertCircle className="h-3 w-3" /> No roles assigned — user has no access.
                                                        </p>
                                                    )}
                                                    <div className="flex flex-wrap gap-2">
                                                        {user.rbacRoles.map(r => (
                                                            <span key={r._id} className="flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium">
                                                                <CheckCircle2 className="h-3 w-3 text-success" />
                                                                {r.displayName}
                                                                <button
                                                                    onClick={() => revokeRoleMutation.mutate({ userId: user._id, roleId: r._id })}
                                                                    className="ml-1 text-muted-foreground hover:text-danger"
                                                                    title="Revoke role"
                                                                >
                                                                    <XCircle className="h-3 w-3" />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">Add Role</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {roles.filter(r => r.isActive && !assignedRoleIds.has(r._id)).map(r => (
                                                            <button
                                                                key={r._id}
                                                                onClick={() => assignRoleMutation.mutate({ userId: user._id, roleId: r._id })}
                                                                className="flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                                {r.displayName}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ── Role Definitions ─────────────────────────────────────────────── */}
            {activeTab === 'roles' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {rolesLoading ? (
                        <p className="text-sm text-muted-foreground col-span-full">Loading roles…</p>
                    ) : roles.map(role => (
                        <Card key={role._id}>
                            <CardContent className="pt-5 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{role.displayName}</p>
                                        <p className="text-xs text-muted-foreground">{role.description}</p>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        {role.isSystem && <Badge tone="neutral">System</Badge>}
                                        <Badge tone={role.isActive ? 'success' : 'danger'}>{role.isActive ? 'Active' : 'Inactive'}</Badge>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Workspaces</p>
                                    <div className="flex flex-wrap gap-1">
                                        {role.workspaces.map(w => <Badge key={w} tone="brand" className="text-xs">{w}</Badge>)}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">
                                        Permissions <span className="font-normal">({role.permissions.length})</span>
                                    </p>
                                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                                        {role.permissions.map(p => (
                                            <span key={p} className="rounded px-1.5 py-0.5 text-[10px] bg-surface-2 text-muted-foreground font-mono">{p}</span>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* ── Permission Catalogue ─────────────────────────────────────────── */}
            {activeTab === 'catalogue' && (
                <div className="space-y-4">
                    {Object.entries(permsByWorkspace).map(([workspace, perms]) => (
                        <Card key={workspace}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm">
                                    <Shield className="h-4 w-4 text-primary" />
                                    {workspace}
                                    <Badge tone="neutral">{perms.length}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="divide-y divide-border">
                                    {perms.map(p => (
                                        <div key={p.key} className="flex items-center justify-between gap-3 py-2">
                                            <code className="text-xs font-mono text-primary">{p.key}</code>
                                            <span className="text-xs text-muted-foreground text-right">{p.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* ── Access Simulator ─────────────────────────────────────────────── */}
            {activeTab === 'simulator' && (
                <AccessSimulator users={users} catalogue={catalogue} />
            )}

            {/* ── Effective Access ─────────────────────────────────────────────── */}
            {activeTab === 'effective' && (
                <EffectiveAccessView users={users} catalogue={catalogue} />
            )}
        </div>
    );
}

// ─── Access Simulator ─────────────────────────────────────────────────────────

function AccessSimulator({ users, catalogue }: { users: UserWithRoles[]; catalogue: PermissionCatalogue | undefined }) {
    const [userId, setUserId]         = React.useState('');
    const [permission, setPermission] = React.useState('');
    const [result, setResult]         = React.useState<SimulateResult | null>(null);
    const [loading, setLoading]       = React.useState(false);
    const [error, setError]           = React.useState('');

    const allPermissions = React.useMemo(() =>
        catalogue?.permissions ? Object.keys(catalogue.permissions).sort() : [],
        [catalogue]
    );

    async function simulate() {
        if (!userId || !permission) { setError('Select a user and a permission.'); return; }
        setError(''); setResult(null); setLoading(true);
        try {
            const data = await apiFetch<SimulateResult>('/api/rbac/simulate', {
                method: 'POST',
                body: JSON.stringify({ userId, permission }),
            });
            setResult(data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Request failed');
        } finally {
            setLoading(false);
        }
    }

    const selectedUser = users.find(u => u._id === userId);

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Input panel */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <PlayCircle className="h-5 w-5 text-primary" />
                        Access Simulator
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                        Check whether a specific user would be allowed or denied a permission, and see the authoritative reason from the backend.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">User</label>
                        <select
                            value={userId}
                            onChange={e => { setUserId(e.target.value); setResult(null); }}
                            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">Select a user…</option>
                            {users.map(u => (
                                <option key={u._id} value={u._id}>
                                    {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || u._id}
                                    {' '}({u.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Permission</label>
                        <select
                            value={permission}
                            onChange={e => { setPermission(e.target.value); setResult(null); }}
                            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                        >
                            <option value="">Select a permission…</option>
                            {allPermissions.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    {error && (
                        <p className="text-xs text-danger flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 shrink-0" /> {error}
                        </p>
                    )}

                    <Button onClick={simulate} disabled={loading || !userId || !permission} className="w-full">
                        {loading ? 'Checking…' : 'Check Access'}
                    </Button>
                </CardContent>
            </Card>

            {/* Result panel */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Result</CardTitle>
                    {selectedUser && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Checking access for{' '}
                            <strong>{[selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(' ') || selectedUser.email}</strong>
                        </p>
                    )}
                </CardHeader>
                <CardContent>
                    {!result && !loading && (
                        <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
                            <PlayCircle className="h-8 w-8 opacity-30" />
                            <p className="text-sm">Run a simulation to see the result</p>
                        </div>
                    )}
                    {loading && (
                        <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            <p className="text-sm">Querying authorization engine…</p>
                        </div>
                    )}
                    {result && (
                        <div className="space-y-4">
                            {/* Verdict */}
                            <div className={`flex items-center gap-3 rounded-xl p-4 ${result.result === 'ALLOWED' ? 'bg-success/10 border border-success/20' : 'bg-danger/10 border border-danger/20'}`}>
                                {result.result === 'ALLOWED'
                                    ? <CheckCircle2 className="h-8 w-8 text-success shrink-0" />
                                    : <Ban className="h-8 w-8 text-danger shrink-0" />
                                }
                                <div>
                                    <p className={`text-lg font-bold ${result.result === 'ALLOWED' ? 'text-success' : 'text-danger'}`}>
                                        {result.result}
                                    </p>
                                    <code className="text-xs text-muted-foreground font-mono">{result.permission}</code>
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="rounded-lg border border-border bg-surface-2 p-3 space-y-1.5">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reason</p>
                                <p className="text-sm text-foreground">{result.reason}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                                    <Info className="h-3 w-3" />
                                    This result is computed live from the database — it reflects the user&apos;s current permissions, not a cached state.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Effective Access View ────────────────────────────────────────────────────

function EffectiveAccessView({ users, catalogue }: { users: UserWithRoles[]; catalogue: PermissionCatalogue | undefined }) {
    const [userId, setUserId] = React.useState('');
    const [search, setSearch] = React.useState('');

    const { data: effective, isLoading, error } = useQuery<EffectivePermissions>({
        queryKey: ['rbac', 'effective', userId],
        queryFn: () => apiFetch<EffectivePermissions>(`/api/rbac/users/${userId}/effective`),
        enabled: !!userId,
        staleTime: 0, // always fresh
    });

    const allPermissions = React.useMemo(() =>
        catalogue?.permissions ? Object.keys(catalogue.permissions).sort() : [],
        [catalogue]
    );

    const annotatedMap = React.useMemo(() => {
        const m: Record<string, AnnotatedPermission> = {};
        (effective?.annotated || []).forEach(a => { m[a.permission] = a; });
        return m;
    }, [effective]);

    // Group all catalogue permissions by workspace prefix
    const grouped = React.useMemo(() => {
        const groups: Record<string, string[]> = {};
        allPermissions.forEach(p => {
            if (search && !p.toLowerCase().includes(search.toLowerCase())) return;
            const prefix = p.split('.')[0];
            if (!groups[prefix]) groups[prefix] = [];
            groups[prefix].push(p);
        });
        return groups;
    }, [allPermissions, search]);

    const selectedUser = users.find(u => u._id === userId);

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="pt-5">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">User</label>
                            <select
                                value={userId}
                                onChange={e => setUserId(e.target.value)}
                                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Select a user…</option>
                                {users.map(u => (
                                    <option key={u._id} value={u._id}>
                                        {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || u._id}
                                        {' '}({u.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Filter permissions</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input placeholder="e.g. DOCTOR or VIEW" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {!userId && (
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
                    <Eye className="h-8 w-8 opacity-30" />
                    <p className="text-sm">Select a user to view their effective permissions</p>
                </div>
            )}

            {userId && isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground p-4">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-sm">Loading effective permissions…</span>
                </div>
            )}

            {userId && error && (
                <p className="text-sm text-danger p-4">Failed to load effective permissions.</p>
            )}

            {userId && effective && (
                <>
                    {/* Summary header */}
                    <Card>
                        <CardContent className="pt-5">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-sm font-semibold text-foreground">
                                    {selectedUser ? [selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(' ') || selectedUser.email : userId}
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    {effective.workspaces.map(w => <Badge key={w} tone="brand">{w}</Badge>)}
                                    {effective.workspaces.length === 0 && <Badge tone="danger">No workspaces</Badge>}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {effective.permissions.length} permission{effective.permissions.length !== 1 ? 's' : ''} active
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Per-workspace permission grid */}
                    <div className="space-y-4">
                        {Object.entries(grouped).map(([workspace, perms]) => (
                            <Card key={workspace}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-sm">
                                        <Shield className="h-4 w-4 text-primary" />
                                        {workspace}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="divide-y divide-border">
                                        {perms.map(perm => {
                                            const entry = annotatedMap[perm];
                                            const allowed = effective.permissions.includes(perm);
                                            const isDenyOverride = entry?.sources.some(s => s.type === 'DENY_OVERRIDE');
                                            const isGrantOverride = entry?.sources.some(s => s.type === 'GRANT_OVERRIDE');
                                            const fromRole = entry?.sources.find(s => s.type === 'ROLE');

                                            return (
                                                <div key={perm} className="flex items-center justify-between gap-3 py-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        {allowed
                                                            ? <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                                                            : <XCircle className="h-3.5 w-3.5 text-danger/40 shrink-0" />
                                                        }
                                                        <code className={`text-xs font-mono truncate ${allowed ? 'text-foreground' : 'text-muted-foreground/50'}`}>{perm}</code>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-1.5">
                                                        {isDenyOverride && (
                                                            <Badge tone="danger" className="text-[10px]">Explicit Deny</Badge>
                                                        )}
                                                        {isGrantOverride && (
                                                            <Badge tone="success" className="text-[10px]">Direct Grant</Badge>
                                                        )}
                                                        {fromRole && !isDenyOverride && (
                                                            <span className="text-[10px] text-muted-foreground">via {fromRole.name}</span>
                                                        )}
                                                        {!allowed && !isDenyOverride && (
                                                            <span className="text-[10px] text-muted-foreground/50">—</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
