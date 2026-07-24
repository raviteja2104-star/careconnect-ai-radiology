'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Siren, Clock, Activity, AlertTriangle, UserPlus, 
  HeartPulse, Zap, Brain, Thermometer, Wind,
  ArrowRight, ShieldAlert, Truck, ChevronRight, Stethoscope, CheckCircle
} from 'lucide-react';

export default function EmergencyDepartment() {
  const [activeTab, setActiveTab] = useState('tracking board');

  // Mock Data
  const stats = [
    { label: "Patients Waiting", value: '14', icon: <Clock className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { label: 'Avg Wait Time', value: '28m', icon: <HourglassIcon className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Critical (ESI 1-2)', value: '3', icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    { label: 'En Route', value: '2', icon: <Truck className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
  ];

  const trackingBoard = [
    { bed: 'Resus 1', patient: 'Unknown Male', age: '50s', gender: 'M', esi: 1, complaint: 'Cardiac Arrest', arrTime: '10:05', status: 'Code Blue', md: 'Dr. Sharma', rn: 'Nurse Joy', flags: ['STEMI'] },
    { bed: 'Trauma 2', patient: 'Rohit Verma', age: '34', gender: 'M', esi: 1, complaint: 'MVA, Head Trauma', arrTime: '10:15', status: 'Primary Survey', md: 'Dr. Anita', rn: 'Nurse Mark', flags: ['Trauma'] },
    { bed: 'Bed 4', patient: 'Sunita Rao', age: '65', gender: 'F', esi: 2, complaint: 'Left-side weakness', arrTime: '10:30', status: 'CT Pending', md: 'Dr. Khan', rn: 'Nurse Joy', flags: ['Stroke Alert'] },
    { bed: 'Bed 7', patient: 'Amit Singh', age: '45', gender: 'M', esi: 3, complaint: 'Severe Abdominal Pain', arrTime: '09:45', status: 'Labs Sent', md: 'Dr. Khan', rn: 'Nurse Mary', flags: [] },
    { bed: 'Wait 1', patient: 'Priya Patel', age: '28', gender: 'F', esi: 4, complaint: 'Ankle Sprain', arrTime: '09:10', status: 'Waiting MD', md: 'Unassigned', rn: 'Unassigned', flags: [] },
  ];

  const getESIColor = (esi: number) => {
    switch (esi) {
      case 1: return 'bg-red-600 text-white dark:bg-red-700 border-red-800'; // Resuscitation
      case 2: return 'bg-orange-500 text-white dark:bg-orange-600 border-orange-700'; // Emergent
      case 3: return 'bg-amber-400 text-amber-900 dark:bg-amber-500 dark:text-amber-950 border-amber-600'; // Urgent
      case 4: return 'bg-green-500 text-white dark:bg-green-600 border-green-700'; // Less Urgent
      case 5: return 'bg-blue-500 text-white dark:bg-blue-600 border-blue-700'; // Non-Urgent
      default: return 'bg-slate-200 text-slate-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
        
        {/* Header & Tabs */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-10 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Siren className="w-6 h-6 text-red-600 dark:text-red-500" /> Emergency Department
              </h1>
              <p className="text-sm text-slate-500">Level-1 Trauma Center Command Hub</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors animate-pulse">
                <AlertTriangle className="w-4 h-4" /> Activate Protocol
              </button>
            </div>
          </div>
          
          <div className="flex space-x-1 overflow-x-auto hide-scrollbar pb-1">
            {['dashboard', 'tracking board', 'triage', 'trauma', 'stroke', 'stemi', 'sepsis', 'observation'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          
          {activeTab === 'tracking board' && (
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

                {/* Main Tracking Board */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <h2 className="text-lg font-bold flex items-center gap-2">Live ED Tracking Board <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span></h2>
                    <div className="flex gap-2">
                       <button className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-sm hover:opacity-90">Quick Reg</button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                          <th className="px-4 py-3 font-semibold">ESI</th>
                          <th className="px-4 py-3 font-semibold">Bed</th>
                          <th className="px-4 py-3 font-semibold">Patient</th>
                          <th className="px-4 py-3 font-semibold">Complaint</th>
                          <th className="px-4 py-3 font-semibold">Arrival</th>
                          <th className="px-4 py-3 font-semibold">MD / RN</th>
                          <th className="px-4 py-3 font-semibold">Status / Flow</th>
                          <th className="px-4 py-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {trackingBoard.map((pt, i) => (
                          <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${pt.esi === 1 ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                            <td className="px-4 py-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold border shadow-sm ${getESIColor(pt.esi)}`}>
                                {pt.esi}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-100">{pt.bed}</td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{pt.patient}</p>
                              <p className="text-xs text-slate-500">{pt.age}y • {pt.gender}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{pt.complaint}</p>
                              <div className="flex gap-1 mt-1">
                                {pt.flags.map(flag => (
                                  <span key={flag} className="px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 text-[10px] font-bold rounded flex items-center gap-1">
                                    <Zap className="w-2.5 h-2.5" /> {flag}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-slate-600 dark:text-slate-400">{pt.arrTime}</td>
                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                              <div>{pt.md}</div>
                              <div>{pt.rn}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-bold rounded ${pt.status === 'Code Blue' ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                                {pt.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800">Chart</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

             </div>
          )}

          {activeTab === 'triage' && (
             <div className="flex flex-col items-center justify-center h-full text-center">
               <Activity className="w-16 h-16 text-slate-300 mb-4" />
               <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Triage & Assessment</h3>
               <p className="text-slate-500 max-w-md">Comprehensive module for capturing Chief Complaint, Vitals, Pain Score, and AI-assisted Emergency Severity Index (ESI) assignment.</p>
             </div>
          )}

          {activeTab === 'stroke' && (
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                   <div className="flex items-center gap-3">
                     <div className="p-3 bg-red-100 text-red-600 dark:bg-red-900/30 rounded-xl"><Brain className="w-6 h-6" /></div>
                     <div>
                       <h2 className="text-xl font-bold">Stroke Code Pathway</h2>
                       <p className="text-sm text-slate-500">Patient: Sunita Rao • Bed 4</p>
                     </div>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Door-to-CT Time</p>
                      <p className="text-3xl font-mono font-bold text-red-600">14:22</p>
                   </div>
                </div>
                
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                  
                  {/* Timeline Items */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 bg-green-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                       <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">Patient Arrival (Door)</h4>
                        <span className="text-xs font-mono text-slate-500">10:30</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Left-side weakness noted at triage.</p>
                    </div>
                  </div>

                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 bg-indigo-600 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 animate-pulse">
                       <Clock className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-indigo-900 dark:text-indigo-100">Non-Con CT Head</h4>
                        <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">Pending</span>
                      </div>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-3">Order placed. Patient en route to Radiology.</p>
                      <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded shadow-sm">Mark CT Complete</button>
                    </div>
                  </div>
                  
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                       <Activity className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-60">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100">Thrombolysis Decision</h4>
                        <span className="text-xs font-mono text-slate-500">--:--</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Neurology Consult & NIHSS Score required.</p>
                    </div>
                  </div>

                </div>
             </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}

// Quick component for a simple Hourglass icon missing from lucide
function HourglassIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 22h14" />
      <path d="M5 2h14" />
      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </svg>
  );
}
