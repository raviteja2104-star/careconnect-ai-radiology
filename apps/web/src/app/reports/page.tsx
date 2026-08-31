'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  BarChart3, TrendingUp, Download, Calendar, Filter, FileText, 
  DollarSign, Users, Activity, Bed, Pill, Stethoscope, PieChart, 
  ArrowUpRight, ArrowDownRight, RefreshCw, Printer, ShieldCheck
} from 'lucide-react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'financial' | 'occupancy' | 'clinical' | 'opd-ipd'>('financial');
  const [dateRange, setDateRange] = useState('This Month (Jul 2026)');
  const [selectedDept, setSelectedDept] = useState('All Departments');

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-xs">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Hospital Executive Analytics & Clinical Reports
                </h1>
                <p className="text-xs text-slate-500">
                  Real-time operational, financial, bed utilization, & medico-legal compliance analytics.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 outline-none font-bold cursor-pointer"
              >
                <option>Today (25 Jul 2026)</option>
                <option>This Week</option>
                <option>This Month (Jul 2026)</option>
                <option>Q3 2026</option>
                <option>Financial Year 2026-27</option>
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold">
              <Filter className="w-4 h-4 text-indigo-600" />
              <select 
                value={selectedDept} 
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 outline-none font-bold cursor-pointer"
              >
                <option>All Departments</option>
                <option>Cardiology</option>
                <option>Pediatrics</option>
                <option>Orthopedics</option>
                <option>Neurology</option>
                <option>General Surgery</option>
                <option>ICU & Emergency</option>
              </select>
            </div>

            {/* Export Report CTA */}
            <button 
              onClick={() => alert(`Exporting CareConnect Executive Report (${dateRange}) as PDF & CSV...`)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" /> Export Report (PDF/CSV)
            </button>
          </div>
        </div>

        {/* Top Operational Executive KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400 uppercase">Gross Revenue (Jul 2026)</span>
              <span className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <strong className="text-2xl font-black text-slate-900 dark:text-white">₹ 1,48,50,000</strong>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +14.2%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block">OPD: ₹42.5L | IPD: ₹88.0L | Pharmacy: ₹18.0L</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400 uppercase">Bed Occupancy Rate</span>
              <span className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl">
                <Bed className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <strong className="text-2xl font-black text-slate-900 dark:text-white">86.4%</strong>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +5.1%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block">216 of 250 Beds Occupied (ICU: 92%)</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400 uppercase">Total Patient Footfall</span>
              <span className="p-2 bg-purple-50 dark:bg-purple-950 text-purple-600 rounded-xl">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <strong className="text-2xl font-black text-slate-900 dark:text-white">3,842 Patients</strong>
              <span className="text-xs font-bold text-purple-600 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +8.7%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block">OPD: 3,120 | IPD Admissions: 722</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400 uppercase">Avg Length of Stay (ALOS)</span>
              <span className="p-2 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-xl">
                <Activity className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <strong className="text-2xl font-black text-slate-900 dark:text-white">3.8 Days</strong>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                <ArrowDownRight className="w-3.5 h-3.5" /> -0.4 Days
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block">Readmission Rate: 2.1% (Low)</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4 overflow-x-auto">
          {[
            { id: 'financial', label: '💳 Financial & Revenue Analytics' },
            { id: 'occupancy', label: '🛏️ Bed Occupancy & ADT' },
            { id: 'clinical', label: '🔬 Clinical, Lab & Pharmacy Volume' },
            { id: 'opd-ipd', label: '🏥 OPD vs IPD Footfall & Demographics' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`pb-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === t.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: FINANCIAL & REVENUE ANALYTICS */}
        {activeTab === 'financial' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Departmental Revenue Breakdown (Jul 2026)
                </h3>
                <span className="text-xs text-indigo-600 font-bold">Total: ₹ 1.48 Cr</span>
              </div>

              <div className="space-y-3">
                {[
                  { dept: 'Cardiology & Catheterization', rev: '₹ 44,50,000', pct: 30, color: 'bg-indigo-600' },
                  { dept: 'Orthopedics & Joint Replacement', rev: '₹ 32,80,000', pct: 22, color: 'bg-blue-600' },
                  { dept: 'ICU & Emergency Care', rev: '₹ 26,40,000', pct: 18, color: 'bg-purple-600' },
                  { dept: 'Pharmacy & Drug Sales', rev: '₹ 18,20,000', pct: 12, color: 'bg-emerald-600' },
                  { dept: 'Laboratory & Radiology Services', rev: '₹ 14,80,000', pct: 10, color: 'bg-amber-600' },
                  { dept: 'General Surgery & Day Care', rev: '₹ 11,80,000', pct: 8, color: 'bg-rose-600' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>{item.dept}</span>
                      <span>{item.rev} ({item.pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.pct * 2.5}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Modes */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Payment Collection Modes
              </h3>

              <div className="space-y-4 pt-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">TPA / Health Insurance</span>
                    <strong className="text-sm font-black text-slate-900 dark:text-white">₹ 82,40,000 (55.5%)</strong>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg">540 Claims</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">UPI / Card / NetBanking</span>
                    <strong className="text-sm font-black text-slate-900 dark:text-white">₹ 48,10,000 (32.4%)</strong>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg">Digital</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Cash Receipts</span>
                    <strong className="text-sm font-black text-slate-900 dark:text-white">₹ 18,00,000 (12.1%)</strong>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-lg">Desk Counter</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BED OCCUPANCY */}
        {activeTab === 'occupancy' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Ward & ICU Bed Occupancy Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl">
                <span className="text-[10px] font-bold text-red-700 dark:text-red-300 uppercase block">Intensive Care Unit (ICU)</span>
                <strong className="text-xl font-black text-red-900 dark:text-red-100">23 / 25 Beds (92%)</strong>
                <span className="text-[10px] text-slate-500 block mt-1">2 Ventilators Available</span>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 rounded-2xl">
                <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase block">Cardiac Care Unit (CCU)</span>
                <strong className="text-xl font-black text-purple-900 dark:text-purple-100">14 / 15 Beds (93.3%)</strong>
                <span className="text-[10px] text-slate-500 block mt-1">1 Bed Available</span>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl">
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase block">Private & Deluxe Rooms</span>
                <strong className="text-xl font-black text-blue-900 dark:text-blue-100">62 / 70 Beds (88.5%)</strong>
                <span className="text-[10px] text-slate-500 block mt-1">8 Beds Available</span>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">General Ward</span>
                <strong className="text-xl font-black text-emerald-900 dark:text-emerald-100">117 / 140 Beds (83.5%)</strong>
                <span className="text-[10px] text-slate-500 block mt-1">23 Beds Available</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CLINICAL & PHARMACY */}
        {activeTab === 'clinical' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Laboratory & Diagnostic Test Volume
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span>Complete Blood Count (CBC)</span>
                  <strong className="text-slate-900 dark:text-white">1,420 Tests</strong>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span>HbA1c & Fasting Blood Glucose</span>
                  <strong className="text-slate-900 dark:text-white">980 Tests</strong>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span>Lipid Profile & Renal Function Test</span>
                  <strong className="text-slate-900 dark:text-white">740 Tests</strong>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Pharmacy Top Dispensed Medications
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span>Telmisartan 40mg (Antihypertensive)</span>
                  <strong className="text-slate-900 dark:text-white">4,200 Tablets</strong>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span>Metformin 500mg SR (Antidiabetic)</span>
                  <strong className="text-slate-900 dark:text-white">3,850 Tablets</strong>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span>Amoxicillin + Clavulanic Acid 625mg</span>
                  <strong className="text-slate-900 dark:text-white">1,940 Strips</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
