'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Mic, Wifi, CheckCircle, AlertTriangle, Monitor, ShieldCheck, Clock, Video } from 'lucide-react';
import { Button, Badge, Skeleton } from '@/components/ui';

interface TelemedicineWaitingRoomProps {
  sessionId: string;
  doctorName: string;
  department: string;
  onJoin: () => void;
}

export default function TelemedicineWaitingRoom({ sessionId, doctorName, department, onJoin }: TelemedicineWaitingRoomProps) {
  const [checks, setChecks] = useState({
    camera: 'pending', // pending, passed, failed
    mic: 'pending',
    network: 'pending',
    browser: 'pending'
  });
  const [consentGiven, setConsentGiven] = useState(false);
  const [allPassed, setAllPassed] = useState(false);

  useEffect(() => {
    // Simulate pre-call checks
    const runChecks = async () => {
      await new Promise(r => setTimeout(r, 500));
      setChecks(c => ({ ...c, browser: 'passed' }));

      await new Promise(r => setTimeout(r, 800));
      setChecks(c => ({ ...c, network: 'passed' }));

      await new Promise(r => setTimeout(r, 1000));
      setChecks(c => ({ ...c, camera: 'passed', mic: 'passed' }));
    };
    runChecks();
  }, []);

  useEffect(() => {
    if (checks.camera === 'passed' && checks.mic === 'passed' && checks.network === 'passed' && checks.browser === 'passed' && consentGiven) {
      setAllPassed(true);
    } else {
      setAllPassed(false);
    }
  }, [checks, consentGiven]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-float md:flex-row"
      >
        {/* Left Side: Info */}
        <div className="flex w-full flex-col justify-between gradient-brand p-8 text-primary-foreground md:w-5/12">
          <div>
            <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
              <Video className="h-5 w-5" aria-hidden />
            </span>
            <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">Virtual Waiting Room</h1>
            <p className="mb-8 text-sm text-primary-foreground/80">
              Please complete the checks before joining the consultation.
            </p>

            <div className="mb-6 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="mb-1 text-xs uppercase tracking-wider text-primary-foreground/70">Appointment with</p>
              <p className="text-lg font-semibold">{doctorName}</p>
              <p className="text-sm text-primary-foreground/80">{department}</p>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
              <Clock className="h-5 w-5 shrink-0 text-primary-foreground/80" aria-hidden />
              <div className="text-sm">
                <span className="block font-medium">Est. Wait Time</span>
                <span className="text-primary-foreground/80">~ 5 minutes</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs text-primary-foreground/80">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            <span>End-to-end encrypted consultation</span>
          </div>
        </div>

        {/* Right Side: Checks */}
        <div className="flex w-full flex-col p-8 md:w-7/12">
          <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-lg font-bold text-foreground">Pre-call Device Check</h2>
            <Badge tone="neutral" className="font-mono text-[10px]">{sessionId}</Badge>
          </div>

          <div className="flex-1 space-y-3">
            <CheckItem icon={<Monitor className="h-5 w-5" aria-hidden />} label="Browser Compatibility" status={checks.browser} index={0} />
            <CheckItem icon={<Wifi className="h-5 w-5" aria-hidden />} label="Network Connection" status={checks.network} index={1} />
            <CheckItem icon={<Camera className="h-5 w-5" aria-hidden />} label="Camera Access" status={checks.camera} index={2} />
            <CheckItem icon={<Mic className="h-5 w-5" aria-hidden />} label="Microphone Access" status={checks.mic} index={3} />
          </div>

          <div className="mt-8 border-t border-border pt-6">
            <label className="group flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
              />
              <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                I consent to telemedicine consultation. I understand that video and audio will be transmitted securely and may be analyzed by AI for clinical documentation purposes.
              </span>
            </label>

            <Button
              size="lg"
              className="mt-6 w-full"
              disabled={!allPassed}
              onClick={onJoin}
            >
              {allPassed ? 'Join Consultation' : 'Complete Checks to Join'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CheckItem({ icon, label, status, index = 0 }: { icon: React.ReactNode, label: string, status: string, index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-center justify-between rounded-xl border border-border bg-muted p-3"
    >
      <div className="flex items-center gap-3 text-foreground">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-card text-muted-foreground shadow-soft">
          {icon}
        </span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div aria-live="polite">
        {status === 'pending' && <Skeleton className="h-5 w-5 rounded-full" />}
        {status === 'passed' && <CheckCircle className="h-5 w-5 text-success" aria-label="Passed" />}
        {status === 'failed' && <AlertTriangle className="h-5 w-5 text-danger" aria-label="Failed" />}
      </div>
    </motion.div>
  );
}
