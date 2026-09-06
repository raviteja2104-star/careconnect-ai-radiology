'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Video, CalendarClock, ShieldCheck, Clock,
  AlertCircle, ExternalLink, CheckCircle2,
} from 'lucide-react';
import {
  PageHeader, Card, CardContent, CardHeader, CardTitle,
  Button, Badge, EmptyState, SkeletonCard,
} from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Appointment {
  _id: string;
  visitType?: string;
  doctor?: { firstName?: string; lastName?: string; specialization?: string };
  date?: string;
  timeSlot?: string;
  status?: string;
  meetingLink?: string;
}

interface JoinResult {
  sessionId: string;
  status: string;
  roomId: string;
  roomUrl: string;
  videoProvider: string;
  appointment: Appointment;
}

function formatApptTime(date?: string, timeSlot?: string): string {
  if (!date) return '';
  const d = new Date(date);
  const dateStr = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  return timeSlot ? `${dateStr} · ${timeSlot}` : dateStr;
}

export default function TelemedicinePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Record<string, JoinResult>>({});
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['appointments', 'telemedicine'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/appointments?type=video`, {
        headers: getAuthHeader(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Failed to load appointments');
      return json;
    },
    retry: false,
    staleTime: 60000,
  });

  const joinMutation = useMutation({
    mutationFn: async (appointmentId: string): Promise<JoinResult> => {
      const res = await fetch(`${API_BASE}/api/telemedicine/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ appointmentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to join waiting room');
      return json.data as JoinResult;
    },
    onSuccess: (result, appointmentId) => {
      setSessions(prev => ({ ...prev, [appointmentId]: result }));
      setJoiningId(null);
      setJoinError(null);
    },
    onError: (err: Error) => {
      setJoiningId(null);
      setJoinError(err.message);
    },
  });

  const handleJoin = (appointmentId: string) => {
    setJoiningId(appointmentId);
    setJoinError(null);
    joinMutation.mutate(appointmentId);
  };

  const handleOpenRoom = (roomUrl: string) => {
    window.open(roomUrl, '_blank', 'noopener,noreferrer');
  };

  const appointments: Appointment[] = (() => {
    const list = data?.data || [];
    return Array.isArray(list) ? list : [];
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Telemedicine"
        description="Virtual care sessions — join your video appointment directly from here."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Telemedicine' }]}
      />

      {/* Per-appointment join errors */}
      {joinError && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{joinError}</span>
        </motion.div>
      )}

      {/* Upcoming video appointments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-5 w-5 text-primary" />
            Upcoming Video Consultations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : error ? (
            <EmptyState
              icon={AlertCircle}
              title="Could not load appointments"
              description={(error as Error).message}
            />
          ) : appointments.length === 0 ? (
            <EmptyState
              icon={Video}
              title="No upcoming video consultations"
              description="Book a telemedicine appointment to start a virtual care session."
              action={{ label: 'Book Appointment', onClick: () => router.push('/appointments') }}
            />
          ) : (
            <div className="divide-y divide-border">
              {appointments.map((appt, i) => {
                const doctorName = appt.doctor
                  ? `Dr. ${(appt.doctor.firstName || '')} ${(appt.doctor.lastName || '')}`.trim()
                  : 'Your Doctor';
                const isJoining = joiningId === appt._id;
                const session = sessions[appt._id];
                const isActive = session && !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(session.status);
                const canJoin = !['Completed', 'Cancelled'].includes(appt.status || '');

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
                          <Video className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{doctorName}</p>
                          {appt.doctor?.specialization && (
                            <p className="text-xs text-muted-foreground">{appt.doctor.specialization}</p>
                          )}
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatApptTime(appt.date, appt.timeSlot)}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Badge tone={canJoin ? 'brand' : 'neutral'}>
                          {appt.status || 'Scheduled'}
                        </Badge>
                        {canJoin && !isActive && (
                          <Button
                            size="sm"
                            variant="primary"
                            loading={isJoining}
                            onClick={() => handleJoin(appt._id)}
                          >
                            <Video className="h-4 w-4" /> Join
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Session row — shown after successful join */}
                    {isActive && session && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 overflow-hidden"
                      >
                        <div className="flex flex-col gap-3 rounded-2xl border border-success/30 bg-success-soft p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-success">
                              <CheckCircle2 className="h-4 w-4 shrink-0" />
                              You are in the waiting room — your doctor will admit you shortly.
                            </div>
                            <Badge tone="success" dot>
                              {session.status === 'IN_PROGRESS' ? 'In Call' : 'Waiting'}
                            </Badge>
                          </div>

                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full sm:w-auto"
                            onClick={() => handleOpenRoom(session.roomUrl)}
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open Video Room
                          </Button>

                          {/* Honest notice about the video provider in use */}
                          <p className="text-xs text-muted-foreground">
                            {session.videoProvider === 'Daily'
                              ? 'Secure Daily.co video room — end-to-end encrypted.'
                              : session.videoProvider === 'WebRTC' && process.env.NEXT_PUBLIC_API_URL
                              ? 'Custom WebRTC room via your configured provider.'
                              : 'Using Jitsi Meet (free, not HIPAA-compliant). Configure DAILY_API_KEY on the backend for a production-grade provider.'}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            icon: Video,
            title: 'HD Video Sessions',
            description: 'High-definition calls with in-call vitals, notes, and prescription generation.',
            note: process.env.NEXT_PUBLIC_DAILY_ENABLED === 'true'
              ? 'Daily.co — configured'
              : 'Configure DAILY_API_KEY for production',
          },
          {
            icon: CalendarClock,
            title: 'Session Scheduling',
            description: 'Book, reschedule and track tele-visits alongside in-person care.',
            note: 'Available via Appointments',
          },
          {
            icon: ShieldCheck,
            title: 'Secure by Design',
            description: 'Auth-gated join, appointment ownership check, 15-min early / 60-min grace window.',
            note: 'Backend validation active',
          },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
          >
            <Card className="h-full">
              <CardContent className="pt-6">
                <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                  <item.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                <p className="mt-2 text-xs font-medium text-primary">{item.note}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
