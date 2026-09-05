'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ArrowLeft, Activity, Heart, Eye, Brain, Stethoscope, Baby, 
  MapPin, Clock, Calendar as CalendarIcon, Video, CheckCircle, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'}/api`;

const ICON_MAP: Record<string, any> = {
  Heart, Brain, Activity, Baby, Eye, Stethoscope
};

export const BookingWizard = () => {
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

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      {/* Progress Header */}
      <div className="mb-10 flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full z-0"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 rounded-full z-0 transition-all duration-500 ease-out"
          style={{ width: `${((step - 1) / 4) * 100}%` }}
        ></div>
        
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="relative z-10 flex flex-col items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300",
              step >= i ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700"
            )}>
              {step > i ? <CheckCircle className="w-5 h-5" /> : i}
            </div>
            <span className={cn(
              "absolute top-10 text-[10px] font-semibold uppercase whitespace-nowrap",
              step >= i ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"
            )}>
              {i === 1 ? 'Specialty' : i === 2 ? 'Doctor' : i === 3 ? 'Schedule' : i === 4 ? 'Details' : 'Confirm'}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 min-h-[500px] relative overflow-hidden shadow-sm">
        
        {step > 1 && step < 6 && (
          <button onClick={prevStep} className="absolute left-8 top-8 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors z-20">
            <ArrowLeft className="w-5 h-5" />
          </button>
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
            className="w-full h-full pt-4"
          >
            {/* STEP 1: Specialty */}
            {step === 1 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">What specialty are you looking for?</h2>
                  <p className="text-zinc-500">Choose a department to see available doctors.</p>
                </div>
                
                {isLoadingSpecialties ? (
                  <div className="flex justify-center items-center py-20"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {specialties.map((spec: any) => {
                      const IconComponent = ICON_MAP[spec.icon] || Activity;
                      return (
                        <button
                          key={spec.id}
                          onClick={() => { setSpecialty(spec.id); nextStep(); }}
                          className={cn(
                            "p-6 rounded-2xl text-left border transition-all duration-200 hover:shadow-md",
                            specialty === spec.id 
                              ? "bg-indigo-50 border-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-500" 
                              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                          )}
                        >
                          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <h3 className="font-bold text-zinc-900 dark:text-white mb-1">{spec.name}</h3>
                          <p className="text-xs text-zinc-500">{spec.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Doctor */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Select a Doctor</h2>
                  <p className="text-zinc-500">Top-rated specialists available for you.</p>
                </div>

                {isLoadingDoctors ? (
                  <div className="flex justify-center items-center py-20"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>
                ) : (
                  <div className="space-y-4">
                    {doctors.map((doc: any) => (
                      <div 
                        key={doc._id}
                        onClick={() => { setDoctor(doc._id); nextStep(); }}
                        className={cn(
                          "p-5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all hover:shadow-md",
                          doctor === doc._id 
                            ? "bg-indigo-50 border-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-500" 
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                        )}
                      >
                        <div className="flex gap-5 items-center">
                          <img src={doc.image} alt={doc.name} className="w-16 h-16 rounded-xl object-cover" />
                          <div>
                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
                              {doc.name} <ShieldCheck className="w-4 h-4 text-blue-500" />
                            </h3>
                            <p className="text-sm text-zinc-500 font-medium mb-2">{doc.specialty} • {doc.exp}</p>
                            <div className="flex items-center gap-3">
                              <span className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                ⭐ {doc.rating}
                              </span>
                              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                                Next: {doc.nextSlot}
                              </span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-zinc-300" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Schedule */}
            {step === 3 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Choose Date & Time</h2>
                  <p className="text-zinc-500">Pick a convenient slot for your visit.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Mock Calendar */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-indigo-600" /> May 2024</h3>
                    <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-zinc-400 mb-4">
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
                              "h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all",
                              isPast ? "opacity-30 cursor-not-allowed text-zinc-400" :
                              isSelected ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" :
                              "bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            )}
                          >
                            {day}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div>
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-600" /> Available Slots</h3>
                    {isLoadingAvailability ? (
                      <div className="flex justify-center items-center h-40"><div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full"></div></div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {timeSlots.map((t: string) => (
                          <button
                            key={t}
                            onClick={() => setTime(t)}
                            className={cn(
                              "py-3 px-4 rounded-xl text-sm font-semibold border transition-all text-center",
                              time === t
                                ? "bg-indigo-50 border-indigo-600 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500 dark:text-indigo-300"
                                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-indigo-300"
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
                  <button 
                    disabled={!date || !time}
                    onClick={nextStep}
                    className="bg-indigo-600 disabled:opacity-50 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Details */}
            {step === 4 && (
              <div className="space-y-8 max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Visit Details</h2>
                  <p className="text-zinc-500">Tell us a bit more about your visit.</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3">Visit Type</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setVisitType('In-Person')}
                        className={cn(
                          "p-4 rounded-xl border flex flex-col items-center gap-2 transition-all",
                          visitType === 'In-Person' ? "bg-indigo-50 border-indigo-600 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500" : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                        )}
                      >
                        <MapPin className="w-6 h-6" />
                        <span className="font-semibold text-sm">In-Person Visit</span>
                      </button>
                      <button
                        onClick={() => setVisitType('Video Call')}
                        className={cn(
                          "p-4 rounded-xl border flex flex-col items-center gap-2 transition-all",
                          visitType === 'Video Call' ? "bg-indigo-50 border-indigo-600 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500" : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                        )}
                      >
                        <Video className="w-6 h-6" />
                        <span className="font-semibold text-sm">Telemedicine (Video)</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-3">Reason for Visit</label>
                    <textarea 
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Briefly describe your symptoms or reason for visit..."
                      className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-zinc-900 dark:text-zinc-100 min-h-[120px] resize-none"
                    ></textarea>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    disabled={!reason}
                    onClick={nextStep}
                    className="bg-indigo-600 disabled:opacity-50 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition-colors"
                  >
                    Review Appointment
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Confirm */}
            {step === 5 && (
              <div className="space-y-8 max-w-xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Review & Confirm</h2>
                  <p className="text-zinc-500">Please verify your appointment details.</p>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6">
                  
                  <div className="flex gap-4 items-center border-b border-zinc-200 dark:border-zinc-700 pb-6">
                    <img src={doctors.find((d: any) => d._id === doctor)?.image} alt="Doc" className="w-16 h-16 rounded-xl object-cover shadow-sm" />
                    <div>
                      <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{doctors.find((d: any) => d._id === doctor)?.name}</h3>
                      <p className="text-sm text-zinc-500 font-medium">{specialties.find((s: any) => s.id === specialty)?.name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Date & Time</p>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{date} • {time}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Visit Type</p>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        {visitType === 'Video Call' ? <Video className="w-4 h-4 text-indigo-500" /> : <MapPin className="w-4 h-4 text-indigo-500" />}
                        {visitType}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Reason</p>
                      <p className="font-medium text-zinc-700 dark:text-zinc-300">{reason}</p>
                    </div>
                  </div>
                </div>

                {/* ABHA / Insurance toggle */}
                <label className="flex items-start gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <input type="checkbox" checked={insurance} onChange={() => setInsurance(!insurance)} className="mt-1 w-5 h-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600" />
                  <div>
                    <p className="font-bold text-zinc-900 dark:text-white text-sm">Apply Insurance / ABHA Benefits</p>
                    <p className="text-xs text-zinc-500 mt-1">Automatically verify coverage before billing.</p>
                  </div>
                </label>

                <button 
                  disabled={bookMutation.isPending}
                  onClick={handleConfirm}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-4 px-8 rounded-xl transition-colors shadow-lg shadow-indigo-600/30 flex justify-center items-center gap-2"
                >
                  {bookMutation.isPending ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <><CheckCircle className="w-5 h-5" /> Confirm Appointment</>
                  )}
                </button>
              </div>
            )}

            {/* STEP 6: Success */}
            {step === 6 && (
              <div className="text-center py-10 space-y-6">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-500" />
                </div>
                <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Appointment Confirmed!</h2>
                <p className="text-zinc-500 max-w-md mx-auto leading-relaxed">
                  Your {visitType.toLowerCase()} with {doctors.find((d: any) => d._id === doctor)?.name} is successfully scheduled for {date} at {time}.
                </p>
                <div className="pt-8">
                  <button onClick={() => router.push('/appointments')} className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 font-bold py-3 px-8 rounded-xl transition-opacity">
                    View My Appointments
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
