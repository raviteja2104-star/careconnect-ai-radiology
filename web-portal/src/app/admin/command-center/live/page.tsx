'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Activity, Building, ArrowRightLeft, AlertTriangle, Play, Sparkles, Map, Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader, StatCard, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, EmptyState } from '@/components/ui';

export default function LiveOperationsWall() {
  const router = useRouter();
  const [stats, setStats] = useState({
    appointments: 0, waitingTokens: 0, inProgressTokens: 0,
    activeTransfers: 0, telemedicineActive: 0, totalInSystem: 0
  });

  const [eventStream, setEventStream] = useState<any[]>([]);

  // Fetch initial state
  const { data: liveData } = useQuery({
    queryKey: ['command_live_stats'],
    queryFn: () => fetch('http://localhost:5000/api/command/live').then(res => res.json())
  });

  const { data: flowData } = useQuery({
    queryKey: ['command_patient_flow'],
    queryFn: () => fetch('http://localhost:5000/api/command/patient-flow').then(res => res.json())
  });

  useEffect(() => {
    if (liveData?.data) {
      setStats(liveData.data);
    }
  }, [liveData]);

  // Hook into universal Event Bus
  useEffect(() => {
    const socket = io('http://localhost:5000');

    const handleEvent = (eventName: string) => (data: any) => {
      // Invalidate queries to refresh counts
      // Alternatively, update stats optimistically here for true zero-latency

      setEventStream(prev => [
        { id: Date.now(), type: eventName, data, time: new Date() },
        ...prev
      ].slice(0, 30));
    };

    socket.on('QUEUE_UPDATED', handleEvent('QUEUE_UPDATED'));
    socket.on('TRANSFER_CREATED', handleEvent('TRANSFER_CREATED'));
    socket.on('CONSULTATION_STARTED', handleEvent('CONSULTATION_STARTED'));
    socket.on('MESSAGE_SENT', handleEvent('MESSAGE_SENT'));
    socket.on('CONSULTATION_COMPLETED', handleEvent('CONSULTATION_COMPLETED'));

    return () => { socket.disconnect(); };
  }, []);

  const heatmap = flowData?.data?.heatmap || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Operations Wall"
        description="Real-time hospital activity streamed from the universal event bus."
        crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Admin', href: '/admin' },
          { label: 'Command Center', href: '/admin/command-center' },
          { label: 'Live' },
        ]}
        actions={<Badge tone="success" dot pulse>Streaming</Badge>}
      />

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Active In Hospital" value={stats.totalInSystem} sub="Patients currently in system" icon={Building} tone="brand" delay={0} />
        <StatCard label="Waiting in Queue" value={stats.waitingTokens} sub="Tokens awaiting call" icon={Users} tone="amber" delay={0.05} />
        <StatCard label="In Consultation" value={stats.inProgressTokens} sub="Live doctor sessions" icon={Activity} tone="emerald" delay={0.1} />
        <StatCard label="Active Transfers" value={stats.activeTransfers} sub="Inter-ward movements" icon={ArrowRightLeft} tone="violet" delay={0.15} />
        <StatCard label="Telemedicine Active" value={stats.telemedicineActive} sub="Remote consultations" icon={Play} tone="teal" delay={0.2} />
      </div>

      <div className="grid h-[600px] grid-cols-1 gap-6 xl:grid-cols-3">

        {/* Left: Department Heatmap */}
        <Card className="flex flex-col xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-primary" aria-hidden /> Department Heatmap
              </CardTitle>
              <CardDescription className="mt-1.5">Waiting load by department</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/operations/ai')}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> AI Optimize Capacity
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto scrollbar-thin">
            {heatmap.length === 0 ? (
              <EmptyState
                icon={Map}
                title="No active departments"
                description="Department load will light up here as patients enter the queues."
                className="h-full"
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {heatmap.map((dept: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      'group relative overflow-hidden rounded-2xl border bg-muted/30 p-5 transition-colors',
                      dept.count > 5 ? 'border-warning/40' : 'border-border'
                    )}
                  >
                    <div
                      className="absolute -mr-4 -mt-4 right-0 top-0 h-16 w-16 rounded-bl-full bg-primary/5 transition-colors group-hover:bg-primary/10"
                      aria-hidden
                    />
                    <h3 className="mb-4 font-semibold text-foreground">{dept.department}</h3>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Waiting</p>
                        <p className="text-2xl font-bold text-foreground tabular-nums">{dept.count}</p>
                      </div>
                      {dept.count > 5 && (
                        <Badge tone="warning">
                          <AlertTriangle className="h-3 w-3" aria-hidden /> High Load
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Live Event Stream */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-success" aria-hidden /> Event Matrix Stream
            </CardTitle>
            <CardDescription>Last 30 events on the bus</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-3 overflow-y-auto scrollbar-thin">
            {eventStream.length === 0 ? (
              <EmptyState
                icon={Radio}
                title="Listening to Event Bus..."
                description="Waiting for hospital activity. New events appear here instantly."
                className="h-full"
              />
            ) : (
              <AnimatePresence initial={false}>
                {eventStream.map((evt) => (
                  <motion.div
                    key={evt.id}
                    layout
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="rounded-xl border border-border bg-muted/30 p-4"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <Badge tone="brand" className="font-mono">{evt.type}</Badge>
                      <span className="font-mono text-xs text-subtle-foreground tabular-nums">
                        {evt.time.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="truncate font-mono text-sm text-muted-foreground">
                      {JSON.stringify(evt.data).substring(0, 100)}...
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
