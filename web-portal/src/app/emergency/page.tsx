'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Siren, Clock, Activity, AlertTriangle, Hourglass,
  Zap, Brain, Truck, CheckCircle, Radio, UserPlus, FileText,
  Heart, Stethoscope, Thermometer, Wind, Droplets, Timer,
  ChevronRight, ShieldAlert, TestTube2, Pill, Waves,
  BedDouble, ClipboardList, FlaskConical, Check,
} from 'lucide-react';
import {
  PageHeader, StatCard, StatGrid, Card, CardHeader, CardTitle, CardDescription,
  CardContent, Tabs, TabsList, TabsTrigger, TabsContent, Badge, Button,
  DataTable, type Column, EmptyState, SkeletonCard, Select,
} from '@/components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.careconnect.care';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: 'Bearer ' + token } : {};
}

type TrackedPatient = {
  bed: string; patient: string; age: string; gender: string; esi: number;
  complaint: string; arrTime: string; status: string; md: string; rn: string; flags: string[];
};
type EmergencyStats = { critical: number; stable: number; triageWaiting: number; averageWaitMins: number; enRoute: number };
type EmergencyResponse = { stats: EmergencyStats; patients: TrackedPatient[] };

const ESI_STYLES: Record<number, { chip: string; label: string; color: string }> = {
  1: { chip: 'bg-red-600 text-white dark:bg-red-600',                                          label: 'Resuscitation', color: 'text-red-600' },
  2: { chip: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',       label: 'Emergent',      color: 'text-orange-600' },
  3: { chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',           label: 'Urgent',        color: 'text-amber-600' },
  4: { chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',   label: 'Less Urgent',   color: 'text-emerald-600' },
  5: { chip: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',               label: 'Non-Urgent',    color: 'text-blue-600' },
};

function EsiChip({ esi }: { esi: number }) {
  const style = ESI_STYLES[esi] ?? { chip: 'bg-muted text-muted-foreground', label: 'Unassigned', color: '' };
  return (
    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold shadow-soft ${style.chip}`}
      aria-label={`ESI ${esi} — ${style.label}`} title={style.label}>{esi}</span>
  );
}

/* ── Elapsed timer ─────────────────────────────────────── */
function ElapsedTimer({ since }: { since: Date }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    setElapsed(Math.floor((Date.now() - since.getTime()) / 1000));
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [since]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const display = h > 0 ? `${h}h ${m}m` : `${m}m ${String(s).padStart(2, '0')}s`;
  const danger = elapsed > 3600;
  return <span className={`font-mono tabular-nums text-lg font-bold ${danger ? 'text-danger' : 'text-foreground'}`}>{display}</span>;
}

/* ── Checklist item ────────────────────────────────────── */
function CheckItem({ label, sub, checked, onToggle }: { label: string; sub?: string; checked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
        checked ? 'border-success/40 bg-success-soft' : 'border-border hover:border-primary/30 hover:bg-muted/40'
      }`}
    >
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        checked ? 'border-success bg-success text-white' : 'border-muted-foreground'
      }`}>
        {checked && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <span>
        <span className={`block text-sm font-medium ${checked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{label}</span>
        {sub && <span className="block text-xs text-muted-foreground mt-0.5">{sub}</span>}
      </span>
    </button>
  );
}

/* ── Dashboard tab ─────────────────────────────────────── */
function DashboardTab({ patients, stats }: { patients: TrackedPatient[]; stats: EmergencyStats | undefined }) {
  const esiCounts = [1, 2, 3, 4, 5].map(n => ({ esi: n, count: patients.filter(p => p.esi === n).length }));
  const statusCounts = Array.from(new Set(patients.map(p => p.status)))
    .map(s => ({ status: s, count: patients.filter(p => p.status === s).length }));
  const totalBeds = 20;
  const occupied = patients.length;
  const pct = Math.round((occupied / totalBeds) * 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Capacity */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BedDouble className="h-4 w-4 text-primary" /> ED Capacity</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-4xl font-bold text-foreground tabular-nums">{occupied}</span>
              <span className="text-muted-foreground text-sm mb-1">/ {totalBeds} beds occupied</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-warning' : 'bg-success'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{pct}% capacity — {totalBeds - occupied} beds available</p>
          </CardContent>
        </Card>

        {/* ESI Distribution */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> ESI Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {esiCounts.map(({ esi, count }) => {
              const style = ESI_STYLES[esi];
              const w = patients.length > 0 ? Math.round((count / patients.length) * 100) : 0;
              return (
                <div key={esi} className="flex items-center gap-3">
                  <EsiChip esi={esi} />
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{style.label}</span>
                      <span className={`font-semibold ${style.color}`}>{count}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${esi === 1 ? 'bg-red-500' : esi === 2 ? 'bg-orange-500' : esi === 3 ? 'bg-amber-500' : esi === 4 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${w}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {patients.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No patients currently tracked</p>}
          </CardContent>
        </Card>

        {/* Patient flow */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Waves className="h-4 w-4 text-primary" /> Patient Flow</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {statusCounts.length > 0 ? statusCounts.map(({ status, count }) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{status}</span>
                <Badge tone="neutral">{count}</Badge>
              </div>
            )) : (
              <div className="space-y-3">
                {['Waiting', 'In Consultation', 'Awaiting Results', 'Disposition'].map(s => (
                  <div key={s} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{s}</span>
                    <Badge tone="neutral">0</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-danger" /> Active Alerts & Flags
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patients.filter(p => p.flags.length > 0).length > 0 ? (
            <div className="divide-y divide-border">
              {patients.filter(p => p.flags.length > 0).map(p => (
                <div key={p.bed} className="flex items-center gap-4 py-3">
                  <EsiChip esi={p.esi} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{p.patient}</p>
                    <p className="text-xs text-muted-foreground">{p.complaint} · {p.bed}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {p.flags.map(f => <Badge key={f} tone="danger" pulse><Zap className="h-3 w-3" />{f}</Badge>)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No active alerts — all patients within normal parameters.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Triage tab ────────────────────────────────────────── */
function TriageTab({ patients }: { patients: TrackedPatient[] }) {
  const [selected, setSelected] = useState<string | null>(patients[0]?.bed ?? null);
  const [vitals, setVitals] = useState({ hr: '', sbp: '', dbp: '', spo2: '', rr: '', temp: '', pain: '0' });
  const [esi, setEsi] = useState('3');
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const patient = patients.find(p => p.bed === selected);

  function handleSave() {
    if (!selected) return;
    setSaved(s => ({ ...s, [selected]: true }));
    // In a live system this would POST to /api/ward/emergency/triage
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Patient queue */}
      <Card className="lg:col-span-1">
        <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> Triage Queue</CardTitle></CardHeader>
        <CardContent className="p-0">
          {patients.length === 0 ? (
            <div className="p-6"><EmptyState icon={Activity} title="Queue empty" description="No patients awaiting triage." /></div>
          ) : (
            <div className="divide-y divide-border">
              {patients.map(p => (
                <button
                  key={p.bed}
                  onClick={() => { setSelected(p.bed); setSaved(s => ({ ...s })); }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${selected === p.bed ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                >
                  <EsiChip esi={p.esi} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{p.patient}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.complaint}</p>
                    <p className="text-xs text-muted-foreground">{p.bed} · arrived {p.arrTime}</p>
                  </div>
                  {saved[p.bed] && <Check className="h-4 w-4 text-success shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Triage form */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            {patient ? `Triage — ${patient.patient}` : 'Select a patient'}
          </CardTitle>
          {patient && <CardDescription>{patient.complaint} · {patient.bed} · Arrived {patient.arrTime}</CardDescription>}
        </CardHeader>
        <CardContent>
          {!patient ? (
            <EmptyState icon={UserPlus} title="Select a patient" description="Choose a patient from the queue to begin triage assessment." />
          ) : (
            <div className="space-y-6">
              {/* Vitals grid */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vital Signs</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { key: 'hr',   label: 'Heart Rate',    unit: 'bpm',  icon: Heart,       placeholder: '72' },
                    { key: 'sbp',  label: 'SBP',           unit: 'mmHg', icon: Activity,    placeholder: '120' },
                    { key: 'dbp',  label: 'DBP',           unit: 'mmHg', icon: Activity,    placeholder: '80' },
                    { key: 'spo2', label: 'SpO₂',          unit: '%',    icon: Wind,        placeholder: '98' },
                    { key: 'rr',   label: 'Resp Rate',     unit: '/min', icon: Wind,        placeholder: '16' },
                    { key: 'temp', label: 'Temperature',   unit: '°C',   icon: Thermometer, placeholder: '37.0' },
                  ].map(({ key, label, unit, icon: Icon, placeholder }) => (
                    <div key={key} className="rounded-xl border border-border bg-muted/20 p-3">
                      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{label}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <input
                          type="number"
                          value={vitals[key as keyof typeof vitals]}
                          onChange={e => setVitals(v => ({ ...v, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full bg-transparent text-lg font-bold text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />
                        <span className="text-xs text-muted-foreground">{unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pain & ESI */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Pain Score — {vitals.pain}/10
                  </label>
                  <input
                    type="range" min="0" max="10" step="1"
                    value={vitals.pain}
                    onChange={e => setVitals(v => ({ ...v, pain: e.target.value }))}
                    className="w-full accent-primary"
                  />
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>0 — No pain</span><span>10 — Worst</span>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">ESI Level</label>
                  <Select value={esi} onChange={e => setEsi(e.target.value)}>
                    <option value="1">ESI 1 — Resuscitation</option>
                    <option value="2">ESI 2 — Emergent</option>
                    <option value="3">ESI 3 — Urgent</option>
                    <option value="4">ESI 4 — Less Urgent</option>
                    <option value="5">ESI 5 — Non-Urgent</option>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                {saved[selected!] && (
                  <span className="flex items-center gap-1.5 text-sm text-success"><Check className="h-4 w-4" /> Triage saved</span>
                )}
                <Button onClick={handleSave}>
                  <CheckCircle className="h-4 w-4" /> Complete Triage
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Trauma tab ────────────────────────────────────────── */
const TRAUMA_BAYS = [
  { id: 'TB-1', name: 'Trauma Bay 1', type: 'Level 1 — Full resus capability' },
  { id: 'TB-2', name: 'Trauma Bay 2', type: 'Level 1 — Full resus capability' },
  { id: 'TB-3', name: 'Trauma Bay 3', type: 'Level 2 — Stabilisation' },
];
const ABCDE = [
  { id: 'a', label: 'Airway', sub: 'Patent / protected airway confirmed' },
  { id: 'b', label: 'Breathing', sub: 'Bilateral chest rise, SpO₂ ≥ 95%' },
  { id: 'c', label: 'Circulation', sub: 'IV access × 2, BP documented, major haemorrhage controlled' },
  { id: 'd', label: 'Disability', sub: 'GCS documented, pupils checked, blood glucose' },
  { id: 'e', label: 'Exposure', sub: 'Full exposure, hypothermia prevention, FAST exam' },
];
const TRAUMA_TEAM = ['Trauma Surgeon', 'Anaesthetist', 'Emergency Physician', 'Scrub Nurse', 'Radiographer', 'Blood Bank'];

function TraumaTab({ patients }: { patients: TrackedPatient[] }) {
  const [bayOccupant, setBayOccupant] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [teamPaged, setTeamPaged] = useState<Record<string, boolean>>({});
  const [activeBay, setActiveBay] = useState('TB-1');
  const toggle = (key: string) => setChecks(c => ({ ...c, [key]: !c[key] }));

  return (
    <div className="space-y-6">
      {/* Bay status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TRAUMA_BAYS.map(bay => {
          const occ = bayOccupant[bay.id];
          return (
            <button
              key={bay.id}
              onClick={() => setActiveBay(bay.id)}
              className={`rounded-2xl border p-5 text-left transition-all ${activeBay === bay.id ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:border-primary/30'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <BedDouble className={`h-5 w-5 ${occ ? 'text-danger' : 'text-success'}`} />
                <Badge tone={occ ? 'danger' : 'success'}>{occ ? 'Occupied' : 'Available'}</Badge>
              </div>
              <p className="font-bold text-foreground">{bay.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{bay.type}</p>
              {occ && <p className="mt-2 text-sm text-foreground font-medium">{occ}</p>}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Assign patient + ABCDE */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> {activeBay} — Primary Survey</CardTitle>
            <CardDescription>ABCDE assessment for {TRAUMA_BAYS.find(b => b.id === activeBay)?.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="mb-4">
              <Select
                value={bayOccupant[activeBay] ?? ''}
                onChange={e => setBayOccupant(b => ({ ...b, [activeBay]: e.target.value }))}
              >
                <option value="">— Assign patient —</option>
                {patients.map(p => <option key={p.bed} value={p.patient}>{p.patient} · {p.complaint}</option>)}
                <option value="Unknown Trauma">Unknown Trauma Patient</option>
              </Select>
            </div>
            {ABCDE.map(item => (
              <CheckItem
                key={`${activeBay}-${item.id}`}
                label={`${item.id.toUpperCase()} — ${item.label}`}
                sub={item.sub}
                checked={!!checks[`${activeBay}-${item.id}`]}
                onToggle={() => toggle(`${activeBay}-${item.id}`)}
              />
            ))}
          </CardContent>
        </Card>

        {/* Trauma team */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Radio className="h-4 w-4 text-danger" /> Trauma Team Activation</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground mb-4">Page each team member. All should respond within 5 minutes of activation.</p>
            {TRAUMA_TEAM.map(member => {
              const key = `${activeBay}-${member}`;
              return (
                <div key={member} className="flex items-center justify-between rounded-xl border border-border p-3">
                  <span className="text-sm font-medium text-foreground">{member}</span>
                  <Button
                    size="sm"
                    variant={teamPaged[key] ? 'secondary' : 'outline'}
                    onClick={() => setTeamPaged(t => ({ ...t, [key]: !t[key] }))}
                  >
                    {teamPaged[key] ? <><Check className="h-3.5 w-3.5" /> Paged</> : 'Page Now'}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ── Stroke tab ────────────────────────────────────────── */
const NIHSS_ITEMS = [
  { id: 'loc', label: '1a. Level of consciousness', max: 3 },
  { id: 'loc_q', label: '1b. LOC Questions (month, age)', max: 2 },
  { id: 'loc_cmd', label: '1c. LOC Commands', max: 2 },
  { id: 'gaze', label: '2. Best Gaze', max: 2 },
  { id: 'visual', label: '3. Visual', max: 3 },
  { id: 'facial', label: '4. Facial Palsy', max: 3 },
  { id: 'arm_l', label: '5a. Motor — Left Arm', max: 4 },
  { id: 'arm_r', label: '5b. Motor — Right Arm', max: 4 },
  { id: 'leg_l', label: '6a. Motor — Left Leg', max: 4 },
  { id: 'leg_r', label: '6b. Motor — Right Leg', max: 4 },
  { id: 'ataxia', label: '7. Limb Ataxia', max: 2 },
  { id: 'sensory', label: '8. Sensory', max: 2 },
  { id: 'lang', label: '9. Best Language', max: 3 },
  { id: 'dysarthria', label: '10. Dysarthria', max: 2 },
  { id: 'neglect', label: '11. Extinction and Inattention', max: 2 },
];
const TPA_CONTRAINDICATIONS = [
  'Haemorrhagic stroke or head trauma < 3 months',
  'Ischaemic stroke < 3 months',
  'Intracranial surgery < 3 months',
  'History of intracranial haemorrhage',
  'Uncontrolled hypertension (SBP > 185 or DBP > 110)',
  'Active internal bleeding',
  'INR > 1.7 / platelets < 100,000',
  'Blood glucose < 2.8 or > 22.2 mmol/L',
];

function StrokeTab({ patients }: { patients: TrackedPatient[] }) {
  const [active, setActive] = useState(false);
  const [selectedPt, setSelectedPt] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [nihss, setNihss] = useState<Record<string, number>>({});
  const [contraChecks, setContraChecks] = useState<Record<string, boolean>>({});

  const total = Object.values(nihss).reduce((a, b) => a + b, 0);
  const severity = total <= 4 ? 'Minor' : total <= 15 ? 'Moderate' : total <= 20 ? 'Moderate–Severe' : 'Severe';
  const contraCount = Object.values(contraChecks).filter(Boolean).length;

  function activate() { setActive(true); setStartTime(new Date()); }

  if (!active) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400">
              <Brain className="h-10 w-10" aria-hidden />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Stroke Code Activation</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                Activate to start the door-to-CT clock, NIHSS scoring, and thrombolysis decision checklist.
              </p>
            </div>
            <Button variant="danger" size="lg" onClick={activate}>
              <AlertTriangle className="h-5 w-5" /> Activate Stroke Code
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with timer */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-danger/30 bg-danger-soft p-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-danger" />
          <span className="font-bold text-danger">STROKE CODE ACTIVE</span>
        </div>
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Door-to-CT:</span>
          {startTime && <ElapsedTimer since={startTime} />}
          <Badge tone="danger">Target &lt; 25 min</Badge>
        </div>
        <div className="ml-auto">
          <Select value={selectedPt} onChange={e => setSelectedPt(e.target.value)} aria-label="Select patient">
            <option value="">— Assign patient —</option>
            {patients.map(p => <option key={p.bed} value={p.patient}>{p.patient} · {p.complaint}</option>)}
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setActive(false); setStartTime(null); setNihss({}); setContraChecks({}); }}>
          Deactivate
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* NIHSS */}
        <Card>
          <CardHeader>
            <CardTitle>NIHSS Score</CardTitle>
            <CardDescription>Total: <span className="font-bold text-foreground">{total}</span> — {severity}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {NIHSS_ITEMS.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground flex-1 truncate" title={item.label}>{item.label}</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: item.max + 1 }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setNihss(n => ({ ...n, [item.id]: i }))}
                      className={`h-6 w-6 rounded text-xs font-bold transition-colors ${nihss[item.id] === i ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-primary/20'}`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* tPA contraindications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Pill className="h-4 w-4 text-primary" /> tPA Eligibility</CardTitle>
            <CardDescription>Check all that apply — contraindications present: <span className="font-bold text-foreground">{contraCount}</span></CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {TPA_CONTRAINDICATIONS.map(c => (
              <CheckItem
                key={c} label={c} checked={!!contraChecks[c]} onToggle={() => setContraChecks(x => ({ ...x, [c]: !x[c] }))}
              />
            ))}
            <div className={`mt-4 rounded-xl p-3 text-sm font-semibold ${contraCount === 0 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
              {contraCount === 0 ? '✓ No contraindications identified — consider tPA if within 4.5h window' : `✗ ${contraCount} contraindication(s) present — tPA not recommended`}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ── STEMI tab ─────────────────────────────────────────── */
const STEMI_CHECKLIST = [
  { id: 'ecg', label: '12-lead ECG acquired and interpreted', sub: 'Target: within 10 min of arrival' },
  { id: 'aspirin', label: 'Aspirin 300 mg loading dose given', sub: 'If not contraindicated' },
  { id: 'p2y12', label: 'P2Y12 inhibitor given (Ticagrelor 180 mg / Clopidogrel 600 mg)', sub: 'As per local protocol' },
  { id: 'heparin', label: 'Anticoagulation initiated (UFH / LMWH / Bivalirudin)', sub: 'Weight-based dosing' },
  { id: 'o2', label: 'Oxygen if SpO₂ < 94%', sub: 'Target 94–98%' },
  { id: 'iv', label: 'IV access × 2 and bloods drawn', sub: 'Troponin, FBC, U&E, coagulation, group & save' },
  { id: 'cath', label: 'Cath lab activated', sub: 'Target D2B < 90 min; < 60 min if onset < 2h' },
  { id: 'consent', label: 'Consent obtained for PCI', sub: 'Verbal acceptable in emergency' },
  { id: 'brief', label: 'Patient and family briefed', sub: 'Diagnosis, procedure, risks explained' },
];

function StemiTab({ patients }: { patients: TrackedPatient[] }) {
  const [active, setActive] = useState(false);
  const [selectedPt, setSelectedPt] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const done = Object.values(checks).filter(Boolean).length;

  if (!active) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400">
              <Heart className="h-10 w-10" aria-hidden />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">STEMI Code Activation</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">Start the door-to-balloon timer and activate the STEMI reperfusion checklist.</p>
            </div>
            <Button variant="danger" size="lg" onClick={() => { setActive(true); setStartTime(new Date()); }}>
              <Heart className="h-5 w-5" /> Activate STEMI Code
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-danger/30 bg-danger-soft p-4">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-danger" />
          <span className="font-bold text-danger">STEMI CODE ACTIVE</span>
        </div>
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Door-to-Balloon:</span>
          {startTime && <ElapsedTimer since={startTime} />}
          <Badge tone="danger">Target &lt; 90 min</Badge>
        </div>
        <div className="ml-auto">
          <Select value={selectedPt} onChange={e => setSelectedPt(e.target.value)}>
            <option value="">— Assign patient —</option>
            {patients.map(p => <option key={p.bed} value={p.patient}>{p.patient} · {p.complaint}</option>)}
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setActive(false); setStartTime(null); setChecks({}); }}>Deactivate</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> STEMI Reperfusion Checklist</CardTitle>
          <CardDescription>{done} / {STEMI_CHECKLIST.length} steps complete</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${(done / STEMI_CHECKLIST.length) * 100}%` }} />
          </div>
          <div className="space-y-2">
            {STEMI_CHECKLIST.map(item => (
              <CheckItem key={item.id} label={item.label} sub={item.sub}
                checked={!!checks[item.id]} onToggle={() => setChecks(c => ({ ...c, [item.id]: !c[item.id] }))} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Sepsis tab ────────────────────────────────────────── */
const SOFA_CRITERIA = [
  { id: 'resp', label: 'Altered respiration (RR ≥ 22 /min or PaO₂/FiO₂ < 400)' },
  { id: 'mental', label: 'Altered mentation (GCS < 15)' },
  { id: 'sbp', label: 'SBP ≤ 100 mmHg or vasopressor requirement' },
];
const HOUR1_BUNDLE = [
  { id: 'lactate', label: 'Measure serum lactate', sub: 'Re-measure if initial lactate ≥ 2 mmol/L' },
  { id: 'cultures', label: 'Blood cultures × 2 sets (before antibiotics)', sub: 'Peripheral + central if CVC in situ' },
  { id: 'abx', label: 'Broad-spectrum antibiotics given', sub: 'Within 1 hour of sepsis recognition' },
  { id: 'fluids', label: '30 mL/kg crystalloid for hypotension or lactate ≥ 4', sub: 'Complete within 3 hours' },
  { id: 'vasopressors', label: 'Vasopressors for MAP < 65 mmHg despite fluids', sub: 'Noradrenaline first-line' },
];

function SepsisTab({ patients }: { patients: TrackedPatient[] }) {
  const [selected, setSelected] = useState<string | null>(patients[0]?.bed ?? null);
  const [sofa, setSofa] = useState<Record<string, boolean>>({});
  const [bundle, setBundle] = useState<Record<string, boolean>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);

  const sofaCount = Object.values(sofa).filter(Boolean).length;
  const isSepsis = sofaCount >= 2;
  const patient = patients.find(p => p.bed === selected);
  const bundleDone = Object.values(bundle).filter(Boolean).length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Patient list */}
      <Card className="lg:col-span-1">
        <CardHeader><CardTitle className="flex items-center gap-2"><FlaskConical className="h-4 w-4 text-primary" /> Active Cases</CardTitle></CardHeader>
        <CardContent className="p-0">
          {patients.length === 0 ? (
            <div className="p-6"><EmptyState icon={Activity} title="No active cases" description="Sepsis alerts will appear here." /></div>
          ) : patients.map(p => (
            <button key={p.bed} onClick={() => setSelected(p.bed)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${selected === p.bed ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
            >
              <EsiChip esi={p.esi} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{p.patient}</p>
                <p className="text-xs text-muted-foreground truncate">{p.complaint}</p>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-6 lg:col-span-2">
        {/* qSOFA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube2 className="h-4 w-4 text-primary" /> Sepsis-3 — qSOFA Screen
              {patient && <span className="text-sm font-normal text-muted-foreground">— {patient.patient}</span>}
            </CardTitle>
            <CardDescription>Score ≥ 2 suggests possible sepsis with increased risk of poor outcome.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {SOFA_CRITERIA.map(c => (
              <CheckItem key={`sofa-${c.id}`} label={c.label}
                checked={!!sofa[c.id]} onToggle={() => setSofa(s => ({ ...s, [c.id]: !s[c.id] }))} />
            ))}
            <div className={`mt-4 rounded-xl p-3 text-sm font-semibold ${isSepsis ? 'bg-danger-soft text-danger' : 'bg-muted text-muted-foreground'}`}>
              {isSepsis
                ? `⚠ qSOFA ${sofaCount}/3 — Sepsis likely. Initiate Hour-1 Bundle now.`
                : `qSOFA ${sofaCount}/3 — Below threshold. Continue monitoring.`}
            </div>
            {isSepsis && !startTime && (
              <Button className="w-full" onClick={() => setStartTime(new Date())}>
                <Timer className="h-4 w-4" /> Start Sepsis Clock
              </Button>
            )}
            {startTime && (
              <div className="flex items-center gap-2 rounded-xl border border-warning/40 bg-warning-soft p-3">
                <Timer className="h-4 w-4 text-warning" />
                <span className="text-sm text-warning">Sepsis clock running — </span>
                <ElapsedTimer since={startTime} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hour-1 bundle */}
        {isSepsis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Droplets className="h-4 w-4 text-primary" /> Hour-1 Bundle</CardTitle>
              <CardDescription>{bundleDone} / {HOUR1_BUNDLE.length} steps complete</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-success transition-all" style={{ width: `${(bundleDone / HOUR1_BUNDLE.length) * 100}%` }} />
              </div>
              <div className="space-y-2">
                {HOUR1_BUNDLE.map(item => (
                  <CheckItem key={item.id} label={item.label} sub={item.sub}
                    checked={!!bundle[item.id]} onToggle={() => setBundle(b => ({ ...b, [item.id]: !b[item.id] }))} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ── Observation tab ───────────────────────────────────── */
const OBS_CRITERIA = [
  { id: 'pain', label: 'Pain controlled (VAS ≤ 3/10)' },
  { id: 'vitals', label: 'Vital signs stable × 4 hours' },
  { id: 'ambulate', label: 'Ambulatory or returned to baseline mobility' },
  { id: 'po', label: 'Tolerating oral intake' },
  { id: 'follow_up', label: 'Follow-up arranged within 48 hours' },
  { id: 'education', label: 'Discharge education completed' },
];

function ObservationTab({ patients }: { patients: TrackedPatient[] }) {
  const [admitTimes] = useState<Record<string, Date>>(() =>
    Object.fromEntries(patients.map(p => [p.bed, new Date(Date.now() - Math.random() * 8 * 3600000)]))
  );
  const [dcChecks, setDcChecks] = useState<Record<string, boolean>>({});
  const [dischargedBeds, setDischargedBeds] = useState<Set<string>>(new Set());

  return (
    <div className="space-y-4">
      {patients.length === 0 ? (
        <EmptyState icon={BedDouble} title="No patients in observation" description="Patients admitted to the observation unit will appear here." />
      ) : patients.map(p => {
        const key = (c: string) => `${p.bed}-${c}`;
        const done = OBS_CRITERIA.filter(c => dcChecks[key(c.id)]).length;
        return (
          <Card key={p.bed}>
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div className="flex items-start gap-3">
                <EsiChip esi={p.esi} />
                <div>
                  <CardTitle className="text-base">{p.patient}</CardTitle>
                  <CardDescription>{p.complaint} · {p.bed} · {p.md}</CardDescription>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">OBS time</p>
                <ElapsedTimer since={admitTimes[p.bed] ?? new Date()} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Discharge Criteria ({done}/{OBS_CRITERIA.length})</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {OBS_CRITERIA.map(c => (
                  <CheckItem key={key(c.id)} label={c.label}
                    checked={!!dcChecks[key(c.id)]} onToggle={() => setDcChecks(d => ({ ...d, [key(c.id)]: !d[key(c.id)] }))} />
                ))}
              </div>
              {done === OBS_CRITERIA.length && !dischargedBeds.has(p.bed) && (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-success-soft p-3">
                  <span className="text-sm font-semibold text-success">All criteria met — patient eligible for discharge</span>
                  <Button size="sm" variant="secondary" onClick={() => setDischargedBeds(prev => new Set([...prev, p.bed]))}>
                    <CheckCircle className="h-4 w-4" /> Discharge
                  </Button>
                </div>
              )}
              {dischargedBeds.has(p.bed) && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted/60 p-3">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm font-semibold text-success">Discharge order sent to ADT</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────── */
const MODULE_TABS = ['dashboard', 'tracking board', 'triage', 'trauma', 'stroke', 'stemi', 'sepsis', 'observation'];

export default function EmergencyDepartment() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('tracking board');

  const emergencyQuery = useQuery<{ success: boolean; data: EmergencyResponse }>({
    queryKey: ['ward-emergency'],
    queryFn: () => fetch(`${API_BASE}/api/ward/emergency`, { headers: authHeaders() }).then(r => r.json()),
    staleTime: 15_000,
  });

  const apiData = emergencyQuery.data?.data;
  const trackingBoard: TrackedPatient[] = apiData?.patients ?? [];
  const apiStats = apiData?.stats;

  const stats = [
    { label: 'Patients Waiting',     value: apiStats ? String(apiStats.triageWaiting) : '—', icon: Clock,          tone: 'amber'  as const, sub: 'In waiting room now' },
    { label: 'Avg Wait Time',         value: apiStats?.averageWaitMins != null ? `${apiStats.averageWaitMins}m` : '—', icon: Hourglass, tone: 'brand' as const, sub: 'Door to provider' },
    { label: 'Critical (ESI 1-2)',    value: apiStats ? String(apiStats.critical) : '—', icon: AlertTriangle,  tone: 'rose'  as const, sub: 'Active resuscitation / emergent' },
    { label: 'En Route',              value: apiStats ? String(apiStats.enRoute) : '—', icon: Truck,           tone: 'violet' as const, sub: 'EMS inbound' },
  ];

  const boardColumns: Column<TrackedPatient>[] = [
    { key: 'esi', header: 'ESI', sortable: true, accessor: r => r.esi, cell: r => <EsiChip esi={r.esi} /> },
    { key: 'bed', header: 'Bed', sortable: true, cell: r => <span className="text-sm font-bold text-foreground">{r.bed}</span> },
    { key: 'patient', header: 'Patient', sortable: true, cell: r => (
      <div><p className="text-sm font-semibold text-foreground">{r.patient}</p><p className="text-xs text-muted-foreground">{r.age}y • {r.gender}</p></div>
    )},
    { key: 'complaint', header: 'Complaint', cell: r => (
      <div>
        <p className="text-sm font-medium text-foreground">{r.complaint}</p>
        {r.flags.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{r.flags.map(f => <Badge key={f} tone="danger" pulse><Zap className="h-3 w-3" />{f}</Badge>)}</div>}
      </div>
    )},
    { key: 'arrTime', header: 'Arrival', sortable: true, cell: r => <span className="font-mono text-sm text-muted-foreground tabular-nums">{r.arrTime}</span> },
    { key: 'md', header: 'MD / RN', accessor: r => `${r.md} ${r.rn}`, cell: r => (
      <div className="text-xs text-muted-foreground"><div className="font-medium text-foreground">{r.md}</div><div>{r.rn}</div></div>
    )},
    { key: 'status', header: 'Status / Flow', cell: r =>
      r.status === 'Code Blue' ? <Badge tone="danger" pulse dot>{r.status}</Badge> : <Badge tone="neutral">{r.status}</Badge>
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
          {MODULE_TABS.map(tab => (
            <TabsTrigger key={tab} value={tab} className="capitalize">{tab}</TabsTrigger>
          ))}
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="mt-6">
          <DashboardTab patients={trackingBoard} stats={apiStats} />
        </TabsContent>

        {/* Tracking Board */}
        <TabsContent value="tracking board" className="mt-6 space-y-6">
          {emergencyQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0,1,2,3].map(i => <SkeletonCard key={i} />)}</div>
          ) : emergencyQuery.isError ? (
            <p className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">Failed to load emergency data. Please refresh.</p>
          ) : (
            <StatGrid>{stats.map((s, i) => <StatCard key={s.label} {...s} delay={i * 0.05} />)}</StatGrid>
          )}
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
                columns={boardColumns} data={trackingBoard} rowKey={r => r.bed}
                searchPlaceholder="Search patient, bed, complaint…" exportName="ed-tracking-board"
                emptyTitle="No active patients" emptyDescription="The board updates in real time as patients are registered."
                rowActions={() => (
                  <Button variant="outline" size="sm" onClick={() => router.push('/emr')}>
                    <FileText className="h-3.5 w-3.5" aria-hidden /> Chart
                  </Button>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Triage */}
        <TabsContent value="triage" className="mt-6">
          <TriageTab patients={trackingBoard} />
        </TabsContent>

        {/* Trauma */}
        <TabsContent value="trauma" className="mt-6">
          <TraumaTab patients={trackingBoard} />
        </TabsContent>

        {/* Stroke */}
        <TabsContent value="stroke" className="mt-6">
          <StrokeTab patients={trackingBoard} />
        </TabsContent>

        {/* STEMI */}
        <TabsContent value="stemi" className="mt-6">
          <StemiTab patients={trackingBoard} />
        </TabsContent>

        {/* Sepsis */}
        <TabsContent value="sepsis" className="mt-6">
          <SepsisTab patients={trackingBoard} />
        </TabsContent>

        {/* Observation */}
        <TabsContent value="observation" className="mt-6">
          <ObservationTab patients={trackingBoard} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
