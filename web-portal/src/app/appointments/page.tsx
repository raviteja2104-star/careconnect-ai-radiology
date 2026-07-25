'use client';

import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Search,
  Video, Phone, Clock, CheckCircle, XCircle, AlertTriangle,
  MoreVertical, Filter, User, Stethoscope, X, Mic, MicOff,
  VideoOff, PhoneOff, MessageSquare, Maximize2, Shield
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

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: 'a1', token: 'A-01', time: '09:00', duration: 20, patientName: 'Rohit Sharma', patientMrn: 'MRN-2024-07241', patientAge: 32, patientGender: 'M', doctor: 'Dr. Priya Mehta', department: 'Cardiology', type: 'OPD', status: 'Completed', reason: 'Chest pain evaluation' },
  { id: 'a2', token: 'A-02', time: '09:30', duration: 30, patientName: 'Priya Patel', patientMrn: 'MRN-2024-08912', patientAge: 45, patientGender: 'F', doctor: 'Dr. Priya Mehta', department: 'Cardiology', type: 'Follow-up', status: 'Completed', reason: 'Post-angioplasty review' },
  { id: 'a3', token: 'A-03', time: '10:00', duration: 20, patientName: 'Anil Kumar', patientMrn: 'MRN-2024-06133', patientAge: 58, patientGender: 'M', doctor: 'Dr. Suresh Gupta', department: 'Endocrinology', type: 'Telemedicine', status: 'Checked In', reason: 'Diabetes management & HbA1c review' },
  { id: 'a4', token: 'A-04', time: '10:30', duration: 15, patientName: 'Deepa Nair', patientMrn: 'MRN-2024-09456', patientAge: 29, patientGender: 'F', doctor: 'Dr. Priya Mehta', department: 'Cardiology', type: 'OPD', status: 'Checked In', reason: 'Hypertension follow-up' },
  { id: 'a5', token: 'A-05', time: '11:00', duration: 45, patientName: 'Mohammed Ali', patientMrn: 'MRN-2024-04877', patientAge: 63, patientGender: 'M', doctor: 'Dr. Rao Srinivas', department: 'Neurology', type: 'Procedure', status: 'Confirmed', reason: 'EEG + Nerve conduction study' },
  { id: 'a6', token: 'A-06', time: '11:30', duration: 20, patientName: 'Kavitha Rajan', patientMrn: 'MRN-2024-03612', patientAge: 45, patientGender: 'F', doctor: 'Dr. Priya Mehta', department: 'Cardiology', type: 'OPD', status: 'Scheduled', reason: 'Annual cardiac check' },
  { id: 'a7', token: 'A-07', time: '12:00', duration: 20, patientName: 'Raju Pillai', patientMrn: 'MRN-2024-02001', patientAge: 55, patientGender: 'M', doctor: 'Dr. Rao Srinivas', department: 'Neurology', type: 'Follow-up', status: 'No Show', reason: 'Post-stroke follow-up' },
  { id: 'a8', token: 'A-08', time: '14:00', duration: 30, patientName: 'Sunita Sharma', patientMrn: 'MRN-2024-05512', patientAge: 52, patientGender: 'F', doctor: 'Dr. Suresh Gupta', department: 'Endocrinology', type: 'Telemedicine', status: 'Scheduled', reason: 'HbA1c review — Thyroid panel' },
  { id: 'a9', token: 'A-09', time: '14:30', duration: 60, patientName: 'Venkat Rao', patientMrn: 'MRN-2024-07823', patientAge: 78, patientGender: 'M', doctor: 'Dr. K. Venkatesh', department: 'Pulmonology', type: 'Procedure', status: 'Scheduled', reason: 'Bronchoscopy — COPD evaluation' },
  { id: 'a10', token: 'A-10', time: '15:30', duration: 20, patientName: 'Meena Gupta', patientMrn: 'MRN-2024-06091', patientAge: 41, patientGender: 'F', doctor: 'Dr. Suresh Gupta', department: 'Endocrinology', type: 'Follow-up', status: 'Cancelled', reason: 'Metformin dosage review' },
];

const DOCTORS = [
  { name: 'Dr. Priya Mehta', department: 'Cardiology' },
  { name: 'Dr. Suresh Gupta', department: 'Endocrinology' },
  { name: 'Dr. Rao Srinivas', department: 'Neurology' },
  { name: 'Dr. K. Venkatesh', department: 'Pulmonology' },
];

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

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ApptStatus>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | ApptType>('All');

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [activeVideoAppt, setActiveVideoAppt] = useState<Appointment | null>(null);

  // Video call controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // New Appointment Form
  const [patientName, setPatientName] = useState('');
  const [patientMrn, setPatientMrn] = useState('MRN-2024-0' + Math.floor(1000 + Math.random() * 9000));
  const [doctor, setDoctor] = useState(DOCTORS[0].name);
  const [type, setType] = useState<ApptType>('OPD');
  const [time, setTime] = useState('16:00');
  const [reason, setReason] = useState('');

  const filtered = useMemo(() =>
    appointments.filter(a => {
      const matchSearch = [a.patientName, a.patientMrn, a.doctor, a.reason].some(f =>
        f.toLowerCase().includes(search.toLowerCase())
      );
      const matchStatus = statusFilter === 'All' || a.status === statusFilter;
      const matchType   = typeFilter === 'All' || a.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    }), [appointments, search, statusFilter, typeFilter]);

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const docObj = DOCTORS.find(d => d.name === doctor) || DOCTORS[0];
    const newAppt: Appointment = {
      id: `a${Date.now()}`,
      token: `A-${appointments.length + 1}`,
      time,
      duration: 20,
      patientName: patientName || 'New Patient',
      patientMrn,
      patientAge: 35,
      patientGender: 'M',
      doctor: docObj.name,
      department: docObj.department,
      type,
      status: 'Confirmed',
      reason: reason || 'General Consultation'
    };
    setAppointments([...appointments, newAppt]);
    setIsBookModalOpen(false);
    setPatientName('');
    setReason('');
  };

  const stats = {
    total: appointments.length,
    completed: appointments.filter(a => a.status === 'Completed').length,
    waiting: appointments.filter(a => ['Checked In', 'Scheduled', 'Confirmed'].includes(a.status)).length,
    cancelled: appointments.filter(a => ['Cancelled', 'No Show'].includes(a.status)).length,
  };

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto relative">

        {/* ── Header ── */}
        <div className="px-8 pt-7 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Appointments</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage schedule and visits</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsBookModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-indigo-500/25 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Book Appointment
              </button>
            </div>
          </div>

          {/* Stats Bar */}
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

          {/* Search + Filter */}
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

        {/* ── Appointment List ── */}
        <div className="px-8 pb-8 flex-1">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((appt) => {
              const sc = STATUS_CONFIG[appt.status];
              const isTelemed = appt.type === 'Telemedicine';

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
                    {isTelemed ? <Video className="w-3 h-3 text-purple-600" /> : <Stethoscope className="w-3 h-3" />}
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
                    {isTelemed && (
                      <button
                        onClick={() => setActiveVideoAppt(appt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                        title="Start Teleconsultation Video Call"
                      >
                        <Video className="w-3.5 h-3.5" /> Video Call
                      </button>
                    )}
                    <Link href="/consultations" className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap">
                      Consult
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── BOOK APPOINTMENT MODAL ── */}
        {isBookModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">Book New Appointment</h3>
                </div>
                <button onClick={() => setIsBookModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleBookSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Patient Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikramaditya Singh"
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">MRN Number</label>
                    <input
                      type="text"
                      value={patientMrn}
                      onChange={e => setPatientMrn(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Time Slot</label>
                    <input
                      type="time"
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Consulting Doctor</label>
                    <select
                      value={doctor}
                      onChange={e => setDoctor(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {DOCTORS.map(d => <option key={d.name} value={d.name}>{d.name} ({d.department})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Visit Type</label>
                    <select
                      value={type}
                      onChange={e => setType(e.target.value as ApptType)}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium dark:text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="OPD">OPD Consultation</option>
                      <option value="Telemedicine">Telemedicine Video Call</option>
                      <option value="Follow-up">Follow-up Visit</option>
                      <option value="Procedure">Clinical Procedure</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Chief Complaint / Reason for Visit</label>
                  <textarea
                    rows={3}
                    placeholder="Describe symptoms or visit objective..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsBookModalOpen(false)}
                    className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Confirm Booking
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── TELECONSULTATION VIDEO CALL MODAL ── */}
        {activeVideoAppt && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col p-4 md:p-8 animate-in fade-in duration-200">
            {/* Call Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                <div>
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    HD Teleconsultation Session
                    <span className="text-xs bg-purple-900/60 text-purple-300 border border-purple-700 px-2 py-0.5 rounded-full font-mono">Encrypted WebRTC</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Patient: <strong className="text-slate-200">{activeVideoAppt.patientName}</strong> ({activeVideoAppt.patientMrn}) · {activeVideoAppt.doctor}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-xl">04:12</span>
                <button onClick={() => setActiveVideoAppt(null)} className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Video Canvas Container */}
            <div className="flex-1 my-4 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden relative">
              {/* Main Feed (Patient) */}
              <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden flex items-center justify-center group shadow-2xl">
                {!isVideoOff ? (
                  <div className="w-full h-full relative bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 flex flex-col items-center justify-center p-6">
                    {/* Simulated Live Video Animation Avatar */}
                    <div className="relative mb-6">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold shadow-2xl animate-pulse">
                        {activeVideoAppt.patientName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-slate-900 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> LIVE 1080p
                      </div>
                    </div>
                    <h4 className="text-white font-bold text-xl">{activeVideoAppt.patientName}</h4>
                    <p className="text-slate-400 text-sm">{activeVideoAppt.reason}</p>

                    {/* Animated Audio Waveform overlay */}
                    <div className="flex items-center gap-1 mt-6">
                      {[40, 70, 30, 90, 60, 100, 50, 80, 40].map((h, idx) => (
                        <div key={idx} className="w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ height: `${h / 2}px`, animationDelay: `${idx * 0.1}s` }} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-500">
                    <VideoOff className="w-12 h-12 mb-2" />
                    <p>Camera feed disabled</p>
                  </div>
                )}

                {/* PIP Self Feed */}
                <div className="absolute bottom-4 right-4 w-44 h-32 bg-slate-950 border-2 border-indigo-500/50 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center justify-center text-white">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">You</div>
                  <span className="text-[10px] text-slate-400 mt-1">Dr. Raj Sharma</span>
                </div>
              </div>

              {/* Side Panel: Clinical Notes & Vitals */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-indigo-400" /> Live In-Call Consult Notes
                  </h4>
                  <textarea
                    rows={6}
                    placeholder="Type SOAP clinical notes during video consultation..."
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  />
                  <div className="mt-3 p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between text-slate-400"><span>Heart Rate:</span><span className="text-emerald-400 font-bold font-mono">74 bpm</span></div>
                    <div className="flex justify-between text-slate-400"><span>Blood Pressure:</span><span className="text-emerald-400 font-bold font-mono">122/80 mmHg</span></div>
                    <div className="flex justify-between text-slate-400"><span>SpO₂:</span><span className="text-emerald-400 font-bold font-mono">98%</span></div>
                  </div>
                </div>

                <Link
                  href="/consultations"
                  onClick={() => setActiveVideoAppt(null)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  Save Note & Transfer to EMR
                </Link>
              </div>
            </div>

            {/* Video Controls Bar */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-center gap-4">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3.5 rounded-2xl transition-all cursor-pointer ${isMuted ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`p-3.5 rounded-2xl transition-all cursor-pointer ${isVideoOff ? 'bg-red-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setActiveVideoAppt(null)}
                className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <PhoneOff className="w-5 h-5" /> End Call
              </button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
