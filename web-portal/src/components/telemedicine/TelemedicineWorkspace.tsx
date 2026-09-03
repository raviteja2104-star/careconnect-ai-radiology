'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Video, Mic, MicOff, VideoOff, PhoneOff, Activity, FileText, Clipboard,
  Sparkles, ShieldCheck, HeartPulse, Thermometer, Droplets, Stethoscope,
} from 'lucide-react';
import { Badge, Button, EmptyState, Textarea, Timeline, TimelineItem } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useWebRTC } from '@/app/telemedicine/_lib/useWebRTC';

interface TelemedicineWorkspaceProps {
  sessionId: string;
  roomId: string;
  patientName: string;
}

type WorkspaceTab = 'emr' | 'notes' | 'prescriptions' | 'ai-scribe';

const TABS: { id: WorkspaceTab; label: string; icon: React.ElementType }[] = [
  { id: 'emr', label: 'Timeline', icon: Activity },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'prescriptions', label: 'Rx', icon: Clipboard },
  { id: 'ai-scribe', label: 'AI Scribe', icon: Sparkles },
];

const VITALS = [
  { label: 'Blood Pressure', value: '120/80', icon: HeartPulse },
  { label: 'Heart Rate', value: '72 bpm', icon: Activity },
  { label: 'Temperature', value: '98.6°F', icon: Thermometer },
  { label: 'SpO2', value: '99%', icon: Droplets },
];

export default function TelemedicineWorkspace({ sessionId, roomId, patientName }: TelemedicineWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'emr' | 'notes' | 'prescriptions' | 'ai-scribe'>('emr');

  // Real WebRTC call: peer-to-peer via the backend socket.io signaling server.
  // This side acts as the clinician (offering peer). `roomId` is kept for
  // display/compat; the signaling room is keyed by sessionId.
  const {
    state: callState, error: callError, localVideoRef, remoteVideoRef,
    isMuted, isCameraOff: isVideoOff, toggleMute, toggleCamera, hangup, retry,
  } = useWebRTC({ sessionId, role: 'doctor' });

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Minimal in-call header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-brand text-primary-foreground">
            <Video className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">Telemedicine Consultation</p>
            <p className="truncate font-mono text-[11px] text-subtle-foreground">{sessionId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
            Encrypted
          </span>
          <Badge tone="danger" dot pulse>Live</Badge>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Video stage */}
        <div className="flex min-w-0 flex-1 flex-col p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex-1 overflow-hidden rounded-3xl bg-black shadow-float"
            data-room-id={roomId}
          >
            {/* Remote patient video (main stage) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
              aria-label={`${patientName} video`}
            />

            {/* Honest connection-state overlays */}
            {callState !== 'connected' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 p-6 text-center">
                {callState === 'media-denied' ? (
                  <div className="max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6">
                    <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-danger/20">
                      <VideoOff className="h-5 w-5 text-danger" aria-hidden />
                    </span>
                    <p className="text-sm font-semibold text-white">Camera &amp; microphone unavailable</p>
                    <p className="mt-1.5 text-xs text-white/60">{callError}</p>
                    <Button className="mt-4 w-full" onClick={retry}>Retry access</Button>
                  </div>
                ) : callState === 'failed' ? (
                  <div className="max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6">
                    <p className="text-sm font-semibold text-white">Connection problem</p>
                    <p className="mt-1.5 text-xs text-white/60">{callError ?? 'The call could not be connected.'}</p>
                    <Button className="mt-4 w-full" onClick={retry}>Retry</Button>
                  </div>
                ) : (
                  <>
                    <span className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
                      <Video className="h-9 w-9 text-white/40" aria-hidden />
                    </span>
                    <p className="text-sm font-medium text-white/60" aria-live="polite">
                      {callState === 'waiting-peer'
                        ? `Waiting for ${patientName} to join…`
                        : callState === 'idle'
                          ? 'Call ended'
                          : 'Connecting…'}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Picture-in-picture self view */}
            <div className="absolute bottom-24 right-4 h-28 w-44 overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-pop backdrop-blur-sm sm:bottom-6 sm:right-6 sm:h-32 sm:w-48">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full -scale-x-100 object-cover"
                aria-label="Your camera preview"
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <VideoOff className="h-6 w-6 text-white/50" aria-label="Camera off" />
                </div>
              )}
              <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white/80">You</span>
            </div>

            {/* Floating call controls */}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-black/60 px-4 py-3 backdrop-blur-md sm:bottom-6">
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
                aria-label={isVideoOff ? 'Turn camera on' : 'Turn camera off'}
                aria-pressed={isVideoOff}
                className={cn(
                  'inline-flex h-12 w-12 items-center justify-center rounded-full text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isVideoOff ? 'bg-danger hover:bg-danger/90' : 'bg-white/10 hover:bg-white/20'
                )}
              >
                {isVideoOff ? <VideoOff className="h-5 w-5" aria-hidden /> : <Video className="h-5 w-5" aria-hidden />}
              </button>

              <span className="mx-1 h-6 w-px bg-white/15" aria-hidden />

              <button
                onClick={hangup}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-danger px-6 text-sm font-semibold text-white transition-colors hover:bg-danger/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <PhoneOff className="h-5 w-5" aria-hidden />
                <span className="hidden sm:inline">End Call</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Clinical side panel */}
        <aside className="flex w-[340px] shrink-0 flex-col border-l border-border bg-card xl:w-[400px]">
          {/* Patient header */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3.5">
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-foreground">{patientName}</h2>
              <p className="text-xs text-muted-foreground">28 YRS • M • UHID: 100452</p>
            </div>
            <Badge tone="danger">Penicillin Allergy</Badge>
          </div>

          {/* Workspace tabs */}
          <div className="shrink-0 border-b border-border p-2" role="tablist" aria-label="Clinical workspace">
            <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
              {TABS.map(({ id, label, icon: Icon }) => (
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
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  <span className="hidden xl:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Workspace content */}
          <div className="scrollbar-thin flex-1 overflow-y-auto p-4">
            {activeTab === 'emr' && (
              <div className="space-y-4 animate-fade-in">
                <section className="rounded-2xl border border-border bg-background p-4 shadow-soft">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Vitals</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {VITALS.map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex items-center gap-2.5 rounded-xl bg-muted/60 p-2.5">
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card text-primary shadow-soft">
                          <Icon className="h-4 w-4" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[11px] text-muted-foreground">{label}</p>
                          <p className="text-sm font-bold tabular-nums text-foreground">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-border bg-background p-4 shadow-soft">
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Past Visits</h3>
                  <Timeline>
                    <TimelineItem icon={Stethoscope} tone="brand" title="General Checkup" meta="May 15, 2024" />
                    <TimelineItem icon={Thermometer} tone="warning" title="Fever & Cough" meta="Jan 10, 2024" />
                  </Timeline>
                </section>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="flex h-full flex-col gap-3 animate-fade-in">
                <Textarea
                  className="flex-1 resize-none"
                  placeholder="Chief Complaints..."
                  aria-label="Chief complaints"
                />
                <Textarea
                  className="flex-1 resize-none"
                  placeholder="Diagnosis / Assessment..."
                  aria-label="Diagnosis and assessment"
                />
                <Button className="w-full">Save Notes</Button>
              </div>
            )}

            {activeTab === 'prescriptions' && (
              <EmptyState
                icon={Clipboard}
                title="No prescriptions yet"
                description="Medications prescribed during this consultation will appear here."
                className="h-full animate-fade-in"
              />
            )}

            {activeTab === 'ai-scribe' && (
              <div className="flex h-full flex-col animate-fade-in">
                <div className="mb-4 rounded-2xl border border-info/20 bg-info-soft p-3.5 text-sm">
                  <p className="flex items-center gap-2 font-semibold text-info">
                    <span className="relative flex h-2.5 w-2.5" aria-hidden>
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-info opacity-60" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-info" />
                    </span>
                    Ambient Listening Active
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    AI is generating a real-time transcript and clinical summary.
                  </p>
                </div>
                <div className="flex-1 rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm italic text-muted-foreground">
                  (Transcript will appear here as the conversation progresses…)
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
