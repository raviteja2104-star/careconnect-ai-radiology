'use client';

import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import {
  Search, Plus, Filter, ChevronRight, Users, UserCheck,
  UserX, Clock, MoreVertical, Phone, Mail, Calendar,
  Activity, AlertTriangle, Heart, Pill, FlaskConical, Download
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Gender = 'Male' | 'Female' | 'Other';
type PatientStatus = 'Active' | 'Admitted' | 'Discharged' | 'Critical';
type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

interface Patient {
  id: string; mrn: string; name: string; age: number; gender: Gender;
  dob: string; phone: string; email?: string; bloodGroup: BloodGroup;
  status: PatientStatus; lastVisit: string; diagnosis: string;
  allergies: string[]; ward?: string; doctor: string; initials: string;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const PATIENTS: Patient[] = [
  { id: '1', mrn: 'MRN-2024-08742', name: 'Ravi Kumar Sharma', age: 54, gender: 'Male', dob: '1970-03-15', phone: '+91 98765 43210', email: 'ravi.sharma@email.com', bloodGroup: 'B+', status: 'Admitted', lastVisit: '24 Jul 2026', diagnosis: 'Acute Myocardial Infarction (STEMI)', allergies: ['Penicillin', 'Aspirin'], ward: 'ICU Bed 2', doctor: 'Dr. Priya Mehta', initials: 'RK' },
  { id: '2', mrn: 'MRN-2024-09133', name: 'Ananya Krishnamurthy', age: 67, gender: 'Female', dob: '1957-11-22', phone: '+91 87654 32109', bloodGroup: 'O+', status: 'Critical', lastVisit: '23 Jul 2026', diagnosis: 'Septic Shock — Post-operative', allergies: ['Sulfa'], ward: 'ICU Bed 7', doctor: 'Dr. Rajesh Iyer', initials: 'AK' },
  { id: '3', mrn: 'MRN-2024-07391', name: 'Mohan Das', age: 32, gender: 'Male', dob: '1994-06-08', phone: '+91 76543 21098', email: 'mohan.das@email.com', bloodGroup: 'A+', status: 'Active', lastVisit: '20 Jul 2026', diagnosis: 'Type 2 Diabetes Mellitus', allergies: [], doctor: 'Dr. Suresh Gupta', initials: 'MD' },
  { id: '4', mrn: 'MRN-2024-06520', name: 'Deepa Nair', age: 29, gender: 'Female', dob: '1997-02-14', phone: '+91 65432 10987', bloodGroup: 'AB-', status: 'Active', lastVisit: '22 Jul 2026', diagnosis: 'Iron Deficiency Anaemia', allergies: ['Latex'], doctor: 'Dr. Priya Mehta', initials: 'DN' },
  { id: '5', mrn: 'MRN-2024-05188', name: 'Suresh Venkataraman', age: 71, gender: 'Male', dob: '1953-09-30', phone: '+91 54321 09876', bloodGroup: 'O-', status: 'Discharged', lastVisit: '18 Jul 2026', diagnosis: 'COPD Exacerbation', allergies: ['Ibuprofen'], doctor: 'Dr. K. Venkatesh', initials: 'SV' },
  { id: '6', mrn: 'MRN-2024-04877', name: 'Mohammed Ali Khan', age: 63, gender: 'Male', dob: '1961-05-17', phone: '+91 43210 98765', email: 'ali.khan@email.com', bloodGroup: 'B-', status: 'Admitted', lastVisit: '24 Jul 2026', diagnosis: 'Ischaemic Stroke', allergies: ['Warfarin'], ward: 'Neurology Ward B-4', doctor: 'Dr. Rao Srinivas', initials: 'MA' },
  { id: '7', mrn: 'MRN-2024-03612', name: 'Kavitha Rajan', age: 45, gender: 'Female', dob: '1979-12-05', phone: '+91 32109 87654', bloodGroup: 'A-', status: 'Active', lastVisit: '21 Jul 2026', diagnosis: 'Hypertension, Grade II', allergies: [], doctor: 'Dr. Priya Mehta', initials: 'KR' },
  { id: '8', mrn: 'MRN-2024-02445', name: 'Priya Patel', age: 39, gender: 'Female', dob: '1985-08-12', phone: '+91 21098 76543', email: 'priya.patel@email.com', bloodGroup: 'O+', status: 'Active', lastVisit: '19 Jul 2026', diagnosis: 'Gestational Diabetes', allergies: ['Penicillin'], doctor: 'Dr. Suresh Gupta', initials: 'PP' },
];

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<PatientStatus, { bg: string; text: string; dot: string }> = {
  Active:     { bg: 'bg-green-50 dark:bg-green-900/20',   text: 'text-green-700 dark:text-green-400',   dot: 'bg-green-500' },
  Admitted:   { bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-700 dark:text-blue-400',     dot: 'bg-blue-500' },
  Discharged: { bg: 'bg-slate-100 dark:bg-slate-800',     text: 'text-slate-600 dark:text-slate-400',   dot: 'bg-slate-400' },
  Critical:   { bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-400',       dot: 'bg-red-500 animate-pulse' },
};

const BLOOD_GROUP_COLOR: Record<BloodGroup, string> = {
  'O+':  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'O-':  'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  'A+':  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'A-':  'bg-blue-200 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  'B+':  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'B-':  'bg-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  'AB+': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'AB-': 'bg-purple-200 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
};

const AVATAR_COLORS = [
  'from-indigo-400 to-purple-500',
  'from-rose-400 to-pink-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-sky-400 to-blue-500',
];

// ─── Stats ─────────────────────────────────────────────────────────────────────
const SUMMARY_STATS = [
  { label: 'Total Patients', value: '2,841', icon: Users, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
  { label: 'Admitted Today', value: '48', icon: UserCheck, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
  { label: 'Critical Cases', value: '7', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
  { label: 'Discharged Today', value: '23', icon: UserX, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | PatientStatus>('All');
  const [view, setView] = useState<'table' | 'cards'>('table');

  const filtered = useMemo(() =>
    PATIENTS.filter(p => {
      const matchSearch = [p.name, p.mrn, p.diagnosis, p.doctor].some(f =>
        f.toLowerCase().includes(search.toLowerCase())
      );
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchSearch && matchStatus;
    }), [search, statusFilter]);

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">

        {/* ── Header ── */}
        <div className="px-8 pt-7 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Patients</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage and view patient records</p>
            </div>
            <div className="flex gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
                <Download className="w-4 h-4" /> Export
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
                <Plus className="w-4 h-4" /> Register Patient
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {SUMMARY_STATS.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, MRN, diagnosis, or doctor..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              {(['All', 'Active', 'Admitted', 'Critical', 'Discharged'] as const).map(f => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${statusFilter === f ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Patient Table ── */}
        <div className="px-8 pb-8 flex-1">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-sm text-slate-500">{filtered.length} patients</span>
              <div className="flex gap-1">
                {(['table', 'cards'] as const).map(v => (
                  <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === v ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                    {v === 'table' ? '≡ Table' : '⊞ Cards'}
                  </button>
                ))}
              </div>
            </div>

            {view === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs uppercase tracking-wider text-slate-500">
                      {['Patient', 'MRN', 'Age/Gender', 'Blood', 'Status', 'Ward / Doctor', 'Last Visit', 'Diagnosis', 'Action'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filtered.map((p, i) => {
                      const sc = STATUS_CONFIG[p.status];
                      return (
                        <tr key={p.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/40 transition-colors group">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                {p.initials}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{p.name}</p>
                                {p.allergies.length > 0 && (
                                  <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {p.allergies.join(', ')}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-slate-500">{p.mrn}</td>
                          <td className="px-5 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{p.age}y · {p.gender[0]}</td>
                          <td className="px-5 py-4">
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${BLOOD_GROUP_COLOR[p.bloodGroup]}`}>{p.bloodGroup}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${sc.bg} ${sc.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{p.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-slate-700 dark:text-slate-300">{p.ward ?? '—'}</p>
                            <p className="text-xs text-slate-500">{p.doctor}</p>
                          </td>
                          <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">{p.lastVisit}</td>
                          <td className="px-5 py-4 max-w-[200px]">
                            <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{p.diagnosis}</p>
                          </td>
                          <td className="px-5 py-4">
                            <Link href="/emr" className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap">View Chart</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((p, i) => {
                  const sc = STATUS_CONFIG[p.status];
                  return (
                    <div key={p.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-sm font-bold`}>
                          {p.initials}
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{p.status}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{p.name}</h4>
                      <p className="text-xs text-slate-500 mb-2">{p.mrn} · {p.age}y · {p.gender}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate mb-3">{p.diagnosis}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${BLOOD_GROUP_COLOR[p.bloodGroup]}`}>{p.bloodGroup}</span>
                        <Link href="/emr" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-1">
                          Chart <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
