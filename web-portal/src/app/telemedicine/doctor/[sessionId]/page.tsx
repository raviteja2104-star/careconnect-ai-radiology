'use client';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Mic, MicOff, Camera, CameraOff, PhoneOff, Sparkles, MessageSquare, FileText, Stethoscope, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { use } from 'react';
import { Badge, Button, EmptyState, Textarea } from '@/components/ui';
import { useWebRTC } from '@/app/telemedicine/_lib/useWebRTC';

type PanelTab = 'SCRIBE' | 'EMR' | 'CHAT';

const PANEL_TABS: { id: PanelTab; label: string; icon: React.ElementType }[] = [
  { id: 'SCRIBE', label: 'AI Scribe', icon: Sparkles },
  { id: 'EMR', label: 'EMR Notes', icon: FileText },
  { id: 'CHAT', label: 'Chat', icon: MessageSquare },
];

export default function DoctorConsultationWorkspace({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.sessionId;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'SCRIBE' | 'EMR' | 'CHAT'>('SCRIBE');
  const [aiSummary, setAiSummary] = useState('');

  // Real WebRTC video: doctor is the offering peer; signaling rides the
  // existing socket.io server (room `webrtc:<sessionId>`).
  const {
    state: callState, error: callError, localVideoRef, remoteVideoRef,
    isMuted, isCameraOff, toggleMute, toggleCamera, hangup, retry,
  } = useWebRTC({ sessionId, role: 'doctor' });

  const endMutation = useMutation({
    mutationFn: () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      return fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care'}/api/telemedicine/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ sessionId, aiSummary })
      }).then(res => res.json());
    },
    onSuccess: () => {
      window.location.href = '/doctor/queue';
    }
  });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-sans text-foreground">

      {/* Left: Video stage */}
      <div className="flex h-full min-w-0 flex-1 flex-col p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl bg-black shadow-float"
        >
          {/* Session chips */}
          <div className="absolute left-4 top-4 flex items-center gap-2 sm:left-6 sm:top-6">
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
              Encrypted
            </span>
            <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1.5 font-mono text-[11px] text-white/60 backdrop-blur-md">
              {sessionId}
            </span>
          </div>

          {/* Remote patient video (main stage) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            aria-label="Patient video"
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
                  <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                    <Camera className="h-10 w-10 text-white/40" aria-hidden />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {callState === 'waiting-peer' ? 'Waiting for patient' : callState === 'idle' ? 'Call ended' : 'Connecting…'}
                  </h2>
                  <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-white/50" aria-live="polite">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
                    {callState === 'waiting-peer' ? 'The patient has not joined the video call yet.' : 'Setting up secure media…'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Doctor PiP */}
          <div className="absolute right-4 top-16 aspect-video w-40 overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-pop sm:right-6 sm:top-6 sm:w-48">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full -scale-x-100 object-cover"
              aria-label="Your camera preview"
            />
            {isCameraOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <CameraOff className="h-6 w-6 text-white/50" aria-hidden />
              </div>
            )}
            <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white/80">You</span>
          </div>

          {/* Floating call controls */}
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-black/60 px-5 py-3 backdrop-blur-md">
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
            <span className="mx-1 h-6 w-px bg-white/15" aria-hidden />
            <button
              onClick={() => { hangup(); endMutation.mutate(); }}
              disabled={endMutation.isPending}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-danger px-6 text-sm font-semibold text-white transition-colors hover:bg-danger/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
            >
              <PhoneOff className="h-5 w-5" aria-hidden />
              {endMutation.isPending ? 'Ending…' : 'End Consultation'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Right: Clinical workspace (AI Scribe + EMR) */}
      <aside className="flex h-full w-[360px] flex-shrink-0 flex-col border-l border-border bg-card xl:w-[450px]">

        {/* Tabs */}
        <div className="shrink-0 border-b border-border p-2" role="tablist" aria-label="Consultation workspace">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
            {PANEL_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  activeTab === id
                    ? 'bg-card text-primary shadow-soft'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="scrollbar-thin flex-1 overflow-y-auto p-4">

          {activeTab === 'SCRIBE' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="relative flex h-3 w-3" aria-hidden>
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Ambient Scribe Active</h3>
                    <p className="text-xs text-muted-foreground">Listening to conversation…</p>
                  </div>
                </div>
                <Badge tone="brand" dot pulse>Rec</Badge>
              </div>

              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Live Transcript &amp; Extraction
                </h4>

                <div className="space-y-4">
                  <section className="rounded-2xl border border-border bg-background p-4 shadow-soft">
                    <h5 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Stethoscope className="h-3.5 w-3.5" aria-hidden /> Symptoms Detected
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="danger">Chest Pain</Badge>
                      <Badge tone="warning">Shortness of breath</Badge>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-border bg-background p-4 shadow-soft">
                    <h5 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <FileText className="h-3.5 w-3.5" aria-hidden /> Auto-Generated SOAP Note
                    </h5>
                    <Textarea
                      value={aiSummary}
                      onChange={e => setAiSummary(e.target.value)}
                      placeholder="AI is generating clinical notes..."
                      aria-label="AI-generated SOAP note"
                      className="h-40 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                    />
                  </section>
                </div>
              </div>

              <Button className="w-full" size="lg">
                Push to Official EMR
              </Button>
            </div>
          )}

          {activeTab === 'EMR' && (
            <EmptyState
              icon={FileText}
              title="EMR integration"
              description="The patient's electronic medical record panel will surface here once connected."
              className="h-full animate-fade-in"
            />
          )}

          {activeTab === 'CHAT' && (
            <EmptyState
              icon={MessageSquare}
              title="Secure messaging"
              description="In-consultation chat with the patient will appear here."
              className="h-full animate-fade-in"
            />
          )}

        </div>
      </aside>
    </div>
  );
}
