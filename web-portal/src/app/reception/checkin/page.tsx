'use client';
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QrCode, Video, MapPin, IndianRupee, Clock, X, ChevronRight } from 'lucide-react';
import {
  PageHeader, Button, Badge, DataTable, SkeletonTable, type Column,
} from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type CheckinAppt = {
  _id: string;
  timeSlot?: string;
  patient?: { name?: string; phone?: string };
  doctor?: { name?: string };
  specialty?: string;
  visitType?: string;
  status?: string;
};

type LookupPatient = {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mrn?: string;
  todayAppointment?: {
    _id: string;
    timeSlot?: string;
    doctor?: { firstName?: string; lastName?: string };
    specialty?: string;
  } | null;
};

// ── QR Lookup Modal ──────────────────────────────────────────────────────────

interface QrModalProps {
  onClose(): void;
  pendingAppointments: CheckinAppt[];
  onCheckin(appointmentId: string): void;
  isProcessing: boolean;
}

function QrModal({ onClose, pendingAppointments, onCheckin, isProcessing }: QrModalProps) {
  const [qrInput, setQrInput] = React.useState('');
  const [lookupResult, setLookupResult] = React.useState<LookupPatient[] | null>(null);
  const [lookupLoading, setLookupLoading] = React.useState(false);
  const [lookupError, setLookupError] = React.useState('');
  const [selectedPatient, setSelectedPatient] = React.useState<LookupPatient | null>(null);

  const handleLookup = async () => {
    const term = qrInput.trim();
    if (!term) return;
    setLookupLoading(true);
    setLookupError('');
    setLookupResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/patient/lookup?q=${encodeURIComponent(term)}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setLookupResult(json.data);
        if (!json.data || json.data.length === 0) setLookupError('No patient found. Try a different name, phone, or MRN.');
      } else {
        setLookupError(json.message || 'Lookup failed.');
      }
    } catch {
      setLookupError('Network error. Please try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  // Match the selected patient against the pending appointments list
  const getMatchedAppointment = (patient: LookupPatient): CheckinAppt | null => {
    // First try backend-returned today appointment
    if (patient.todayAppointment) {
      const apptId = patient.todayAppointment._id;
      const found = pendingAppointments.find((a) => a._id === apptId);
      if (found) return found;
    }
    // Fallback: match by phone or full name in the pending list
    return (
      pendingAppointments.find(
        (a) =>
          (patient.phone && a.patient?.phone === patient.phone) ||
          a.patient?.name === `${patient.firstName} ${patient.lastName}`,
      ) ?? null
    );
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Scan Patient QR"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <QrCode className="h-4 w-4" aria-hidden /> Scan Patient QR / MRN
          </h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {!selectedPatient ? (
            <>
              <p className="text-sm text-muted-foreground">
                Enter the patient&apos;s MRN, name, phone, or QR code value to look them up.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLookup(); }}
                  placeholder="Enter patient QR code or MRN..."
                  className="flex-1 rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <Button
                  onClick={handleLookup}
                  loading={lookupLoading}
                  disabled={lookupLoading || !qrInput.trim()}
                >
                  Search
                </Button>
              </div>

              {lookupError && (
                <p className="text-sm text-danger">{lookupError}</p>
              )}

              {lookupResult && lookupResult.length > 0 && (
                <ul className="space-y-2">
                  {lookupResult.map((p) => (
                    <li key={p._id}>
                      <button
                        onClick={() => setSelectedPatient(p)}
                        className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-left transition-colors hover:bg-muted/80"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {p.mrn ?? ''}{p.phone ? ` · ${p.phone}` : ''}{p.email ? ` · ${p.email}` : ''}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              {/* Confirm check-in view */}
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="font-semibold text-foreground">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {selectedPatient.mrn ?? ''}{selectedPatient.phone ? ` · ${selectedPatient.phone}` : ''}
                </p>
              </div>

              {(() => {
                const appt = getMatchedAppointment(selectedPatient);
                if (appt) {
                  return (
                    <div className="space-y-3 rounded-xl border border-success/30 bg-success/10 p-4">
                      <p className="text-sm font-semibold text-foreground">Appointment Found</p>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {appt.timeSlot}
                        {appt.doctor?.name && ` with Dr. ${appt.doctor.name}`}
                        {appt.specialty && ` · ${appt.specialty}`}
                      </p>
                      <Button
                        className="w-full"
                        onClick={() => { onCheckin(appt._id); handleClose(); }}
                        loading={isProcessing}
                        disabled={isProcessing}
                      >
                        {!isProcessing && <IndianRupee className="h-3.5 w-3.5" aria-hidden />}
                        {isProcessing ? 'Processing…' : 'Collect & Generate Token'}
                      </Button>
                    </div>
                  );
                }
                return (
                  <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                    No pending appointment found for this patient today. Please check in from the appointment list below.
                  </p>
                );
              })()}

              <button
                onClick={() => setSelectedPatient(null)}
                className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                ← Back to search
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AppointmentCheckIn() {
  const queryClient = useQueryClient();
  const [qrModalOpen, setQrModalOpen] = React.useState(false);

  // Close on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setQrModalOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const { data: appointmentsRes, isLoading } = useQuery({
    queryKey: ['reception_appointments'],
    queryFn: () =>
      fetch(`${API_BASE}/api/reception/appointments`, { headers: authHeaders() })
        .then((res) => res.json()),
  });

  const checkinMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      fetch(`${API_BASE}/api/reception/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ appointmentId, paymentCollected: true }),
      }).then((res) => res.json()),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['reception_appointments'] });
      if (res?.data?.token?.tokenNumber) {
        alert(`Token Generated: ${res.data.token.tokenNumber}`);
      }
    },
  });

  const appointments: CheckinAppt[] = appointmentsRes?.data || [];
  const pendingAppointments = appointments.filter(
    (a) => a.status === 'Booked' || a.status === 'Confirmed',
  );

  const columns: Column<CheckinAppt>[] = [
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
    <>
      <div className="space-y-6">
        <PageHeader
          title="Appointment Check-in"
          description="Verify identity, collect copayment, and assign a live queue token."
          crumbs={[{ label: 'Reception', href: '/reception/dashboard' }, { label: 'Check-in' }]}
          actions={
            <Button variant="outline" onClick={() => setQrModalOpen(true)}>
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
            rowKey={(apt) => apt._id}
            searchPlaceholder="Search by name, UHID, phone…"
            exportName="pending-checkins"
            emptyTitle="No pending appointments"
            emptyDescription="Every booked appointment for today has already been checked in."
          />
        )}
      </div>

      {qrModalOpen && (
        <QrModal
          onClose={() => setQrModalOpen(false)}
          pendingAppointments={pendingAppointments}
          onCheckin={(aptId) => checkinMutation.mutate(aptId)}
          isProcessing={checkinMutation.isPending}
        />
      )}
    </>
  );
}
