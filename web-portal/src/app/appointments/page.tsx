'use client';
import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Calendar as CalendarIcon,
  Clock,
  Video,
  MapPin,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import {
  PageHeader,
  StatCard,
  StatGrid,
  Card,
  CardContent,
  Badge,
  Button,
  Avatar,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  EmptyState,
  Dropdown,
  DropdownItem,
  Skeleton,
  SkeletonCard,
} from '@/components/ui';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care'}/api`;

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface AppointmentData {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  date: string;
  time: string;
  type: 'Video Call' | 'In-Person';
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  image: string;
  room?: string;
}

type RawAppointment = {
  _id?: string; id?: string; date?: string; doctorName?: string;
  doctor?: { _id?: string; name?: string; specialty?: string; hospital?: string; image?: string };
  specialty?: string; hospital?: string; room?: string; timeSlot?: string; time?: string;
  visitType?: string; type?: string; status?: string;
};

function mapApiAppointment(raw: RawAppointment): AppointmentData {
  const dateStr = raw.date ? new Date(raw.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const statusMap: Record<string, AppointmentData['status']> = {
    scheduled: 'Upcoming', confirmed: 'Upcoming', upcoming: 'Upcoming', booked: 'Upcoming',
    checked_in: 'Upcoming', waiting: 'Upcoming', vitals: 'Upcoming',
    doctor_ready: 'Upcoming', in_consultation: 'Upcoming',
    completed: 'Completed', done: 'Completed',
    cancelled: 'Cancelled', canceled: 'Cancelled',
  };
  return {
    id: raw._id ?? raw.id ?? '',
    doctorId: raw.doctor?._id ?? '',
    doctorName: raw.doctorName ?? raw.doctor?.name ?? 'Doctor',
    specialty: raw.specialty ?? raw.doctor?.specialty ?? '',
    hospital: raw.hospital ?? raw.doctor?.hospital ?? 'CareConnect',
    room: raw.room,
    date: dateStr,
    time: raw.timeSlot ?? raw.time ?? '',
    type: (raw.visitType === 'Video Call' || raw.type === 'Video Call') ? 'Video Call' : 'In-Person',
    status: statusMap[String(raw.status).toLowerCase()] ?? 'Upcoming',
    image: raw.doctor?.image ?? '',
  };
}

const statusTone: Record<AppointmentData['status'], 'info' | 'success' | 'danger'> = {
  Upcoming: 'info', Completed: 'success', Cancelled: 'danger',
};

// ── Reschedule Modal ──────────────────────────────────────────────────────────

interface RescheduleModalProps {
  appointment: AppointmentData;
  onClose: () => void;
  onSuccess: () => void;
}

function RescheduleModal({ appointment, onClose, onSuccess }: RescheduleModalProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(tomorrowStr);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ['availability', appointment.doctorId, selectedDate],
    enabled: !!appointment.doctorId && !!selectedDate,
    queryFn: () =>
      fetch(`${API_BASE}/appointments/doctors/${appointment.doctorId}/availability?date=${selectedDate}`)
        .then(r => r.json()),
    staleTime: 60_000,
  });

  const slots: string[] = useMemo(() => {
    const raw = slotsData?.data ?? slotsData?.slots ?? slotsData;
    if (Array.isArray(raw)) return raw.map((s: string | { slot?: string; time?: string }) =>
      typeof s === 'string' ? s : s.slot ?? s.time ?? ''
    ).filter(Boolean);
    return [];
  }, [slotsData]);

  const handleConfirm = async () => {
    if (!selectedSlot) { setError('Please select a time slot.'); return; }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/appointments/${appointment.id}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ date: selectedDate, timeSlot: selectedSlot }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Could not reschedule appointment.');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal aria-label="Reschedule appointment">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-float"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Reschedule Appointment</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {appointment.doctorName} · {appointment.specialty}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current booking */}
        <div className="mb-5 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current booking</p>
          <p className="mt-1 font-medium text-foreground">{appointment.date} · {appointment.time}</p>
        </div>

        {/* Date picker */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-semibold text-foreground" htmlFor="reschedule-date">
            New date
          </label>
          <input
            id="reschedule-date"
            type="date"
            min={tomorrowStr}
            value={selectedDate}
            onChange={e => { setSelectedDate(e.target.value); setSelectedSlot(''); }}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Slot picker */}
        <div className="mb-5">
          <p className="mb-2 text-sm font-semibold text-foreground">Available time slots</p>
          {slotsLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 rounded-xl" />)}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No slots available on this date. Try another day.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slots.map(slot => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-xl border py-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selectedSlot === slot
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={saving || !selectedSlot}
          >
            {saving ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Saving…</> : <>Confirm <ChevronRight className="ml-1 h-3.5 w-3.5" /></>}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Appointment Row ───────────────────────────────────────────────────────────

interface AppointmentRowProps {
  appointment: AppointmentData;
  delay: number;
  onCancel: (id: string) => Promise<void>;
  onReschedule: (apt: AppointmentData) => void;
  cancelling: boolean;
}

function AppointmentRow({ appointment, delay, onCancel, onReschedule, cancelling }: AppointmentRowProps) {
  const router = useRouter();
  const isVideo = appointment.type === 'Video Call';
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancelConfirm = async () => {
    setCancelError(null);
    try {
      await onCancel(appointment.id);
      setConfirmCancel(false);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Failed to cancel. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card variant="interactive" className="p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={appointment.doctorName} src={appointment.image} size="lg" />
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">{appointment.doctorName}</h3>
              <p className="text-sm font-medium text-muted-foreground">{appointment.specialty}</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-subtle-foreground">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {appointment.hospital} {appointment.room && `• Room ${appointment.room}`}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Badge tone={statusTone[appointment.status]} dot pulse={appointment.status === 'Upcoming'}>
              {appointment.status}
            </Badge>
            <Badge tone="outline">
              {isVideo ? <Video className="h-3 w-3" aria-hidden /> : <MapPin className="h-3 w-3" aria-hidden />}
              {appointment.type}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-foreground">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
              {appointment.date}
            </span>
            <span className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />
              {appointment.time}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {appointment.status === 'Upcoming' && (
              <>
                {isVideo ? (
                  <Button size="sm" onClick={() => router.push('/telemedicine')}>
                    <Video className="h-4 w-4" aria-hidden /> Join Video
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointment.hospital)}`, '_blank', 'noopener,noreferrer')}
                  >
                    <MapPin className="h-4 w-4" aria-hidden /> Directions
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => onReschedule(appointment)}>
                  Reschedule
                </Button>
                <Dropdown
                  trigger={
                    <Button size="icon-sm" variant="ghost" aria-label="More options">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  }
                >
                  <DropdownItem onClick={() => onReschedule(appointment)}>Reschedule</DropdownItem>
                  <DropdownItem
                    className="text-danger"
                    onClick={() => { setConfirmCancel(true); setCancelError(null); }}
                  >
                    Cancel appointment
                  </DropdownItem>
                </Dropdown>
              </>
            )}
            {appointment.status === 'Completed' && (
              <Button size="sm" variant="secondary" onClick={() => router.push('/appointments/book')}>Book Follow-up</Button>
            )}
          </div>
        </div>

        {confirmCancel && (
          <div className="mt-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3">
            <p className="mb-1 text-sm font-medium text-danger">Cancel this appointment?</p>
            <p className="mb-3 text-xs text-muted-foreground">This cannot be undone. You can book a new appointment afterwards.</p>
            {cancelError && <p className="mb-2 text-xs text-danger">{cancelError}</p>}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-danger/30 text-danger hover:bg-danger/10"
                onClick={handleCancelConfirm}
                loading={cancelling}
                disabled={cancelling}
              >
                Yes, cancel
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setConfirmCancel(false); setCancelError(null); }}
                disabled={cancelling}
              >
                Keep appointment
              </Button>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past' | 'Cancelled'>('Upcoming');
  const [search, setSearch] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [reschedulingAppt, setReschedulingAppt] = useState<AppointmentData | null>(null);

  const handleCancel = useCallback(async (id: string) => {
    setCancellingId(id);
    try {
      const res = await fetch(`${API_BASE}/appointments/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { message?: string }).message ?? 'Failed to cancel appointment.');
      }
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    } finally {
      setCancellingId(null);
    }
  }, [queryClient]);

  const handleRescheduleSuccess = useCallback(async () => {
    setReschedulingAppt(null);
    await queryClient.invalidateQueries({ queryKey: ['appointments'] });
  }, [queryClient]);

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/appointments`, { headers: authHeaders() });
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
    },
    staleTime: 30_000,
  });

  const appointments: AppointmentData[] = useMemo(
    () => (rawData ?? []).map(mapApiAppointment),
    [rawData]
  );

  const filtered = useMemo(() => {
    const byTab = appointments.filter(apt => {
      if (activeTab === 'Upcoming') return apt.status === 'Upcoming';
      if (activeTab === 'Past') return apt.status === 'Completed';
      return apt.status === 'Cancelled';
    });
    if (!search.trim()) return byTab;
    const q = search.toLowerCase();
    return byTab.filter(a =>
      a.doctorName.toLowerCase().includes(q) ||
      a.specialty.toLowerCase().includes(q) ||
      a.hospital.toLowerCase().includes(q)
    );
  }, [appointments, activeTab, search]);

  const upcoming = appointments.filter(a => a.status === 'Upcoming').length;
  const completed = appointments.filter(a => a.status === 'Completed').length;
  const cancelled = appointments.filter(a => a.status === 'Cancelled').length;
  const videoVisits = appointments.filter(a => a.type === 'Video Call' && a.status === 'Upcoming').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Manage your upcoming and past medical visits."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Appointments' }]}
        actions={
          <Link href="/appointments/book">
            <Button>
              <Plus className="h-4 w-4" aria-hidden />
              Book Appointment
            </Button>
          </Link>
        }
      />

      <StatGrid>
        <StatCard label="Upcoming" value={upcoming} sub={upcoming ? 'Scheduled visits' : 'No upcoming visits'} icon={CalendarIcon} tone="brand" delay={0} onClick={() => setActiveTab('Upcoming')} />
        <StatCard label="Video Visits" value={videoVisits} sub="Scheduled online" icon={Video} tone="violet" delay={0.05} onClick={() => router.push('/telemedicine')} />
        <StatCard label="Completed" value={completed} sub="Past visits" icon={CheckCircle2} tone="emerald" delay={0.1} onClick={() => setActiveTab('Past')} />
        <StatCard label="Cancelled" value={cancelled} sub={cancelled ? `${cancelled} cancelled` : 'No cancellations'} icon={XCircle} tone="rose" delay={0.15} onClick={() => setActiveTab('Cancelled')} />
      </StatGrid>

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            {(['Upcoming', 'Past', 'Cancelled'] as const).map((tab) => (
              <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="w-full md:w-72">
          <Input
            icon={<Search />}
            placeholder="Search doctor or specialty…"
            aria-label="Search appointments"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filtered.length > 0 ? (
          filtered.map((apt, i) => (
            <AppointmentRow
              key={apt.id}
              appointment={apt}
              delay={i * 0.05}
              onCancel={handleCancel}
              onReschedule={setReschedulingAppt}
              cancelling={cancellingId === apt.id}
            />
          ))
        ) : (
          <EmptyState
            icon={CalendarIcon}
            title={search ? 'No results' : `No ${activeTab.toLowerCase()} appointments`}
            description={
              search
                ? `No appointments match "${search}". Try a different search term.`
                : `You don't have any ${activeTab.toLowerCase()} appointments. Would you like to schedule one?`
            }
            action={
              activeTab === 'Upcoming' && !search
                ? { label: 'Book an Appointment', onClick: () => router.push('/appointments/book') }
                : undefined
            }
          />
        )}
      </div>

      <AnimatePresence>
        {reschedulingAppt && (
          <RescheduleModal
            appointment={reschedulingAppt}
            onClose={() => setReschedulingAppt(null)}
            onSuccess={handleRescheduleSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
