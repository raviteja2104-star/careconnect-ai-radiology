'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
} from '@/components/ui';

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

const mockAppointments: AppointmentData[] = [
  {
    id: 'apt-1',
    doctorName: 'Dr. Sarah Johnson',
    specialty: 'Cardiologist',
    hospital: 'HealthCore Hospital, New York',
    room: '304',
    date: 'Today, May 25, 2024',
    time: '10:30 AM',
    type: 'Video Call',
    status: 'Upcoming',
    image: 'https://i.pravatar.cc/150?u=doc1'
  },
  {
    id: 'apt-2',
    doctorName: 'Dr. Michael Brown',
    specialty: 'General Physician',
    hospital: 'HealthCore Clinic, Downtown',
    room: '102',
    date: 'May 28, 2024',
    time: '02:00 PM',
    type: 'In-Person',
    status: 'Upcoming',
    image: 'https://i.pravatar.cc/150?u=doc2'
  },
  {
    id: 'apt-3',
    doctorName: 'Dr. Emily Davis',
    specialty: 'Dermatologist',
    hospital: 'Skin & Care Center',
    date: 'Jun 02, 2024',
    time: '11:00 AM',
    type: 'Video Call',
    status: 'Upcoming',
    image: 'https://i.pravatar.cc/150?u=doc3'
  },
  {
    id: 'apt-4',
    doctorName: 'Dr. Robert Wilson',
    specialty: 'Orthopedics',
    hospital: 'HealthCore Hospital, New York',
    date: 'Apr 15, 2024',
    time: '09:00 AM',
    type: 'In-Person',
    status: 'Completed',
    image: 'https://i.pravatar.cc/150?u=doc4'
  }
];

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

  const filteredAppointments = mockAppointments.filter(apt => {
    if (activeTab === 'Upcoming') return apt.status === 'Upcoming';
    if (activeTab === 'Past') return apt.status === 'Completed';
    return apt.status === 'Cancelled';
  });

  const upcoming = mockAppointments.filter(a => a.status === 'Upcoming').length;
  const completed = mockAppointments.filter(a => a.status === 'Completed').length;
  const cancelled = mockAppointments.filter(a => a.status === 'Cancelled').length;
  const videoVisits = mockAppointments.filter(a => a.type === 'Video Call' && a.status === 'Upcoming').length;

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
        <StatCard label="Upcoming" value={upcoming} sub="Next: Today, 10:30 AM" icon={CalendarIcon} tone="brand" delay={0} onClick={() => setActiveTab('Upcoming')} />
        <StatCard label="Video Visits" value={videoVisits} sub="Scheduled online" icon={Video} tone="violet" delay={0.05} onClick={() => router.push('/telemedicine')} />
        <StatCard label="Completed" value={completed} sub="This quarter" icon={CheckCircle2} tone="emerald" delay={0.1} onClick={() => setActiveTab('Past')} />
        <StatCard label="Cancelled" value={cancelled} sub="No cancellations" icon={XCircle} tone="rose" delay={0.15} onClick={() => setActiveTab('Cancelled')} />
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
          <Input icon={<Search />} placeholder="Search doctor or specialty…" aria-label="Search appointments" />
        </div>
      </div>

      {/* Appointment list */}
      <div className="space-y-4">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((apt, i) => (
            <AppointmentRow key={apt.id} appointment={apt} delay={i * 0.05} />
          ))
        ) : (
          <EmptyState
            icon={CalendarIcon}
            title={`No ${activeTab.toLowerCase()} appointments`}
            description={`You don't have any ${activeTab.toLowerCase()} appointments at the moment. Would you like to schedule one?`}
            action={
              activeTab === 'Upcoming'
                ? { label: 'Book an Appointment', onClick: () => router.push('/appointments/book') }
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
