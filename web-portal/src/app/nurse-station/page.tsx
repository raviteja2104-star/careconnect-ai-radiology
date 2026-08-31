'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users, Clock, AlertTriangle, Activity, Pill,
  Droplet, ClipboardList, ScanBarcode, HeartPulse,
  Sparkles, ArrowUpRight,
} from 'lucide-react';
import {
  PageHeader, Button, Badge, StatCard, StatGrid,
  Card, CardHeader, CardTitle, CardContent,
  Tabs, TabsList, TabsTrigger, TabsContent,
  DataTable, type Column, EmptyState, ProgressRing,
} from '@/components/ui';

type Patient = {
  bed: string; name: string; age: number; gender: string; diagnosis: string;
  status: string; risk: string; ews: number; nextMed: string; nextVital: string; ivRunning: boolean;
};

type EmarTask = {
  patient: string; bed: string; drug: string; dose: string; route: string; time: string; status: string;
};

const TAB_LABELS: Record<string, string> = {
  'dashboard': 'Dashboard',
  'patient list': 'Patient List',
  'eMAR': 'eMAR (Meds)',
  'vitals & IO': 'Vitals & IO',
  'tasks': 'Tasks',
  'handover': 'Handover',
};

export default function NurseStation() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [copilotAcknowledged, setCopilotAcknowledged] = useState(false);

  // Mock Data
  const stats = [
    { label: 'Assigned Patients', value: '8', icon: Users, tone: 'brand' as const },
    { label: 'Critical / High Risk', value: '2', icon: AlertTriangle, tone: 'rose' as const },
    { label: 'Meds Due (Next 2h)', value: '14', icon: Pill, tone: 'violet' as const },
    { label: 'Vitals Due', value: '6', icon: Activity, tone: 'amber' as const },
  ];

  const patients: Patient[] = [
    { bed: 'W4-B12', name: 'Rohit Sharma', age: 32, gender: 'M', diagnosis: 'Acute Appendicitis', status: 'Post-Op', risk: 'Medium', ews: 3, nextMed: '14:00', nextVital: '15:00', ivRunning: true },
    { bed: 'W4-B14', name: 'Sunita Rao', age: 65, gender: 'F', diagnosis: 'COPD Exacerbation', status: 'Oxygen Therapy', risk: 'High', ews: 6, nextMed: '13:30 (Overdue)', nextVital: '14:00', ivRunning: true },
    { bed: 'W4-B15', name: 'Amit Singh', age: 45, gender: 'M', diagnosis: 'Dengue Fever', status: 'Stable', risk: 'Low', ews: 1, nextMed: '18:00', nextVital: '18:00', ivRunning: false },
    { bed: 'W4-B18', name: 'Priya Patel', age: 28, gender: 'F', diagnosis: 'Gastroenteritis', status: 'Observation', risk: 'Low', ews: 0, nextMed: '16:00', nextVital: '16:00', ivRunning: true },
  ];

  const emarTasks: EmarTask[] = [
    { patient: 'Sunita Rao', bed: 'W4-B14', drug: 'Salbutamol Nebulizer', dose: '2.5mg', route: 'Inhalation', time: '13:30', status: 'Overdue' },
    { patient: 'Rohit Sharma', bed: 'W4-B12', drug: 'Ceftriaxone', dose: '1g', route: 'IV', time: '14:00', status: 'Due' },
    { patient: 'Rohit Sharma', bed: 'W4-B12', drug: 'Paracetamol', dose: '1g', route: 'IV', time: '14:00', status: 'Due' },
  ];

  const patientColumns: Column<Patient>[] = [
    {
      key: 'bed', header: 'Bed', sortable: true,
      cell: (p) => <span className="font-bold text-foreground">{p.bed}</span>,
    },
    {
      key: 'name', header: 'Patient', sortable: true,
      cell: (p) => (
        <div>
          <p className="font-semibold text-foreground">{p.name}</p>
          <p className="text-xs text-muted-foreground">{p.age}y • {p.gender}</p>
        </div>
      ),
    },
    {
      key: 'diagnosis', header: 'Diagnosis & Status',
      cell: (p) => (
        <div>
          <p className="font-medium text-foreground">{p.diagnosis}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{p.status}</p>
        </div>
      ),
    },
    {
      key: 'ews', header: 'NEWS2', sortable: true, accessor: (p) => p.ews, align: 'center',
      cell: (p) => (
        <Badge tone={p.ews >= 5 ? 'danger' : p.ews >= 3 ? 'warning' : 'success'} dot pulse={p.ews >= 5}>
          {p.ews}
        </Badge>
      ),
    },
    {
      key: 'ivRunning', header: 'Infusions', accessor: (p) => (p.ivRunning ? 'Running' : '-'),
      cell: (p) => p.ivRunning ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-info">
          <Droplet className="h-4 w-4" aria-hidden /> Running
        </span>
      ) : (
        <span className="text-xs text-subtle-foreground">—</span>
      ),
    },
    {
      key: 'nextMed', header: 'Next Task',
      cell: (p) => (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Pill className="h-3 w-3" aria-hidden /> {p.nextMed}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Activity className="h-3 w-3" aria-hidden /> {p.nextVital}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nurse Station"
        description="Ward 4 (General Medical) • Shift: 08:00 - 16:00 • Nurse: Sarah K."
        crumbs={[{ label: 'Clinical' }, { label: 'Nurse Station' }]}
        actions={
          <Button disabled title="Coming soon">
            <ScanBarcode className="h-4 w-4" aria-hidden /> Scan Patient / Med
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto max-w-full flex-wrap justify-start overflow-x-auto no-scrollbar">
          {Object.keys(TAB_LABELS).map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {TAB_LABELS[tab]}
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

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Early Warning Scores (EWS) Alerts */}
            <div className="space-y-6 xl:col-span-1">
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-danger" aria-hidden /> NEWS2 Alerts
                  </CardTitle>
                  <Badge tone="danger" dot pulse>1 Critical</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="rounded-2xl border border-danger/30 bg-danger-soft p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <ProgressRing value={88} size={56} strokeWidth={5} tone="danger">
                          <span className="text-xs font-bold">88%</span>
                        </ProgressRing>
                        <div>
                          <p className="text-sm font-bold text-foreground">W4-B14 • Sunita Rao</p>
                          <p className="text-xs font-semibold text-danger">NEWS2 Score: 6</p>
                          <p className="mt-1 text-xs text-muted-foreground">SpO2 dropped to 88% on room air. RR 24.</p>
                        </div>
                      </div>
                      <Button variant="danger" size="sm" onClick={() => router.push('/messages')}>Escalate</Button>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05 }}
                    className="rounded-2xl border border-warning/30 bg-warning-soft p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-foreground">W4-B12 • Rohit Sharma</p>
                        <p className="text-xs font-semibold text-warning">NEWS2 Score: 3</p>
                        <p className="mt-1 text-xs text-muted-foreground">Temp 38.2°C, HR 102.</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => router.push('/emr')}>Review</Button>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>

              {/* AI Assistant */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="gradient-brand relative overflow-hidden rounded-3xl p-6 text-primary-foreground shadow-float"
              >
                <div className="absolute right-0 top-0 h-40 w-40 -translate-y-10 translate-x-10 rounded-full bg-white/10 blur-3xl" aria-hidden />
                <div className="relative z-10">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="rounded-lg bg-white/20 p-1.5 backdrop-blur-sm">
                      <Sparkles className="h-4 w-4" aria-hidden />
                    </span>
                    <h3 className="text-sm font-bold tracking-wide">AI Nursing Copilot</h3>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed opacity-90">
                    <strong>Reminder:</strong> Blood cultures for W4-B12 (Rohit) need to be drawn before starting IV Ceftriaxone at 14:00.
                  </p>
                  <Button
                    variant="glass"
                    size="sm"
                    className="w-full"
                    disabled={copilotAcknowledged}
                    onClick={() => setCopilotAcknowledged(true)}
                  >
                    {copilotAcknowledged ? 'Acknowledged' : 'Acknowledge'}
                  </Button>
                </div>
              </motion.div>
            </div>

            {/* Pending Meds (eMAR Preview) */}
            <Card className="xl:col-span-2 self-start">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-muted-foreground" aria-hidden /> Pending eMAR (Next 2 Hours)
                </CardTitle>
                <Button variant="link" size="sm" onClick={() => setActiveTab('eMAR')}>
                  View Full eMAR <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {emarTasks.map((task, i) => (
                    <motion.li
                      key={`${task.bed}-${task.drug}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
                    >
                      <div className="w-32 min-w-0">
                        <p className="text-sm font-bold text-foreground">{task.bed}</p>
                        <p className="text-xs text-muted-foreground">{task.patient}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{task.drug}</p>
                        <p className="text-xs text-muted-foreground">{task.dose} • {task.route}</p>
                      </div>
                      <Badge tone={task.status === 'Overdue' ? 'danger' : 'warning'}>
                        <Clock className="h-3 w-3" aria-hidden /> {task.time} ({task.status})
                      </Badge>
                      <Button size="sm" variant="secondary" disabled title="Coming soon">
                        <ScanBarcode className="h-3.5 w-3.5" aria-hidden /> Scan
                      </Button>
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patient list" className="mt-6">
          <DataTable<Patient>
            columns={patientColumns}
            data={patients}
            rowKey={(p) => p.bed}
            searchPlaceholder="Search by name or bed..."
            exportName="ward4-patients"
            emptyTitle="No patients assigned"
            emptyDescription="Patients assigned to this ward will appear here."
            toolbar={
              <div className="flex items-center gap-2">
                <Badge tone="brand">My Patients (8)</Badge>
                <Badge tone="outline">Critical (2)</Badge>
                <Badge tone="outline">All Ward 4</Badge>
              </div>
            }
            rowActions={() => (
              <Button size="sm" variant="secondary" onClick={() => router.push('/emr')}>Open Chart</Button>
            )}
          />
        </TabsContent>

        <TabsContent value="eMAR" className="mt-6">
          <EmptyState
            icon={Pill}
            title="eMAR workspace coming soon"
            description="The full electronic medication administration record is being prepared. Use the dashboard preview for now."
            action={{ label: 'Back to Dashboard', onClick: () => setActiveTab('dashboard') }}
          />
        </TabsContent>
        <TabsContent value="vitals & IO" className="mt-6">
          <EmptyState
            icon={Activity}
            title="Vitals & IO charting coming soon"
            description="Bedside vitals capture and intake/output charting will live here."
            action={{ label: 'Back to Dashboard', onClick: () => setActiveTab('dashboard') }}
          />
        </TabsContent>
        <TabsContent value="tasks" className="mt-6">
          <EmptyState
            icon={ClipboardList}
            title="No tasks to show"
            description="Nursing tasks assigned to this shift will appear here."
            action={{ label: 'Back to Dashboard', onClick: () => setActiveTab('dashboard') }}
          />
        </TabsContent>
        <TabsContent value="handover" className="mt-6">
          <EmptyState
            icon={Users}
            title="Shift handover coming soon"
            description="Structured SBAR handover notes for the next shift will live here."
            action={{ label: 'Back to Dashboard', onClick: () => setActiveTab('dashboard') }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
