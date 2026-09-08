'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  HeartPulse, Activity, AlertTriangle, Wind,
  Droplets, Stethoscope, Siren, ActivitySquare, Clipboard,
} from 'lucide-react';
import {
  PageHeader, Button, Badge, StatCard, StatGrid,
  Card, CardHeader, CardTitle, CardContent,
  Tabs, TabsList, TabsTrigger, TabsContent,
  EmptyState, ProgressRing, SkeletonCard,
} from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: 'Bearer ' + token } : {};
}

type Monitor = {
  bed: string; patient: string; age: number; status: string;
  hr: number; bp: string; map: number; spo2: number; rr: number; temp: number;
  vent: string | null; pressor: string | null;
};

type ICUStats = {
  census: string; onVentilator: number; onVasopressors: number; criticalAlerts: number;
};

type ICUResponse = {
  stats: ICUStats;
  patients: Monitor[];
};

const TABS = ['dashboard', 'central monitor', 'ventilators', 'infusions', 'severity scores', 'rounds'];

export default function ICUDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('central monitor');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time for real-time feel
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const icuQuery = useQuery<{ success: boolean; data: ICUResponse }>({
    queryKey: ['ward-icu'],
    queryFn: () =>
      fetch(`${API_BASE}/api/ward/icu`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const apiData = icuQuery.data?.data;
  const apiStats = apiData?.stats;
  const monitors: Monitor[] = apiData?.patients ?? [];

  const stats = [
    { label: 'ICU Census',       value: apiStats?.census          ?? '—', icon: HeartPulse,   tone: 'violet' as const },
    { label: 'On Ventilator',    value: apiStats ? String(apiStats.onVentilator)   : '—', icon: Wind,         tone: 'brand'  as const },
    { label: 'On Vasopressors',  value: apiStats ? String(apiStats.onVasopressors) : '—', icon: Droplets,     tone: 'violet' as const },
    { label: 'Critical Alerts',  value: apiStats ? String(apiStats.criticalAlerts) : '—', icon: AlertTriangle, tone: 'rose'  as const },
  ];

  // Helper for conditional styling (semantic tokens)
  const getAlertClasses = (status: string) => {
    switch (status) {
      case 'Critical': return 'border-danger/60 ring-1 ring-danger/20';
      case 'Warning': return 'border-warning/60 ring-1 ring-warning/20';
      default: return 'border-border';
    }
  };

  const statusTone = (status: string): 'danger' | 'warning' | 'success' =>
    status === 'Critical' ? 'danger' : status === 'Warning' ? 'warning' : 'success';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Critical Care (ICU)"
        description={
          <span className="inline-flex items-center gap-2">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Live Command Center • <span className="tabular-nums">{currentTime.toLocaleTimeString()}</span>
          </span>
        }
        crumbs={[{ label: 'Clinical' }, { label: 'Critical Care' }]}
        actions={
          <>
            <Button variant="secondary" onClick={() => setActiveTab('rounds')}>
              <Stethoscope className="h-4 w-4" aria-hidden /> Start Rounds
            </Button>
            <Button variant="danger" className="animate-pulse" onClick={() => router.push('/emergency')}>
              <Siren className="h-4 w-4" aria-hidden /> Code Blue
            </Button>
          </>
        }
      />

      {icuQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : icuQuery.isError ? (
        <p className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">Failed to load ICU data. Please refresh.</p>
      ) : (
        <StatGrid>
          {stats.map((stat, idx) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              tone={stat.tone}
              delay={idx * 0.05}
            />
          ))}
        </StatGrid>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto max-w-full flex-wrap justify-start overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="capitalize">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="central monitor" className="mt-6">
          {icuQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="h-56 animate-pulse rounded-2xl bg-muted" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {monitors.map((m, i) => (
                <motion.div
                  key={m.bed}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex flex-col overflow-hidden rounded-2xl border-2 bg-card shadow-soft ${getAlertClasses(m.status)}`}
                >
                  {/* Monitor header */}
                  <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-muted/60 px-4 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-lg font-bold text-primary">{m.bed}</span>
                      <span className="truncate text-sm font-semibold text-foreground">{m.patient}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge tone={statusTone(m.status)} dot pulse={m.status === 'Critical'}>{m.status}</Badge>
                      {m.vent && (
                        <Badge tone="info">
                          <Wind className="h-3 w-3" aria-hidden /> {m.vent}
                        </Badge>
                      )}
                      {m.pressor && (
                        <Badge tone="brand">
                          <Droplets className="h-3 w-3" aria-hidden /> {m.pressor}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Vitals grid */}
                  <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-5 p-4">
                    {/* HR */}
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-wider text-success">HR (bpm)</span>
                      <div className="mt-1 flex items-baseline justify-between">
                        <span className={`font-mono text-4xl font-bold tabular-nums ${m.hr > 100 ? 'animate-pulse text-danger' : 'text-success'}`}>
                          {m.hr}
                        </span>
                        <Activity className="h-5 w-5 text-success opacity-50" aria-hidden />
                      </div>
                    </div>

                    {/* BP */}
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-danger">NIBP (mmHg)</span>
                        <span className="font-mono text-[10px] text-subtle-foreground">MAP: {m.map}</span>
                      </div>
                      <div className="mt-1 flex items-baseline">
                        <span className={`font-mono text-3xl font-bold tabular-nums text-danger ${(m.map < 65 || m.map > 105) ? 'animate-pulse' : ''}`}>
                          {m.bp}
                        </span>
                      </div>
                    </div>

                    {/* SpO2 */}
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-wider text-info">SpO2 (%)</span>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className={`font-mono text-4xl font-bold tabular-nums ${m.spo2 < 94 ? 'animate-pulse text-danger' : 'text-info'}`}>
                          {m.spo2}
                        </span>
                        <ProgressRing
                          value={m.spo2}
                          size={44}
                          strokeWidth={4}
                          tone={m.spo2 < 94 ? 'danger' : 'brand'}
                        >
                          <span className="sr-only">{m.spo2}% oxygen saturation</span>
                          <span aria-hidden className="text-[10px] font-bold">{m.spo2}</span>
                        </ProgressRing>
                      </div>
                    </div>

                    {/* RR */}
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-wider text-warning">RR (rpm)</span>
                      <div className="mt-1 flex items-baseline">
                        <span className={`font-mono text-4xl font-bold tabular-nums ${m.rr > 25 ? 'text-danger' : 'text-warning'}`}>
                          {m.rr}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ventilators" className="mt-6">
          <EmptyState
            icon={Wind}
            title="Ventilator Management"
            description="Track FiO2, PEEP, Peak Pressures, and Respiratory modes across the ICU."
          />
        </TabsContent>

        <TabsContent value="severity scores" className="mt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>APACHE II Score</CardTitle>
                <ActivitySquare className="h-5 w-5 text-primary" aria-hidden />
              </CardHeader>
              <CardContent>
                <div className="mb-2 text-4xl font-bold tabular-nums text-primary">24</div>
                <p className="text-sm text-muted-foreground">Predicted Mortality: ~50%. Calculated 2 hours ago for Patient Rohit S.</p>
                <Button variant="secondary" className="mt-4 w-full" disabled title="Coming soon">Recalculate</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>SOFA Score</CardTitle>
                <ActivitySquare className="h-5 w-5 text-success" aria-hidden />
              </CardHeader>
              <CardContent>
                <div className="mb-2 text-4xl font-bold tabular-nums text-success">9</div>
                <p className="text-sm text-muted-foreground">Suggests significant organ failure (Resp, CV, Renal). Patient Sunita R.</p>
                <Button variant="secondary" className="mt-4 w-full" disabled title="Coming soon">Recalculate</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {['dashboard', 'infusions', 'rounds'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <EmptyState
              icon={Clipboard}
              title={`${tab.charAt(0).toUpperCase() + tab.slice(1)} Module`}
              description={`The ${tab} workspace will be rendered here.`}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
