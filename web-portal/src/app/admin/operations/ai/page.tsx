'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BrainCircuit, TrendingUp, Clock, Users, ArrowRight, Radar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PageHeader, Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, Button, SkeletonCard, EmptyState,
} from '@/components/ui';

const severityTone = (severity: string) =>
  severity === 'CRITICAL' ? 'danger'
    : severity === 'HIGH' ? 'warning'
    : severity === 'MEDIUM' ? 'info'
    : 'success';

export default function SmartQueueAIOptimiser() {
  const { data: predictionsRes } = useQuery({
    queryKey: ['ai_queue_predictions'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care'}/api/operations/predictions`).then(res => res.json()),
    refetchInterval: 15000,
  });

  const { data: recommendationsRes } = useQuery({
    queryKey: ['ai_recommendations'],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care'}/api/operations/recommendations`).then(res => res.json()),
  });

  const predictions = predictionsRes?.data || [];
  const recommendations = recommendationsRes?.data || [];
  const predictionsLoading = !predictionsRes;

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
              <BrainCircuit className="h-5 w-5" aria-hidden />
            </span>
            AI Capacity Optimiser
          </span>
        }
        description="Continuously analyzing live Queue Engine, Appointments, and Scheduling data to predict bottlenecks and recommend capacity adjustments."
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Operations', href: '/admin/operations' }, { label: 'AI Optimiser' }]}
        actions={<Badge tone="brand" dot pulse>Forecast horizon: next 60 mins</Badge>}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left: Department Predictions */}
        <div className="space-y-4 xl:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Radar className="h-5 w-5 text-muted-foreground" aria-hidden />
            Predicted Queue Heatmap
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {predictionsLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : predictions.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  icon={Radar}
                  title="Gathering operational data"
                  description="The AI engine is collecting live queue telemetry. Predictions will appear within a minute."
                />
              </div>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              predictions.map((p: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Card className="relative h-full overflow-hidden">
                    <div
                      aria-hidden
                      className={cn(
                        'pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-xl',
                        p.severity === 'CRITICAL' ? 'bg-danger-soft' :
                        p.severity === 'HIGH' ? 'bg-warning-soft' :
                        p.severity === 'MEDIUM' ? 'bg-info-soft' : 'bg-success-soft'
                      )}
                    />
                    <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                      <div>
                        <CardTitle className="text-base">{p.department}</CardTitle>
                        <Badge tone={severityTone(p.severity)} dot className="mt-1.5">{p.severity}</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-subtle-foreground">AI Confidence</p>
                        <p className="text-sm font-bold tabular-nums text-primary">{p.confidence}%</p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            <Users className="h-3.5 w-3.5" aria-hidden /> Wait Vol.
                          </p>
                          <p className="text-2xl font-bold tabular-nums text-foreground">
                            {p.currentQueue} <span className="text-sm font-medium text-muted-foreground">now</span>
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-warning">
                            <TrendingUp className="h-3 w-3" aria-hidden /> {p.predictedNextHourVolume} next hr
                          </p>
                        </div>
                        <div>
                          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" aria-hidden /> Est Wait
                          </p>
                          <p className={cn(
                            'text-2xl font-bold tabular-nums',
                            p.predictedWaitTime > 45 ? 'text-danger' : 'text-foreground'
                          )}>
                            {p.predictedWaitTime} <span className="text-sm font-medium text-muted-foreground">mins</span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right: Action Center (Recommendations) */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Action Center</h2>

          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <EmptyState
                icon={BrainCircuit}
                title="No active recommendations"
                description="The AI optimiser will surface recommendations as patterns emerge."
              />
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              recommendations.map((rec: any, i: number) => (
                <motion.div
                  key={rec._id || i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <Badge tone={rec.severity === 'HIGH' || rec.severity === 'CRITICAL' ? 'danger' : 'warning'} dot>
                          {rec.severity} priority
                        </Badge>
                        <span className="text-xs text-subtle-foreground">{rec.department}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{rec.recommendationTitle}</h3>
                      <p className="mb-4 mt-1 text-xs text-muted-foreground">{rec.recommendationDetails}</p>
                      <Button size="sm" className="w-full" disabled title="Select a workflow first">
                        Approve Action <ArrowRight className="h-4 w-4" aria-hidden />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
