'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Scissors, Calendar, Clock, Activity, CheckCircle,
  AlertTriangle, ShieldCheck, HeartPulse, UserPlus, Settings,
} from 'lucide-react';
import {
  PageHeader, Button, Badge, StatCard, StatGrid,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Tabs, TabsList, TabsTrigger, TabsContent,
  DataTable, type Column, EmptyState, ProgressRing,
} from '@/components/ui';

type Procedure = {
  room: string; patient: string; procedure: string; surgeon: string;
  anesthesiologist: string; startTime: string; status: string; expectedEnd: string;
};

const TABS = ['dashboard', 'calendar', 'who safety checklist', 'anesthesia', 'intraoperative', 'pacu (recovery)', 'instruments'];

export default function OTDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

  // KPI Stats
  const stats = [
    { label: "Today's Surgeries", value: '14', icon: Scissors, tone: 'violet' as const },
    { label: 'Running Now', value: '4', icon: Activity, tone: 'emerald' as const },
    { label: 'Delayed', value: '1', icon: Clock, tone: 'amber' as const },
    { label: 'Available ORs', value: '3', icon: CheckCircle, tone: 'brand' as const },
  ];

  const runningProcedures: Procedure[] = [
    { room: 'OR-1 (Cardiac)', patient: 'Arun K. (M/55)', procedure: 'CABG x3', surgeon: 'Dr. R. Sharma', anesthesiologist: 'Dr. V. Patel', startTime: '08:00 AM', status: 'IntraOp (Bypass)', expectedEnd: '12:30 PM' },
    { room: 'OR-2 (Ortho)', patient: 'Smita J. (F/62)', procedure: 'TKR Right', surgeon: 'Dr. A. Gupta', anesthesiologist: 'Dr. M. Singh', startTime: '09:30 AM', status: 'IntraOp (Implanting)', expectedEnd: '11:30 AM' },
    { room: 'OR-3 (General)', patient: 'Vikas T. (M/34)', procedure: 'Laparoscopic Cholecystectomy', surgeon: 'Dr. P. Nair', anesthesiologist: 'Dr. S. Reddy', startTime: '10:00 AM', status: 'Closing', expectedEnd: '11:00 AM' },
    { room: 'OR-5 (Trauma)', patient: 'Unknown Male', procedure: 'Ex-Lap (Trauma)', surgeon: 'Dr. K. Desai', anesthesiologist: 'Dr. L. Fernandez', startTime: '10:15 AM', status: 'Critical / Bleeding', expectedEnd: 'Unknown' },
  ];

  const whoChecklist = [
    { phase: 'Sign In (Before Induction)', icon: UserPlus, iconClass: 'text-primary', items: ['Patient Identity Confirmed', 'Consent Verified', 'Site Marked', 'Anesthesia Safety Check', 'Allergies Known'], completed: true },
    { phase: 'Time Out (Before Incision)', icon: Clock, iconClass: 'text-warning', items: ['Team Introductions', 'Procedure Confirmation', 'Prophylactic Antibiotics <60m', 'Essential Imaging Displayed', 'Blood Available'], completed: false },
    { phase: 'Sign Out (Before Patient Leaves)', icon: CheckCircle, iconClass: 'text-success', items: ['Instrument/Sponge Count Correct', 'Specimens Labelled', 'Equipment Issues Addressed', 'Post-Op Recovery Plan'], completed: false },
  ];

  const boardColumns: Column<Procedure>[] = [
    {
      key: 'room', header: 'Room', sortable: true,
      cell: (p) => <span className="font-bold text-primary">{p.room}</span>,
    },
    {
      key: 'patient', header: 'Patient',
      cell: (p) => <span className="font-semibold text-foreground">{p.patient}</span>,
    },
    {
      key: 'procedure', header: 'Procedure',
      cell: (p) => <span className="font-medium text-foreground">{p.procedure}</span>,
    },
    {
      key: 'surgeon', header: 'Surgeon / Anesthetist',
      cell: (p) => (
        <div className="text-xs">
          <p className="font-semibold text-foreground">{p.surgeon}</p>
          <p className="text-muted-foreground">{p.anesthesiologist}</p>
        </div>
      ),
    },
    {
      key: 'startTime', header: 'Timing',
      cell: (p) => (
        <div className="text-xs text-muted-foreground">
          <p>Start: {p.startTime}</p>
          <p>Est. End: {p.expectedEnd}</p>
        </div>
      ),
    },
    {
      key: 'status', header: 'Status',
      cell: (p) => (
        <Badge
          tone={p.status.includes('Critical') ? 'danger' : p.status.includes('Closing') ? 'success' : 'info'}
          dot
          pulse={p.status.includes('Critical')}
        >
          {p.status.includes('Critical') && <AlertTriangle className="h-3 w-3" aria-hidden />}
          {p.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operation Theatre"
        description="Surgical Command Center & Perioperative Workflows"
        crumbs={[{ label: 'Clinical' }, { label: 'Operation Theatre' }]}
        actions={
          <Button onClick={() => setActiveTab('calendar')}>
            <Calendar className="h-4 w-4" aria-hidden /> Schedule Surgery
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto max-w-full flex-wrap justify-start overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="capitalize">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard" className="mt-6 space-y-6">
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

          <DataTable<Procedure>
            columns={boardColumns}
            data={runningProcedures}
            rowKey={(p) => p.room}
            searchPlaceholder="Search room, patient, procedure…"
            exportName="ot-live-board"
            emptyTitle="No procedures running"
            emptyDescription="Live surgeries in progress will appear on this board."
            toolbar={
              <Badge tone="success" dot pulse>Live OT Board</Badge>
            }
            rowActions={() => (
              <Button size="sm" variant="outline" onClick={() => router.push('/emr')}>Open Chart</Button>
            )}
          />
        </TabsContent>

        <TabsContent value="who safety checklist" className="mt-6">
          <div className="mx-auto max-w-4xl">
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ShieldCheck className="h-6 w-6 text-success" aria-hidden /> WHO Surgical Safety Checklist
                </CardTitle>
                <CardDescription>OR-2 • Patient: Smita J. • Procedure: TKR Right</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {whoChecklist.map((phase, idx) => {
                    const PhaseIcon = phase.icon;
                    return (
                      <motion.div
                        key={phase.phase}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: idx * 0.05 }}
                        className={`rounded-2xl border p-4 ${phase.completed ? 'border-success/30 bg-success-soft' : 'border-border bg-muted/40'}`}
                      >
                        <div className="mb-4 flex items-center gap-2 border-b border-border pb-2">
                          <PhaseIcon className={`h-5 w-5 ${phase.iconClass}`} aria-hidden />
                          <h3 className="text-sm font-bold text-foreground">{phase.phase}</h3>
                        </div>
                        <div className="space-y-3">
                          {phase.items.map((item) => (
                            <label key={item} className="flex cursor-pointer items-start gap-2">
                              <input
                                type="checkbox"
                                className="mt-0.5 rounded border-input bg-card text-primary focus:ring-primary"
                                defaultChecked={phase.completed}
                              />
                              <span className="text-sm text-foreground">{item}</span>
                            </label>
                          ))}
                        </div>
                        <Button
                          variant={phase.completed ? 'primary' : 'outline'}
                          className="mt-6 w-full"
                          size="sm"
                          disabled
                          title={phase.completed ? 'Already signed' : 'Coming soon'}
                        >
                          {phase.completed ? (
                            <>
                              <CheckCircle className="h-4 w-4" aria-hidden /> Signed & Verified
                            </>
                          ) : (
                            'Sign & Verify'
                          )}
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pacu (recovery)" className="mt-6 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center gap-3 rounded-2xl border border-info/30 bg-info-soft p-4"
          >
            <HeartPulse className="h-8 w-8 text-info" aria-hidden />
            <div>
              <h3 className="text-lg font-bold text-foreground">Post-Anesthesia Care Unit (PACU)</h3>
              <p className="text-sm text-muted-foreground">Monitoring recovery and Aldrete scores for safe transfer.</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* PACU Patient Card */}
            <Card>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">Anita M. (F/42)</CardTitle>
                  <CardDescription className="mt-1">Laparoscopic Appendectomy • Dr. P. Nair</CardDescription>
                </div>
                <Badge tone="warning">Phase 1 Recovery</Badge>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3">
                    <ProgressRing value={80} size={52} strokeWidth={5} tone="brand">
                      <span className="text-xs font-bold">8</span>
                    </ProgressRing>
                    <div>
                      <span className="text-xs font-bold uppercase text-subtle-foreground">Aldrete Score</span>
                      <p className="text-lg font-bold tabular-nums text-primary">8 <span className="text-sm font-normal text-muted-foreground">/ 10</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3">
                    <ProgressRing value={40} size={52} strokeWidth={5} tone="warning">
                      <span className="text-xs font-bold">4</span>
                    </ProgressRing>
                    <div>
                      <span className="text-xs font-bold uppercase text-subtle-foreground">Pain Score</span>
                      <p className="text-lg font-bold tabular-nums text-warning">4 <span className="text-sm font-normal text-muted-foreground">/ 10</span></p>
                    </div>
                  </div>
                </div>

                <div className="mb-4 space-y-2 text-sm text-muted-foreground">
                  <p className="flex justify-between"><span>Activity:</span> <span className="font-medium text-foreground">Moves 2 extremities (1)</span></p>
                  <p className="flex justify-between"><span>Respiration:</span> <span className="font-medium text-foreground">Dyspnea / Shallow (1)</span></p>
                  <p className="flex justify-between"><span>Circulation:</span> <span className="font-medium text-foreground">BP +/- 20% normal (2)</span></p>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" disabled title="Coming soon">Administer Analgesia</Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push('/adt')}>Transfer to Ward</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {['calendar', 'anesthesia', 'intraoperative', 'instruments'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <EmptyState
              icon={Settings}
              title={`${tab.charAt(0).toUpperCase() + tab.slice(1)} Module`}
              description={`The ${tab} workspace is being integrated with the perioperative platform.`}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
