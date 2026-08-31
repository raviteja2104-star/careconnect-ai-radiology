'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Siren, Clock, Activity, AlertTriangle, Hourglass,
  Zap, Brain, Truck, CheckCircle, Radio, UserPlus, FileText,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription,
  CardContent, Tabs, TabsList, TabsTrigger, TabsContent, Badge, Button,
  DataTable, type Column, EmptyState, Timeline, TimelineItem,
} from '@/components/ui';

type TrackedPatient = {
  bed: string; patient: string; age: string; gender: string; esi: number;
  complaint: string; arrTime: string; status: string; md: string; rn: string; flags: string[];
};

const ESI_STYLES: Record<number, { chip: string; label: string }> = {
  1: { chip: 'bg-red-600 text-white dark:bg-red-600', label: 'Resuscitation' },
  2: { chip: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400', label: 'Emergent' },
  3: { chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', label: 'Urgent' },
  4: { chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400', label: 'Less Urgent' },
  5: { chip: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', label: 'Non-Urgent' },
};

function EsiChip({ esi }: { esi: number }) {
  const style = ESI_STYLES[esi] ?? { chip: 'bg-muted text-muted-foreground', label: 'Unassigned' };
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold shadow-soft ${style.chip}`}
      aria-label={`ESI ${esi} — ${style.label}`}
      title={style.label}
    >
      {esi}
    </span>
  );
}

const MODULE_TABS = ['dashboard', 'tracking board', 'triage', 'trauma', 'stroke', 'stemi', 'sepsis', 'observation'];

export default function EmergencyDepartment() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('tracking board');

  // Mock Data
  const stats = [
    { label: 'Patients Waiting', value: '14', icon: Clock, tone: 'amber' as const, sub: 'In waiting room now' },
    { label: 'Avg Wait Time', value: '28m', icon: Hourglass, tone: 'brand' as const, sub: 'Door to provider' },
    { label: 'Critical (ESI 1-2)', value: '3', icon: AlertTriangle, tone: 'rose' as const, sub: 'Active resuscitation / emergent' },
    { label: 'En Route', value: '2', icon: Truck, tone: 'violet' as const, sub: 'EMS inbound' },
  ];

  const trackingBoard: TrackedPatient[] = [
    { bed: 'Resus 1', patient: 'Unknown Male', age: '50s', gender: 'M', esi: 1, complaint: 'Cardiac Arrest', arrTime: '10:05', status: 'Code Blue', md: 'Dr. Sharma', rn: 'Nurse Joy', flags: ['STEMI'] },
    { bed: 'Trauma 2', patient: 'Rohit Verma', age: '34', gender: 'M', esi: 1, complaint: 'MVA, Head Trauma', arrTime: '10:15', status: 'Primary Survey', md: 'Dr. Anita', rn: 'Nurse Mark', flags: ['Trauma'] },
    { bed: 'Bed 4', patient: 'Sunita Rao', age: '65', gender: 'F', esi: 2, complaint: 'Left-side weakness', arrTime: '10:30', status: 'CT Pending', md: 'Dr. Khan', rn: 'Nurse Joy', flags: ['Stroke Alert'] },
    { bed: 'Bed 7', patient: 'Amit Singh', age: '45', gender: 'M', esi: 3, complaint: 'Severe Abdominal Pain', arrTime: '09:45', status: 'Labs Sent', md: 'Dr. Khan', rn: 'Nurse Mary', flags: [] },
    { bed: 'Wait 1', patient: 'Priya Patel', age: '28', gender: 'F', esi: 4, complaint: 'Ankle Sprain', arrTime: '09:10', status: 'Waiting MD', md: 'Unassigned', rn: 'Unassigned', flags: [] },
  ];

  const boardColumns: Column<TrackedPatient>[] = [
    {
      key: 'esi', header: 'ESI', sortable: true,
      accessor: (row) => row.esi,
      cell: (row) => <EsiChip esi={row.esi} />,
    },
    {
      key: 'bed', header: 'Bed', sortable: true,
      cell: (row) => <span className="text-sm font-bold text-foreground">{row.bed}</span>,
    },
    {
      key: 'patient', header: 'Patient', sortable: true,
      cell: (row) => (
        <div>
          <p className="text-sm font-semibold text-foreground">{row.patient}</p>
          <p className="text-xs text-muted-foreground">{row.age}y • {row.gender}</p>
        </div>
      ),
    },
    {
      key: 'complaint', header: 'Complaint',
      cell: (row) => (
        <div>
          <p className="text-sm font-medium text-foreground">{row.complaint}</p>
          {row.flags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {row.flags.map((flag) => (
                <Badge key={flag} tone="danger" pulse>
                  <Zap className="h-3 w-3" aria-hidden /> {flag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'arrTime', header: 'Arrival', sortable: true,
      cell: (row) => <span className="font-mono text-sm text-muted-foreground tabular-nums">{row.arrTime}</span>,
    },
    {
      key: 'md', header: 'MD / RN',
      accessor: (row) => `${row.md} ${row.rn}`,
      cell: (row) => (
        <div className="text-xs text-muted-foreground">
          <div className="font-medium text-foreground">{row.md}</div>
          <div>{row.rn}</div>
        </div>
      ),
    },
    {
      key: 'status', header: 'Status / Flow',
      cell: (row) =>
        row.status === 'Code Blue'
          ? <Badge tone="danger" pulse dot>{row.status}</Badge>
          : <Badge tone="neutral">{row.status}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2.5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-danger-soft text-danger">
              <Siren className="h-5 w-5" aria-hidden />
            </span>
            Emergency Department
          </span>
        }
        description="Level-1 Trauma Center Command Hub — live tracking, triage and code pathways."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Emergency' }]}
        actions={
          <Button variant="danger" className="animate-pulse" onClick={() => setActiveTab('stroke')}>
            <AlertTriangle className="h-4 w-4" aria-hidden /> Activate Protocol
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto max-w-full flex-wrap overflow-x-auto no-scrollbar">
          {MODULE_TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="capitalize">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="tracking board" className="mt-6 space-y-6">
          <StatGrid>
            {stats.map((stat, idx) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                sub={stat.sub}
                icon={stat.icon}
                tone={stat.tone}
                delay={idx * 0.05}
              />
            ))}
          </StatGrid>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Live ED Tracking Board
                  <span className="relative flex h-2.5 w-2.5" aria-label="Live" role="status">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-danger" />
                  </span>
                </CardTitle>
                <CardDescription>All active beds, sorted by acuity and arrival.</CardDescription>
              </div>
              <Button variant="secondary" size="sm" onClick={() => router.push('/patients')}>
                <UserPlus className="h-4 w-4" aria-hidden /> Quick Reg
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable<TrackedPatient>
                columns={boardColumns}
                data={trackingBoard}
                rowKey={(row) => row.bed}
                searchPlaceholder="Search patient, bed, complaint…"
                exportName="ed-tracking-board"
                emptyTitle="No active patients"
                emptyDescription="The board updates in real time as patients are registered."
                rowActions={() => (
                  <Button variant="outline" size="sm" onClick={() => router.push('/emr')}>
                    <FileText className="h-3.5 w-3.5" aria-hidden /> Chart
                  </Button>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triage" className="mt-6">
          <Card>
            <CardContent className="py-10">
              <EmptyState
                icon={Activity}
                title="Triage & Assessment"
                description="Comprehensive module for capturing Chief Complaint, Vitals, Pain Score, and AI-assisted Emergency Severity Index (ESI) assignment."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stroke" className="mt-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-4xl"
          >
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border pb-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-danger-soft text-danger">
                    <Brain className="h-6 w-6" aria-hidden />
                  </span>
                  <div>
                    <CardTitle>Stroke Code Pathway</CardTitle>
                    <CardDescription>Patient: Sunita Rao • Bed 4</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Door-to-CT Time</p>
                  <p className="font-mono text-3xl font-bold text-danger tabular-nums">14:22</p>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <Timeline>
                  <TimelineItem icon={CheckCircle} tone="success" title="Patient Arrival (Door)" meta="10:30">
                    Left-side weakness noted at triage.
                  </TimelineItem>
                  <TimelineItem icon={Clock} tone="brand" title="Non-Con CT Head" meta="Pending">
                    <p>Order placed. Patient en route to Radiology.</p>
                    <Button size="sm" className="mt-3" disabled title="Coming soon">Mark CT Complete</Button>
                  </TimelineItem>
                  <TimelineItem icon={Activity} tone="neutral" title="Thrombolysis Decision" meta="--:--">
                    Neurology Consult &amp; NIHSS Score required.
                  </TimelineItem>
                </Timeline>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {['dashboard', 'trauma', 'stemi', 'sepsis', 'observation'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <Card>
              <CardContent className="py-10">
                <EmptyState
                  icon={Radio}
                  title={`${tab.charAt(0).toUpperCase()}${tab.slice(1)} module`}
                  description="This pathway module is being provisioned for your facility. Check back soon."
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
