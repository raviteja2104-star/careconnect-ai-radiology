'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Activity,
  Pill,
  FileText,
  Stethoscope,
  RefreshCw,
  Download,
  ShieldCheck,
  Clock,
  Calendar,
} from 'lucide-react';
import {
  PageHeader,
  StatCard,
  StatGrid,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  Timeline,
  TimelineItem,
} from '@/components/ui';

const MOCK_RECORDS = {
  patientId: "PAT-123",
  abdmLinked: true,
  lastSynced: "2026-08-04T10:30:00Z",
  conditions: [
    { id: "DIAG-001", name: "Essential (primary) hypertension", code: "I10", status: "Active", date: "2026-08-03", doctor: "Dr. Sunita Sharma" },
    { id: "DIAG-002", name: "Type 2 diabetes mellitus", code: "E11", status: "Active", date: "2025-11-15", doctor: "Dr. Anil Kumar" }
  ],
  medications: [
    { id: "RX-001", name: "Amlodipine 5mg Tablet", dosage: "1 tablet daily", status: "Active", prescribed: "2026-08-03" },
    { id: "RX-002", name: "Metformin 500mg", dosage: "1 tablet twice daily", status: "Active", prescribed: "2025-11-15" }
  ],
  visits: [
    { id: "ENC-999", type: "Telemedicine", date: "2026-08-03", doctor: "Dr. Sunita Sharma", department: "Cardiology", summary: "Routine blood pressure check." },
    { id: "ENC-888", type: "Outpatient", date: "2026-06-12", doctor: "Dr. Anil Kumar", department: "Endocrinology", summary: "HbA1c review and medication adjustment." }
  ]
};

export default function HealthRecordsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(MOCK_RECORDS, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-records-${MOCK_RECORDS.patientId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const encountersTimeline = (
    <Card>
      <CardHeader>
        <CardTitle>Clinical Encounters Timeline</CardTitle>
        <CardDescription>Consultations and visits pulled from your linked facilities.</CardDescription>
      </CardHeader>
      <CardContent>
        <Timeline>
          {MOCK_RECORDS.visits.map((visit) => (
            <TimelineItem
              key={visit.id}
              icon={Stethoscope}
              tone="brand"
              title={`${visit.department} Consultation`}
              meta={
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" aria-hidden />
                  {new Date(visit.date).toLocaleDateString()}
                </span>
              }
            >
              <div className="mt-1 rounded-2xl border border-border bg-muted/40 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{visit.type}</Badge>
                  <span className="text-sm font-medium text-foreground">{visit.doctor}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{visit.summary}</p>
                {MOCK_RECORDS.conditions.filter(c => c.date === visit.date).length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3">
                    {MOCK_RECORDS.conditions.filter(c => c.date === visit.date).map(c => (
                      <span key={c.id} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Activity className="h-4 w-4 text-danger" aria-hidden />
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Health Records"
        description="Manage and view your complete medical history."
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Health Records' }]}
        actions={
          <>
            <Badge tone="success" dot pulse className="px-3 py-1.5">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              ABDM Linked
            </Badge>
            <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-primary' : ''}`} aria-hidden />
              {isSyncing ? 'Syncing with NHA Gateway…' : 'Sync Records'}
            </Button>
            <Button variant="primary" onClick={handleExport}>
              <Download className="h-4 w-4" aria-hidden />
              Export FHIR
            </Button>
          </>
        }
      />

      <StatGrid>
        <StatCard label="Active Conditions" value={MOCK_RECORDS.conditions.length} icon={Activity} tone="rose" delay={0} sub={`Patient ${MOCK_RECORDS.patientId}`} />
        <StatCard label="Current Medications" value={MOCK_RECORDS.medications.length} icon={Pill} tone="amber" delay={0.05} sub="All active prescriptions" />
        <StatCard label="Past Visits" value={MOCK_RECORDS.visits.length} icon={Stethoscope} tone="brand" delay={0.1} sub="Across linked facilities" />
        <StatCard label="Lab Reports" value="0" icon={FileText} tone="emerald" delay={0.15} sub={`Last synced ${new Date(MOCK_RECORDS.lastSynced).toLocaleDateString()}`} />
      </StatGrid>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList aria-label="Health record sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="visits">Visits</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">{encountersTimeline}</TabsContent>
        <TabsContent value="visits">{encountersTimeline}</TabsContent>

        <TabsContent value="conditions">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {MOCK_RECORDS.conditions.map((condition, i) => (
              <motion.div
                key={condition.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card variant="interactive" className="h-full" onClick={() => router.push('/emr/patients/demo')}>
                  <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
                    <div>
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                            <Activity className="h-4 w-4" aria-hidden />
                          </span>
                          <Badge tone="outline" className="font-mono">ICD-10: {condition.code}</Badge>
                        </div>
                        <Badge tone="success" dot>{condition.status}</Badge>
                      </div>
                      <h3 className="text-lg font-bold leading-tight text-foreground">{condition.name}</h3>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" aria-hidden />
                        Recorded {new Date(condition.date).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Stethoscope className="h-3.5 w-3.5" aria-hidden />
                        {condition.doctor}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="medications">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {MOCK_RECORDS.medications.map((med, i) => (
              <motion.div
                key={med.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card variant="interactive" className="h-full" onClick={() => router.push('/medications')}>
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                          <Pill className="h-5 w-5" aria-hidden />
                        </span>
                        <div>
                          <h3 className="text-base font-bold leading-tight text-foreground">{med.name}</h3>
                          <p className="mt-0.5 text-sm text-muted-foreground">{med.dosage}</p>
                        </div>
                      </div>
                      <Badge tone="success" dot>{med.status}</Badge>
                    </div>
                    <div className="flex items-center gap-1.5 border-t border-border pt-3 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      Prescribed on {new Date(med.prescribed).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
