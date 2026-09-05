'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
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
} from 'lucide-react';
import {
  PageHeader,
  StatCard,
  StatGrid,
  Card,
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

export interface AppointmentData {
  id: string;
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

function mapApiAppointment(raw: any): AppointmentData {
  const dateStr = raw.date ? new Date(raw.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : raw.date;
  const statusMap: Record<string, AppointmentData['status']> = {
    scheduled: 'Upcoming', confirmed: 'Upcoming', upcoming: 'Upcoming',
    completed: 'Completed', done: 'Completed',
    cancelled: 'Cancelled', canceled: 'Cancelled',
  };
  return {
    id: raw._id ?? raw.id,
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
  Upcoming: 'info',
  Completed: 'success',
  Cancelled: 'danger',
};

function AppointmentRow({ appointment, delay }: { appointment: AppointmentData; delay: number }) {
  const router = useRouter();
  const isVideo = appointment.type === 'Video Call';
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
                <Button size="sm" variant="outline" onClick={() => router.push('/appointments/book')}>Reschedule</Button>
                <Dropdown
                  trigger={
                    <Button size="icon-sm" variant="ghost" aria-label="More options">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  }
                >
                  <DropdownItem onClick={() => router.push(isVideo ? '/telemedicine' : '/appointments/book')}>View details</DropdownItem>
                  <DropdownItem disabled title="Coming soon" className="opacity-50">Cancel appointment</DropdownItem>
                </Dropdown>
              </>
            )}
            {appointment.status === 'Completed' && (
              <Button size="sm" variant="secondary" onClick={() => router.push('/appointments/book')}>Book Follow-up</Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function AppointmentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Past' | 'Cancelled'>('Upcoming');
  const [search, setSearch] = useState('');

  const { data: rawData, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`${API_BASE}/appointments`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
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

      {/* Controls: tabs + search */}
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

      {/* Appointment list */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : filtered.length > 0 ? (
          filtered.map((apt, i) => (
            <AppointmentRow key={apt.id} appointment={apt} delay={i * 0.05} />
          ))
        ) : (
          <EmptyState
            icon={CalendarIcon}
            title={search ? 'No results' : `No ${activeTab.toLowerCase()} appointments`}
            description={
              search
                ? `No appointments match "${search}". Try a different search term.`
                : `You don't have any ${activeTab.toLowerCase()} appointments at the moment. Would you like to schedule one?`
            }
            action={
              activeTab === 'Upcoming' && !search
                ? { label: 'Book an Appointment', onClick: () => router.push('/appointments/book') }
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
