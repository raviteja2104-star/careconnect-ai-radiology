'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Video, CalendarClock, ShieldCheck, Clock, User, Phone,
  AlertCircle, Loader2, ArrowRight,
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
  type?: string;
  consultationType?: string;
  doctor?: { firstName?: string; lastName?: string; specialization?: string };
  doctorName?: string;
  scheduledAt?: string;
  date?: string;
  time?: string;
  status?: string;
  notes?: string;
}

interface TeleSession {
  _id: string;
  status: string;
  roomId?: string;
}

export default function TelemedicinePage() {
  const router = useRouter();
  const [activeSession, setActiveSession] = useState<TeleSession | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

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
    mutationFn: async (tokenId: string) => {
      const res = await fetch(`${API_BASE}/api/telemedicine/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ tokenId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to join waiting room');
      return json.data as TeleSession;
    },
    onSuccess: (session) => {
      setActiveSession(session);
      setJoiningId(null);
    },
    onError: () => {
      setJoiningId(null);
    },
  });

  const telemedicineAppointments: Appointment[] = (() => {
    const list = data?.data || data?.appointments || [];
    if (!Array.isArray(list)) return [];
    return list.filter((a: Appointment) => {
      const t = (a.type || a.consultationType || '').toLowerCase();
      return t.includes('video') || t.includes('tele') || t.includes('virtual');
    });
  })();

  const handleJoin = (appointment: Appointment) => {
    setJoiningId(appointment._id);
    joinMutation.mutate(appointment._id);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Telemedicine"
        description="Virtual care sessions, lobby and consult rooms."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Telemedicine' }]}
      />

      {/* Active session banner */}
      {activeSession && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-success/30 bg-success-soft p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success">
                <Video className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  You are in the waiting room
                </p>
                <p className="text-xs text-muted-foreground">
                  Your doctor will admit you shortly. Room: {activeSession.roomId}
                </p>
              </div>
            </div>
            <Badge tone="success" dot>Waiting</Badge>
          </div>
          {/* Video provider must be configured in backend for actual video call */}
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-soft p-3 text-xs text-warning">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Video calling requires a WebRTC provider (Daily.co, Twilio Video, etc.) configured
              via the <strong>VIDEO_PROVIDER_URL</strong> environment variable on the backend.
              Contact your administrator to complete the setup.
            </span>
          </div>
        </motion.div>
      )}

      {/* Appointments list */}
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
              description={(error as Error).message || 'The appointments service is temporarily unavailable.'}
            />
          ) : telemedicineAppointments.length === 0 ? (
            <EmptyState
              icon={Video}
              title="No upcoming video consultations"
              description="Book a telemedicine appointment to start a virtual care session."
              action={
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => router.push('/appointments')}
                >
                  Book Appointment <ArrowRight className="h-4 w-4" />
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-border">
              {telemedicineAppointments.map((appt, i) => {
                const doctorName = appt.doctor
                  ? `Dr. ${appt.doctor.firstName || ''} ${appt.doctor.lastName || ''}`.trim()
                  : appt.doctorName || 'Your Doctor';
                const specialization = appt.doctor?.specialization || '';
                const scheduledAt = appt.scheduledAt || appt.date;
                const isJoining = joiningId === appt._id;
                const isUpcoming = !appt.status || appt.status === 'scheduled' || appt.status === 'confirmed';

                return (
                  <motion.div
                    key={appt._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                        <Video className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{doctorName}</p>
                        {specialization && (
                          <p className="text-xs text-muted-foreground">{specialization}</p>
                        )}
                        {scheduledAt && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(scheduledAt).toLocaleString('en-IN', {
                              dateStyle: 'medium', timeStyle: 'short',
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone={isUpcoming ? 'brand' : 'neutral'}>
                        {appt.status || 'Scheduled'}
                      </Badge>
                      {isUpcoming && (
                        <Button
                          size="sm"
                          variant="primary"
                          loading={isJoining}
                          onClick={() => handleJoin(appt)}
                          disabled={!!activeSession}
                        >
                          <Video className="h-4 w-4" />
                          Join
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            icon: Video,
            title: 'HD Video Sessions',
            description: 'High-definition video calls with in-call vitals display, note-taking, and prescription generation.',
            status: 'Requires video provider configuration',
          },
          {
            icon: CalendarClock,
            title: 'Session Scheduling',
            description: 'Book, reschedule and track tele-visits alongside in-person care from the Appointments page.',
            status: 'Available via Appointments',
          },
          {
            icon: ShieldCheck,
            title: 'Secure by Design',
            description: 'End-to-end encrypted sessions with full audit trails and role-based access control.',
            status: 'Infrastructure ready',
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
                <p className="mt-2 text-xs font-medium text-primary">{item.status}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
