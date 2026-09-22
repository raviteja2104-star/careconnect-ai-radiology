'use client';
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Calendar, Clock, Plus, Trash2, ChevronLeft, ChevronRight,
  Sun, Moon, Coffee, AlertCircle, CheckCircle,
} from 'lucide-react';
import {
  PageHeader, Badge, Button, Card, CardHeader, CardTitle, CardContent,
  EmptyState, SkeletonCard, Label, Input, Select, useToast, Dialog,
} from '@/components/ui';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getDoctorId(): string | null {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return null;
    const p = JSON.parse(atob(token.split('.')[1]));
    return p.id ?? p._id ?? null;
  } catch { return null; }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type TimeSlot = { startTime: string; endTime: string; slotDuration?: number; maxPatients?: number };
type DaySchedule = TimeSlot[];
type WeeklySchedule = { [day: string]: DaySchedule };
type Leave = { _id?: string; startDate: string; endDate: string; reason?: string; type?: string };
type ScheduleData = {
  doctor: string;
  hospital: string;
  weeklySchedule: WeeklySchedule;
  leaves: Leave[];
};

type Slot = { time: string; available: boolean; reason?: string };

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const LEAVE_TYPES = ['Vacation', 'Sick', 'Conference', 'Emergency', 'Other'];
const DEFAULT_SLOTS: TimeSlot[] = [{ startTime: '09:00', endTime: '13:00', slotDuration: 15 }];

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function dayName(d: Date): string {
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
}

function slotLabel(s: TimeSlot) {
  return `${s.startTime} – ${s.endTime}${s.slotDuration ? ` (${s.slotDuration}min slots)` : ''}`;
}

function isOnLeave(leaves: Leave[], date: Date): Leave | null {
  const ds = formatDate(date);
  return leaves.find(l => l.startDate.slice(0, 10) <= ds && l.endDate.slice(0, 10) >= ds) ?? null;
}

// ── Day column ────────────────────────────────────────────────────────────────

function DayColumn({
  day, slots, onAddSlot, onRemoveSlot,
}: {
  day: string;
  slots: DaySchedule;
  onAddSlot: (day: string) => void;
  onRemoveSlot: (day: string, idx: number) => void;
}) {
  const isWeekend = day === 'Saturday' || day === 'Sunday';
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold uppercase tracking-wide ${isWeekend ? 'text-warning' : 'text-muted-foreground'}`}>
          {day.slice(0, 3)}
        </span>
        {isWeekend && <span className="text-xs text-warning">Weekend</span>}
      </div>
      <div className="min-h-[80px] space-y-1.5 rounded-xl border border-border bg-muted/30 p-2">
        {slots.length === 0 ? (
          <p className="py-3 text-center text-xs text-subtle-foreground">Off</p>
        ) : (
          slots.map((s, i) => (
            <div key={i} className="group flex items-center justify-between gap-1 rounded-lg bg-card px-2.5 py-1.5 shadow-soft">
              <span className="text-xs font-medium tabular-nums text-foreground">{s.startTime}–{s.endTime}</span>
              <button
                onClick={() => onRemoveSlot(day, i)}
                className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                aria-label={`Remove ${slotLabel(s)}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>
      <Button size="sm" variant="ghost" className="w-full text-xs" onClick={() => onAddSlot(day)}>
        <Plus className="h-3 w-3" /> Add slot
      </Button>
    </div>
  );
}

// ── Add Slot Modal ────────────────────────────────────────────────────────────

function AddSlotModal({ day, onClose, onAdd }: {
  day: string;
  onClose: () => void;
  onAdd: (slot: TimeSlot) => void;
}) {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');
  const [duration, setDuration] = useState('15');

  return (
    <Dialog open onClose={onClose} title={`Add slot — ${day}`} size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            onAdd({ startTime, endTime, slotDuration: parseInt(duration) || 15 });
            onClose();
          }}>Add</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="slot-start" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">Start time</Label>
            <Input id="slot-start" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="slot-end" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">End time</Label>
            <Input id="slot-end" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="slot-duration" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">Slot duration (minutes)</Label>
          <Select id="slot-duration" value={duration} onChange={e => setDuration(e.target.value)}>
            {[10, 15, 20, 30, 45, 60].map(d => <option key={d} value={d}>{d} min</option>)}
          </Select>
        </div>
      </div>
    </Dialog>
  );
}

// ── Add Leave Modal ───────────────────────────────────────────────────────────

function AddLeaveModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (leave: Omit<Leave, '_id'>) => void;
}) {
  const today = formatDate(new Date());
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState('');
  const [type, setType] = useState('Vacation');

  return (
    <Dialog open onClose={onClose} title="Add leave" size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onAdd({ startDate, endDate, reason, type }); onClose(); }}>
            Save leave
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="leave-start" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">From</Label>
            <Input id="leave-start" type="date" value={startDate} min={today} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="leave-end" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">To</Label>
            <Input id="leave-end" type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="leave-type" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">Type</Label>
          <Select id="leave-type" value={type} onChange={e => setType(e.target.value)}>
            {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="leave-reason" className="mb-1.5 block text-xs font-bold uppercase tracking-wide">Reason (optional)</Label>
          <Input id="leave-reason" type="text" placeholder="e.g. Annual conference in Mumbai" value={reason} onChange={e => setReason(e.target.value)} />
        </div>
      </div>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DoctorSchedulePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [addSlotDay, setAddSlotDay] = useState<string | null>(null);
  const [showAddLeave, setShowAddLeave] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>(() =>
    Object.fromEntries(DAYS.map(d => [d, [] as DaySchedule]))
  );

  useEffect(() => { setDoctorId(getDoctorId()); }, []);

  // Fetch weekly schedule
  const { data: schedData, isLoading: schedLoading } = useQuery({
    queryKey: ['schedule', doctorId],
    queryFn: () =>
      fetch(`${API}/api/schedules/${doctorId}`, { headers: authHeaders() }).then(r => r.json()),
    enabled: !!doctorId,
  });

  // Keep local weeklySchedule in sync with server data
  useEffect(() => {
    if (schedData?.success && schedData.data?.weeklySchedule) {
      setWeeklySchedule(schedData.data.weeklySchedule);
    }
  }, [schedData]);

  // Fetch available slots for the viewed date
  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['schedule-slots', doctorId, formatDate(viewDate)],
    queryFn: () =>
      fetch(`${API}/api/schedules/${doctorId}/slots?date=${formatDate(viewDate)}`, { headers: authHeaders() }).then(r => r.json()),
    enabled: !!doctorId,
  });

  const schedule: ScheduleData | null = schedData?.success ? schedData.data : null;
  const slots: Slot[] = slotsData?.data ?? [];
  const leaves: Leave[] = schedule?.leaves ?? [];
  const leaveToday = isOnLeave(leaves, viewDate);

  // Save weekly schedule
  const saveMutation = useMutation({
    mutationFn: () =>
      fetch(`${API}/api/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ doctor: doctorId, weeklySchedule }),
      }).then(r => r.json()),
    onSuccess: res => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['schedule', doctorId] });
        queryClient.invalidateQueries({ queryKey: ['schedule-slots', doctorId] });
        toast({ title: 'Schedule saved', description: 'Your weekly hours are updated.' });
      } else {
        toast({ title: 'Save failed', description: res.error || 'Unknown error', variant: 'destructive' });
      }
    },
    onError: () => toast({ title: 'Save failed', description: 'Network error', variant: 'destructive' }),
  });

  // Add leave
  const addLeaveMutation = useMutation({
    mutationFn: (leave: Omit<Leave, '_id'>) =>
      fetch(`${API}/api/schedules/${doctorId}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(leave),
      }).then(r => r.json()),
    onSuccess: res => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['schedule', doctorId] });
        toast({ title: 'Leave added' });
      } else {
        toast({ title: 'Failed to add leave', description: res.error, variant: 'destructive' });
      }
    },
  });

  // Delete leave
  const deleteLeaveMutation = useMutation({
    mutationFn: (leaveId: string) =>
      fetch(`${API}/api/schedules/${doctorId}/leaves/${leaveId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', doctorId] });
      toast({ title: 'Leave removed' });
    },
  });

  function handleAddSlot(day: string, slot: TimeSlot) {
    setWeeklySchedule(prev => ({ ...prev, [day]: [...(prev[day] ?? []), slot] }));
  }

  function handleRemoveSlot(day: string, idx: number) {
    setWeeklySchedule(prev => ({ ...prev, [day]: (prev[day] ?? []).filter((_, i) => i !== idx) }));
  }

  const hasChanges = JSON.stringify(weeklySchedule) !== JSON.stringify(schedule?.weeklySchedule ?? {});

  // Slot session buckets
  const morning = slots.filter(s => s.time < '12:00');
  const afternoon = slots.filter(s => s.time >= '12:00' && s.time < '17:00');
  const evening = slots.filter(s => s.time >= '17:00');

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Schedule"
        description="Manage weekly working hours, leaves, and view available appointment slots."
        crumbs={[{ label: 'Doctor', href: '/dashboard' }, { label: 'Schedule' }]}
        actions={
          <Button
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            disabled={!hasChanges || saveMutation.isPending}
          >
            <CheckCircle className="h-4 w-4" aria-hidden />
            {saveMutation.isPending ? 'Saving…' : 'Save schedule'}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Left: weekly schedule editor */}
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-primary" aria-hidden />
                Weekly Working Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              {schedLoading ? (
                <SkeletonCard />
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-7">
                  {DAYS.map(day => (
                    <DayColumn
                      key={day}
                      day={day}
                      slots={weeklySchedule[day] ?? []}
                      onAddSlot={d => setAddSlotDay(d)}
                      onRemoveSlot={handleRemoveSlot}
                    />
                  ))}
                </div>
              )}
              {hasChanges && (
                <p className="mt-4 text-xs text-warning">
                  <AlertCircle className="mr-1 inline h-3 w-3" aria-hidden />
                  Unsaved changes — click &ldquo;Save schedule&rdquo; to publish.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Leave list */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Moon className="h-4 w-4 text-primary" aria-hidden />
                  Leave Calendar
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowAddLeave(true)}>
                  <Plus className="h-3.5 w-3.5" aria-hidden /> Add leave
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {schedLoading ? (
                <SkeletonCard />
              ) : leaves.length === 0 ? (
                <EmptyState icon={Moon} title="No leaves scheduled" description="Add planned time-off so patients see you as unavailable." />
              ) : (
                <div className="space-y-2">
                  {leaves.map((l, i) => {
                    const startStr = new Date(l.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                    const endStr = new Date(l.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                    const isSame = l.startDate.slice(0, 10) === l.endDate.slice(0, 10);
                    return (
                      <motion.div
                        key={l._id ?? i}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.04 }}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <Badge tone={l.type === 'Emergency' ? 'danger' : l.type === 'Sick' ? 'warning' : 'brand'}>
                            {l.type ?? 'Leave'}
                          </Badge>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {isSame ? startStr : `${startStr} – ${endStr}`}
                            </p>
                            {l.reason && <p className="mt-0.5 text-xs text-muted-foreground">{l.reason}</p>}
                          </div>
                        </div>
                        <button
                          onClick={() => l._id && deleteLeaveMutation.mutate(l._id)}
                          disabled={!l._id || deleteLeaveMutation.isPending}
                          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
                          aria-label="Delete leave"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: day view */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-primary" aria-hidden />
                  Day View
                </CardTitle>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; })}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                    aria-label="Previous day"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewDate(new Date())}
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-muted"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setViewDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; })}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                    aria-label="Next day"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm font-semibold text-foreground">{dayName(viewDate)}</p>
            </CardHeader>
            <CardContent>
              {leaveToday ? (
                <div className="rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm">
                  <p className="font-semibold text-warning">On leave</p>
                  <p className="mt-0.5 text-warning/80">{leaveToday.type}{leaveToday.reason ? ` — ${leaveToday.reason}` : ''}</p>
                </div>
              ) : slotsLoading ? (
                <SkeletonCard />
              ) : slots.length === 0 ? (
                <EmptyState icon={Clock} title="No slots" description="No working hours set for this day." />
              ) : (
                <div className="space-y-4">
                  {[
                    { label: 'Morning', icon: Sun, items: morning },
                    { label: 'Afternoon', icon: Coffee, items: afternoon },
                    { label: 'Evening', icon: Moon, items: evening },
                  ].filter(g => g.items.length > 0).map(group => (
                    <div key={group.label}>
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        <group.icon className="h-3.5 w-3.5" aria-hidden />
                        {group.label}
                      </p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {group.items.map((s, i) => (
                          <div
                            key={i}
                            className={`rounded-lg border px-2 py-1.5 text-center text-xs font-medium tabular-nums transition-colors ${
                              s.available
                                ? 'border-success/30 bg-success/10 text-success'
                                : 'border-border bg-muted/40 text-muted-foreground line-through'
                            }`}
                            title={s.available ? 'Available' : (s.reason ?? 'Booked')}
                          >
                            {s.time}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success/70" />Available</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/40" />Booked</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {addSlotDay && (
        <AddSlotModal
          day={addSlotDay}
          onClose={() => setAddSlotDay(null)}
          onAdd={slot => handleAddSlot(addSlotDay, slot)}
        />
      )}
      {showAddLeave && (
        <AddLeaveModal
          onClose={() => setShowAddLeave(false)}
          onAdd={leave => addLeaveMutation.mutate(leave)}
        />
      )}
    </div>
  );
}
