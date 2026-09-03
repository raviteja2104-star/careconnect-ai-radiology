'use client';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, Phone, UserPlus, CheckCircle, Hospital, HelpCircle, ArrowLeft, Printer, Delete,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type KioskStep = 'WELCOME' | 'METHOD' | 'PHONE_INPUT' | 'WALKIN_FORM' | 'SUCCESS';

const stepMotion = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -16, scale: 0.98 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
};

export default function KioskApp() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<KioskStep>('WELCOME');
  const [phone, setPhone] = useState('');
  const [walkinData, setWalkinData] = useState({ patientName: '', department: 'General Medicine' });
  const [generatedToken, setGeneratedToken] = useState<any>(null);

  const checkinMutation = useMutation({
    mutationFn: (identifier: string) =>
      fetch('http://localhost:5000/api/kiosk/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      }).then(res => res.json()),
    onSuccess: (res) => {
      if (res.success) {
        setGeneratedToken(res.data.token);
        setStep('SUCCESS');
      } else {
        alert(res.error || 'Check-in failed');
      }
    }
  });

  const registerMutation = useMutation({
    mutationFn: (data: any) =>
      fetch('http://localhost:5000/api/kiosk/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: (res) => {
      if (res.success) {
        setGeneratedToken(res.data);
        setStep('SUCCESS');
      }
    }
  });

  const handlePhoneSubmit = () => {
    if (phone.length >= 10) {
      checkinMutation.mutate(phone);
    }
  };

  const handleWalkinSubmit = () => {
    if (walkinData.patientName) {
      registerMutation.mutate(walkinData);
    }
  };

  const resetKiosk = () => {
    setStep('WELCOME');
    setPhone('');
    setWalkinData({ patientName: '', department: 'General Medicine' });
    setGeneratedToken(null);
  };

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col font-sans select-none overflow-hidden touch-manipulation">

      {/* Header */}
      <header className="h-24 shrink-0 border-b border-border bg-card flex items-center justify-between px-10">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-brand text-white shadow-soft">
            <Hospital className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">CareConnect</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Self-Service Terminal</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex rounded-full bg-muted p-1.5">
            <button aria-pressed="true" className="rounded-full bg-card px-6 py-2 font-bold text-foreground shadow-soft">EN</button>
            <button disabled title="Coming soon" className="rounded-full px-6 py-2 font-bold text-muted-foreground opacity-50 cursor-not-allowed">HI</button>
          </div>
          <button disabled title="Coming soon" className="flex items-center gap-2 rounded-full px-4 py-2 font-bold text-muted-foreground opacity-50 cursor-not-allowed">
            <HelpCircle className="h-6 w-6" aria-hidden /> Help
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative flex flex-1 flex-col items-center justify-center p-8">

        {step !== 'WELCOME' && step !== 'SUCCESS' && (
          <button
            onClick={() => setStep('METHOD')}
            className="absolute left-8 top-8 z-10 flex items-center gap-3 rounded-2xl px-6 py-4 text-xl font-bold text-muted-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-8 w-8" aria-hidden /> Back
          </button>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: WELCOME */}
          {step === 'WELCOME' && (
            <motion.div
              key="welcome"
              {...stepMotion}
              onClick={() => setStep('METHOD')}
              className="group flex h-full w-full cursor-pointer flex-col items-center justify-center"
            >
              <div className="mb-12 flex h-48 w-48 items-center justify-center rounded-full bg-primary/10 transition-transform duration-500 group-hover:scale-110">
                <span className="relative flex h-24 w-24">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-24 w-24 rounded-full gradient-brand" />
                </span>
              </div>
              <h1 className="mb-6 text-7xl font-black text-foreground">Touch to Start</h1>
              <p className="text-3xl font-medium text-muted-foreground">Fast Check-in &amp; Registration</p>
            </motion.div>
          )}

          {/* STEP 2: METHOD SELECTION */}
          {step === 'METHOD' && (
            <motion.div key="method" {...stepMotion} className="w-full max-w-6xl">
              <h1 className="mb-16 text-center text-5xl font-black text-foreground">How would you like to check in?</h1>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {[
                  {
                    icon: Phone,
                    tile: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
                    title: 'I have an Appointment',
                    desc: 'Enter your mobile number or ABHA ID',
                    onClick: () => setStep('PHONE_INPUT'),
                  },
                  {
                    icon: QrCode,
                    tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
                    title: 'Scan QR Code',
                    desc: 'Scan your digital appointment receipt',
                    onClick: undefined,
                  },
                  {
                    icon: UserPlus,
                    tile: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
                    title: 'New Walk-in',
                    desc: 'Register as a new patient',
                    onClick: () => setStep('WALKIN_FORM'),
                  },
                ].map((opt) => (
                  <button
                    key={opt.title}
                    onClick={opt.onClick}
                    disabled={!opt.onClick}
                    title={!opt.onClick ? 'Coming soon' : undefined}
                    className={cn(
                      'group flex flex-col items-center rounded-3xl border-2 border-border bg-card p-12 text-center shadow-soft transition-all',
                      opt.onClick
                        ? 'hover:-translate-y-2 hover:border-primary hover:shadow-pop'
                        : 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className={cn(
                      'mb-8 flex h-24 w-24 items-center justify-center rounded-full transition-colors group-hover:gradient-brand group-hover:text-white',
                      opt.tile
                    )}>
                      <opt.icon className="h-10 w-10" aria-hidden />
                    </div>
                    <h2 className="mb-4 text-3xl font-bold text-foreground">{opt.title}</h2>
                    <p className="text-xl text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: PHONE INPUT */}
          {step === 'PHONE_INPUT' && (
            <motion.div key="phone" {...stepMotion} className="w-full max-w-2xl">
              <h1 className="mb-12 text-center text-4xl font-black text-foreground">Enter Mobile Number</h1>

              <div className="rounded-3xl border border-border bg-card p-10 shadow-float">
                <input
                  type="tel"
                  value={phone}
                  readOnly
                  aria-label="Mobile number"
                  className="mb-10 w-full rounded-2xl border-2 border-input bg-muted px-8 py-6 text-center font-mono text-4xl tracking-widest text-foreground outline-none placeholder:text-subtle-foreground"
                  placeholder="10-digit number"
                />

                <div className="mb-10 grid grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'Clear', 0, 'DEL'].map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        if (key === 'Clear') setPhone('');
                        else if (key === 'DEL') setPhone(prev => prev.slice(0, -1));
                        else if (phone.length < 10) setPhone(prev => prev + key);
                      }}
                      className={cn(
                        'flex h-24 items-center justify-center rounded-2xl text-3xl font-bold transition-all active:scale-95',
                        typeof key === 'number'
                          ? 'bg-muted text-foreground hover:bg-border/70'
                          : 'bg-danger-soft text-danger hover:brightness-95'
                      )}
                    >
                      {key === 'DEL' ? <Delete className="h-8 w-8" aria-label="Delete last digit" /> : key}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handlePhoneSubmit}
                  disabled={phone.length < 10 || checkinMutation.isPending}
                  className="flex h-24 w-full items-center justify-center gap-4 rounded-2xl gradient-brand text-3xl font-bold text-white shadow-float transition-all hover:brightness-105 active:brightness-95 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {checkinMutation.isPending ? 'Verifying…' : <><CheckCircle className="h-8 w-8" aria-hidden /> Verify &amp; Check-in</>}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3.5: WALKIN FORM */}
          {step === 'WALKIN_FORM' && (
            <motion.div key="walkin" {...stepMotion} className="w-full max-w-3xl">
              <h1 className="mb-12 text-center text-4xl font-black text-foreground">Walk-in Registration</h1>

              <div className="space-y-8 rounded-3xl border border-border bg-card p-10 shadow-float">
                <div>
                  <label htmlFor="kiosk-name" className="mb-4 block text-xl font-bold text-foreground">Full Name</label>
                  <input
                    id="kiosk-name"
                    type="text"
                    value={walkinData.patientName}
                    onChange={(e) => setWalkinData({ ...walkinData, patientName: e.target.value })}
                    className="w-full rounded-2xl border-2 border-input bg-muted px-6 py-6 text-2xl font-medium text-foreground outline-none transition-colors placeholder:text-subtle-foreground focus:border-primary"
                    placeholder="Tap to enter name…"
                  />
                </div>

                <div>
                  <label htmlFor="kiosk-dept" className="mb-4 block text-xl font-bold text-foreground">Select Department</label>
                  <select
                    id="kiosk-dept"
                    value={walkinData.department}
                    onChange={(e) => setWalkinData({ ...walkinData, department: e.target.value })}
                    className="w-full cursor-pointer rounded-2xl border-2 border-input bg-muted px-6 py-6 text-2xl font-medium text-foreground outline-none transition-colors focus:border-primary"
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                  </select>
                </div>

                <button
                  onClick={handleWalkinSubmit}
                  disabled={!walkinData.patientName || registerMutation.isPending}
                  className="mt-8 flex h-24 w-full items-center justify-center gap-4 rounded-2xl gradient-brand text-3xl font-bold text-white shadow-float transition-all hover:brightness-105 active:brightness-95 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {registerMutation.isPending ? 'Processing…' : <><CheckCircle className="h-8 w-8" aria-hidden /> Generate Token</>}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'SUCCESS' && generatedToken && (
            <motion.div key="success" {...stepMotion} className="w-full max-w-2xl text-center">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="mx-auto mb-10 flex h-32 w-32 items-center justify-center rounded-full bg-success shadow-[0_0_50px_rgba(34,197,94,0.3)]"
              >
                <CheckCircle className="h-16 w-16 text-white" aria-hidden />
              </motion.div>
              <h1 className="mb-4 text-5xl font-black text-foreground">Check-in Complete!</h1>
              <p className="mb-12 text-2xl text-muted-foreground">Please take your printed token below.</p>

              <div className="relative mb-12 overflow-hidden rounded-3xl border-4 border-dashed border-border bg-card p-12">
                <p className="mb-4 text-2xl font-bold uppercase tracking-widest text-muted-foreground">Your Token Number</p>
                <h2 className="mb-8 font-mono text-8xl font-black tracking-tighter text-gradient">{generatedToken.tokenNumber}</h2>
                <div className="grid grid-cols-2 gap-8 rounded-2xl bg-muted p-8 text-left">
                  <div>
                    <p className="text-sm font-bold uppercase text-muted-foreground">Patient</p>
                    <p className="text-2xl font-bold text-foreground">{generatedToken.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase text-muted-foreground">Department</p>
                    <p className="text-2xl font-bold text-foreground">{generatedToken.department}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={resetKiosk}
                className="mx-auto flex items-center gap-4 rounded-full gradient-brand px-12 py-6 text-2xl font-bold text-white shadow-pop transition-all hover:brightness-105 active:brightness-95"
              >
                <Printer className="h-8 w-8" aria-hidden /> Finish &amp; Print Token
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
