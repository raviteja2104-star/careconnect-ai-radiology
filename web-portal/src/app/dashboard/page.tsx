'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import {
  Users, Clock, AlertTriangle, IndianRupee, Video,
  Activity, Calendar, FileText, ArrowRight, Bell,
  TrendingUp, TrendingDown, Stethoscope, FlaskConical,
  CheckCircle, XCircle, Heart, Pill, ChevronRight,
  MoreVertical
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface QueuePatient {
  token: string; name: string; age: string; gender: string;
  type: 'OPD' | 'Telemedicine' | 'Follow-up';
  time: string; waitMins: number; risk: 'Low' | 'Medium' | 'High';
  status: 'Waiting' | 'Vitals Taken' | 'Scheduled' | 'In Consultation';
  mrn: string;
}

interface Task { title: string; patient: string; time: string; type: 'radiology' | 'prescription' | 'lab' | 'approval'; priority: 'normal' | 'urgent'; }
interface Alert { id: string; type: 'critical' | 'warning' | 'info'; message: string; patient: string; time: string; }

// ─── Mock Data ─────────────────────────────────────────────────────────────────
const KPI_STATS = [
  { label: "Today's Appointments", value: '42', sub: '+5 from yesterday', icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', trend: 'up' },
  { label: 'Waiting Queue', value: '12', sub: '3 waited > 30 min', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', trend: 'neutral' },
  { label: 'Critical Alerts', value: '3', sub: '2 new since last login', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30', trend: 'up' },
  { label: 'Revenue (Today)', value: '₹45,200', sub: '↑ 12% vs last week', icon: IndianRupee, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30', trend: 'up' },
];

const QUEUE: QueuePatient[] = [
  { token: 'A-01', name: 'Rohit Sharma', age: '32', gender: 'M', type: 'OPD', time: '10:00 AM', waitMins: 15, risk: 'Low', status: 'Waiting', mrn: 'MRN-2024-07241' },
  { token: 'A-02', name: 'Priya Patel', age: '45', gender: 'F', type: 'Follow-up', time: '10:15 AM', waitMins: 5, risk: 'High', status: 'Vitals Taken', mrn: 'MRN-2024-08912' },
  { token: 'A-03', name: 'Anil Kumar', age: '58', gender: 'M', type: 'Telemedicine', time: '10:30 AM', waitMins: 0, risk: 'Medium', status: 'Scheduled', mrn: 'MRN-2024-06133' },
  { token: 'A-04', name: 'Deepa Nair', age: '29', gender: 'F', type: 'OPD', time: '10:45 AM', waitMins: 32, risk: 'Low', status: 'Waiting', mrn: 'MRN-2024-09456' },
  { token: 'A-05', name: 'Mohammed Ali', age: '63', gender: 'M', type: 'Follow-up', time: '11:00 AM', waitMins: 0, risk: 'High', status: 'In Consultation', mrn: 'MRN-2024-04877' },
];

const TASKS: Task[] = [
  { title: 'Review MRI Brain — Possible Ischemia', patient: 'Suresh Verma', time: '2h ago', type: 'radiology', priority: 'urgent' },
  { title: 'Sign Prescription Refill (Metformin)', patient: 'Meena Gupta', time: '4h ago', type: 'prescription', priority: 'normal' },
  { title: 'Critical Lab: HbA1c 9.8% — Action Required', patient: 'Vikram Singh', time: '1h ago', type: 'lab', priority: 'urgent' },
  { title: 'Discharge Summary Approval', patient: 'Lakshmi Reddy', time: '30m ago', type: 'approval', priority: 'urgent' },
];

const ALERTS: Alert[] = [
  { id: '1', type: 'critical', message: 'Troponin I critically elevated — 4.82 ng/mL', patient: 'Ravi Kumar (MRN-2024-08742)', time: '09:52' },
  { id: '2', type: 'warning', message: 'Drug interaction: Warfarin + Aspirin flagged', patient: 'Deepa Nair (MRN-2024-09456)', time: '09:30' },
  { id: '3', type: 'info', message: 'Imaging complete: CT Chest report available', patient: 'Anil Kumar (MRN-2024-06133)', time: '08:45' },
];

const UPCOMING = [
  { time: '14:00', name: 'Kavitha Rajan', type: 'New Consult', specialty: 'Cardiology' },
  { time: '14:30', name: 'Raju Pillai', type: 'Follow-up', specialty: 'Neurology' },
  { time: '15:00', name: 'Sunita Sharma', type: 'Telemedicine', specialty: 'Endocrinology' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  'Waiting':         { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  'Vitals Taken':    { dot: 'bg-green-500',  text: 'text-green-700 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20' },
  'Scheduled':       { dot: 'bg-slate-400',  text: 'text-slate-600 dark:text-slate-400',  bg: 'bg-slate-100 dark:bg-slate-800' },
  'In Consultation': { dot: 'bg-indigo-500 animate-pulse', text: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
};
const RISK_CONFIG = {
  Low:    'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  Medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  High:   'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
};
const TASK_CONFIG = {
  radiology:    { color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30', icon: Activity },
  prescription: { color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30', icon: Pill },
  lab:          { color: 'bg-red-50 text-red-600 dark:bg-red-900/30', icon: FlaskConical },
  approval:     { color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30', icon: CheckCircle },
};
const ALERT_CONFIG = {
  critical: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
  warning:  'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
  info:     'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [queueFilter, setQueueFilter] = useState<'All' | 'OPD' | 'Telemedicine' | 'Follow-up'>('All');
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const filteredQueue = QUEUE.filter(p => queueFilter === 'All' || p.type === queueFilter);
  const activeAlerts = ALERTS.filter(a => !dismissedAlerts.includes(a.id));

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">

        {/* ── Header ── */}
        <div className="px-8 pt-7 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Good Morning, Dr. Sharma 👋</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{today}</p>
            </div>
            <div className="flex gap-3">
              <Link href="/appointments" className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
                <Calendar className="w-4 h-4" /> Manage Schedule
              </Link>
              <Link href="/emr" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
                <Stethoscope className="w-4 h-4" /> Start Next Consult
              </Link>
            </div>
          </div>

          {/* ── KPI Row ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {KPI_STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${stat.bg}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{stat.value}</p>
                    <p className={`text-xs mt-0.5 flex items-center gap-1 ${stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                      {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : null}
                      {stat.sub}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Active Alerts Banner ── */}
        {activeAlerts.length > 0 && (
          <div className="px-8 mb-2 space-y-2">
            {activeAlerts.map(alert => (
              <div key={alert.id} className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${ALERT_CONFIG[alert.type]}`}>
                {alert.type === 'critical' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <Bell className="w-4 h-4 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <span className="font-semibold">{alert.message}</span>
                  <span className="text-xs opacity-70 ml-2">· {alert.patient} · {alert.time}</span>
                </div>
                <button onClick={() => setDismissedAlerts(p => [...p, alert.id])} className="shrink-0 p-1 hover:opacity-70 transition-opacity" aria-label="Dismiss">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── Main Content ── */}
        <div className="px-8 pb-8 flex-1 flex flex-col xl:flex-row gap-6">

          {/* ── Left: Queue ── */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col overflow-hidden">
              {/* Queue header */}
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Patient Queue
                    <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full">{QUEUE.length}</span>
                  </h2>
                  <div className="flex gap-1">
                    {(['All', 'OPD', 'Telemedicine', 'Follow-up'] as const).map(f => (
                      <button key={f} onClick={() => setQueueFilter(f)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${queueFilter === f ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Queue table */}
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs uppercase tracking-wider text-slate-500">
                      {['Token', 'Patient', 'Type', 'Time', 'Wait', 'Risk', 'Status', 'Action'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-left font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredQueue.map((p) => {
                      const sc = STATUS_CONFIG[p.status];
                      return (
                        <tr key={p.token} className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/50 transition-colors group">
                          <td className="px-5 py-4 font-bold text-slate-900 dark:text-white font-mono">{p.token}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {p.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-white">{p.name}</p>
                                <p className="text-xs text-slate-500">{p.age}y · {p.gender} · <span className="font-mono">{p.mrn}</span></p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${p.type === 'Telemedicine' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                              {p.type === 'Telemedicine' && <Video className="w-3 h-3" />}
                              {p.type}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">{p.time}</td>
                          <td className="px-5 py-4">
                            <span className={`font-semibold ${p.waitMins > 20 ? 'text-red-600 dark:text-red-400' : p.waitMins > 10 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>
                              {p.waitMins > 0 ? `${p.waitMins}m` : '—'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${RISK_CONFIG[p.risk]}`}>{p.risk}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${sc.bg} ${sc.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                              {p.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {p.type === 'Telemedicine' && (
                                <Link href="/consultations" className="p-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg transition-colors" title="Join Video">
                                  <Video className="w-3.5 h-3.5" />
                                </Link>
                              )}
                              <Link href="/emr" className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-lg hover:opacity-80 transition-opacity whitespace-nowrap">
                                Open Chart
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400">Showing {filteredQueue.length} of {QUEUE.length} patients</span>
                <Link href="/appointments" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                  View Full Schedule <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* ── Right: Sidebar ── */}
          <div className="w-full xl:w-[360px] shrink-0 flex flex-col gap-5">

            {/* Task Center */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white">Task Center</h3>
                <span className="text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
                  {TASKS.filter(t => t.priority === 'urgent').length} Urgent
                </span>
              </div>
              <div className="p-2">
                {TASKS.map((task, i) => {
                  const cfg = TASK_CONFIG[task.type];
                  const Icon = cfg.icon;
                  return (
                    <Link key={i} href={task.type === 'prescription' ? '/prescriptions' : task.type === 'lab' ? '/lab-orders' : '/emr'} className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer group block">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors leading-snug">{task.title}</p>
                          {task.priority === 'urgent' && <span className="shrink-0 text-[10px] font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">URGENT</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{task.patient} · {task.time}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Upcoming */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white">Upcoming (Afternoon)</h3>
              </div>
              <div className="p-3 space-y-2">
                {UPCOMING.map((a, i) => (
                  <Link key={i} href="/appointments" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                    <div className="w-14 text-center">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">{a.time}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{a.name}</p>
                      <p className="text-xs text-slate-500">{a.type} · {a.specialty}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </Link>
                ))}
              </div>
            </div>

            {/* AI Briefing */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg p-5 text-white relative overflow-hidden">
              <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm"><Activity className="w-4 h-4" /></div>
                  <span className="font-bold text-sm">AI Daily Briefing</span>
                </div>
                <p className="text-sm text-indigo-100 leading-relaxed mb-4">
                  You have <strong>3 high-risk patients</strong> today. <strong>Suresh Verma's</strong> MRI shows minor ischemia — review recommended before 12:00.
                </p>
                <Link href="/emr" className="w-full py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
                  <Heart className="w-3.5 h-3.5" /> Open AI Copilot
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
