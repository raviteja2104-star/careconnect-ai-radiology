'use client';
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QrCode, Video, MapPin, IndianRupee, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  PageHeader, Button, Badge, DataTable, SkeletonTable, type Column,
} from '@/components/ui';

export default function AppointmentCheckIn() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: appointmentsRes, isLoading } = useQuery({
    queryKey: ['reception_appointments'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care'}/api/reception/appointments`).then(res => res.json())
  });

  const checkinMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care'}/api/reception/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, paymentCollected: true })
      }).then(res => res.json()),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['reception_appointments'] });
      alert(`Token Generated: ${res.data.token.tokenNumber}`);
    }
  });

  const appointments = appointmentsRes?.data || [];
  const pendingAppointments = appointments.filter((a: any) => a.status === 'Booked' || a.status === 'Confirmed');

  const columns: Column<any>[] = [
    {
      key: 'timeSlot',
      header: 'Time',
      sortable: true,
      accessor: (apt) => apt.timeSlot ?? '',
      cell: (apt) => (
        <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums text-foreground">
          <Clock className="h-3.5 w-3.5 text-subtle-foreground" aria-hidden />
          {apt.timeSlot}
        </span>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      sortable: true,
      accessor: (apt) => apt.patient?.name ?? '',
      cell: (apt) => (
        <div>
          <p className="font-semibold text-foreground">{apt.patient?.name || 'Unknown Patient'}</p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{apt.patient?.phone || 'No Phone'}</p>
        </div>
      ),
    },
    {
      key: 'doctor',
      header: 'Doctor & Dept',
      sortable: true,
      accessor: (apt) => `${apt.doctor?.name ?? ''} ${apt.specialty ?? ''}`,
      cell: (apt) => (
        <div>
          <p className="font-semibold text-foreground">Dr. {apt.doctor?.name || 'Unassigned'}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{apt.specialty}</p>
        </div>
      ),
    },
    {
      key: 'visitType',
      header: 'Type',
      accessor: (apt) => apt.visitType ?? '',
      cell: (apt) => (
        <Badge tone={apt.visitType === 'Video Call' ? 'brand' : 'info'}>
          {apt.visitType === 'Video Call'
            ? <Video className="h-3 w-3" aria-hidden />
            : <MapPin className="h-3 w-3" aria-hidden />}
          {apt.visitType}
        </Badge>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      accessor: () => '',
      cell: (apt) => (
        <Button
          size="sm"
          onClick={() => checkinMutation.mutate(apt._id)}
          loading={checkinMutation.isPending}
        >
          {!checkinMutation.isPending && <IndianRupee className="h-3.5 w-3.5" aria-hidden />}
          {checkinMutation.isPending ? 'Processing…' : 'Collect & Token'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointment Check-in"
        description="Verify identity, collect copayment, and assign a live queue token."
        crumbs={[{ label: 'Reception', href: '/reception/dashboard' }, { label: 'Check-in' }]}
        actions={
          <Button variant="outline" disabled title="Coming soon">
            <QrCode className="h-4 w-4" aria-hidden /> Scan Patient QR
          </Button>
        }
      />

      {isLoading ? (
        <SkeletonTable rows={6} />
      ) : (
        <DataTable
          columns={columns}
          data={pendingAppointments}
          rowKey={(apt: any) => apt._id}
          searchPlaceholder="Search by name, UHID, phone…"
          exportName="pending-checkins"
          emptyTitle="No pending appointments"
          emptyDescription="Every booked appointment for today has already been checked in."
        />
      )}
    </div>
  );
}
