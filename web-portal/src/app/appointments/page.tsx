'use client';

import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Search,
  Video, Phone, Clock, CheckCircle, XCircle, AlertTriangle,
  MoreVertical, Filter, User, Stethoscope
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type ApptStatus = 'Scheduled' | 'Confirmed' | 'Checked In' | 'Completed' | 'Cancelled' | 'No Show';
type ApptType   = 'OPD' | 'Telemedicine' | 'Follow-up' | 'Procedure' | 'Emergency';

interface Appointment {
  id: string; token: string; time: string; duration: number; // minutes
  patientName: string; patientMrn: string; patientAge: number; patientGender: string;
  doctor: string; department: string; type: ApptType; status: ApptStatus;
  reason: string; notes?: string;
}

// ─── Mock ──────────────────────────────────────────────────────────────────────
const APPOINTMENTS: Appointment[] = [
  { id: 'a1', token: 'A-01', time: '09:00', duration: 20, patientName: 'Rohit Sharma', patientMrn: 'MRN-2024-07241', patientAge: 32, patientGender: 'M', doctor: 'Dr. Priya Mehta', department: 'Cardiology', type: 'OPD', status: 'Completed', reason: 'Chest pain evaluation' },
  { id: 'a2', token: 'A-02', time: '09:30', duration: 30, patientName: 'Priya Patel', patientMrn: 'MRN-2024-08912', patientAge: 45, patientGender: 'F', doctor: 'Dr. Priya Mehta', department: 'Cardiology', type: 'Follow-up', status: 'Completed', reason: 'Post-angioplasty review' },
  { id: 'a3', token: 'A-03', time: '10:00', duration: 20, patientName: 'Anil Kumar', patientMrn: 'MRN-2024-06133', patientAge: 58, patientGender: 'M', doctor: 'Dr. Suresh Gupta', department: 'Endocrinology', type: 'Telemedicine', status: 'Checked In', reason: 'Diabetes management' },
  { id: 'a4', token: 'A-04', time: '10:30', duration: 15, patientName: 'Deepa Nair', patientMrn: 'MRN-2024-09456', patientAge: 29, patientGender: 'F', doctor: 'Dr. Priya Mehta', department: 'Cardiology', type: 'OPD', status: 'Checked In', reason: 'Hypertension follow-up' },
  { id: 'a5', token: 'A-05', time: '11:00', duration: 45, patientName: 'Mohammed Ali', patientMrn: 'MRN-2024-04877', patientAge: 63, patientGender: 'M', doctor: 'Dr. Rao Srinivas', department: 'Neurology', type: 'Procedure', status: 'Confirmed', reason: 'EEG + Nerve conduction study' },
  { id: 'a6', token: 'A-06', time: '11:30', duration: 20, patientName: 'Kavitha Rajan', patientMrn: 'MRN-2024-03612', patientAge: 45, patientGender: 'F', doctor: 'Dr. Priya Mehta', department: 'Cardiology', type: 'OPD', status: 'Scheduled', reason: 'Annual cardiac check' },
  { id: 'a7', token: 'A-07', time: '12:00', duration: 20, patientName: 'Raju Pillai', patientMrn: 'MRN-2024-02001', patientAge: 55, patientGender: 'M', doctor: 'Dr. Rao Srinivas', department: 'Neurology', type: 'Follow-up', status: 'No Show', reason: 'Post-stroke follow-up' },
  { id: 'a8', token: 'A-08', time: '14:00', duration: 30, patientName: 'Sunita Sharma', patientMrn: 'MRN-2024-05512', patientAge: 52, patientGender: 'F', doctor: 'Dr. Suresh Gupta', department: 'Endocrinology', type: 'Telemedicine', status: 'Scheduled', reason: 'HbA1c review — Thyroid panel' },
  { id: 'a9', token: 'A-09', time: '14:30', duration: 60, patientName: 'Venkat Rao', patientMrn: 'MRN-2024-07823', patientAge: 78, patientGender: 'M', doctor: 'Dr. K. Venkatesh', department: 'Pulmonology', type: 'Procedure', status: 'Scheduled', reason: 'Bronchoscopy — COPD evaluation' },
  { id: 'a10', token: 'A-10', time: '15:30', duration: 20, patientName: 'Meena Gupta', patientMrn: 'MRN-2024-06091', patientAge: 41, patientGender: 'F', doctor: 'Dr. Suresh Gupta', department: 'Endocrinology', type: 'Follow-up', status: 'Cancelled', reason: 'Metformin dosage review', notes: 'Patient called to cancel — travel' },
];

// ─── Configs ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ApptStatus, { bg: string; text: string; dot: string; icon: React.ElementType }> = {
  'Scheduled':  { bg: 'bg-slate-100 dark:bg-slate-800',       text: 'text-slate-600 dark:text-slate-400',   dot: 'bg-slate-400',                icon: Clock },
  'Confirmed':  { bg: 'bg-blue-50 dark:bg-blue-900/20',       text: 'text-blue-700 dark:text-blue-400',     dot: 'bg-blue-500',                 icon: CheckCircle },
  'Checked In': { bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-700 dark:text-amber-400',   dot: 'bg-amber-500 animate-pulse',  icon: Clock },
  'Completed':  { bg: 'bg-green-50 dark:bg-green-900/20',     text: 'text-green-700 dark:text-green-400',   dot: 'bg-green-500',                icon: CheckCircle },
  'Cancelled':  { bg: 'bg-red-50 dark:bg-red-900/20',         text: 'text-red-700 dark:text-red-400',       dot: 'bg-red-400',                  icon: XCircle },
  'No Show':    { bg: 'bg-orange-50 dark:bg-orange-900/20',   text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-400',               icon: AlertTriangle },
};

const TYPE_CONFIG: Record<ApptType, string> = {
  'OPD':        'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Telemedicine':'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Follow-up':  'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Procedure':  'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Emergency':  'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function computeStats(appts: Appointment[]) {
  return {
    total:     appts.length,
    completed: appts.filter(a => a.status === 'Completed').length,
    waiting:   appts.filter(a => a.status === 'Checked In' || a.status === 'Scheduled' || a.status === 'Confirmed').length,
    cancelled: appts.filter(a => a.status === 'Cancelled' || a.status === 'No Show').length,
  };
}

export default function AppointmentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ApptStatus>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | ApptType>('All');

  const filtered = useMemo(() =>
    APPOINTMENTS.filter(a => {
      const matchSearch = [a.patientName, a.patientMrn, a.doctor, a.reason].some(f =>
        f.toLowerCase().includes(search.toLowerCase())
      );
      const matchStatus = statusFilter === 'All' || a.status === statusFilter;
      const matchType   = typeFilter === 'All' || a.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    }), [search, statusFilter, typeFilter]);

  const stats = computeStats(APPOINTMENTS);

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
        <div className="px-8 pt-7 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Appointments</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage schedule and visits</p>
            </div>
            <div className="flex gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
                <Plus className="w-4 h-4" /> Book Appointment
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-5">
            {[
              { label: 'Total', value: stats.total, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
              { label: 'Completed', value: stats.completed, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
              { label: 'Waiting / Upcoming', value: stats.waiting, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: 'Cancelled / No Show', value: stats.cancelled, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4 flex flex-col items-center justify-center`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient, doctor, or reason..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['All', 'OPD', 'Telemedicine', 'Follow-up', 'Procedure'] as const).map(t => (
                <button key={t} onClick={() => setTypeFilter(t as typeof typeFilter)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${typeFilter === t ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-8 pb-8 flex-1">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((appt) => {
                const sc = STATUS_CONFIG[appt.status];
                return (
                  <div key={appt.id} className="flex items-center gap-4 px-5 py-4 hover:bg-indigo-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                    <div className="w-16 text-center shrink-0">
                      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">{appt.time}</p>
                      <p className="text-xs text-slate-400">{appt.duration}m</p>
                    </div>
                    <div className="w-12 text-center shrink-0">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">{appt.token}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {appt.patientName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{appt.patientName}</p>
                        <p className="text-xs text-slate-500">{appt.patientAge}y · {appt.patientGender} · <span className="font-mono">{appt.patientMrn}</span></p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 ${TYPE_CONFIG[appt.type]}`}>
                      {appt.type === 'Telemedicine' ? <Video className="w-3 h-3" /> : <Stethoscope className="w-3 h-3" />}
                      {appt.type}
                    </span>
                    <div className="hidden lg:block flex-1 min-w-0">
                      <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{appt.reason}</p>
                      <p className="text-xs text-slate-400 truncate">{appt.doctor} · {appt.department}</p>
                    </div>
                    <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{appt.status}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href="/consultations" className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap">Consult</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
