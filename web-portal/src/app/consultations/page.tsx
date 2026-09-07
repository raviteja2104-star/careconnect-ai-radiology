'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText, Pill, FlaskConical, Search, Plus, Activity, Heart,
  Thermometer, Save, Send, Mic,
} from 'lucide-react';
import {
  PageHeader, Badge, Button, Avatar, Card, CardContent,
  Tabs, TabsList, TabsTrigger, TabsContent, Input, Textarea, Label,
  EmptyState,
} from '@/components/ui';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Consultation {
  id: string; token: string; patientName: string; patientMrn: string;
  patientAge: number | null; patientGender: string; appointmentTime: string;
  type: string; status: 'In Progress' | 'Completed' | 'Pending Review';
  chiefComplaint: string; doctor: string; department: string;
  diagnosis?: string; encounterId?: string | null;
  soap?: { subjective?: string; objective?: string; assessment?: string; plan?: string; };
  vitals?: { bp: string | null; hr: number | null; temp: number | null; spo2: number | null; rr: number | null; };
}

function VitalsStrip({ vitals }: { vitals: NonNullable<Consultation['vitals']> }) {
  const items = [
    { label: 'BP', value: vitals.bp, unit: 'mmHg', icon: Heart, ok: true },
    { label: 'HR', value: vitals.hr, unit: 'bpm', icon: Activity, ok: vitals.hr ? vitals.hr >= 60 && vitals.hr <= 100 : true },
    { label: 'Temp', value: vitals.temp, unit: '°C', icon: Thermometer, ok: vitals.temp ? vitals.temp <= 37.5 : true },
    { label: 'SpO₂', value: vitals.spo2 ? `${vitals.spo2}%` : null, unit: '', icon: Activity, ok: vitals.spo2 ? vitals.spo2 >= 95 : true },
    { label: 'RR', value: vitals.rr, unit: '/min', icon: Activity, ok: vitals.rr ? vitals.rr >= 12 && vitals.rr <= 20 : true },
  ].filter(v => v.value !== null && v.value !== undefined);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(v => {
        const Icon = v.icon;
        return (
          <span key={v.label} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-sm ${v.ok ? 'border-success/30 bg-success-soft text-success' : 'border-danger/30 bg-danger-soft text-danger'}`}>
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
        <motion.div key={s.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
          <Label htmlFor={`soap-${s.key}`} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {s.label}
          </Label>
          <Textarea id={`soap-${s.key}`} defaultValue={soap?.[s.key] ?? ''} placeholder={s.placeholder} rows={5} className="resize-none bg-muted/30" />
        </motion.div>
      ))}
    </div>
  );
}

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Consultation | null>(null);
  const [activeTab, setActiveTab] = useState<'soap' | 'rx' | 'labs'>('soap');

  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
        const r = await fetch(`${API}/api/consultations/today`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (r.ok) {
          const data = await r.json();
          if (data.success && Array.isArray(data.data)) {
            setConsultations(data.data as Consultation[]);
            if (data.data.length > 0) setSelected(data.data[0] as Consultation);
          }
        }
      } catch {
        // API unreachable — show empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = consultations.filter(c =>
    !search || c.patientName.toLowerCase().includes(search.toLowerCase()) || c.chiefComplaint.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Consultations" description="SOAP documentation for today's encounters" crumbs={[{ label: 'Clinical', href: '/dashboard' }, { label: 'Consultations' }]} />
        <p className="text-sm text-muted-foreground">Loading today's consultations…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consultations"
        description="SOAP documentation for today's encounters"
        crumbs={[{ label: 'Clinical', href: '/dashboard' }, { label: 'Consultations' }]}
      />

      {consultations.length === 0 ? (
        <EmptyState icon={FileText} title="No consultations today" description="Today's appointment queue is empty. Appointments will appear here as patients check in." />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Encounter list rail */}
          <Card className="overflow-hidden self-start xl:col-span-1">
            <div className="border-b border-border p-4">
              <Input
                icon={<Search />}
                type="text"
                placeholder="Search patient..."
                aria-label="Search consultations"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-[560px] divide-y divide-border overflow-y-auto scrollbar-thin">
              {filtered.map(c => {
                const cs = STATUS_TONE[c.status];
                const isActive = selected?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`w-full px-4 py-4 text-left transition-colors ${isActive ? 'border-l-2 border-primary bg-primary/5' : 'border-l-2 border-transparent hover:bg-muted/50'}`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">{c.token}</span>
                      <span className="font-mono text-xs text-primary">{c.appointmentTime}</span>
                      <Badge tone={cs.tone} dot pulse={cs.pulse} className="ml-auto text-[10px]">{c.status}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{c.patientName}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.chiefComplaint || c.department}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Encounter workspace */}
          {selected && (() => {
            const sc = STATUS_TONE[selected.status];
            return (
              <div className="space-y-6 xl:col-span-2">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar name={selected.patientName} size="lg" />
                        <div>
                          <h2 className="text-lg font-bold leading-tight text-foreground">{selected.patientName}</h2>
                          <p className="text-sm text-muted-foreground">
                            {selected.patientAge ? `${selected.patientAge}y · ` : ''}{selected.patientGender ? `${selected.patientGender} · ` : ''}
                            <span className="font-mono">{selected.patientMrn}</span> · {selected.department}
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
                        <SOAPEditor soap={selected.soap ?? undefined} />
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
                            <Button size="sm"><Plus className="h-3.5 w-3.5" aria-hidden /> Add Medication</Button>
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-4 text-sm text-primary">
                          <Pill className="h-4 w-4 shrink-0" aria-hidden />
                          No medications prescribed yet for this encounter.
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
                            <Button size="sm"><Plus className="h-3.5 w-3.5" aria-hidden /> Order Labs</Button>
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
            );
          })()}
        </div>
      )}
    </div>
  );
}
