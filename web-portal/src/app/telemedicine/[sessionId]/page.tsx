'use client';
import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import TelemedicineWaitingRoom from '@/components/telemedicine/TelemedicineWaitingRoom';
import TelemedicineWorkspace from '@/components/telemedicine/TelemedicineWorkspace';
import { Skeleton } from '@/components/ui';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type SessionData = {
  _id: string;
  roomId: string;
  roomUrl?: string;
  status: string;
  videoProvider?: string;
  patient?: { _id?: string; firstName?: string; lastName?: string };
  doctor?: { _id?: string; firstName?: string; lastName?: string; specialization?: string; department?: string };
  appointment?: { _id?: string; date?: string; timeSlot?: string; visitType?: string; department?: string } | string;
};

export default function TelemedicineSessionPage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  const [hasJoined, setHasJoined] = useState(false);
  const [liveRoomUrl, setLiveRoomUrl] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['telemedicine-session', sessionId],
    queryFn: (): Promise<{ success: boolean; data?: SessionData; error?: string }> =>
      fetch(`${API}/api/telemedicine/${sessionId}`, { headers: authHeaders() })
        .then(res => res.json()),
    staleTime: 60_000,
    retry: 1,
  });

  const session: SessionData | undefined = data?.data;

  const handleJoin = useCallback(async () => {
    setJoinError(null);
    if (!session) return;

    const apptId = typeof session.appointment === 'string'
      ? session.appointment
      : session.appointment?._id;

    if (apptId) {
      try {
        const res = await fetch(`${API}/api/telemedicine/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ appointmentId: apptId }),
        });
        const json = await res.json();
        if (!res.ok) {
          setJoinError(json.error ?? 'Could not join session');
          return;
        }
        if (json.data?.roomUrl) setLiveRoomUrl(json.data.roomUrl);
      } catch {
        // Network failure — fall through to the workspace anyway using the session URL
      }
    }

    setHasJoined(true);
  }, [session]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }

  if (!data?.success || !session) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="space-y-2 text-center">
          <p className="text-lg font-semibold text-foreground">Session not found</p>
          <p className="text-sm text-muted-foreground">
            {data?.error ?? 'This telemedicine session could not be loaded.'}
          </p>
        </div>
      </div>
    );
  }

  const doctor = session.doctor;
  const doctorName = doctor
    ? `${doctor.firstName ?? ''} ${doctor.lastName ?? ''}`.trim() || 'Your Doctor'
    : 'Your Doctor';

  const appt = typeof session.appointment === 'object' ? session.appointment : null;
  const department =
    doctor?.department ??
    doctor?.specialization ??
    appt?.department ??
    appt?.visitType ??
    'Consultation';

  const patientUser = session.patient;
  const patientName = patientUser
    ? `${patientUser.firstName ?? ''} ${patientUser.lastName ?? ''}`.trim() || 'Patient'
    : 'Patient';

  if (!hasJoined) {
    return (
      <>
        {joinError && (
          <div className="mx-4 mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {joinError}
          </div>
        )}
        <TelemedicineWaitingRoom
          sessionId={sessionId}
          doctorName={doctorName}
          department={department}
          onJoin={handleJoin}
        />
      </>
    );
  }

  return (
    <TelemedicineWorkspace
      sessionId={sessionId}
      roomId={liveRoomUrl ?? session.roomUrl ?? session.roomId}
      patientName={patientName}
    />
  );
}
