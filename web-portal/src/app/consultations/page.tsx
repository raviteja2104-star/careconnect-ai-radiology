'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText, Pill, FlaskConical, Search, Plus, Activity, Heart,
  Thermometer, Save, Send, Mic,
} from 'lucide-react';
import {
  PageHeader, Badge, Button, Avatar, Card, CardContent,
  Tabs, TabsList, TabsTrigger, TabsContent, Input, Textarea, Label,
} from '@/components/ui';

interface Consultation {
  id: string; token: string; patientName: string; patientMrn: string;
  patientAge: number; patientGender: string; appointmentTime: string;
  type: string; status: 'In Progress' | 'Completed' | 'Pending Review';
  chiefComplaint: string; doctor: string; department: string;
  diagnosis?: string; soap?: { subjective?: string; objective?: string; assessment?: string; plan?: string; };
  vitals?: { bp: string; hr: number; temp: number; spo2: number; rr: number; };
}

const CONSULTATIONS: Consultation[] = [
  {
    id: 'c1', token: 'A-01', patientName: 'Rohit Sharma', patientMrn: 'MRN-2024-07241',
    patientAge: 32, patientGender: 'M', appointmentTime: '09:00', type: 'OPD',
    status: 'Completed', chiefComplaint: 'Chest pain, radiating to left arm, onset 2 hours ago',
    doctor: 'Dr. Priya Mehta', department: 'Cardiology',
    diagnosis: 'Unstable Angina — Rule out NSTEMI',
    vitals: { bp: '138/88', hr: 96, temp: 37.2, spo2: 97, rr: 18 },
    soap: {
      subjective: 'Patient presents with crushing chest pain (8/10) radiating to left arm, onset 2 hours ago. Associated diaphoresis and mild dyspnoea. No fever, nausea or vomiting.',
      objective: 'Alert and oriented. BP 138/88 mmHg, HR 96 bpm, SpO2 97%. ECG: mild ST depression in V4-V6. Troponin I pending.',
      assessment: 'Unstable Angina, possible NSTEMI. Risk factors: hypertension, smoker (15 pack-years).',
      plan: '1. STAT Troponin I and cardiac markers. 2. 12-lead ECG. 3. Aspirin 300mg loading. 4. Nitrates PRN. 5. Admit to Cardiology for monitoring. 6. Cardiology registrar review.',
    }
  },
  { id: 'c2', token: 'A-02', patientName: 'Priya Patel', patientMrn: 'MRN-2024-08912', patientAge: 45, patientGender: 'F', appointmentTime: '09:30', type: 'Follow-up', status: 'Completed', chiefComplaint: 'Post-angioplasty review — 1 week', doctor: 'Dr. Priya Mehta', department: 'Cardiology', diagnosis: 'Post-PCI — LAD stent', vitals: { bp: '118/74', hr: 72, temp: 36.8, spo2: 99, rr: 14 } },
  { id: 'c3', token: 'A-03', patientName: 'Anil Kumar', patientMrn: 'MRN-2024-06133', patientAge: 58, patientGender: 'M', appointmentTime: '10:00', type: 'Telemedicine', status: 'In Progress', chiefComplaint: 'Diabetes management — HbA1c review', doctor: 'Dr. Suresh Gupta', department: 'Endocrinology', vitals: { bp: '142/90', hr: 80, temp: 37.0, spo2: 98, rr: 16 } },
  { id: 'c4', token: 'A-04', patientName: 'Deepa Nair', patientMrn: 'MRN-2024-09456', patientAge: 29, patientGender: 'F', appointmentTime: '10:30', type: 'OPD', status: 'Pending Review', chiefComplaint: 'Persistent headaches for 3 weeks', doctor: 'Dr. Rao Srinivas', department: 'Neurology' },
];

function VitalsStrip({ vitals }: { vitals: NonNullable<Consultation['vitals']> }) {
  const items = [
    { label: 'BP', value: vitals.bp, unit: 'mmHg', icon: Heart, ok: true },
    { label: 'HR', value: vitals.hr, unit: 'bpm', icon: Activity, ok: vitals.hr >= 60 && vitals.hr <= 100 },
    { label: 'Temp', value: vitals.temp, unit: '°C', icon: Thermometer, ok: vitals.temp <= 37.5 },
    { label: 'SpO₂', value: `${vitals.spo2}%`, unit: '', icon: Activity, ok: vitals.spo2 >= 95 },
    { label: 'RR', value: vitals.rr, unit: '/min', icon: Activity, ok: vitals.rr >= 12 && vitals.rr <= 20 },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(v => {
        const Icon = v.icon;
        return (
          <span
            key={v.label}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-sm ${v.ok
              ? 'border-success/30 bg-success-soft text-success'
              : 'border-danger/30 bg-danger-soft text-danger'}`}
          >
            <Icon className="h-3 w-3" aria-hidden />
            <span className="font-semibold tabular-nums">{v.value}</span>
            {v.unit && <span className="text-xs opacity-70">{v.unit}</span>}
            <span className="ml-1 text-xs opacity-60">{v.label}</span>
          </span>
        );
      })}
    </div>
  );
}

const STATUS_TONE: Record<Consultation['status'], { tone: 'brand' | 'success' | 'warning'; pulse?: boolean }> = {
  'In Progress': { tone: 'brand', pulse: true },
  'Completed': { tone: 'success' },
  'Pending Review': { tone: 'warning' },
};

function SOAPEditor({ soap }: { soap?: Consultation['soap'] }) {
  const sections: { key: keyof NonNullable<Consultation['soap']>; label: string; placeholder: string }[] = [
    { key: 'subjective', label: 'S — Subjective', placeholder: "Patient's reported symptoms, history, and complaints..." },
    { key: 'objective', label: 'O — Objective', placeholder: 'Examination findings, vitals, and investigation results...' },
    { key: 'assessment', label: 'A — Assessment', placeholder: 'Diagnosis and clinical impression...' },
    { key: 'plan', label: 'P — Plan', placeholder: 'Treatment plan, investigations ordered, follow-up...' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {sections.map((s, i) => (
        <motion.div
          key={s.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <Label htmlFor={`soap-${s.key}`} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {s.label}
          </Label>
          <Textarea
            id={`soap-${s.key}`}
            defaultValue={soap?.[s.key] ?? ''}
            placeholder={s.placeholder}
            rows={5}
            className="resize-none bg-muted/30"
          />
        </motion.div>
      ))}
    </div>
  );
}

export default function ConsultationsPage() {
  const [selected, setSelected] = useState<Consultation>(CONSULTATIONS[0]);
  const [activeTab, setActiveTab] = useState<'soap' | 'rx' | 'labs'>('soap');

  const sc = STATUS_TONE[selected.status];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consultations"
        description="SOAP documentation for today's encounters"
        crumbs={[{ label: 'Clinical', href: '/dashboard' }, { label: 'Consultations' }]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ── Encounter list rail ── */}
        <Card className="overflow-hidden self-start xl:col-span-1">
          <div className="border-b border-border p-4">
            <Input icon={<Search />} type="text" placeholder="Search patient..." aria-label="Search consultations" />
          </div>
          <div className="max-h-[560px] divide-y divide-border overflow-y-auto scrollbar-thin">
            {CONSULTATIONS.map(c => {
              const cs = STATUS_TONE[c.status];
              const isActive = selected.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`w-full px-4 py-4 text-left transition-colors ${isActive
                    ? 'border-l-2 border-primary bg-primary/5'
                    : 'border-l-2 border-transparent hover:bg-muted/50'}`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">{c.token}</span>
                    <span className="font-mono text-xs text-primary">{c.appointmentTime}</span>
                    <Badge tone={cs.tone} dot pulse={cs.pulse} className="ml-auto text-[10px]">{c.status}</Badge>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{c.patientName}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.chiefComplaint}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* ── Encounter workspace ── */}
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar name={selected.patientName} size="lg" />
                  <div>
                    <h2 className="text-lg font-bold leading-tight text-foreground">{selected.patientName}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selected.patientAge}y · {selected.patientGender} · <span className="font-mono">{selected.patientMrn}</span> · {selected.department}
                    </p>
                    {selected.diagnosis && <p className="mt-0.5 text-sm font-medium text-primary">{selected.diagnosis}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={sc.tone} dot pulse={sc.pulse}>{selected.status}</Badge>
                  <Link href="/emr">
                    <Button size="sm">
                      <FileText className="h-3.5 w-3.5" aria-hidden /> Open Full EMR
                    </Button>
                  </Link>
                </div>
              </div>

              {selected.vitals && (
                <div className="mt-4 border-t border-border pt-4">
                  <VitalsStrip vitals={selected.vitals} />
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'soap' | 'rx' | 'labs')}>
            <TabsList>
              <TabsTrigger value="soap"><FileText className="h-4 w-4" aria-hidden /> SOAP Notes</TabsTrigger>
              <TabsTrigger value="rx"><Pill className="h-4 w-4" aria-hidden /> Prescriptions</TabsTrigger>
              <TabsTrigger value="labs"><FlaskConical className="h-4 w-4" aria-hidden /> Lab Orders</TabsTrigger>
            </TabsList>

            <TabsContent value="soap">
              <Card>
                <CardContent className="space-y-5 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-bold text-foreground">SOAP Note</h3>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" disabled title="Coming soon">
                        <Mic className="h-3.5 w-3.5" aria-hidden /> Dictate
                      </Button>
                      <Button variant="outline" size="sm" className="text-primary" disabled title="Coming soon">
                        <Activity className="h-3.5 w-3.5" aria-hidden /> AI Assist
                      </Button>
                    </div>
                  </div>
                  <SOAPEditor soap={selected.soap} />
                  <div className="flex gap-3 border-t border-border pt-4">
                    <Button variant="secondary" disabled title="Coming soon">
                      <Save className="h-4 w-4" aria-hidden /> Save Draft
                    </Button>
                    <Button disabled title="Coming soon">
                      <Send className="h-4 w-4" aria-hidden /> Sign &amp; Complete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rx">
              <Card>
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground">Prescriptions</h3>
                    <Link href="/prescriptions">
                      <Button size="sm">
                        <Plus className="h-3.5 w-3.5" aria-hidden /> Add Medication
                      </Button>
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-4 text-sm text-primary">
                    <Pill className="h-4 w-4 shrink-0" aria-hidden />
                    No medications prescribed yet. Use the button above to add.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="labs">
              <Card>
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground">Lab Orders</h3>
                    <Link href="/lab-orders">
                      <Button size="sm">
                        <Plus className="h-3.5 w-3.5" aria-hidden /> Order Labs
                      </Button>
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-info-soft p-4 text-sm text-info">
                    <FlaskConical className="h-4 w-4 shrink-0" aria-hidden />
                    No lab orders linked to this consultation.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
