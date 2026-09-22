'use client';
import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { Users, Clock, CheckCircle2, PhoneCall, AlertTriangle } from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardContent,
  Badge, Button, DataTable, SkeletonTable, type Column, EmptyState,
} from '@/components/ui';
import { useToast } from '@/components/ui/toast';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type QueueToken = {
  _id: string;
  tokenNumber: string;
  patientName: string;
  department: string;
  priority: number;
  priorityReason?: string;
  status: string;
  room?: string;
  createdAt?: string;
  calledAt?: string;
  doctor?: { firstName?: string; lastName?: string };
};

const STATUS_TONE: Record<string, 'warning' | 'brand' | 'success' | 'danger' | 'neutral'> = {
  WAITING: 'warning',
  CALLED: 'brand',
  IN_PROGRESS: 'success',
  COMPLETED: 'success',
  MISSED: 'danger',
};

export default function LiveQueueMonitor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Detect department from query or default to first available
  const [selectedDept, setSelectedDept] = React.useState('Cardiology');

  const { data: queueRes, isLoading } = useQuery({
    queryKey: ['reception_queue', selectedDept],
    queryFn: () =>
      fetch(`${API}/api/queue/${encodeURIComponent(selectedDept)}`, { headers: authHeaders() })
        .then(r => r.json()),
    refetchInterval: 15_000,
  });

  // Live socket updates
  useEffect(() => {
    const socket = io(API);
    socket.on('QUEUE_UPDATED', ({ department }: { department: string }) => {
      queryClient.invalidateQueries({ queryKey: ['reception_queue', department] });
    });
    socket.on('TOKEN_CALLED', () => {
      queryClient.invalidateQueries({ queryKey: ['reception_queue', selectedDept] });
    });
    return () => { socket.disconnect(); };
  }, [queryClient, selectedDept]);

  const callMutation = useMutation({
    mutationFn: ({ id, room }: { id: string; room: string }) =>
      fetch(`${API}/api/queue/call/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ room }),
      }).then(r => r.json()),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['reception_queue', selectedDept] });
      if (res?.success) {
        toast('success', `Token called: ${res.data?.tokenNumber}`, `Room: ${res.data?.room}`);
      } else {
        toast('error', 'Call failed', res?.error || 'Unknown error');
      }
    },
    onError: () => toast('error', 'Call failed', 'Network error'),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`${API}/api/queue/complete/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reception_queue', selectedDept] });
      toast('success', 'Consultation completed');
    },
    onError: () => toast('error', 'Failed to complete', 'Network error'),
  });

  const tokens: QueueToken[] = queueRes?.data ?? [];
  const avgWait: number | null = queueRes?.avgWaitMins ?? null;
  const waiting = tokens.filter(t => t.status === 'WAITING').length;
  const inProgress = tokens.filter(t => t.status === 'CALLED' || t.status === 'IN_PROGRESS').length;

  const DEPARTMENTS = ['Cardiology', 'General', 'Orthopedics', 'Pediatrics', 'ENT', 'Neurology', 'Gynecology', 'Dermatology'];

  const columns: Column<QueueToken>[] = [
    {
      key: 'tokenNumber',
      header: 'Token',
      sortable: true,
      accessor: (t) => t.tokenNumber,
      cell: (t) => (
        <span className="font-mono text-base font-extrabold tabular-nums text-primary">{t.tokenNumber}</span>
      ),
    },
    {
      key: 'patientName',
      header: 'Patient',
      sortable: true,
      accessor: (t) => t.patientName,
      cell: (t) => (
        <div>
          <p className="font-semibold text-foreground">{t.patientName}</p>
          {t.priorityReason && t.priorityReason !== 'Normal' && (
            <span className="text-xs font-bold text-danger">{t.priorityReason}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (t) => t.status,
      cell: (t) => (
        <Badge tone={STATUS_TONE[t.status] ?? 'neutral'} dot={t.status === 'CALLED' || t.status === 'IN_PROGRESS'} pulse={t.status === 'CALLED'}>
          {t.status}
        </Badge>
      ),
    },
    {
      key: 'room',
      header: 'Room',
      accessor: (t) => t.room ?? '',
      cell: (t) => t.room ? <span className="font-mono text-sm text-muted-foreground">{t.room}</span> : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'doctor',
      header: 'Doctor',
      accessor: (t) => [t.doctor?.firstName, t.doctor?.lastName].filter(Boolean).join(' '),
      cell: (t) => (
        <span className="text-sm text-muted-foreground">
          {[t.doctor?.firstName, t.doctor?.lastName].filter(Boolean).join(' ') || '—'}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Actions',
      align: 'right',
      accessor: () => '',
      cell: (t) => (
        <div className="flex gap-2 justify-end">
          {t.status === 'WAITING' && (
            <Button
              size="sm"
              onClick={() => callMutation.mutate({ id: t._id, room: 'OPD-1' })}
              loading={callMutation.isPending}
            >
              <PhoneCall className="h-3.5 w-3.5" /> Call
            </Button>
          )}
          {(t.status === 'CALLED' || t.status === 'IN_PROGRESS') && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => completeMutation.mutate(t._id)}
              loading={completeMutation.isPending}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Complete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Live Queue Monitor"
        description="Real-time token management and patient calling."
        crumbs={[{ label: 'Reception', href: '/reception/dashboard' }, { label: 'Queue' }]}
      />

      {/* Department selector */}
      <div className="flex flex-wrap gap-2">
        {DEPARTMENTS.map(dept => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              selectedDept === dept
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      <StatGrid>
        <StatCard label="Waiting" value={waiting} sub="Patients in queue" icon={Users} tone="amber" delay={0} />
        <StatCard label="In Progress" value={inProgress} sub="Being consulted" icon={AlertTriangle} tone="brand" delay={0.05} />
        <StatCard
          label="Avg Wait"
          value={avgWait !== null ? `${avgWait}m` : '—'}
          sub="Based on today's data"
          icon={Clock}
          tone="emerald"
          delay={0.1}
        />
        <StatCard label="Completed Today" value={tokens.length - waiting - inProgress} sub="Consultations done" icon={CheckCircle2} tone="teal" delay={0.15} />
      </StatGrid>

      <Card>
        <CardHeader>
          <CardTitle>Active Queue — {selectedDept}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable rows={5} />
          ) : tokens.length === 0 ? (
            <EmptyState icon={Users} title="Queue is empty" description="No active tokens for this department today." />
          ) : (
            <DataTable<QueueToken>
              columns={columns}
              data={tokens}
              rowKey={(t) => t._id}
              searchPlaceholder="Search by name or token…"
              exportName={`queue-${selectedDept.toLowerCase()}`}
              emptyTitle="No tokens found"
              emptyDescription="Adjust your search or select a different department."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
