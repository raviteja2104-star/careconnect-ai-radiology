'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  UserPlus, ArrowRightLeft, UserMinus, Activity, 
  FileCheck, FileText, CheckCircle, Clock, 
  AlertTriangle, ShieldCheck, HeartPulse, Stethoscope, Pill
} from 'lucide-react';

export default function ADTDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock Data
  const stats = [
    { label: "Admissions (Today)", value: '24', icon: <UserPlus className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { label: 'Pending Discharges', value: '12', icon: <UserMinus className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { label: 'Active Transfers', value: '5', icon: <ArrowRightLeft className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Current Inpatients', value: '382', icon: <Activity className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
  ];

  const pendingAdmissions = [
    { id: 'ADM-26-891', patient: 'Rohit Sharma', age: 32, type: 'Emergency', diagnosis: 'Acute Appendicitis', priority: 'High', bedStatus: 'Allocated (W4-B12)' },
    { id: 'ADM-26-892', patient: 'Meena Gupta', age: 45, type: 'Elective', diagnosis: 'Cholecystectomy', priority: 'Medium', bedStatus: 'Pending Allocation' },
  ];

  const dischargeQueue = [
    { id: 'DIS-26-442', patient: 'Anil Kumar', bed: 'W2-105', docClear: true, nurseClear: true, pharmClear: false, billClear: false },
    { id: 'DIS-26-443', patient: 'Sunita Rao', bed: 'ICU-B4', docClear: true, nurseClear: true, pharmClear: true, billClear: true },
  ];

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
        
        {/* Header & Tabs */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-10 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ArrowRightLeft className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> IPD / ADT Center
              </h1>
              <p className="text-sm text-slate-500">Admission, Transfer, and Discharge Operations</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
                <UserPlus className="w-4 h-4" /> New Admission
              </button>
            </div>
          </div>
          
          <div className="flex space-x-1">
            {['dashboard', 'admissions', 'transfers', 'discharge planner', 'clearance checklist'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize transition-colors ${activeTab === tab ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          
          {activeTab === 'dashboard' && (
             <div className="space-y-6">
                
                {/* KPI Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                   
                   {/* Admission Requests Queue */}
                   <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                         <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                           <UserPlus className="w-4 h-4 text-indigo-600" /> Pending Admissions
                         </h3>
                         <button className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">View All</button>
                      </div>
                      <div className="p-4 space-y-4">
                        {pendingAdmissions.map((adm, i) => (
                          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg gap-4">
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                 <span className="font-bold text-slate-900 dark:text-slate-100">{adm.patient}</span>
                                 <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${adm.type === 'Emergency' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{adm.type}</span>
                               </div>
                               <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{adm.diagnosis}</p>
                               <p className="text-xs font-semibold text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {adm.bedStatus}</p>
                            </div>
                            <div className="flex gap-2">
                               <button className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded shadow-sm hover:bg-slate-50">View Details</button>
                               <button className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded shadow-sm hover:bg-indigo-700">Check-in</button>
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>

                   {/* Discharge Planner / Clearance Tracker */}
                   <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                         <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                           <UserMinus className="w-4 h-4 text-emerald-600" /> Discharge Planner
                         </h3>
                      </div>
                      <div className="p-4 space-y-4">
                        {dischargeQueue.map((dis, i) => {
                          const isFullyCleared = dis.docClear && dis.nurseClear && dis.pharmClear && dis.billClear;
                          return (
                            <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg">
                              <div className="flex justify-between items-start mb-3">
                                 <div>
                                   <p className="font-bold text-slate-900 dark:text-slate-100">{dis.patient}</p>
                                   <p className="text-xs text-slate-500">Bed: {dis.bed} • ID: {dis.id}</p>
                                 </div>
                                 {isFullyCleared ? (
                                   <button className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded shadow-sm">Final Discharge</button>
                                 ) : (
                                   <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded">Pending Clearances</span>
                                 )}
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                <div className={`flex flex-col items-center justify-center p-2 rounded border ${dis.docClear ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-400'}`}>
                                   <Stethoscope className="w-4 h-4 mb-1" />
                                   <span className="text-[10px] font-semibold text-center leading-tight">Clinical</span>
                                </div>
                                <div className={`flex flex-col items-center justify-center p-2 rounded border ${dis.nurseClear ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-400'}`}>
                                   <Activity className="w-4 h-4 mb-1" />
                                   <span className="text-[10px] font-semibold text-center leading-tight">Nursing</span>
                                </div>
                                <div className={`flex flex-col items-center justify-center p-2 rounded border ${dis.pharmClear ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-400'}`}>
                                   <Pill className="w-4 h-4 mb-1" />
                                   <span className="text-[10px] font-semibold text-center leading-tight">Pharmacy</span>
                                </div>
                                <div className={`flex flex-col items-center justify-center p-2 rounded border ${dis.billClear ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-slate-400'}`}>
                                   <FileText className="w-4 h-4 mb-1" />
                                   <span className="text-[10px] font-semibold text-center leading-tight">Billing</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                   </div>

                </div>
             </div>
          )}

          {activeTab === 'discharge planner' && (
             <div className="flex flex-col items-center justify-center h-full text-center">
               <FileCheck className="w-16 h-16 text-slate-300 mb-4" />
               <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Discharge Clearance Checklist</h3>
               <p className="text-slate-500 max-w-md">Orchestrating multi-department sign-offs to safely transition patients out of inpatient care and release beds.</p>
             </div>
          )}
          
        </div>
      </div>
    </DashboardLayout>
  );
}
