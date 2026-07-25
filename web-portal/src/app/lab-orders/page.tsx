'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  FlaskConical, Plus, Search, AlertTriangle, CheckCircle, Clock,
  ChevronDown, Download, TrendingUp, TrendingDown, RefreshCw
} from 'lucide-react';

type OrderStatus  = 'Pending' | 'Specimen Collected' | 'In Process' | 'Partial' | 'Final' | 'Verified';
type Priority     = 'Routine' | 'Urgent' | 'STAT';

interface LabResult {
  test: string; loincCode?: string;
  value: number | string; unit: string; referenceRange?: string;
  status: 'normal' | 'low' | 'high' | 'critical-low' | 'critical-high';
  delta?: number;
}

interface LabOrder {
  id: string; mrn: string; patientName: string; patientAge: number; patientGender: string;
  panelName: string; orderedBy: string; department: string;
  orderedAt: string; reportedAt?: string;
  status: OrderStatus; priority: Priority;
  results: LabResult[];
  specimenType: string;
}

const LAB_ORDERS: LabOrder[] = [
  {
    id: 'lo1', mrn: 'MRN-2024-07241', patientName: 'Rohit Sharma', patientAge: 32, patientGender: 'M',
    panelName: 'Cardiac Markers (STAT)', orderedBy: 'Dr. Priya Mehta', department: 'Cardiology',
    orderedAt: '09:18, 24 Jul', reportedAt: '09:52, 24 Jul', status: 'Final', priority: 'STAT',
    specimenType: 'Serum',
    results: [
      { test: 'Troponin I',   value: 4.82, unit: 'ng/mL', referenceRange: '<0.04', status: 'critical-high', delta: 4.78, loincCode: '42757-5' },
      { test: 'CK-MB',        value: 68,   unit: 'U/L',   referenceRange: '0–25',  status: 'critical-high', delta: 55 },
      { test: 'BNP',          value: 890,  unit: 'pg/mL', referenceRange: '<100',  status: 'high',          delta: 210 },
      { test: 'D-Dimer',      value: 1.2,  unit: 'mg/L',  referenceRange: '<0.5',  status: 'high' },
    ]
  },
  {
    id: 'lo2', mrn: 'MRN-2024-07241', patientName: 'Rohit Sharma', patientAge: 32, patientGender: 'M',
    panelName: 'Complete Blood Count (CBC)', orderedBy: 'Dr. Priya Mehta', department: 'Cardiology',
    orderedAt: '09:18, 24 Jul', reportedAt: '10:45, 24 Jul', status: 'Final', priority: 'Urgent',
    specimenType: 'EDTA Blood',
    results: [
      { test: 'Haemoglobin', value: 8.2,   unit: 'g/dL',  referenceRange: '13.5–17.5', status: 'low',   delta: -1.3 },
      { test: 'WBC',         value: 14800,  unit: '/µL',   referenceRange: '4000–11000', status: 'high',  delta: 2100 },
      { test: 'Platelets',   value: 145000, unit: '/µL',   referenceRange: '150–400k',   status: 'low' },
      { test: 'Haematocrit', value: 26.4,   unit: '%',     referenceRange: '41–53',      status: 'low' },
    ]
  },
  {
    id: 'lo3', mrn: 'MRN-2024-06133', patientName: 'Anil Kumar', patientAge: 58, patientGender: 'M',
    panelName: 'HbA1c + Lipid Profile', orderedBy: 'Dr. Suresh Gupta', department: 'Endocrinology',
    orderedAt: '10:00, 24 Jul', reportedAt: '11:30, 24 Jul', status: 'Verified', priority: 'Routine',
    specimenType: 'Serum',
    results: [
      { test: 'HbA1c',         value: 9.8,   unit: '%',      referenceRange: '<7.0',   status: 'critical-high', delta: 0.6, loincCode: '4548-4' },
      { test: 'Total Cholesterol', value: 218, unit: 'mg/dL', referenceRange: '<200',   status: 'high' },
      { test: 'LDL',           value: 148,   unit: 'mg/dL',  referenceRange: '<100',   status: 'high' },
      { test: 'HDL',           value: 38,    unit: 'mg/dL',  referenceRange: '>40',    status: 'low' },
      { test: 'Triglycerides', value: 189,   unit: 'mg/dL',  referenceRange: '<150',   status: 'high' },
    ]
  },
  {
    id: 'lo4', mrn: 'MRN-2024-09133', patientName: 'Ananya Krishnamurthy', patientAge: 67, patientGender: 'F',
    panelName: 'Sepsis Panel (Blood Culture + Procalcitonin)', orderedBy: 'Dr. Rajesh Iyer', department: 'ICU',
    orderedAt: '14:00, 23 Jul', status: 'In Process', priority: 'STAT',
    specimenType: 'Blood / Serum',
    results: []
  },
];

const RESULT_CFG = {
  normal:         { label: 'N',  textColor: 'text-green-700 dark:text-green-400', bg: '' },
  low:            { label: 'L',  textColor: 'text-blue-700 dark:text-blue-400',   bg: '' },
  high:           { label: 'H',  textColor: 'text-amber-700 dark:text-amber-400', bg: '' },
  'critical-low': { label: 'LL', textColor: 'text-red-700 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-900/10' },
  'critical-high':{ label: 'HH', textColor: 'text-red-700 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-900/10' },
};

const STATUS_CFG: Record<OrderStatus, { bg: string; text: string; dot: string }> = {
  'Pending':            { bg: 'bg-slate-100 dark:bg-slate-800',     text: 'text-slate-600 dark:text-slate-400',   dot: 'bg-slate-400' },
  'Specimen Collected': { bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-700 dark:text-blue-400',     dot: 'bg-blue-500' },
  'In Process':         { bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-700 dark:text-amber-400',   dot: 'bg-amber-500 animate-pulse' },
  'Partial':            { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
  'Final':              { bg: 'bg-green-50 dark:bg-green-900/20',   text: 'text-green-700 dark:text-green-400',   dot: 'bg-green-500' },
  'Verified':           { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400', dot: 'bg-indigo-500' },
};

const PRIORITY_CFG: Record<Priority, string> = {
  STAT:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Urgent:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Routine: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const SUMMARY_STATS = [
  { label: 'Total Orders', value: LAB_ORDERS.length, bg: 'bg-indigo-50 dark:bg-indigo-900/20', color: 'text-indigo-600' },
  { label: 'Critical Values', value: LAB_ORDERS.flatMap(o => o.results).filter(r => r.status.startsWith('critical')).length, bg: 'bg-red-50 dark:bg-red-900/20', color: 'text-red-600' },
  { label: 'Pending / In Process', value: LAB_ORDERS.filter(o => ['Pending','Specimen Collected','In Process'].includes(o.status)).length, bg: 'bg-amber-50 dark:bg-amber-900/20', color: 'text-amber-600' },
  { label: 'Final / Verified', value: LAB_ORDERS.filter(o => ['Final','Verified'].includes(o.status)).length, bg: 'bg-green-50 dark:bg-green-900/20', color: 'text-green-600' },
];

export default function LabOrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>('All');
  const [expandedId, setExpandedId] = useState<string | null>(LAB_ORDERS[0].id);

  const filtered = LAB_ORDERS.filter(o => {
    const matchSearch = [o.patientName, o.panelName, o.mrn, o.orderedBy].some(f =>
      f.toLowerCase().includes(search.toLowerCase())
    );
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
        <div className="px-8 pt-7 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lab Orders</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Laboratory investigations and results</p>
            </div>
            <div className="flex gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
                <Plus className="w-4 h-4" /> Order Labs
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {SUMMARY_STATS.map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search panel, patient, or doctor..." className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" />
            </div>
          </div>
        </div>

        <div className="px-8 pb-8 flex-1 space-y-3">
          {filtered.map(order => {
            const sc = STATUS_CFG[order.status];
            const isCrit = order.results.some(r => r.status.startsWith('critical'));
            const isExpanded = expandedId === order.id;

            return (
              <div key={order.id} className={`bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden transition-all ${isCrit ? 'border-red-300 dark:border-red-800' : 'border-slate-200 dark:border-slate-800'}`}>
                <button onClick={() => setExpandedId(isExpanded ? null : order.id)} className="w-full px-5 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{order.panelName}</span>
                      {isCrit && <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> CRITICAL</span>}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${PRIORITY_CFG[order.priority]}`}>{order.priority}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {order.patientName} · {order.mrn} · {order.specimenType} · Ordered: {order.orderedAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{order.status}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isExpanded && order.results.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                          {['Test', 'LOINC', 'Value', 'Reference Range', 'Delta', 'Flag'].map(h => (
                            <th key={h} className="px-5 py-3 text-left font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {order.results.map((r, i) => {
                          const rc = RESULT_CFG[r.status];
                          return (
                            <tr key={i} className={`${rc.bg} transition-colors`}>
                              <td className="px-5 py-3 font-medium text-slate-800 dark:text-white">{r.test}</td>
                              <td className="px-5 py-3 text-xs font-mono text-slate-400">{r.loincCode ?? '—'}</td>
                              <td className={`px-5 py-3 font-bold font-mono ${rc.textColor}`}>
                                {r.value} <span className="text-xs font-normal opacity-70">{r.unit}</span>
                              </td>
                              <td className="px-5 py-3 text-xs text-slate-400">{r.referenceRange ?? '—'}</td>
                              <td className="px-5 py-3">
                                {r.delta !== undefined ? (
                                  <span className={`text-xs font-medium flex items-center gap-1 ${r.delta > 0 ? 'text-red-500' : r.delta < 0 ? 'text-blue-500' : 'text-slate-400'}`}>
                                    {r.delta > 0 ? <TrendingUp className="w-3 h-3" /> : r.delta < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                                    {r.delta > 0 ? '+' : ''}{r.delta}
                                  </span>
                                ) : <span className="text-slate-300">—</span>}
                              </td>
                              <td className={`px-5 py-3 font-bold text-xs ${rc.textColor}`}>{rc.label}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
