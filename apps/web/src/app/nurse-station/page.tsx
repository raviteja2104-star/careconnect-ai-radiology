'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Users, Clock, AlertTriangle, Activity, Pill, 
  Syringe, Droplet, ClipboardList, CheckCircle, 
  ScanBarcode, Filter, Search, HeartPulse, Thermometer,
  ArrowRight, Info
} from 'lucide-react';

export default function NurseStation() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock Data
  const stats = [
    { label: "Assigned Patients", value: '8', icon: <Users className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Critical / High Risk', value: '2', icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    { label: 'Meds Due (Next 2h)', value: '14', icon: <Pill className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { label: 'Vitals Due', value: '6', icon: <Activity className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  ];

  const patients = [
    { bed: 'W4-B12', name: 'Rohit Sharma', age: 32, gender: 'M', diagnosis: 'Acute Appendicitis', status: 'Post-Op', risk: 'Medium', ews: 3, nextMed: '14:00', nextVital: '15:00', ivRunning: true },
    { bed: 'W4-B14', name: 'Sunita Rao', age: 65, gender: 'F', diagnosis: 'COPD Exacerbation', status: 'Oxygen Therapy', risk: 'High', ews: 6, nextMed: '13:30 (Overdue)', nextVital: '14:00', ivRunning: true },
    { bed: 'W4-B15', name: 'Amit Singh', age: 45, gender: 'M', diagnosis: 'Dengue Fever', status: 'Stable', risk: 'Low', ews: 1, nextMed: '18:00', nextVital: '18:00', ivRunning: false },
    { bed: 'W4-B18', name: 'Priya Patel', age: 28, gender: 'F', diagnosis: 'Gastroenteritis', status: 'Observation', risk: 'Low', ews: 0, nextMed: '16:00', nextVital: '16:00', ivRunning: true },
  ];

  const emarTasks = [
    { patient: 'Sunita Rao', bed: 'W4-B14', drug: 'Salbutamol Nebulizer', dose: '2.5mg', route: 'Inhalation', time: '13:30', status: 'Overdue' },
    { patient: 'Rohit Sharma', bed: 'W4-B12', drug: 'Ceftriaxone', dose: '1g', route: 'IV', time: '14:00', status: 'Due' },
    { patient: 'Rohit Sharma', bed: 'W4-B12', drug: 'Paracetamol', dose: '1g', route: 'IV', time: '14:00', status: 'Due' },
  ];

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
        
        {/* Header & Tabs */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-10 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Activity className="w-6 h-6 text-rose-500" /> Nurse Station
              </h1>
              <p className="text-sm text-slate-500">Ward 4 (General Medical) • Shift: 08:00 - 16:00 • Nurse: Sarah K.</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm hover:opacity-90 transition-opacity">
                <ScanBarcode className="w-4 h-4" /> Scan Patient / Med
              </button>
            </div>
          </div>
          
          <div className="flex space-x-1">
            {['dashboard', 'patient list', 'eMAR', 'vitals & IO', 'tasks', 'handover'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize transition-colors ${activeTab === tab ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {tab === 'eMAR' ? 'eMAR (Meds)' : tab}
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

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                   
                   {/* Early Warning Scores (EWS) Alerts */}
                   <div className="xl:col-span-1 space-y-6">
                     <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-red-50/50 dark:bg-red-900/10 flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <HeartPulse className="w-5 h-5 text-red-600 dark:text-red-400" />
                             <h3 className="font-bold text-slate-900 dark:text-slate-100">NEWS2 Alerts</h3>
                           </div>
                           <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full animate-pulse">1 Critical</span>
                        </div>
                        <div className="p-4">
                           <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg mb-3">
                             <div className="flex justify-between items-start mb-1">
                               <div>
                                 <span className="text-xs font-bold text-red-700 dark:text-red-400 block">W4-B14 • Sunita Rao</span>
                                 <span className="text-[10px] text-red-500 font-semibold">NEWS2 Score: 6</span>
                               </div>
                               <button className="text-xs font-semibold text-red-700 dark:text-red-400 bg-white dark:bg-slate-900 px-2 py-1 rounded shadow-sm hover:underline border border-red-200 dark:border-red-800">Escalate</button>
                             </div>
                             <p className="text-xs text-slate-700 dark:text-slate-300 mt-2">SpO2 dropped to 88% on room air. RR 24.</p>
                           </div>
                           
                           <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
                             <div className="flex justify-between items-start mb-1">
                               <div>
                                 <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block">W4-B12 • Rohit Sharma</span>
                                 <span className="text-[10px] text-amber-500 font-semibold">NEWS2 Score: 3</span>
                               </div>
                               <button className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-white dark:bg-slate-900 px-2 py-1 rounded shadow-sm hover:underline border border-amber-200 dark:border-amber-800">Review</button>
                             </div>
                             <p className="text-xs text-slate-700 dark:text-slate-300 mt-2">Temp 38.2°C, HR 102.</p>
                           </div>
                        </div>
                     </div>
                     
                     {/* AI Assistant */}
                      <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-md p-6 text-white relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl translate-x-10 -translate-y-10"></div>
                         <div className="relative z-10">
                           <div className="flex items-center gap-2 mb-4">
                             <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm"><Activity className="w-4 h-4" /></div>
                             <h3 className="font-bold text-sm tracking-wide">AI Nursing Copilot</h3>
                           </div>
                           <p className="text-sm text-rose-100 mb-4 leading-relaxed">
                             <strong>Reminder:</strong> Blood cultures for W4-B12 (Rohit) need to be drawn before starting IV Ceftriaxone at 14:00.
                           </p>
                           <button className="w-full py-2 bg-white text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-lg transition-colors shadow-sm">
                             Acknowledge
                           </button>
                         </div>
                      </div>
                   </div>

                   {/* Pending Meds (eMAR Preview) */}
                   <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                         <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                           <Pill className="w-4 h-4 text-slate-400" /> Pending eMAR (Next 2 Hours)
                         </h3>
                         <button onClick={() => setActiveTab('eMAR')} className="text-sm font-semibold text-rose-600 dark:text-rose-400">View Full eMAR</button>
                      </div>
                      <table className="w-full text-left border-collapse">
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {emarTasks.map((task, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-4 w-1/4">
                                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{task.bed}</p>
                                <p className="text-xs text-slate-500">{task.patient}</p>
                              </td>
                              <td className="p-4 w-1/3">
                                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{task.drug}</p>
                                <p className="text-xs text-slate-500">{task.dose} • {task.route}</p>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-1 text-[10px] font-bold rounded flex items-center gap-1 w-max ${task.status === 'Overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'}`}>
                                  <Clock className="w-3 h-3" /> {task.time} ({task.status})
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-sm hover:opacity-90 flex items-center gap-1 ml-auto">
                                  <ScanBarcode className="w-3 h-3" /> Scan
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>

                </div>
             </div>
          )}

          {activeTab === 'patient list' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-md">My Patients (8)</button>
                  <button className="px-3 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium rounded-md">Critical (2)</button>
                  <button className="px-3 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium rounded-md">All Ward 4</button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search by name or bed..." className="pl-9 pr-4 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64" />
                  </div>
                  <button className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4 font-semibold">Bed</th>
                      <th className="px-6 py-4 font-semibold">Patient</th>
                      <th className="px-6 py-4 font-semibold">Diagnosis & Status</th>
                      <th className="px-6 py-4 font-semibold">NEWS2</th>
                      <th className="px-6 py-4 font-semibold">Infusions</th>
                      <th className="px-6 py-4 font-semibold">Next Task</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {patients.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{p.bed}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{p.name}</p>
                          <p className="text-xs text-slate-500">{p.age}y • {p.gender}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{p.diagnosis}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{p.status}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-bold rounded-md ${p.ews >= 5 ? 'bg-red-100 text-red-700' : p.ews >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {p.ews}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {p.ivRunning ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400"><Droplet className="w-4 h-4"/> Running</span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                             <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400"><Pill className="w-3 h-3"/> {p.nextMed}</span>
                             <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400"><Activity className="w-3 h-3"/> {p.nextVital}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-sm hover:opacity-90">Open Chart</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </DashboardLayout>
  );
}
