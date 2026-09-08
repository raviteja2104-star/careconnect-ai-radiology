'use client';
import React, { useState, useEffect, useRef, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Camera, CameraOff, PhoneOff,
  Clock, CheckCircle, AlertCircle, ExternalLink, ShieldCheck, Wifi, WifiOff,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';
import { useWebRTC } from '@/app/telemedicine/_lib/useWebRTC';
import { cn } from '@/lib/utils';

type PageState = 'pre-join' | 'joining' | 'waiting' | 'in-call' | 'external' | 'ended' | 'error';

interface SessionInfo {
  sessionId: string;
  status: string;
  roomId: string;
  roomUrl: string;
  videoProvider: string;
  appointment: {
    _id: string;
    doctorName?: string;
    doctorId?: { firstName?: string; lastName?: string };
    department?: string;
    scheduledAt?: string;
  };
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  try {
    const token = window.localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export default function TelemedicinePatientPage({ params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = use(params);

  const [pageState, setPageState] = useState<PageState>('pre-join');
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasConsented, setHasConsented] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hook always runs — passes null sessionId during pre-join so camera preview
  // starts immediately; signaling activates once sessionId is set.
  const {
    state: callState,
    error: callError,
    localVideoRef,
    remoteVideoRef,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
    hangup,
    retry,
  } = useWebRTC({ sessionId, role: 'patient' });

  // Poll session status when waiting for the doctor (Socket.io disabled on Vercel)
  useEffect(() => {
    if (pageState !== 'waiting' || !session) return;

    const check = async () => {
      try {
        const res = await fetch(`${API}/api/telemedicine/session/${session.appointment._id}`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        const status: string = data?.data?.status ?? data?.status ?? '';
        if (status === 'IN_PROGRESS') {
          clearInterval(pollRef.current!);
          if (session.videoProvider !== 'WebRTC') {
            setPageState('external');
          } else {
            setPageState('in-call');
          }
        } else if (status === 'COMPLETED' || status === 'CANCELLED') {
          clearInterval(pollRef.current!);
          setPageState('ended');
        }
      } catch {
        // network blip — keep polling
      }
    };

    pollRef.current = setInterval(check, 5000);
    return () => clearInterval(pollRef.current!);
  }, [pageState, session]);

  const handleJoin = async () => {
    if (!hasConsented) return;
    setPageState('joining');
    try {
      const res = await fetch(`${API}/api/telemedicine/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ appointmentId: tokenId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message ?? 'Could not join the session.');
      }
      const info: SessionInfo = data.data;
      setSession(info);
      setSessionId(info.sessionId);

      if (info.status === 'IN_PROGRESS') {
        setPageState(info.videoProvider !== 'WebRTC' ? 'external' : 'in-call');
      } else {
        setPageState('waiting');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setPageState('error');
    }
  };

  const handleHangup = () => {
    hangup();
    setPageState('ended');
  };

  const doctorLabel = session?.appointment
    ? (session.appointment.doctorName
        ?? `Dr. ${session.appointment.doctorId?.firstName ?? ''} ${session.appointment.doctorId?.lastName ?? ''}`.trim()
        ?? 'Your doctor')
    : 'Your doctor';

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <AnimatePresence mode="wait">

        {/* ── Pre-join ── */}
        {(pageState === 'pre-join' || pageState === 'joining') && (
          <motion.div
            key="pre-join"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-lg"
          >
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Camera className="h-7 w-7 text-primary" aria-hidden />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Ready to join?</h1>
              <p className="mt-1 text-sm text-muted-foreground">Check your camera and microphone before entering.</p>
            </div>

            {/* Local camera preview */}
            <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-3xl bg-black shadow-float">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full -scale-x-100 object-cover"
                aria-label="Camera preview"
              />
              {callState === 'media-denied' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/20">
                    <CameraOff className="h-6 w-6 text-danger" aria-hidden />
                  </div>
                  <p className="text-sm font-semibold text-white">Camera unavailable</p>
                  <p className="text-xs text-white/60">{callError}</p>
                  <Button size="sm" onClick={retry}>Retry access</Button>
                </div>
              )}
              {callState !== 'media-denied' && isCameraOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <CameraOff className="h-8 w-8 text-white/40" aria-hidden />
                </div>
              )}
              {/* Controls overlay */}
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-2 backdrop-blur-sm">
                <button
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  aria-pressed={isMuted}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors',
                    isMuted ? 'bg-danger' : 'bg-white/10 hover:bg-white/20'
                  )}
                >
                  {isMuted ? <MicOff className="h-4 w-4" aria-hidden /> : <Mic className="h-4 w-4" aria-hidden />}
                </button>
                <button
                  onClick={toggleCamera}
                  aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
                  aria-pressed={isCameraOff}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors',
                    isCameraOff ? 'bg-danger' : 'bg-white/10 hover:bg-white/20'
                  )}
                >
                  {isCameraOff ? <CameraOff className="h-4 w-4" aria-hidden /> : <Camera className="h-4 w-4" aria-hidden />}
                </button>
              </div>
            </div>

            {/* Consent */}
            <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-4">
              <input
                type="checkbox"
                checked={hasConsented}
                onChange={e => setHasConsented(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">
                I consent to this video consultation being conducted securely. I understand my camera and microphone will be active during the call.
              </span>
            </label>

            <Button
              className="w-full"
              size="lg"
              disabled={!hasConsented || pageState === 'joining' || callState === 'media-denied'}
              loading={pageState === 'joining'}
              onClick={handleJoin}
            >
              {pageState === 'joining' ? 'Joining…' : 'Join Consultation'}
            </Button>
          </motion.div>
        )}

        {/* ── Waiting for doctor ── */}
        {pageState === 'waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm text-center"
          >
            <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/30" aria-hidden />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-10 w-10 text-primary" aria-hidden />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Waiting for your doctor</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {doctorLabel} will admit you shortly. Please keep this tab open.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-4">
              <ShieldCheck className="h-4 w-4 text-success" aria-hidden />
              <span className="text-xs text-muted-foreground">Your session is encrypted and private</span>
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
              <Wifi className="h-3.5 w-3.5" aria-hidden />
              Checking status…
            </p>
          </motion.div>
        )}

        {/* ── WebRTC in-call ── */}
        {pageState === 'in-call' && sessionId && (
          <motion.div
            key="in-call"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-screen w-full flex-col"
          >
            {/* Video stage */}
            <div className="relative flex flex-1 flex-col overflow-hidden bg-black">

              {/* Remote (doctor) main stage */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
                aria-label="Doctor video"
              />

              {/* Connection state overlay */}
              {callState !== 'connected' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
                  {callState === 'media-denied' || callState === 'failed' ? (
                    <div className="max-w-xs rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-danger/20">
                        {callState === 'media-denied'
                          ? <CameraOff className="h-5 w-5 text-danger" aria-hidden />
                          : <WifiOff className="h-5 w-5 text-danger" aria-hidden />
                        }
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {callState === 'media-denied' ? 'Camera unavailable' : 'Connection failed'}
                      </p>
                      <p className="mt-1.5 text-xs text-white/60">{callError}</p>
                      <Button className="mt-4 w-full" onClick={retry}>Retry</Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                        <Camera className="h-10 w-10 text-white/40" aria-hidden />
                      </div>
                      <h2 className="text-xl font-bold text-white" aria-live="polite">
                        {callState === 'waiting-peer' ? 'Waiting for your doctor…' : 'Connecting…'}
                      </h2>
                      <p className="mt-2 text-sm text-white/50">
                        {callState === 'waiting-peer'
                          ? `${doctorLabel} has not joined video yet`
                          : 'Setting up secure media…'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Status chips */}
              <div className="absolute left-4 top-4 flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
                  Encrypted
                </span>
                {callState === 'connected' && (
                  <Badge tone="success" dot pulse className="backdrop-blur-md">Live</Badge>
                )}
              </div>

              {/* Patient PiP (self view) */}
              <div className="absolute right-4 top-4 aspect-video w-36 overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-pop sm:w-44">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full -scale-x-100 object-cover"
                  aria-label="Your camera"
                />
                {isCameraOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <CameraOff className="h-5 w-5 text-white/50" aria-hidden />
                  </div>
                )}
                <span className="absolute bottom-1.5 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white/80">You</span>
              </div>

              {/* Floating controls */}
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-black/60 px-5 py-3 backdrop-blur-md">
                <button
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  aria-pressed={isMuted}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isMuted ? 'bg-danger hover:bg-danger/90' : 'bg-white/10 hover:bg-white/20'
                  )}
                >
                  {isMuted ? <MicOff className="h-5 w-5" aria-hidden /> : <Mic className="h-5 w-5" aria-hidden />}
                </button>
                <button
                  onClick={toggleCamera}
                  aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
                  aria-pressed={isCameraOff}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isCameraOff ? 'bg-danger hover:bg-danger/90' : 'bg-white/10 hover:bg-white/20'
                  )}
                >
                  {isCameraOff ? <CameraOff className="h-5 w-5" aria-hidden /> : <Camera className="h-5 w-5" aria-hidden />}
                </button>
                <span className="mx-1 h-6 w-px bg-white/15" aria-hidden />
                <button
                  onClick={handleHangup}
                  className="flex h-12 items-center gap-2 rounded-full bg-danger px-6 text-sm font-semibold text-white transition-colors hover:bg-danger/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <PhoneOff className="h-5 w-5" aria-hidden />
                  Leave
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── External provider (Jitsi / Daily) ── */}
        {pageState === 'external' && session?.roomUrl && (
          <motion.div
            key="external"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-screen w-full flex-col"
          >
            <div className="flex items-center justify-between border-b border-border bg-card px-5 py-3">
              <div className="flex items-center gap-3">
                <Badge tone="success" dot pulse>In Consultation</Badge>
                <span className="text-sm text-muted-foreground">{doctorLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={session.roomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  Open in new tab
                </a>
                <Button size="sm" variant="danger" onClick={handleHangup}>
                  <PhoneOff className="h-3.5 w-3.5" aria-hidden />
                  Leave
                </Button>
              </div>
            </div>
            <iframe
              src={session.roomUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="flex-1 border-0"
              title="Video consultation"
            />
          </motion.div>
        )}

        {/* ── Ended ── */}
        {pageState === 'ended' && (
          <motion.div
            key="ended"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-10 w-10 text-success" aria-hidden />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Consultation complete</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your session has ended. Your doctor will send any notes or prescriptions through the app.
            </p>
            <Button
              className="mt-8 w-full"
              size="lg"
              onClick={() => { window.location.href = '/'; }}
            >
              Return to home
            </Button>
          </motion.div>
        )}

        {/* ── Error ── */}
        {pageState === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-sm text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-danger/10">
              <AlertCircle className="h-10 w-10 text-danger" aria-hidden />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Could not join</h2>
            <p className="mt-2 text-sm text-muted-foreground">{errorMsg ?? 'The session link may be invalid or expired.'}</p>
            <Button
              className="mt-8 w-full"
              size="lg"
              variant="secondary"
              onClick={() => { setPageState('pre-join'); setErrorMsg(null); setHasConsented(false); }}
            >
              Try again
            </Button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
