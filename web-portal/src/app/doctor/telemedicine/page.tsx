'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Video, CalendarClock, Clock, User, AlertCircle,
  Play, RefreshCcw, CheckCircle2,
} from 'lucide-react';
import {
  PageHeader, Card, CardContent, CardHeader, CardTitle,
  Button, Badge, EmptyState, SkeletonCard,
} from '@/components/ui';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Appointment {
  _id: string;
  visitType?: string;
  patient?: { firstName?: string; lastName?: string };
  date?: string;
  timeSlot?: string;
  status?: string;
}

interface TeleSession {
  _id: string;
  status: string;
  roomUrl?: string;
  patient?: { firstName?: string; lastName?: string };
}

function formatApptTime(date?: string, timeSlot?: string): string {
  if (!date) return '';
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  return timeSlot ? `${dateStr} · ${timeSlot}` : dateStr;
}

export default function DoctorTelemedicinePage() {
  const router = useRouter();
  const [startingId, setStartingId] = useState<string | null>(null);
  const [sessionMap, setSessionMap] = useState<Record<string, TeleSession>>({});
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['doctor_video_appointments'],
    queryFn: () =>
      fetch(`${API}/api/appointments?type=video`, { headers: authHeaders() })
        .then(r => r.json()),
    staleTime: 60_000,
    refetchInterval: 30_000,
  });

  const checkSessionMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      fetch(`${API}/api/telemedicine/session/${appointmentId}`, { headers: authHeaders() })
        .then(r => r.json()),
    onSuccess: (json, appointmentId) => {
      if (json?.data?._id) {
        setSessionMap(prev => ({ ...prev, [appointmentId]: json.data as TeleSession }));
      }
    },
  });

  const startMutation = useMutation({
    mutationFn: (sessionId: string) =>
      fetch(`${API}/api/telemedicine/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ sessionId }),
      }).then(r => r.json()),
    onSuccess: (json, sessionId) => {
      setStartingId(null);
      router.push(`/telemedicine/doctor/${sessionId}`);
    },
    onError: (err: Error) => {
      setStartingId(null);
      setError(err.message);
    },
  });

  const handleCheckAndStart = async (appt: Appointment) => {
    setError(null);
    const existing = sessionMap[appt._id];
    if (existing) {
      setStartingId(appt._id);
      startMutation.mutate(existing._id);
      return;
    }

    // check for session first
    try {
      const json = await fetch(`${API}/api/telemedicine/session/${appt._id}`, { headers: authHeaders() }).then(r => r.json());
      if (json?.data?._id) {
        setSessionMap(prev => ({ ...prev, [appt._id]: json.data as TeleSession }));
        setStartingId(appt._id);
        startMutation.mutate(json.data._id);
      } else {
        setError('Patient has not joined the waiting room yet. Ask them to join first.');
      }
    } catch {
      setError('Could not check session status. Try again.');
    }
  };

  const appointments: Appointment[] = (() => {
    const list = data?.data ?? data?.appointments ?? [];
    return Array.isArray(list) ? list : [];
  })();

  const videoAppts = appointments.filter(a => a.visitType === 'video' || a.visitType === 'Video');

  const statusTone = (s?: string): 'success' | 'warning' | 'neutral' | 'danger' => {
    if (!s) return 'neutral';
    if (s === 'Confirmed' || s === 'Checked_In') return 'success';
    if (s === 'Booked') return 'warning';
    if (s === 'Completed') return 'neutral';
    if (s === 'Cancelled') return 'danger';
    return 'neutral';
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Telemedicine"
        description="Start virtual consultations with your patients."
        crumbs={[{ label: 'Doctor', href: '/doctor/queue' }, { label: 'Telemedicine' }]}
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4" aria-hidden /> Refresh
          </Button>
        }
      />

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
        </motion.div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-5 w-5 text-primary" aria-hidden />
            Upcoming Video Consultations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : videoAppts.length === 0 ? (
            <EmptyState
              icon={Video}
              title="No video consultations scheduled"
              description="Upcoming telemedicine appointments will appear here."
            />
          ) : (
            <div className="divide-y divide-border">
              {videoAppts.map((appt, i) => {
                const patientName = appt.patient
                  ? `${appt.patient.firstName ?? ''} ${appt.patient.lastName ?? ''}`.trim()
                  : 'Patient';
                const session = sessionMap[appt._id];
                const isStarting = startingId === appt._id;
                const isDone = appt.status === 'Completed' || appt.status === 'Cancelled';
                const patientJoined = session?.status === 'WAITING' || session?.status === 'IN_PROGRESS';

                return (
                  <motion.div
                    key={appt._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-4">
                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                          <Video className="h-5 w-5" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-foreground">{patientName}</span>
                            <Badge tone={statusTone(appt.status)}>{appt.status ?? 'Booked'}</Badge>
                            {patientJoined && (
                              <Badge tone="success" dot pulse>Patient in Waiting Room</Badge>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" aria-hidden />
                              {formatApptTime(appt.date, appt.timeSlot)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" aria-hidden />
                              Video Consultation
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {isDone ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-success">
                            <CheckCircle2 className="h-4 w-4" aria-hidden /> Done
                          </span>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleCheckAndStart(appt)}
                              loading={isStarting}
                              disabled={isStarting}
                            >
                              <Play className="h-3.5 w-3.5" aria-hidden />
                              {session ? 'Start Consultation' : 'Check & Start'}
                            </Button>
                            {!session && (
                              <button
                                onClick={() => checkSessionMutation.mutate(appt._id)}
                                className="text-xs text-muted-foreground underline hover:text-foreground"
                              >
                                Check session status
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How video consultations work</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Patient books a <strong>Video</strong> appointment and joins the waiting room.</li>
            <li>You see <Badge tone="success" dot pulse className="inline-flex">Patient in Waiting Room</Badge> badge when they are ready.</li>
            <li>Click <strong>Start Consultation</strong> to open the video workspace.</li>
            <li>AI Scribe captures notes in real time. End the session to auto-generate an EMR summary.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
