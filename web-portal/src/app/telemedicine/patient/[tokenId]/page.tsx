'use client';
import React, { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { motion } from 'framer-motion';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Settings, ShieldCheck, Activity, Video } from 'lucide-react';
import { use } from 'react';
import { Badge, Button, Skeleton } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useWebRTC } from '@/app/telemedicine/_lib/useWebRTC';

export default function PatientVirtualWaitingRoom({ params }: { params: Promise<{ tokenId: string }> }) {
  const resolvedParams = use(params);
  const tokenId = resolvedParams.tokenId;

  const [status, setStatus] = useState<'CONNECTING' | 'WAITING' | 'IN_CONSULTATION'>('CONNECTING');
  const [session, setSession] = useState<any>(null);

  // Real WebRTC video. Media (camera preview) starts immediately; signaling
  // joins room `webrtc:<sessionId>` once the join API returns the session id.
  // The patient is the answering peer — the doctor sends the offer.
  const {
    state: callState, error: callError, localVideoRef, remoteVideoRef,
    isMuted, isCameraOff, toggleMute, toggleCamera, hangup, retry,
  } = useWebRTC({ sessionId: session?._id ?? null, role: 'patient' });

  const joinMutation = useMutation({
    mutationFn: () =>
      fetch('http://localhost:5000/api/telemedicine/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId })
      }).then(res => res.json()),
    onSuccess: (res) => {
      setSession(res.data);
      setStatus(res.data.status === 'IN_PROGRESS' ? 'IN_CONSULTATION' : 'WAITING');
    }
  });

  useEffect(() => {
    // Initial join
    joinMutation.mutate();

    // Listen for doctor start
    const socket = io('http://localhost:5000');
    socket.on('CONSULTATION_STARTED', (data) => {
      if (data.tokenId === tokenId) {
        setStatus('IN_CONSULTATION');
      }
    });

    socket.on('CONSULTATION_COMPLETED', (data) => {
      if (session && data.sessionId === session._id) {
        window.location.href = '/telemedicine/feedback'; // Mock redirect
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [tokenId]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background font-sans text-foreground">

      {/* Minimal header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl gradient-brand text-primary-foreground">
            <Video className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-base font-bold tracking-tight sm:text-lg">CareConnect Telemedicine</span>
        </div>
        <div className="flex items-center gap-3 text-sm font-medium">
          <span className="hidden items-center gap-1.5 text-muted-foreground sm:flex">
            <ShieldCheck className="h-4 w-4 text-success" aria-hidden /> End-to-end Encrypted
          </span>
          <Badge tone="info">
            <Activity className="h-3 w-3" aria-hidden /> Ping: 42ms
          </Badge>
        </div>
      </header>

      {/* Main content */}
      <div className="relative flex flex-1 items-center justify-center overflow-y-auto p-6 sm:p-8">

        {status === 'WAITING' || status === 'CONNECTING' ? (
          <div className="grid w-full max-w-4xl grid-cols-1 items-center gap-8 md:grid-cols-2">

            {/* Self video preview (mock) */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-video overflow-hidden rounded-3xl bg-black shadow-float"
            >
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
                aria-label="Your camera preview"
              />
              {(callState === 'media-denied' || isCameraOff) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-6 text-center">
                  <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                    <CameraOff className="h-8 w-8 text-white/40" aria-hidden />
                  </span>
                  {callState === 'media-denied' && (
                    <>
                      <p className="max-w-xs text-xs text-white/60">{callError}</p>
                      <Button size="sm" onClick={retry}>Retry camera access</Button>
                    </>
                  )}
                </div>
              )}
              <span className="absolute left-4 top-4 rounded-md bg-black/50 px-2 py-1 text-[11px] font-medium text-white/80">Camera preview</span>
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                <button
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  aria-pressed={isMuted}
                  className={cn(
                    'inline-flex h-12 w-12 items-center justify-center rounded-full text-white backdrop-blur transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
                    'inline-flex h-12 w-12 items-center justify-center rounded-full text-white backdrop-blur transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isCameraOff ? 'bg-danger hover:bg-danger/90' : 'bg-white/10 hover:bg-white/20'
                  )}
                >
                  {isCameraOff ? <CameraOff className="h-5 w-5" aria-hidden /> : <Camera className="h-5 w-5" aria-hidden />}
                </button>
                <button
                  aria-label="Device settings"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Settings className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </motion.div>

            {/* Waiting info */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <span className="relative flex h-3.5 w-3.5" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-primary" />
                </span>
              </span>

              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Virtual Waiting Room</h1>
                {status === 'CONNECTING' ? (
                  <p className="mt-2 text-lg text-muted-foreground" aria-live="polite">Connecting to secure server…</p>
                ) : (
                  <p className="mt-2 text-lg text-muted-foreground" aria-live="polite">
                    Please wait. The doctor will admit you shortly.
                  </p>
                )}
              </div>

              {status === 'CONNECTING' ? (
                <div className="space-y-3 rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-5 w-3/5" />
                </div>
              ) : (
                <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Queue Position</span>
                    <span className="text-2xl font-bold tabular-nums text-foreground">2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Est. Wait Time</span>
                    <span className="text-2xl font-bold tabular-nums text-primary">~8 min</span>
                  </div>
                </div>
              )}

              <p className="flex items-center gap-2 text-xs text-subtle-foreground">
                <ShieldCheck className="h-4 w-4 text-success" aria-hidden />
                Your consultation is private and encrypted end-to-end.
              </p>
            </motion.div>

          </div>
        ) : (

          /* IN CONSULTATION (mock doctor view) */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-full w-full max-w-6xl overflow-hidden rounded-3xl bg-black shadow-float"
          >
            {/* Doctor video feed (remote, main stage) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
              aria-label="Doctor video"
            />

            {/* Honest connection-state overlay */}
            {callState !== 'connected' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
                {callState === 'media-denied' ? (
                  <div className="max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-danger/20">
                      <CameraOff className="h-5 w-5 text-danger" aria-hidden />
                    </div>
                    <p className="text-sm font-semibold text-white">Camera &amp; microphone unavailable</p>
                    <p className="mt-1.5 text-xs text-white/60">{callError}</p>
                    <Button className="mt-4 w-full" onClick={retry}>Retry access</Button>
                  </div>
                ) : callState === 'failed' ? (
                  <div className="max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                    <p className="text-sm font-semibold text-white">Connection problem</p>
                    <p className="mt-1.5 text-xs text-white/60">{callError ?? 'The call could not be connected.'}</p>
                    <Button className="mt-4 w-full" onClick={retry}>Retry</Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full border-4 border-white/10 bg-white/5">
                      <Video className="h-10 w-10 text-white/40" aria-hidden />
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      {callState === 'idle' ? 'Call ended' : 'Connecting to your doctor…'}
                    </h2>
                    <p className="text-white/50" aria-live="polite">
                      {callState === 'waiting-peer' ? "Waiting for the doctor's video…" : 'Setting up secure media…'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Self view picture-in-picture */}
            <div className="absolute right-4 top-4 flex aspect-video w-40 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-pop sm:right-6 sm:top-6 sm:w-48">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
                aria-label="Your camera preview"
              />
              {isCameraOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <CameraOff className="h-6 w-6 text-white/50" aria-hidden />
                </div>
              )}
              <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white/80">You</span>
            </div>

            {/* Floating controls */}
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-black/60 px-5 py-3 backdrop-blur-md sm:bottom-8 sm:gap-4 sm:px-8 sm:py-4">
              <button
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                aria-pressed={isMuted}
                className={cn(
                  'inline-flex h-12 w-12 items-center justify-center rounded-full text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
                  'inline-flex h-12 w-12 items-center justify-center rounded-full text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isCameraOff ? 'bg-danger hover:bg-danger/90' : 'bg-white/10 hover:bg-white/20'
                )}
              >
                {isCameraOff ? <CameraOff className="h-5 w-5" aria-hidden /> : <Camera className="h-5 w-5" aria-hidden />}
              </button>
              <span className="mx-1 h-8 w-px bg-white/15" aria-hidden />
              <button
                onClick={hangup}
                aria-label="Leave consultation"
                className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-danger text-white transition-colors hover:bg-danger/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <PhoneOff className="h-6 w-6" aria-hidden />
              </button>
            </div>
          </motion.div>

        )}

      </div>
    </div>
  );
}
