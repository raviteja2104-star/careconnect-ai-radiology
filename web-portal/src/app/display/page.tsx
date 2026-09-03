'use client';

import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Clock, HeartPulse, DoorOpen, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const TICKER_ITEMS = [
  'PLEASE KEEP YOUR MOBILE PHONES ON SILENT',
  'DO NOT LEAVE YOUR BELONGINGS UNATTENDED',
  'FOR ASSISTANCE, CONTACT RECEPTION',
  'MASKS ARE RECOMMENDED IN WAITING AREAS',
];

export default function PatientDisplayBoard() {
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch initial queue state
  const { data: queueData } = useQuery({
    queryKey: ['queue', 'OPD'],
    queryFn: () => fetch('http://localhost:5000/api/queue/OPD').then(res => res.json())
  });

  // Setup WebSockets
  useEffect(() => {
    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('Connected to Queue WebSocket');
    });

    socket.on('QUEUE_UPDATED', (data) => {
      if (data.department === 'OPD') {
        queryClient.invalidateQueries({ queryKey: ['queue', 'OPD'] });
      }
    });

    socket.on('TOKEN_CALLED', (data) => {
      // Could trigger a sound or a visual flash here
      if (data.department === 'OPD') {
        const msg = new SpeechSynthesisUtterance(`Token number ${data.token.tokenNumber}, please proceed to Room ${data.token.room}`);
        window.speechSynthesis.speak(msg);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  // Update Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const tokens = queueData?.data || [];
  const currentlyCalling = tokens.filter((t: any) => t.status === 'CALLED' || t.status === 'IN_PROGRESS');
  const waitingTokens = tokens.filter((t: any) => t.status === 'WAITING').slice(0, 8); // Next 8

  const ticker = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="dark flex h-screen w-full flex-col overflow-hidden bg-background font-sans text-foreground">
      {/* Header */}
      <header className="flex h-24 shrink-0 items-center justify-between border-b border-border bg-card px-10 shadow-soft">
        <div className="flex items-center gap-4">
          <div className="gradient-brand flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground shadow-float">
            <Megaphone className="h-7 w-7" aria-hidden />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">OPD Waiting Area</h1>
            <p className="text-lg text-muted-foreground">CareConnect Main Hospital</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-4xl font-bold tabular-nums tracking-wider text-foreground">
            {currentTime.toLocaleTimeString()}
          </p>
          <p className="text-lg text-muted-foreground">
            {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </header>

      {/* Main Board */}
      <div className="flex min-h-0 flex-1">

        {/* Left: Active Called Tokens */}
        <section className="flex flex-[2] flex-col gap-6 overflow-hidden border-r border-border p-8" aria-label="Now serving">
          <h2 className="mb-2 flex items-center gap-3 text-2xl font-bold uppercase tracking-widest text-muted-foreground">
            <span className="relative flex h-3.5 w-3.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-success" />
            </span>
            Please Proceed
          </h2>

          <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
            {currentlyCalling.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 rounded-3xl border-4 border-dashed border-border text-muted-foreground">
                <Stethoscope className="h-14 w-14 text-subtle-foreground" aria-hidden />
                <p className="text-2xl font-medium">Waiting for Doctor...</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {currentlyCalling.map((token: any) => (
                  <motion.div
                    key={token._id}
                    layout
                    initial={{ opacity: 0, y: 24, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center justify-between rounded-3xl border border-primary/30 bg-card p-8 shadow-pop ring-1 ring-primary/20"
                  >
                    <div className="min-w-0">
                      <p className="mb-2 text-xl font-bold uppercase tracking-wider text-muted-foreground">Token Number</p>
                      <p className="text-gradient font-mono text-8xl font-black leading-none tracking-tighter tabular-nums">
                        {token.tokenNumber}
                      </p>
                      <p className="mt-4 truncate text-3xl font-bold text-foreground">{token.patientName}</p>
                      {token.priorityReason !== 'Normal' && (
                        <span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-danger-soft px-4 py-1.5 text-xl font-black uppercase text-danger">
                          <HeartPulse className="h-5 w-5" aria-hidden />
                          {token.priorityReason} Priority
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end text-right">
                      <p className="mb-2 flex items-center gap-2 text-xl font-bold uppercase tracking-wider text-muted-foreground">
                        <DoorOpen className="h-6 w-6" aria-hidden /> Proceed To
                      </p>
                      <div className="rounded-2xl border-2 border-primary/40 bg-primary/10 px-8 py-6">
                        <p className="text-6xl font-black text-primary">{token.room || 'Room 1'}</p>
                      </div>
                      <p className="mt-4 text-xl font-semibold text-muted-foreground">Dr. {token.doctor?.name || 'Assigned Doctor'}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </section>

        {/* Right: Upcoming Tokens */}
        <aside className="flex flex-1 flex-col bg-card/50 p-8" aria-label="Next in line">
          <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold uppercase tracking-widest text-muted-foreground">
            <Clock className="h-6 w-6" aria-hidden /> Next in Line
          </h2>

          <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
            {waitingTokens.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border py-10 text-center text-xl italic text-subtle-foreground">
                Queue is empty
              </div>
            ) : (
              waitingTokens.map((token: any, index: number) => (
                <motion.div
                  key={token._id}
                  layout
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    'flex items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-soft',
                    index === 0 && 'border-primary/30'
                  )}
                >
                  <div className="flex min-w-0 items-center gap-6">
                    <span className="w-24 shrink-0 font-mono text-4xl font-black tabular-nums text-foreground">
                      {token.tokenNumber}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xl font-bold text-foreground">{token.patientName}</p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        Wait: ~{token.estimatedWaitMinutes}m
                        {token.priorityReason !== 'Normal' && (
                          <span className="ml-2 font-bold uppercase text-danger">• {token.priorityReason}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
            <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HeartPulse className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="text-xl font-bold text-foreground">Health Tip of the Day</h3>
            <p className="mt-2 text-muted-foreground">
              Drink at least 8 glasses of water daily to maintain optimal hydration and support immune function.
            </p>
          </div>
        </aside>
      </div>

      {/* Ticker / Footer */}
      <div className="gradient-brand flex h-12 shrink-0 items-center overflow-hidden" role="marquee" aria-label="Announcements">
        <motion.div
          className="flex whitespace-nowrap text-lg font-semibold tracking-wider text-primary-foreground"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 40, ease: 'linear', repeat: Infinity }}
        >
          {ticker.map((item, i) => (
            <span key={i} className="px-6">
              {item} <span aria-hidden className="pl-6">•</span>
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
