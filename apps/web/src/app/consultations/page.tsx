'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import {
  Stethoscope, FileText, Pill, FlaskConical, Clock, CheckCircle,
  AlertTriangle, ChevronRight, Search, Plus, Activity, Heart,
  Brain, Thermometer, Save, Send, MoreVertical, X, Mic
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Consultation {
  id: string; token: string; patientName: string; patientMrn: string;
  patientAge: number; patientGender: string; appointmentTime: string;
  type: string; status: 'In Progress' | 'Completed' | 'Pending Review';
  chiefComplaint: string; doctor: string; department: string;
  diagnosis?: string; soap?: { subjective?: string; objective?: string; assessment?: string; plan?: string; };
  vitals?: { bp: string; hr: number; temp: number; spo2: number; rr: number; };
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
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

// ─── Vitals Display ───────────────────────────────────────────────────────────
function VitalsStrip({ vitals }: { vitals: NonNullable<Consultation['vitals']> }) {
  const items = [
    { label: 'BP', value: vitals.bp, unit: 'mmHg', icon: Heart, ok: true },
    { label: 'HR', value: vitals.hr, unit: 'bpm', icon: Activity, ok: vitals.hr >= 60 && vitals.hr <= 100 },
    { label: 'Temp', value: vitals.temp, unit: '°C', icon: Thermometer, ok: vitals.temp <= 37.5 },
    { label: 'SpO₂', value: `${vitals.spo2}%`, unit: '', icon: Activity, ok: vitals.spo2 >= 95 },
    { label: 'RR', value: vitals.rr, unit: '/min', icon: Activity, ok: vitals.rr >= 12 && vitals.rr <= 20 },
  ];
  return (
    <div className="flex gap-3 flex-wrap">
      {items.map(v => {
        const Icon = v.icon;
        return (
          <div key={v.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-mono ${v.ok ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400'}`}>
            <Icon className="w-3 h-3" />
            <span className="font-semibold">{v.value}</span>
            <span className="text-xs opacity-70">{v.unit}</span>
            <span className="text-xs ml-1 opacity-50">{v.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  'In Progress':    { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500 animate-pulse' },
  'Completed':      { bg: 'bg-green-50 dark:bg-green-900/20',   text: 'text-green-700 dark:text-green-400',   dot: 'bg-green-500' },
  'Pending Review': { bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-700 dark:text-amber-400',   dot: 'bg-amber-500' },
};

// ─── SOAP Note Editor ─────────────────────────────────────────────────────────
function SOAPEditor({ soap }: { soap?: Consultation['soap'] }) {
  const sections: { key: keyof NonNullable<Consultation['soap']>; label: string; placeholder: string }[] = [
    { key: 'subjective', label: 'S — Subjective', placeholder: "Patient's reported symptoms, history, and complaints..." },
    { key: 'objective',  label: 'O — Objective',  placeholder: 'Examination findings, vitals, and investigation results...' },
    { key: 'assessment', label: 'A — Assessment', placeholder: 'Diagnosis and clinical impression...' },
    { key: 'plan',       label: 'P — Plan',       placeholder: 'Treatment plan, investigations ordered, follow-up...' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sections.map(s => (
        <div key={s.key}>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{s.label}</label>
          <textarea
            defaultValue={soap?.[s.key] ?? ''}
            placeholder={s.placeholder}
            rows={5}
            className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ConsultationsPage() {
  const [selected, setSelected] = useState<Consultation>(CONSULTATIONS[0]);
  const [activeTab, setActiveTab] = useState<'soap' | 'rx' | 'labs'>('soap');

  return (
    <DashboardLayout>
      <div className="flex-1 flex h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">

        {/* ── Left Panel: Consultation List ── */}
        <div className="w-80 shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="px-4 py-5 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-bold text-slate-900 dark:text-white text-lg mb-3">Consultations</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search patient..." className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {CONSULTATIONS.map(c => {
              const sc = STATUS_CFG[c.status];
              const isActive = selected.id === c.id;
              return (
                <button key={c.id} onClick={() => setSelected(c)} className={`w-full px-4 py-4 text-left transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 border-r-2 border-indigo-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-500">{c.token}</span>
                    <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">{c.appointmentTime}</span>
                    <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{c.status}</span>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{c.patientName}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{c.chiefComplaint}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right Panel: Consultation Detail ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Patient banner */}
          <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {selected.patientName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{selected.patientName}</h2>
                  <p className="text-slate-500 text-sm">{selected.patientAge}y · {selected.patientGender} · <span className="font-mono">{selected.patientMrn}</span> · {selected.department}</p>
                  {selected.diagnosis && <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">{selected.diagnosis}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${STATUS_CFG[selected.status].bg} ${STATUS_CFG[selected.status].text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CFG[selected.status].dot}`} />{selected.status}
                </span>
                <Link href="/emr" className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                  <FileText className="w-3.5 h-3.5" /> Open Full EMR
                </Link>
              </div>
            </div>

            {/* Vitals */}
            {selected.vitals && (
              <div className="mt-3">
                <VitalsStrip vitals={selected.vitals} />
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {([
              { key: 'soap', label: 'SOAP Notes', icon: FileText },
              { key: 'rx',   label: 'Prescriptions', icon: Pill },
              { key: 'labs', label: 'Lab Orders', icon: FlaskConical },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                <t.icon className="w-4 h-4" />{t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'soap' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">SOAP Note</h3>
                  <div className="flex gap-2">
                    <button className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <Mic className="w-3.5 h-3.5" /> Dictate
                    </button>
                    <button className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-colors">
                      <Activity className="w-3.5 h-3.5" /> AI Assist
                    </button>
                  </div>
                </div>
                <SOAPEditor soap={selected.soap} />
                <div className="flex gap-3 pt-2">
                  <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">
                    <Save className="w-4 h-4" /> Save Draft
                  </button>
                  <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors">
                    <Send className="w-4 h-4" /> Sign & Complete
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'rx' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">Prescriptions</h3>
                  <Link href="/prescriptions" className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add Medication
                  </Link>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 text-sm text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                  <Pill className="w-4 h-4 shrink-0" />
                  No medications prescribed yet. Use the button above to add.
                </div>
              </div>
            )}

            {activeTab === 'labs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">Lab Orders</h3>
                  <Link href="/lab-orders" className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Order Labs
                  </Link>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 shrink-0" />
                  No lab orders linked to this consultation.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
