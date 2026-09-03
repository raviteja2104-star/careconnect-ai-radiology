'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, ShieldAlert, HeartPulse, Bed, Clock,
  DollarSign, Sparkles, AlertCircle,
  Server, Zap, RefreshCcw, ArrowRight,
} from 'lucide-react';
import { integrationHubService, CommandCenterData } from '@/services/integrationHubService';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, Button, Progress,
} from '@/components/ui';

export default function HospitalCommandCenterPage() {
  const [data, setData] = useState<CommandCenterData>(integrationHubService.getCommandCenterData());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setData(integrationHubService.getCommandCenterData());
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            Hospital Command Center
            <Badge tone="success" dot pulse className="font-mono text-[10px] uppercase">Live Stream</Badge>
          </span>
        }
        description="Real-Time Operational, Clinical, Financial & AI Nervous System"
        crumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Command Center' }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleRefresh} loading={isRefreshing}>
              <RefreshCcw className="h-4 w-4" aria-hidden /> Refresh Telemetry
            </Button>
            <Button size="sm" onClick={() => { window.location.href = '/admin/enterprise'; }}>
              <Server className="h-4 w-4" aria-hidden /> Integration Hub
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </>
        }
      />

      {/* Clinical critical alerts */}
      <section aria-label="Clinical critical alerts">
        <StatGrid className="xl:grid-cols-5">
          <StatCard
            label="Code Blue"
            value={data.clinicalAlerts.codeBlueCount}
            sub="Active Cardiac Arrests"
            icon={HeartPulse}
            tone="emerald"
            delay={0}
          />
          <StatCard
            label="Sepsis Bundle"
            value={data.clinicalAlerts.sepsisRiskAlerts}
            sub="1-Hour Protocol Timers"
            icon={AlertCircle}
            tone="amber"
            delay={0.05}
          />
          <StatCard
            label="Stroke Alerts"
            value={data.clinicalAlerts.strokeAlerts}
            sub="STAT CT Imaging Gate"
            icon={Zap}
            tone="violet"
            delay={0.1}
          />
          <StatCard
            label="High NEWS2"
            value={data.clinicalAlerts.highNews2Count}
            sub="Score ≥ 7 Deterioration"
            icon={ShieldAlert}
            tone="rose"
            delay={0.15}
          />
          <StatCard
            label="Critical Labs"
            value={data.clinicalAlerts.criticalLabValues}
            sub="STAT Panic Value Alerts"
            icon={Activity}
            tone="teal"
            delay={0.2}
          />
        </StatGrid>
      </section>

      {/* Capacity, TAT, financial */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Capacity gauges */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Bed className="h-4 w-4 text-primary" aria-hidden /> Facility Occupancy & Capacity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <Progress
                value={data.hospital.icuOccupancyPct}
                tone="warning"
                label={`ICU Occupancy (${data.hospital.ipdOccupiedBeds} Beds)`}
                showValue
              />
              <Progress
                value={data.hospital.otUtilisationPct}
                tone="brand"
                label="Operation Theatre (OT) Utilisation"
                showValue
              />
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-center">
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Available Ward Beds</span>
                  <span className="text-xl font-bold tabular-nums text-success">{data.operations.availableBeds}</span>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Avg OPD Wait Time</span>
                  <span className="text-xl font-bold tabular-nums text-info">{data.hospital.waitingPatientsAvgMins}m</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Turnaround & logistics */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-success" aria-hidden /> Turnaround & Logistics TAT
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <TatRow
                title="Laboratory Stat TAT"
                sub="Specimen to Result Delivery"
                value={`${data.operations.labTurnaroundAvgMins} mins`}
                valueClass="text-success"
              />
              <TatRow
                title="Radiology PACS TAT"
                sub="DICOM Scan to Report Signoff"
                value={`${data.operations.radiologyTurnaroundAvgMins} mins`}
                valueClass="text-primary"
              />
              <TatRow
                title="Pharmacy Stock Health"
                sub="Critical Medication Availability"
                value={`${data.operations.pharmacyStockHealthPct}%`}
                valueClass="text-info"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Financial stream */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-success" aria-hidden /> Real-Time Financial Stream
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-success/30 bg-success-soft p-4">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-success">Revenue Today</span>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground tabular-nums">
                  ₹{(data.financial.revenueTodayINR / 100000).toFixed(2)} Lakhs
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pending Insurance</span>
                  <span className="text-sm font-bold tabular-nums text-warning">
                    ₹{(data.financial.pendingInsuranceClaimsINR / 100000).toFixed(2)}L
                  </span>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-3">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Open Invoices</span>
                  <span className="text-sm font-bold tabular-nums text-info">
                    {data.financial.outstandingInvoicesCount} Active
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* AI gateway telemetry */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" aria-hidden /> AI Clinical Gateway & LLM Telemetry
              </CardTitle>
              <CardDescription className="mt-1">Copilot inference activity across the clinical estate.</CardDescription>
            </div>
            <Badge tone="brand" className="font-mono">Avg Latency: {data.aiGateway.avgLatencyMs}ms</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              <GatewayTile label="AI Consultations Today" value={data.aiGateway.aiConsultationsCount} valueClass="text-violet-600 dark:text-violet-400" />
              <GatewayTile label="Clinician Acceptance Rate" value={`${data.aiGateway.acceptedRecommendationsPct}%`} valueClass="text-success" />
              <GatewayTile label="Clinician Overrides" value={data.aiGateway.overrideCount} valueClass="text-warning" />
              <GatewayTile label="Rx Translation Dispatches" value={data.aiGateway.translationDispatches} valueClass="text-info" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Local pieces                                                        */
/* ------------------------------------------------------------------ */

function TatRow({ title, sub, value, valueClass }: { title: string; sub: string; value: string; valueClass: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-3">
      <div className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">{sub}</span>
      </div>
      <span className={`shrink-0 font-mono text-lg font-bold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

function GatewayTile({ label, value, valueClass }: { label: string; value: React.ReactNode; valueClass: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`mt-1 block text-xl font-bold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}
