'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, AlertCircle, CalendarOff } from 'lucide-react';
import { Button, Input, Select, Badge, Card, CardHeader, CardTitle, CardContent, EmptyState } from '@/components/ui';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

type Leave = {
  _id: string;
  startDate: string;
  endDate: string;
  reason: string;
  type: string;
};

const LEAVE_TONE: Record<string, 'warning' | 'danger' | 'info' | 'neutral'> = {
  Vacation: 'info',
  Sick: 'danger',
  Conference: 'neutral',
  Emergency: 'warning',
  Other: 'neutral',
};

export function LeaveManager({ doctorId }: { doctorId: string }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ startDate: '', endDate: '', reason: '', type: 'Vacation' });
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery<{ success: boolean; data: Leave[] }>({
    queryKey: ['doctor_leaves', doctorId],
    queryFn: () =>
      fetch(`${API}/api/schedules/${doctorId}/leaves`, { headers: authHeaders() }).then(r => r.json()),
    enabled: !!doctorId,
  });

  const addMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const res = await fetch(`${API}/api/schedules/${doctorId}/leaves`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to add leave');
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['doctor_leaves', doctorId] });
      setForm({ startDate: '', endDate: '', reason: '', type: 'Vacation' });
      setShowForm(false);
      setFormError('');
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (leaveId: string) => {
      const res = await fetch(`${API}/api/schedules/${doctorId}/leaves/${leaveId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete');
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctor_leaves', doctorId] }),
  });

  const leaves: Leave[] = data?.data ?? [];

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.startDate || !form.endDate) {
      setFormError('Start and end dates are required.');
      return;
    }
    if (form.endDate < form.startDate) {
      setFormError('End date must be on or after start date.');
      return;
    }
    addMutation.mutate(form);
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between border-b border-border">
        <CardTitle className="text-sm">Leave / Time Off</CardTitle>
        <Button size="sm" variant="secondary" onClick={() => setShowForm(v => !v)} className="h-7 gap-1 text-xs">
          <Plus className="h-3.5 w-3.5" /> Add Leave
        </Button>
      </CardHeader>

      {showForm && (
        <div className="border-b border-border bg-muted/30 p-4">
          <form onSubmit={handleAdd} className="space-y-3">
            {formError && (
              <p className="flex items-center gap-1 text-xs text-danger">
                <AlertCircle className="h-3.5 w-3.5" /> {formError}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Start Date</label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                  className="h-8 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">End Date</label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                  className="h-8 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Leave Type</label>
                <Select
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="h-8 text-xs"
                >
                  {['Vacation', 'Sick', 'Conference', 'Emergency', 'Other'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground">Reason</label>
                <Input
                  value={form.reason}
                  onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                  placeholder="Optional reason"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={addMutation.isPending} className="h-8">
                {addMutation.isPending ? 'Saving…' : 'Save Leave'}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setShowForm(false); setFormError(''); }} className="h-8">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2].map(i => <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />)}
          </div>
        ) : leaves.length === 0 ? (
          <EmptyState icon={CalendarOff} title="No leave records" description="Approved leaves and time-off will appear here." />
        ) : (
          <ul className="divide-y divide-border">
            {leaves.map(l => (
              <li key={l._id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone={LEAVE_TONE[l.type] ?? 'neutral'} dot>{l.type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {fmt(l.startDate)} – {fmt(l.endDate)}
                    </span>
                  </div>
                  {l.reason && <p className="mt-0.5 text-xs text-muted-foreground">{l.reason}</p>}
                </div>
                <button
                  onClick={() => deleteMutation.mutate(l._id)}
                  disabled={deleteMutation.isPending}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                  aria-label="Delete leave"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
