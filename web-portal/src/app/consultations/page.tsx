'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText, Pill, FlaskConical, Search, Plus, Activity, Heart,
  Thermometer, Save, Send, Mic, MicOff, Loader2, AlertTriangle,
} from 'lucide-react';
import {
  PageHeader, Badge, Button, Avatar, Card, CardContent,
  Tabs, TabsList, TabsTrigger, TabsContent, Input, Textarea, Label,
  EmptyState, Dialog,
} from '@/components/ui';

interface SRResult {
  readonly [index: number]: { readonly transcript: string };
}
interface SRResultList {
  readonly length: number;
  readonly [index: number]: SRResult;
}
interface SREvent extends Event {
  readonly resultIndex: number;
  readonly results: SRResultList;
}
interface SRInstance {
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SREvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: { new(): SRInstance } | undefined;
    webkitSpeechRecognition: { new(): SRInstance } | undefined;
  }
}

const AI_TEMPLATES: Array<{ label: string; fields: Partial<SoapFields> }> = [
  {
    label: 'Hypertension follow-up',
    fields: {
      subjective: 'Patient presents for hypertension review. Reports good adherence to medications. No chest pain, dyspnoea or headache.',
      objective: 'BP: /  mmHg, HR:  bpm. Cardiovascular examination normal. No peripheral oedema.',
      assessment: 'Essential hypertension, controlled.',
      plan: 'Continue current antihypertensive regimen. Home BP monitoring encouraged. Review in 4–6 weeks.',
    },
  },
  {
    label: 'Upper respiratory infection',
    fields: {
      subjective: 'Patient presents with sore throat, nasal congestion and low-grade fever for  days. No dyspnoea or chest pain.',
      objective: 'Temp: °C. Throat erythema noted. No tonsil exudate. Lungs clear. No cervical lymphadenopathy.',
      assessment: 'Acute upper respiratory tract infection, likely viral.',
      plan: 'Symptomatic management: paracetamol, saline nasal rinse, adequate hydration. Advised to return if symptoms worsen.',
    },
  },
  {
    label: 'Musculoskeletal pain',
    fields: {
      subjective: 'Patient presents with pain in the  region for  days. Aggravated by movement, relieved partially by rest.',
      objective: 'Tenderness on palpation. Range of motion reduced. No neurovascular deficit.',
      assessment: 'Musculoskeletal pain, likely mechanical.',
      plan: 'Analgesics and NSAIDs as required. Physiotherapy referral considered. Review if no improvement in 2 weeks.',
    },
  },
];

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token
    ? { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

interface Consultation {
  id: string; token: string; patientName: string; patientMrn: string;
  patientAge: number | null; patientGender: string; appointmentTime: string;
  type: string; status: 'In Progress' | 'Completed' | 'Pending Review';
  chiefComplaint: string; doctor: string; department: string;
  diagnosis?: string; encounterId?: string | null;
  soap?: { subjective?: string; objective?: string; assessment?: string; plan?: string; };
  vitals?: { bp: string | null; hr: number | null; temp: number | null; spo2: number | null; rr: number | null; };
}

interface SoapFields {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface DrugLine { name: string; dose?: string; quantity?: number; durationDays?: number; }
interface MedOrder {
  _id: string; orderCode?: string; status: string; createdAt: string;
  details: { drugs: DrugLine[] };
  orderingDoctorId?: { firstName?: string; lastName?: string } | null;
}
interface SafetyFlag { drug?: string; type?: string; severity: 'info' | 'warning' | 'critical'; message: string; }
interface LabTest { name: string; code?: string; }
interface LabOrder {
  _id: string; orderCode?: string; status: string; priority?: string; createdAt: string;
  details: { tests: LabTest[] };
  orderingDoctorId?: { firstName?: string; lastName?: string } | null;
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

interface SOAPEditorProps {
  soap: SoapFields;
  onChange: (field: keyof SoapFields, value: string) => void;
}

function SOAPEditor({ soap, onChange }: SOAPEditorProps) {
  const sections: { key: keyof SoapFields; label: string; placeholder: string }[] = [
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
          <Textarea
            id={`soap-${s.key}`}
            value={soap[s.key]}
            onChange={e => onChange(s.key, e.target.value)}
            placeholder={s.placeholder}
            rows={5}
            className="resize-none bg-muted/30"
          />
        </motion.div>
      ))}
    </div>
  );
}

function emptySoap(soap?: Consultation['soap']): SoapFields {
  return {
    subjective: soap?.subjective ?? '',
    objective: soap?.objective ?? '',
    assessment: soap?.assessment ?? '',
    plan: soap?.plan ?? '',
  };
}

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Consultation | null>(null);
  const [activeTab, setActiveTab] = useState<'soap' | 'rx' | 'labs'>('soap');

  // Controlled SOAP fields
  const [soap, setSoap] = useState<SoapFields>({ subjective: '', objective: '', assessment: '', plan: '' });

  // Action states
  const [isSaving, setIsSaving] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Rx tab state
  const [medOrders, setMedOrders] = useState<MedOrder[]>([]);
  const [medLoading, setMedLoading] = useState(false);
  const [medError, setMedError] = useState('');
  const [addMedOpen, setAddMedOpen] = useState(false);
  const [drugDraft, setDrugDraft] = useState({ name: '', dose: '', quantity: '', durationDays: '' });
  const [medSubmitting, setMedSubmitting] = useState(false);
  const [safetyFlags, setSafetyFlags] = useState<SafetyFlag[]>([]);
  const [pendingAck, setPendingAck] = useState(false);

  // Labs tab state
  const [labOrders, setLabOrders] = useState<LabOrder[]>([]);
  const [labLoading, setLabLoading] = useState(false);
  const [labError, setLabError] = useState('');
  const [addLabOpen, setAddLabOpen] = useState(false);
  const [labDraft, setLabDraft] = useState({ testName: '', priority: 'routine' });
  const [labSubmitting, setLabSubmitting] = useState(false);
  const [labSubmitError, setLabSubmitError] = useState('');

  // Dictate + AI Assist
  const [dictating, setDictating] = useState(false);
  const recognitionRef = useRef<SRInstance | null>(null);
  const [aiAssistOpen, setAiAssistOpen] = useState(false);

  const fetchMedOrders = React.useCallback(async (encounterId: string) => {
    setMedLoading(true);
    setMedError('');
    try {
      const r = await fetch(`${API}/api/emr/orders?encounterId=${encounterId}&category=medication`, { headers: authHeaders() });
      if (r.ok) {
        const data = await r.json();
        setMedOrders(Array.isArray(data) ? data : []);
      } else {
        setMedError('Failed to load medications.');
      }
    } catch {
      setMedError('Network error loading medications.');
    } finally {
      setMedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'rx' && selected?.encounterId) {
      fetchMedOrders(selected.encounterId);
    } else if (activeTab === 'rx') {
      setMedOrders([]);
    }
  }, [activeTab, selected?.encounterId, fetchMedOrders]);

  const fetchLabOrders = React.useCallback(async (encounterId: string) => {
    setLabLoading(true);
    setLabError('');
    try {
      const r = await fetch(`${API}/api/emr/orders?encounterId=${encounterId}&category=lab`, { headers: authHeaders() });
      if (r.ok) {
        const data = await r.json();
        setLabOrders(Array.isArray(data) ? data : []);
      } else {
        setLabError('Failed to load lab orders.');
      }
    } catch {
      setLabError('Network error loading lab orders.');
    } finally {
      setLabLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'labs' && selected?.encounterId) {
      fetchLabOrders(selected.encounterId);
    } else if (activeTab === 'labs') {
      setLabOrders([]);
    }
  }, [activeTab, selected?.encounterId, fetchLabOrders]);

  async function handleOrderLab() {
    if (!labDraft.testName.trim() || !selected?.encounterId) return;
    setLabSubmitting(true);
    setLabSubmitError('');
    try {
      const r = await fetch(`${API}/api/emr/encounters/${selected.encounterId}/orders`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          category: 'lab',
          priority: labDraft.priority,
          details: { tests: [{ name: labDraft.testName.trim() }] },
        }),
      });
      const data = await r.json();
      if (r.ok) {
        setAddLabOpen(false);
        setLabDraft({ testName: '', priority: 'routine' });
        await fetchLabOrders(selected.encounterId);
      } else {
        setLabSubmitError(data.message || 'Failed to place lab order.');
      }
    } catch {
      setLabSubmitError('Network error.');
    } finally {
      setLabSubmitting(false);
    }
  }

  async function handleAddMed(acknowledge = false) {
    if (!drugDraft.name.trim() || !selected?.encounterId) return;
    setMedSubmitting(true);
    if (!acknowledge) setSafetyFlags([]);
    try {
      const drug: DrugLine & Record<string, unknown> = { name: drugDraft.name.trim() };
      if (drugDraft.dose) drug.dose = drugDraft.dose;
      if (drugDraft.quantity) drug.quantity = Number(drugDraft.quantity);
      if (drugDraft.durationDays) drug.durationDays = Number(drugDraft.durationDays);
      const body: Record<string, unknown> = { category: 'medication', details: { drugs: [drug] } };
      if (acknowledge) body.acknowledgeCritical = true;
      const r = await fetch(`${API}/api/emr/encounters/${selected.encounterId}/orders`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
      });
      const data = await r.json();
      if (r.status === 422 && data.flags) {
        setSafetyFlags(data.flags as SafetyFlag[]);
        setPendingAck(true);
      } else if (r.ok) {
        setAddMedOpen(false);
        setDrugDraft({ name: '', dose: '', quantity: '', durationDays: '' });
        setSafetyFlags([]);
        setPendingAck(false);
        await fetchMedOrders(selected.encounterId);
      } else {
        setSafetyFlags([{ severity: 'critical', message: data.message || 'Failed to add medication.' }]);
      }
    } catch {
      setSafetyFlags([{ severity: 'critical', message: 'Network error.' }]);
    } finally {
      setMedSubmitting(false);
    }
  }

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
            if (data.data.length > 0) {
              const first = data.data[0] as Consultation;
              setSelected(first);
              setSoap(emptySoap(first.soap ?? undefined));
            }
          }
        }
      } catch {
        // API unreachable — show empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function selectConsultation(c: Consultation) {
    setSelected(c);
    setSoap(emptySoap(c.soap ?? undefined));
    setSaveMessage(null);
    setMedOrders([]);
    setMedError('');
    setLabOrders([]);
    setLabError('');
  }

  function handleSoapChange(field: keyof SoapFields, value: string) {
    setSoap(prev => ({ ...prev, [field]: value }));
  }

  function handleDictate() {
    if (dictating) {
      recognitionRef.current?.stop();
      setDictating(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event: SREvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setSoap(prev => ({ ...prev, subjective: (prev.subjective + ' ' + transcript.trim()).trimStart() }));
    };
    recognition.onend = () => setDictating(false);
    recognitionRef.current = recognition;
    recognition.start();
    setDictating(true);
  }

  async function handleSaveDraft() {
    if (!selected) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const encId = selected.encounterId ?? selected.id;
      const r = await fetch(`${API}/api/consultations/${encId}/soap`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ soap }),
      });
      const data = await r.json();
      if (r.ok && data.success) {
        setSaveMessage('Draft saved.');
        // If a new encounter was created (no prior encounterId), capture its ID
        const newEncounterId = data.data?._id?.toString?.();
        if (newEncounterId && !selected.encounterId) {
          const updated = { ...selected, encounterId: newEncounterId };
          setSelected(updated);
          setConsultations(prev => prev.map(c => c.id === selected.id ? updated : c));
        }
      } else {
        setSaveMessage(data.message || 'Save failed.');
      }
    } catch {
      setSaveMessage('Network error — draft not saved.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSign() {
    if (!selected) return;
    setIsSigning(true);
    setSaveMessage(null);
    try {
      const encId = selected.encounterId ?? selected.id;
      const r = await fetch(`${API}/api/consultations/${encId}/sign`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ soap }),
      });
      const data = await r.json();
      if (r.ok && data.success) {
        // Mutate consultation status to Completed in local state
        setConsultations(prev =>
          prev.map(c => c.id === selected.id ? { ...c, status: 'Completed' } : c)
        );
        setSelected(prev => prev ? { ...prev, status: 'Completed' } : prev);
        setSaveMessage('Note signed and encounter completed.');
      } else {
        setSaveMessage(data.message || 'Sign failed.');
      }
    } catch {
      setSaveMessage('Network error — note not signed.');
    } finally {
      setIsSigning(false);
    }
  }

  const isInFlight = isSaving || isSigning;

  const filtered = consultations.filter(c =>
    !search || c.patientName.toLowerCase().includes(search.toLowerCase()) || c.chiefComplaint.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Consultations" description="SOAP documentation for today's encounters" crumbs={[{ label: 'Clinical', href: '/dashboard' }, { label: 'Consultations' }]} />
        <p className="text-sm text-muted-foreground">Loading today&apos;s consultations…</p>
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
                    onClick={() => selectConsultation(c)}
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
                        <Link href={selected.encounterId ? `/emr/encounter/${selected.encounterId}` : '#'}>
                          <Button size="sm" disabled={!selected.encounterId} title={!selected.encounterId ? 'Save a draft first to open the full EMR workspace' : undefined}>
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
                            <Button variant={dictating ? 'danger' : 'secondary'} size="sm" onClick={handleDictate}>
                              {dictating ? <MicOff className="h-3.5 w-3.5" aria-hidden /> : <Mic className="h-3.5 w-3.5" aria-hidden />}
                              {dictating ? 'Stop' : 'Dictate'}
                            </Button>
                            <Button variant="outline" size="sm" className="text-primary" onClick={() => setAiAssistOpen(true)}>
                              <Activity className="h-3.5 w-3.5" aria-hidden /> AI Assist
                            </Button>
                          </div>
                        </div>
                        <SOAPEditor soap={soap} onChange={handleSoapChange} />
                        {saveMessage && (
                          <p className="text-sm text-muted-foreground">{saveMessage}</p>
                        )}
                        <div className="flex gap-3 border-t border-border pt-4">
                          <Button
                            variant="secondary"
                            onClick={handleSaveDraft}
                            disabled={isInFlight}
                          >
                            {isSaving
                              ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                              : <Save className="h-4 w-4" aria-hidden />
                            }
                            Save Draft
                          </Button>
                          <Button
                            onClick={handleSign}
                            disabled={isInFlight}
                          >
                            {isSigning
                              ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                              : <Send className="h-4 w-4" aria-hidden />
                            }
                            Sign &amp; Complete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="rx">
                    <Card>
                      <CardContent className="space-y-4 p-6">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-foreground">Medications</h3>
                          {selected.encounterId && (
                            <Button size="sm" onClick={() => { setAddMedOpen(true); setSafetyFlags([]); setPendingAck(false); setDrugDraft({ name: '', dose: '', quantity: '', durationDays: '' }); }}>
                              <Plus className="h-3.5 w-3.5" aria-hidden /> Add Medication
                            </Button>
                          )}
                        </div>

                        {!selected.encounterId && (
                          <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning">
                            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                            Save a SOAP draft first to enable prescriptions for this encounter.
                          </div>
                        )}

                        {selected.encounterId && medLoading && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading medications…
                          </div>
                        )}

                        {selected.encounterId && medError && (
                          <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">{medError}</p>
                        )}

                        {selected.encounterId && !medLoading && !medError && medOrders.length === 0 && (
                          <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-4 text-sm text-primary">
                            <Pill className="h-4 w-4 shrink-0" aria-hidden />
                            No medications prescribed yet for this encounter.
                          </div>
                        )}

                        {medOrders.length > 0 && (
                          <div className="divide-y divide-border rounded-xl border border-border">
                            {medOrders.map(order => (
                              <div key={order._id} className="px-4 py-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-0.5">
                                    {order.details.drugs.map((d, i) => (
                                      <p key={i} className="text-sm font-medium text-foreground">
                                        {d.name}{d.dose ? ` — ${d.dose}` : ''}{d.quantity ? ` ×${d.quantity}` : ''}{d.durationDays ? ` (${d.durationDays}d)` : ''}
                                      </p>
                                    ))}
                                  </div>
                                  <Badge tone="success" className="shrink-0 text-[10px]">{order.status || 'ordered'}</Badge>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  {order.orderCode ? ` · ${order.orderCode}` : ''}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="labs">
                    <Card>
                      <CardContent className="space-y-4 p-6">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-foreground">Lab Orders</h3>
                          {selected.encounterId && (
                            <Button size="sm" onClick={() => { setAddLabOpen(true); setLabDraft({ testName: '', priority: 'routine' }); setLabSubmitError(''); }}>
                              <Plus className="h-3.5 w-3.5" aria-hidden /> Order Labs
                            </Button>
                          )}
                        </div>

                        {!selected.encounterId && (
                          <div className="flex items-center gap-2 rounded-xl border border-warning/30 bg-warning-soft p-4 text-sm text-warning">
                            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                            Save a SOAP draft first to enable lab orders for this encounter.
                          </div>
                        )}

                        {selected.encounterId && labLoading && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading lab orders…
                          </div>
                        )}

                        {selected.encounterId && labError && (
                          <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">{labError}</p>
                        )}

                        {selected.encounterId && !labLoading && !labError && labOrders.length === 0 && (
                          <div className="flex items-center gap-2 rounded-xl bg-info-soft p-4 text-sm text-info">
                            <FlaskConical className="h-4 w-4 shrink-0" aria-hidden />
                            No lab orders placed for this encounter yet.
                          </div>
                        )}

                        {labOrders.length > 0 && (
                          <div className="divide-y divide-border rounded-xl border border-border">
                            {labOrders.map(order => (
                              <div key={order._id} className="px-4 py-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-0.5">
                                    {order.details.tests.map((t, i) => (
                                      <p key={i} className="text-sm font-medium text-foreground">{t.name}{t.code ? ` (${t.code})` : ''}</p>
                                    ))}
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1.5">
                                    {order.priority && order.priority !== 'routine' && (
                                      <Badge tone="warning" className="text-[10px]">{order.priority}</Badge>
                                    )}
                                    <Badge tone="brand" className="text-[10px]">{order.status || 'ordered'}</Badge>
                                  </div>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  {order.orderCode ? ` · ${order.orderCode}` : ''}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            );
          })()}
        </div>
      )}

      <Dialog
        open={addLabOpen}
        onClose={() => setAddLabOpen(false)}
        title="Order Lab Test"
        description="This order will be routed to the lab worklist for this encounter."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddLabOpen(false)}>Cancel</Button>
            <Button onClick={handleOrderLab} loading={labSubmitting} disabled={!labDraft.testName.trim()}>Place Order</Button>
          </>
        }
      >
        <div className="space-y-4">
          {labSubmitError && (
            <p role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">{labSubmitError}</p>
          )}
          <div>
            <Label htmlFor="lab-name">Test name <span aria-hidden>*</span></Label>
            <Input
              id="lab-name"
              value={labDraft.testName}
              onChange={e => setLabDraft(d => ({ ...d, testName: e.target.value }))}
              placeholder="e.g. Complete Blood Count"
            />
          </div>
          <div>
            <Label htmlFor="lab-priority">Priority</Label>
            <div className="mt-1 flex gap-2">
              {(['routine', 'urgent', 'stat'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setLabDraft(d => ({ ...d, priority: p }))}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${labDraft.priority === p ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted/30 text-foreground hover:bg-muted'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={addMedOpen}
        onClose={() => { setAddMedOpen(false); setSafetyFlags([]); setPendingAck(false); }}
        title="Add Medication"
        description="This prescription will be sent to pharmacy as a clinical order."
        size="sm"
        footer={
          pendingAck ? (
            <>
              <Button variant="outline" onClick={() => { setAddMedOpen(false); setSafetyFlags([]); setPendingAck(false); }}>Cancel</Button>
              <Button variant="danger" onClick={() => handleAddMed(true)} loading={medSubmitting}>Acknowledge &amp; Prescribe</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => { setAddMedOpen(false); setSafetyFlags([]); setPendingAck(false); }}>Cancel</Button>
              <Button onClick={() => handleAddMed(false)} loading={medSubmitting} disabled={!drugDraft.name.trim()}>Add Medication</Button>
            </>
          )
        }
      >
        <div className="space-y-4">
          {safetyFlags.length > 0 && (
            <div className="space-y-2">
              {safetyFlags.map((f, i) => (
                <div key={i} className={`flex items-start gap-2 rounded-lg p-3 text-sm ${f.severity === 'critical' ? 'border border-danger/30 bg-danger-soft text-danger' : f.severity === 'warning' ? 'border border-warning/30 bg-warning-soft text-warning' : 'border border-info/30 bg-info-soft text-info'}`}>
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <div>
                    {f.drug && <p className="font-semibold">{f.drug}</p>}
                    <p>{f.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div>
            <Label htmlFor="med-name">Drug name <span aria-hidden>*</span></Label>
            <Input id="med-name" value={drugDraft.name} onChange={e => setDrugDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. Amoxicillin" />
          </div>
          <div>
            <Label htmlFor="med-dose">Dose</Label>
            <Input id="med-dose" value={drugDraft.dose} onChange={e => setDrugDraft(d => ({ ...d, dose: e.target.value }))} placeholder="e.g. 500 mg TID" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="med-qty">Quantity</Label>
              <Input id="med-qty" type="number" min="1" value={drugDraft.quantity} onChange={e => setDrugDraft(d => ({ ...d, quantity: e.target.value }))} placeholder="e.g. 21" />
            </div>
            <div>
              <Label htmlFor="med-dur">Duration (days)</Label>
              <Input id="med-dur" type="number" min="1" value={drugDraft.durationDays} onChange={e => setDrugDraft(d => ({ ...d, durationDays: e.target.value }))} placeholder="e.g. 7" />
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={aiAssistOpen}
        onClose={() => setAiAssistOpen(false)}
        title="AI Assist — SOAP Templates"
        description={selected?.chiefComplaint ? `Pre-fill SOAP note for "${selected.chiefComplaint}"` : 'Select a template to pre-fill the SOAP note.'}
        size="sm"
      >
        <div className="flex flex-col gap-3">
          {AI_TEMPLATES.map(t => (
            <Button
              key={t.label}
              variant="outline"
              className="h-auto justify-start whitespace-normal py-3 text-left"
              onClick={() => {
                (Object.entries(t.fields) as Array<[keyof SoapFields, string]>).forEach(([k, v]) => handleSoapChange(k, v));
                setAiAssistOpen(false);
              }}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </Dialog>
    </div>
  );
}
