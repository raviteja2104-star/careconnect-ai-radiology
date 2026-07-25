'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import {
  Pill, Plus, Search, AlertTriangle, CheckCircle, Clock,
  XCircle, MoreVertical, Filter, RefreshCw, Download,
  ChevronRight, Activity, User, Calendar
} from 'lucide-react';

type RxStatus = 'Active' | 'Completed' | 'Discontinued' | 'On Hold' | 'Pending';
type RxRoute  = 'Oral' | 'IV' | 'IM' | 'Topical' | 'Inhaled' | 'Subcutaneous';

interface Prescription {
  id: string; mrn: string; patientName: string; patientAge: number; patientGender: string;
  drugName: string; genericName: string; dose: string; frequency: string; route: RxRoute;
  duration: string; startDate: string; endDate?: string;
  status: RxStatus; prescribedBy: string; department: string;
  isHighAlert: boolean; indication: string; dispensed: boolean;
  refillsRemaining?: number;
}

const PRESCRIPTIONS: Prescription[] = [
  { id: 'rx1', mrn: 'MRN-2024-07241', patientName: 'Rohit Sharma', patientAge: 32, patientGender: 'M', drugName: 'Aspirin', genericName: 'Aspirin', dose: '75mg', frequency: 'Once daily', route: 'Oral', duration: '90 days', startDate: '24 Jul 2026', status: 'Active', prescribedBy: 'Dr. Priya Mehta', department: 'Cardiology', isHighAlert: false, indication: 'Secondary prevention — Antiplatelet', dispensed: true, refillsRemaining: 2 },
  { id: 'rx2', mrn: 'MRN-2024-07241', patientName: 'Rohit Sharma', patientAge: 32, patientGender: 'M', drugName: 'Clopidogrel', genericName: 'Clopidogrel', dose: '75mg', frequency: 'Once daily', route: 'Oral', duration: '12 months', startDate: '24 Jul 2026', status: 'Active', prescribedBy: 'Dr. Priya Mehta', department: 'Cardiology', isHighAlert: false, indication: 'DAPT — Post PCI', dispensed: true, refillsRemaining: 3 },
  { id: 'rx3', mrn: 'MRN-2024-07241', patientName: 'Rohit Sharma', patientAge: 32, patientGender: 'M', drugName: 'Heparin', genericName: 'Heparin Sodium', dose: '5000 IU', frequency: '8 hourly', route: 'Subcutaneous', duration: '5 days', startDate: '24 Jul 2026', status: 'Active', prescribedBy: 'Dr. Priya Mehta', department: 'Cardiology', isHighAlert: true, indication: 'Anticoagulation — DVT prophylaxis', dispensed: false },
  { id: 'rx4', mrn: 'MRN-2024-06133', patientName: 'Anil Kumar', patientAge: 58, patientGender: 'M', drugName: 'Metformin', genericName: 'Metformin HCl', dose: '1000mg', frequency: 'Twice daily with meals', route: 'Oral', duration: 'Ongoing', startDate: '01 Jan 2026', status: 'Active', prescribedBy: 'Dr. Suresh Gupta', department: 'Endocrinology', isHighAlert: false, indication: 'Type 2 Diabetes Mellitus', dispensed: true, refillsRemaining: 1 },
  { id: 'rx5', mrn: 'MRN-2024-06133', patientName: 'Anil Kumar', patientAge: 58, patientGender: 'M', drugName: 'Glipizide', genericName: 'Glipizide', dose: '5mg', frequency: 'Before breakfast', route: 'Oral', duration: 'Ongoing', startDate: '15 Mar 2026', status: 'On Hold', prescribedBy: 'Dr. Suresh Gupta', department: 'Endocrinology', isHighAlert: false, indication: 'HbA1c uncontrolled — Add-on', dispensed: false },
  { id: 'rx6', mrn: 'MRN-2024-09133', patientName: 'Ananya Krishnamurthy', patientAge: 67, patientGender: 'F', drugName: 'Noradrenaline', genericName: 'Norepinephrine', dose: '0.1 mcg/kg/min', frequency: 'Continuous infusion', route: 'IV', duration: 'Until haemodynamically stable', startDate: '23 Jul 2026', status: 'Active', prescribedBy: 'Dr. Rajesh Iyer', department: 'ICU', isHighAlert: true, indication: 'Septic Shock — Vasopressor support', dispensed: true },
  { id: 'rx7', mrn: 'MRN-2024-05188', patientName: 'Suresh Venkataraman', patientAge: 71, patientGender: 'M', drugName: 'Tiotropium', genericName: 'Tiotropium Bromide', dose: '18mcg', frequency: 'Once daily via inhaler', route: 'Inhaled', duration: 'Ongoing', startDate: '10 Jun 2026', status: 'Completed', prescribedBy: 'Dr. K. Venkatesh', department: 'Pulmonology', isHighAlert: false, indication: 'COPD Maintenance', dispensed: true, endDate: '10 Jul 2026' },
  { id: 'rx8', mrn: 'MRN-2024-03612', patientName: 'Kavitha Rajan', patientAge: 45, patientGender: 'F', drugName: 'Amlodipine', genericName: 'Amlodipine Besylate', dose: '5mg', frequency: 'Once daily', route: 'Oral', duration: 'Ongoing', startDate: '01 Feb 2026', status: 'Active', prescribedBy: 'Dr. Priya Mehta', department: 'Cardiology', isHighAlert: false, indication: 'Hypertension Grade II', dispensed: true, refillsRemaining: 0 },
];

const STATUS_CFG: Record<RxStatus, { bg: string; text: string; dot: string }> = {
  Active:       { bg: 'bg-green-50 dark:bg-green-900/20',   text: 'text-green-700 dark:text-green-400',   dot: 'bg-green-500' },
  Completed:    { bg: 'bg-slate-100 dark:bg-slate-800',     text: 'text-slate-600 dark:text-slate-400',   dot: 'bg-slate-400' },
  Discontinued: { bg: 'bg-red-50 dark:bg-red-900/20',       text: 'text-red-700 dark:text-red-400',       dot: 'bg-red-500' },
  'On Hold':    { bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-700 dark:text-amber-400',   dot: 'bg-amber-500' },
  Pending:      { bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-700 dark:text-blue-400',     dot: 'bg-blue-500' },
};

const ROUTE_CFG: Record<RxRoute, string> = {
  Oral:          'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  IV:            'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  IM:            'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Topical:       'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  Inhaled:       'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Subcutaneous:  'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

const SUMMARY_STATS = [
  { label: 'Active Orders', value: PRESCRIPTIONS.filter(r => r.status === 'Active').length, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', icon: CheckCircle },
  { label: 'High-Alert Drugs', value: PRESCRIPTIONS.filter(r => r.isHighAlert).length, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', icon: AlertTriangle },
  { label: 'Pending Dispense', value: PRESCRIPTIONS.filter(r => !r.dispensed && r.status === 'Active').length, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Clock },
  { label: 'Refill Needed', value: PRESCRIPTIONS.filter(r => r.refillsRemaining === 0).length, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: RefreshCw },
];

export default function PrescriptionsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | RxStatus>('All');

  const filtered = PRESCRIPTIONS.filter(rx => {
    const matchSearch = [rx.patientName, rx.drugName, rx.genericName, rx.mrn, rx.indication].some(f =>
      f.toLowerCase().includes(search.toLowerCase())
    );
    const matchStatus = statusFilter === 'All' || rx.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
        <div className="px-8 pt-7 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Prescriptions</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Medication orders and dispensing status</p>
            </div>
            <div className="flex gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
                <Plus className="w-4 h-4" /> New Prescription
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {SUMMARY_STATS.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
                  <Icon className={`w-5 h-5 ${s.color} shrink-0`} />
                  <div>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search drug, patient, or indication..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['All', 'Active', 'On Hold', 'Completed', 'Discontinued'] as const).map(f => (
                <button key={f} onClick={() => setStatusFilter(f as typeof statusFilter)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${statusFilter === f ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-8 pb-8 flex-1">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs uppercase tracking-wider text-slate-500">
                    {['Drug', 'Patient', 'Dose / Frequency', 'Route', 'Duration', 'Prescribed By', 'Status', 'Dispensed'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map(rx => {
                    const sc = STATUS_CFG[rx.status];
                    return (
                      <tr key={rx.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {rx.isHighAlert && (
                              <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold rounded border border-red-200 dark:border-red-800">
                                <AlertTriangle className="w-2.5 h-2.5" /> HIGH ALERT
                              </span>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{rx.drugName}</p>
                              <p className="text-xs text-slate-500 italic">{rx.genericName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900 dark:text-white">{rx.patientName}</p>
                          <p className="text-xs text-slate-500 font-mono">{rx.mrn}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-800 dark:text-white">{rx.dose}</p>
                          <p className="text-xs text-slate-500">{rx.frequency}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${ROUTE_CFG[rx.route]}`}>{rx.route}</span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-700 dark:text-slate-300">{rx.duration}</td>
                        <td className="px-5 py-4">
                          <p className="text-slate-700 dark:text-slate-300 text-sm">{rx.prescribedBy}</p>
                          <p className="text-xs text-slate-400">{rx.department}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${sc.bg} ${sc.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{rx.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {rx.dispensed ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
