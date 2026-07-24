'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Scissors, Calendar, Clock, Activity, CheckCircle, 
  AlertTriangle, ShieldCheck, HeartPulse, UserPlus, FileText, Settings, Users
} from 'lucide-react';

export default function OTDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // KPI Stats
  const stats = [
    { label: "Today's Surgeries", value: '14', icon: <Scissors className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { label: 'Running Now', value: '4', icon: <Activity className="w-5 h-5" />, color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    { label: 'Delayed', value: '1', icon: <Clock className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { label: 'Available ORs', value: '3', icon: <CheckCircle className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  ];

  const runningProcedures = [
    { room: 'OR-1 (Cardiac)', patient: 'Arun K. (M/55)', procedure: 'CABG x3', surgeon: 'Dr. R. Sharma', anesthesiologist: 'Dr. V. Patel', startTime: '08:00 AM', status: 'IntraOp (Bypass)', expectedEnd: '12:30 PM' },
    { room: 'OR-2 (Ortho)', patient: 'Smita J. (F/62)', procedure: 'TKR Right', surgeon: 'Dr. A. Gupta', anesthesiologist: 'Dr. M. Singh', startTime: '09:30 AM', status: 'IntraOp (Implanting)', expectedEnd: '11:30 AM' },
    { room: 'OR-3 (General)', patient: 'Vikas T. (M/34)', procedure: 'Laparoscopic Cholecystectomy', surgeon: 'Dr. P. Nair', anesthesiologist: 'Dr. S. Reddy', startTime: '10:00 AM', status: 'Closing', expectedEnd: '11:00 AM' },
    { room: 'OR-5 (Trauma)', patient: 'Unknown Male', procedure: 'Ex-Lap (Trauma)', surgeon: 'Dr. K. Desai', anesthesiologist: 'Dr. L. Fernandez', startTime: '10:15 AM', status: 'Critical / Bleeding', expectedEnd: 'Unknown' },
  ];

  const whoChecklist = [
    { phase: 'Sign In (Before Induction)', icon: <UserPlus className="w-5 h-5 text-indigo-500" />, items: ['Patient Identity Confirmed', 'Consent Verified', 'Site Marked', 'Anesthesia Safety Check', 'Allergies Known'], completed: true },
    { phase: 'Time Out (Before Incision)', icon: <Clock className="w-5 h-5 text-amber-500" />, items: ['Team Introductions', 'Procedure Confirmation', 'Prophylactic Antibiotics <60m', 'Essential Imaging Displayed', 'Blood Available'], completed: false },
    { phase: 'Sign Out (Before Patient Leaves)', icon: <CheckCircle className="w-5 h-5 text-emerald-500" />, items: ['Instrument/Sponge Count Correct', 'Specimens Labelled', 'Equipment Issues Addressed', 'Post-Op Recovery Plan'], completed: false },
  ];

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
        
        {/* Header & Tabs */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-10 flex flex-col gap-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Scissors className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> Operation Theatre
              </h1>
              <p className="text-sm text-slate-500">Surgical Command Center & Perioperative Workflows</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
                <Calendar className="w-4 h-4" /> Schedule Surgery
              </button>
            </div>
          </div>
          
          <div className="flex space-x-1 overflow-x-auto hide-scrollbar pb-1">
            {['dashboard', 'calendar', 'who safety checklist', 'anesthesia', 'intraoperative', 'pacu (recovery)', 'instruments'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
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

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <h2 className="text-lg font-bold flex items-center gap-2">Live OT Board</h2>
                    <div className="flex gap-2">
                       <button className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-sm hover:opacity-90">View All</button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                          <th className="px-4 py-3 font-semibold">Room</th>
                          <th className="px-4 py-3 font-semibold">Patient</th>
                          <th className="px-4 py-3 font-semibold">Procedure</th>
                          <th className="px-4 py-3 font-semibold">Surgeon / Anesthetist</th>
                          <th className="px-4 py-3 font-semibold">Timing</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {runningProcedures.map((proc, i) => (
                          <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${proc.status.includes('Critical') ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                            <td className="px-4 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-400">{proc.room}</td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{proc.patient}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{proc.procedure}</p>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">{proc.surgeon}</div>
                              <div>{proc.anesthesiologist}</div>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                              <div>Start: {proc.startTime}</div>
                              <div>Est. End: {proc.expectedEnd}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-bold rounded flex items-center w-max gap-1 ${
                                proc.status.includes('Critical') ? 'bg-red-600 text-white animate-pulse' : 
                                proc.status.includes('Closing') ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 
                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                              }`}>
                                {proc.status.includes('Critical') && <AlertTriangle className="w-3 h-3" />}
                                {proc.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800">Open Chart</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

             </div>
          )}

          {activeTab === 'who safety checklist' && (
             <div className="max-w-4xl mx-auto">
               <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 mb-6">
                 <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-green-500" /> WHO Surgical Safety Checklist</h2>
                      <p className="text-sm text-slate-500">OR-2 • Patient: Smita J. • Procedure: TKR Right</p>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {whoChecklist.map((phase, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border ${phase.completed ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-900/50' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                         <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                            {phase.icon}
                            <h3 className="font-bold text-sm">{phase.phase}</h3>
                         </div>
                         <div className="space-y-3">
                           {phase.items.map((item, i) => (
                             <label key={i} className="flex items-start gap-2 cursor-pointer">
                               <input type="checkbox" className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600" defaultChecked={phase.completed} />
                               <span className="text-sm text-slate-700 dark:text-slate-300">{item}</span>
                             </label>
                           ))}
                         </div>
                         <button className={`mt-6 w-full py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors ${phase.completed ? 'bg-green-600 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}>
                            {phase.completed ? 'Signed & Verified' : 'Sign & Verify'}
                         </button>
                      </div>
                    ))}
                 </div>
               </div>
             </div>
          )}

          {activeTab === 'pacu (recovery)' && (
             <div className="space-y-6">
               <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                  <div className="flex items-center gap-3">
                    <HeartPulse className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Post-Anesthesia Care Unit (PACU)</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Monitoring recovery and Aldrete scores for safe transfer.</p>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* PACU Patient Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg">Anita M. (F/42)</h4>
                        <p className="text-sm text-slate-500">Laparoscopic Appendectomy • Dr. P. Nair</p>
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">Phase 1 Recovery</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                       <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                         <span className="text-xs font-bold text-slate-400 uppercase">Aldrete Score</span>
                         <p className="text-2xl font-bold text-indigo-600">8 <span className="text-sm text-slate-500 font-normal">/ 10</span></p>
                       </div>
                       <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                         <span className="text-xs font-bold text-slate-400 uppercase">Pain Score</span>
                         <p className="text-2xl font-bold text-amber-600">4 <span className="text-sm text-slate-500 font-normal">/ 10</span></p>
                       </div>
                    </div>

                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                       <p className="flex justify-between"><span>Activity:</span> <span className="font-medium text-slate-900 dark:text-slate-100">Moves 2 extremities (1)</span></p>
                       <p className="flex justify-between"><span>Respiration:</span> <span className="font-medium text-slate-900 dark:text-slate-100">Dyspnea / Shallow (1)</span></p>
                       <p className="flex justify-between"><span>Circulation:</span> <span className="font-medium text-slate-900 dark:text-slate-100">BP +/- 20% normal (2)</span></p>
                    </div>

                    <div className="flex gap-2">
                       <button className="flex-1 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-sm font-semibold rounded-lg">Administer Analgesia</button>
                       <button className="flex-1 py-2 bg-white border border-slate-200 dark:border-slate-700 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg">Transfer to Ward</button>
                    </div>
                  </div>
               </div>
             </div>
          )}

          {activeTab !== 'dashboard' && activeTab !== 'who safety checklist' && activeTab !== 'pacu (recovery)' && (
             <div className="flex flex-col items-center justify-center h-full text-center pb-20">
               <Settings className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
               <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2 capitalize">{activeTab} Module</h3>
               <p className="text-slate-500 max-w-md">The {activeTab} workspace is being integrated with the perioperative platform.</p>
             </div>
          )}
          
        </div>
      </div>
    </DashboardLayout>
  );
}
