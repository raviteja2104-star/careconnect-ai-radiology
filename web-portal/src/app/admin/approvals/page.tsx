'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import {
    PageHeader, Card, CardContent, Button, Badge, Avatar, EmptyState,
} from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeader(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

interface PendingUser {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    createdAt: string;
    avatar?: string;
    authProviders?: { googleId?: string };
}

async function fetchPending(): Promise<PendingUser[]> {
    const res = await fetch(`${API_BASE}/api/admin/pending-approvals`, {
        headers: { 'Content-Type': 'application/json', ...authHeader() },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to load pending approvals');
    return json.data as PendingUser[];
}

async function patchUser(id: string, action: 'approve' | 'reject'): Promise<void> {
    const res = await fetch(`${API_BASE}/api/admin/users/${id}/${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Action failed');
}

const ROLE_LABELS: Record<string, string> = {
    doctor: 'Doctor', nurse: 'Nurse', reception: 'Receptionist',
    lab_tech: 'Lab Technician', pharmacist: 'Pharmacist',
    radiologist: 'Radiologist', emergency: 'Emergency Staff',
    admin: 'Administrator', biller: 'Biller', patient: 'Patient',
};

export default function ApprovalsPage() {
    const qc = useQueryClient();

    const { data: users = [], isLoading, isError, refetch } = useQuery({
        queryKey: ['admin', 'pending-approvals'],
        queryFn: fetchPending,
        refetchInterval: 30000,
    });

    const approveMutation = useMutation({
        mutationFn: (id: string) => patchUser(id, 'approve'),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'pending-approvals'] }),
    });

    const rejectMutation = useMutation({
        mutationFn: (id: string) => patchUser(id, 'reject'),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'pending-approvals'] }),
    });

    const isPending = (id: string) =>
        approveMutation.isPending && approveMutation.variables === id ||
        rejectMutation.isPending && rejectMutation.variables === id;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Account Approvals"
                description="Review and approve new accounts registered via Google Sign-In."
                crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Approvals' }]}
                actions={
                    <div className="flex items-center gap-2">
                        {users.length > 0 && (
                            <Badge tone="warning" dot pulse>
                                {users.length} pending
                            </Badge>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => refetch()}>
                            <RefreshCw className="h-4 w-4" aria-hidden />
                            Refresh
                        </Button>
                    </div>
                }
            />

            {isLoading && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardContent className="p-4">
                                <div className="flex animate-pulse items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-muted" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-40 rounded bg-muted" />
                                        <div className="h-3 w-60 rounded bg-muted" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {isError && !isLoading && (
                <Card>
                    <CardContent className="p-6 text-center text-sm text-muted-foreground">
                        Failed to load pending approvals.{' '}
                        <button onClick={() => refetch()} className="font-medium text-primary underline">Retry</button>
                    </CardContent>
                </Card>
            )}

            {!isLoading && !isError && users.length === 0 && (
                <EmptyState
                    icon={CheckCircle2}
                    title="No pending approvals"
                    description="All Google Sign-In requests have been reviewed. New requests will appear here automatically."
                />
            )}

            {!isLoading && users.length > 0 && (
                <div className="space-y-3">
                    {users.map((user) => {
                        const name = `${user.firstName} ${user.lastName}`;
                        const via = user.authProviders?.googleId ? 'Google' : 'Unknown';
                        const since = new Date(user.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                        });
                        const busy = isPending(user._id);

                        return (
                            <Card key={user._id}>
                                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                                    <Avatar name={name} src={user.avatar} size="md" />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-semibold text-foreground">{name}</span>
                                            <Badge tone="neutral">{ROLE_LABELS[user.role] ?? user.role}</Badge>
                                            <Badge tone="warning" className="gap-1">
                                                <Clock className="h-3 w-3" aria-hidden /> Pending
                                            </Badge>
                                        </div>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {user.email} · via {via} · Registered {since}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-danger/40 text-danger hover:bg-danger/10"
                                            onClick={() => rejectMutation.mutate(user._id)}
                                            disabled={busy}
                                        >
                                            <XCircle className="h-3.5 w-3.5" aria-hidden />
                                            Reject
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => approveMutation.mutate(user._id)}
                                            disabled={busy}
                                            loading={approveMutation.isPending && approveMutation.variables === user._id}
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                                            Approve
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
