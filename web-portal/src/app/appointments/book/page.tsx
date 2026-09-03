'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ArrowLeft, Activity, Heart, Eye, Brain, Stethoscope, Baby,
  MapPin, Clock, Calendar as CalendarIcon, Video, CheckCircle, ShieldCheck, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  PageHeader,
  Card,
  Button,
  Badge,
  Avatar,
  Textarea,
  Label,
  Progress,
  Skeleton,
  SkeletonCard,
} from '@/components/ui';

const API_BASE = 'http://localhost:5000/api';

const ICON_MAP: Record<string, any> = {
  Heart, Brain, Activity, Baby, Eye, Stethoscope
};

const STEP_LABELS = ['Specialty', 'Doctor', 'Schedule', 'Details', 'Confirm'];

export default function BookAppointmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Form State
  const [specialty, setSpecialty] = useState('');
  const [doctor, setDoctor] = useState('');
  const [date, setDate] = useState('2024-05-25');
  const [time, setTime] = useState('');
  const [visitType, setVisitType] = useState<'In-Person' | 'Video Call'>('In-Person');
  const [reason, setReason] = useState('');
  const [insurance, setInsurance] = useState(false);

  // Queries
  const { data: specialtiesRes, isLoading: isLoadingSpecialties } = useQuery({
    queryKey: ['specialties'],
    queryFn: () => fetch(`${API_BASE}/appointments/specialties`).then(res => res.json())
  });

  const { data: doctorsRes, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['doctors', specialty],
    queryFn: () => fetch(`${API_BASE}/appointments/doctors?specialty=${specialty}`).then(res => res.json()),
    enabled: !!specialty
  });

  const { data: availabilityRes, isLoading: isLoadingAvailability } = useQuery({
    queryKey: ['availability', doctor, date],
    queryFn: () => fetch(`${API_BASE}/appointments/doctors/${doctor}/availability?date=${date}`).then(res => res.json()),
    enabled: !!doctor && !!date
  });

  // Mutation
  const bookMutation = useMutation({
    mutationFn: (bookingData: any) =>
      fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      }).then(res => res.json()),
    onSuccess: () => {
      setStep(6);
    }
  });

  const specialties = specialtiesRes?.data || [];
  const doctors = doctorsRes?.data || [];
  const timeSlots = availabilityRes?.data || [];

  const nextStep = () => { setDirection(1); setStep(s => s + 1); };
  const prevStep = () => { setDirection(-1); setStep(s => s - 1); };

  const handleConfirm = () => {
    bookMutation.mutate({
      doctorId: doctor,
      specialty,
      date,
      timeSlot: time,
      visitType,
      reason,
      insuranceApplied: insurance
    });
  };

  const variants = {
    initial: (dir: number) => ({ opacity: 0, x: dir > 0 ? 20 : -20 }),
    animate: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -20 : 20 }),
  };

  const selectedDoctor = doctors.find((d: any) => d._id === doctor);
  const selectedSpecialty = specialties.find((s: any) => s.id === specialty);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Book an Appointment"
        description="Schedule an in-person, home, or video consultation."
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Appointments', href: '/appointments' },
          { label: 'Book' },
        ]}
      />

      <div className="mx-auto max-w-4xl pb-20">
        {/* Stepper */}
        {step < 6 && (
          <div className="mb-8">
            <Progress
              value={((step - 1) / (STEP_LABELS.length - 1)) * 100}
              size="sm"
              aria-hidden
            />
            <ol className="mt-3 flex items-center justify-between" aria-label="Booking steps">
              {STEP_LABELS.map((label, i) => {
                const n = i + 1;
                const done = step > n;
                const current = step === n;
                return (
                  <li key={label} className="flex flex-col items-center gap-1.5" aria-current={current ? 'step' : undefined}>
                    <span
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors duration-300',
                        done || current
                          ? 'gradient-brand text-white shadow-soft'
                          : 'border border-border bg-muted text-subtle-foreground'
                      )}
                    >
                      {done ? <CheckCircle className="h-4.5 w-4.5" aria-hidden /> : n}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-semibold uppercase tracking-wider',
                        done || current ? 'text-primary' : 'text-subtle-foreground'
                      )}
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <Card className="relative min-h-[500px] overflow-hidden rounded-3xl p-8">
          {step > 1 && step < 6 && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={prevStep}
              aria-label="Go back a step"
              className="absolute left-6 top-6 z-20 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="h-full w-full pt-4"
            >
              {/* STEP 1: Specialty */}
              {step === 1 && (
                <div className="space-y-8">
                  <div className="mb-8 text-center">
                    <h2 className="mb-2 text-2xl font-bold text-foreground">What specialty are you looking for?</h2>
                    <p className="text-muted-foreground">Choose a department to see available doctors.</p>
                  </div>

                  {isLoadingSpecialties ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonCard key={i} />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {specialties.map((spec: any, i: number) => {
                        const IconComponent = ICON_MAP[spec.icon] || Activity;
                        const selected = specialty === spec.id;
                        return (
                          <motion.button
                            key={spec.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            onClick={() => { setSpecialty(spec.id); nextStep(); }}
                            className={cn(
                              'rounded-2xl border p-6 text-left transition-all duration-200 hover:shadow-float',
                              selected
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-border bg-card hover:border-primary/40'
                            )}
                          >
                            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <IconComponent className="h-6 w-6" aria-hidden />
                            </span>
                            <h3 className="mb-1 font-semibold text-foreground">{spec.name}</h3>
                            <p className="text-xs text-muted-foreground">{spec.desc}</p>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Doctor */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="mb-8 text-center">
                    <h2 className="mb-2 text-2xl font-bold text-foreground">Select a Doctor</h2>
                    <p className="text-muted-foreground">Top-rated specialists available for you.</p>
                  </div>

                  {isLoadingDoctors ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-5 rounded-2xl border border-border p-5">
                          <Skeleton className="h-16 w-16 rounded-xl" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-3 w-40" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {doctors.map((doc: any, i: number) => (
                        <motion.div
                          key={doc._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.05 }}
                          onClick={() => { setDoctor(doc._id); nextStep(); }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setDoctor(doc._id); nextStep(); } }}
                          className={cn(
                            'flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-5 transition-all hover:shadow-float',
                            doctor === doc._id
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-border bg-card hover:border-primary/40'
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-5">
                            <Avatar name={doc.name} src={doc.image} size="xl" />
                            <div className="min-w-0">
                              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                                {doc.name}
                                <ShieldCheck className="h-4 w-4 text-info" aria-hidden />
                              </h3>
                              <p className="mb-2 text-sm font-medium text-muted-foreground">{doc.specialty} • {doc.exp}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge tone="success">
                                  <Star className="h-3 w-3 fill-current" aria-hidden />
                                  {doc.rating}
                                </Badge>
                                <Badge tone="brand">Next: {doc.nextSlot}</Badge>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-6 w-6 shrink-0 text-subtle-foreground" aria-hidden />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Schedule */}
              {step === 3 && (
                <div className="space-y-8">
                  <div className="mb-8 text-center">
                    <h2 className="mb-2 text-2xl font-bold text-foreground">Choose Date & Time</h2>
                    <p className="text-muted-foreground">Pick a convenient slot for your visit.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {/* Calendar */}
                    <div className="rounded-2xl border border-border bg-card p-6">
                      <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                        <CalendarIcon className="h-5 w-5 text-primary" aria-hidden /> May 2024
                      </h3>
                      <div className="mb-4 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-subtle-foreground">
                        {['M','T','W','T','F','S','S'].map((d,i) => <div key={i}>{d}</div>)}
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({length: 31}).map((_, i) => {
                          const day = i + 1;
                          const isPast = day < 20;
                          const isSelected = date === `2024-05-${day.toString().padStart(2, '0')}`;
                          return (
                            <button
                              key={i}
                              disabled={isPast}
                              onClick={() => setDate(`2024-05-${day.toString().padStart(2, '0')}`)}
                              className={cn(
                                'flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition-all',
                                isPast ? 'cursor-not-allowed text-subtle-foreground opacity-40' :
                                isSelected ? 'gradient-brand text-white shadow-soft' :
                                'bg-muted text-foreground hover:bg-border/70'
                              )}
                            >
                              {day}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Time slots */}
                    <div>
                      <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                        <Clock className="h-5 w-5 text-primary" aria-hidden /> Available Slots
                      </h3>
                      {isLoadingAvailability ? (
                        <div className="grid grid-cols-2 gap-3">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-11 rounded-xl" />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {timeSlots.map((t: string) => (
                            <button
                              key={t}
                              onClick={() => setTime(t)}
                              aria-pressed={time === t}
                              className={cn(
                                'rounded-xl border px-4 py-3 text-center text-sm font-semibold transition-all',
                                time === t
                                  ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                                  : 'border-border bg-card text-foreground hover:border-primary/40'
                              )}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button size="lg" disabled={!date || !time} onClick={nextStep}>
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 4: Details */}
              {step === 4 && (
                <div className="mx-auto max-w-2xl space-y-8">
                  <div className="mb-8 text-center">
                    <h2 className="mb-2 text-2xl font-bold text-foreground">Visit Details</h2>
                    <p className="text-muted-foreground">Tell us a bit more about your visit.</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="mb-3">Visit Type</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setVisitType('In-Person')}
                          aria-pressed={visitType === 'In-Person'}
                          className={cn(
                            'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all',
                            visitType === 'In-Person'
                              ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                              : 'border-border text-muted-foreground hover:border-primary/40'
                          )}
                        >
                          <MapPin className="h-6 w-6" aria-hidden />
                          <span className="text-sm font-semibold">In-Person Visit</span>
                        </button>
                        <button
                          onClick={() => setVisitType('Video Call')}
                          aria-pressed={visitType === 'Video Call'}
                          className={cn(
                            'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all',
                            visitType === 'Video Call'
                              ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                              : 'border-border text-muted-foreground hover:border-primary/40'
                          )}
                        >
                          <Video className="h-6 w-6" aria-hidden />
                          <span className="text-sm font-semibold">Telemedicine (Video)</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="visit-reason" className="mb-3">Reason for Visit</Label>
                      <Textarea
                        id="visit-reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Briefly describe your symptoms or reason for visit…"
                        className="min-h-[120px] resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button size="lg" disabled={!reason} onClick={nextStep}>
                      Review Appointment
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 5: Confirm */}
              {step === 5 && (
                <div className="mx-auto max-w-xl space-y-8">
                  <div className="mb-8 text-center">
                    <h2 className="mb-2 text-2xl font-bold text-foreground">Review & Confirm</h2>
                    <p className="text-muted-foreground">Please verify your appointment details.</p>
                  </div>

                  <div className="space-y-6 rounded-2xl border border-border bg-muted/40 p-6">
                    <div className="flex items-center gap-4 border-b border-border pb-6">
                      <Avatar name={selectedDoctor?.name ?? 'Doctor'} src={selectedDoctor?.image} size="xl" />
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{selectedDoctor?.name}</h3>
                        <p className="text-sm font-medium text-muted-foreground">{selectedSpecialty?.name}</p>
                      </div>
                    </div>

                    <dl className="grid grid-cols-2 gap-x-4 gap-y-6">
                      <div>
                        <dt className="mb-1 text-xs font-semibold uppercase tracking-wider text-subtle-foreground">Date & Time</dt>
                        <dd className="font-semibold text-foreground">{date} • {time}</dd>
                      </div>
                      <div>
                        <dt className="mb-1 text-xs font-semibold uppercase tracking-wider text-subtle-foreground">Visit Type</dt>
                        <dd className="flex items-center gap-2 font-semibold text-foreground">
                          {visitType === 'Video Call'
                            ? <Video className="h-4 w-4 text-primary" aria-hidden />
                            : <MapPin className="h-4 w-4 text-primary" aria-hidden />}
                          {visitType}
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="mb-1 text-xs font-semibold uppercase tracking-wider text-subtle-foreground">Reason</dt>
                        <dd className="font-medium text-muted-foreground">{reason}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* ABHA / Insurance toggle */}
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={insurance}
                      onChange={() => setInsurance(!insurance)}
                      className="mt-1 h-5 w-5 rounded border-input text-primary accent-[var(--primary)] focus:ring-primary"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-foreground">Apply Insurance / ABHA Benefits</span>
                      <span className="mt-1 block text-xs text-muted-foreground">Automatically verify coverage before billing.</span>
                    </span>
                  </label>

                  <Button
                    size="lg"
                    className="w-full"
                    loading={bookMutation.isPending}
                    onClick={handleConfirm}
                  >
                    {!bookMutation.isPending && <CheckCircle className="h-5 w-5" aria-hidden />}
                    Confirm Appointment
                  </Button>
                </div>
              )}

              {/* STEP 6: Success */}
              {step === 6 && (
                <div className="space-y-6 py-10 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-success-soft"
                  >
                    <CheckCircle className="h-12 w-12 text-success" aria-hidden />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-foreground">Appointment Confirmed!</h2>
                  <p className="mx-auto max-w-md leading-relaxed text-muted-foreground">
                    Your {visitType.toLowerCase()} with {selectedDoctor?.name} is successfully scheduled for {date} at {time}.
                  </p>
                  <div className="pt-8">
                    <Button size="lg" variant="secondary" onClick={() => router.push('/appointments')}>
                      View My Appointments
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
