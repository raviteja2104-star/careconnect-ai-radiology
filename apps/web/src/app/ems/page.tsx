'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Ambulance, MapPin, PhoneCall, AlertTriangle, 
  Activity, Clock, Radio, Truck, FileText, CheckCircle, Navigation, Users
} from 'lucide-react';

export default function EMSDashboard() {
  const [activeTab, setActiveTab] = useState('dispatch center');

  // KPI Stats
  const stats = [
    { label: "Active Incidents", value: '8', icon: <AlertTriangle className="w-5 h-5 text-red-500" />, color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    { label: 'Units En Route', value: '4', icon: <Truck className="w-5 h-5 text-blue-500" />, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Avg Response', value: '8m 42s', icon: <Clock className="w-5 h-5 text-indigo-500" />, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { label: 'Available ALS', value: '2 / 5', icon: <Activity className="w-5 h-5 text-green-500" />, color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  ];

  const dispatchQueue = [
    { id: 'INC-9912', priority: 'Code 3', complaint: 'Cardiac Arrest', location: '124 MG Road, Indiranagar', unit: 'ALS-04', status: 'On Scene', eta: '-', time: '14:22' },
    { id: 'INC-9913', priority: 'Code 2', complaint: 'MVA, Severe Trauma', location: 'Ring Road Junction', unit: 'ALS-01', status: 'En Route', eta: '4m', time: '14:35' },
    { id: 'INC-9914', priority: 'Code 2', complaint: 'Suspected Stroke', location: 'Block B, Koramangala', unit: 'BLS-08', status: 'Transporting', eta: '12m (To ED)', time: '14:10' },
    { id: 'INC-9915', priority: 'Code 1', complaint: 'Fall, Hip Pain', location: 'Sunrise Apts, HSR', unit: 'Pending', status: 'Awaiting Dispatch', eta: '-', time: '14:40' },
  ];

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'Code 3': return 'bg-red-600 text-white animate-pulse';
      case 'Code 2': return 'bg-amber-500 text-white';
      case 'Code 1': return 'bg-blue-500 text-white';
      default: return 'bg-slate-200 text-slate-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
        
        {/* Header & Tabs */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-10 flex flex-col gap-4 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Ambulance className="w-6 h-6 text-red-600 dark:text-red-500" /> Ambulance & EMS Command
              </h1>
              <p className="text-sm text-slate-500">Computer-Aided Dispatch & Pre-Hospital Care</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
                <PhoneCall className="w-4 h-4" /> New Emergency Call
              </button>
            </div>
          </div>
          
          <div className="flex space-x-1 overflow-x-auto hide-scrollbar pb-1">
            {['dispatch center', 'fleet tracking', 'epcr handovers', 'inter-facility', 'maintenance'].map((tab) => (
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
          
          {activeTab === 'dispatch center' && (
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
                   {/* Dispatch Grid */}
                   <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
                     <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                       <h2 className="text-lg font-bold flex items-center gap-2"><Radio className="w-5 h-5 text-red-600" /> Active Incidents</h2>
                       <button className="text-sm font-semibold text-red-600 dark:text-red-400">View Map</button>
                     </div>
                     
                     <div className="flex-1 overflow-x-auto">
                       <table className="w-full text-left border-collapse min-w-[700px]">
                         <thead>
                           <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                             <th className="px-4 py-3 font-semibold">Incident</th>
                             <th className="px-4 py-3 font-semibold">Location</th>
                             <th className="px-4 py-3 font-semibold">Complaint</th>
                             <th className="px-4 py-3 font-semibold">Unit / ETA</th>
                             <th className="px-4 py-3 font-semibold">Status</th>
                             <th className="px-4 py-3 font-semibold text-right">Actions</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                           {dispatchQueue.map((inc, i) => (
                             <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                               <td className="px-4 py-3">
                                 <div className="flex items-center gap-2">
                                   <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${getPriorityColor(inc.priority)}`}>{inc.priority}</span>
                                 </div>
                                 <span className="text-xs font-mono text-slate-500 mt-1 block">{inc.id} • {inc.time}</span>
                               </td>
                               <td className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                                 <div className="flex items-start gap-1">
                                   <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                   <span>{inc.location}</span>
                                 </div>
                               </td>
                               <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 text-sm">
                                 {inc.complaint}
                               </td>
                               <td className="px-4 py-3 text-sm">
                                 <div className="font-bold text-indigo-600 dark:text-indigo-400">{inc.unit}</div>
                                 <div className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3"/> {inc.eta}</div>
                               </td>
                               <td className="px-4 py-3">
                                 <span className={`px-2 py-1 text-xs font-bold rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300`}>
                                   {inc.status}
                                 </span>
                               </td>
                               <td className="px-4 py-3 text-right">
                                 <button className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded shadow-sm hover:bg-slate-50">Manage</button>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   </div>

                   {/* AI Dispatcher Panel */}
                   <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
                     <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2">
                       <span className="flex h-2 w-2 relative">
                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                         <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                       </span>
                       <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">AI Dispatcher</h2>
                     </div>
                     <div className="p-4 space-y-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg">
                           <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-2">Recommendation</p>
                           <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">For INC-9915 (Fall, Hip Pain), dispatch <strong>BLS-02</strong>. Unit is currently 1.2km away at Fuel Station.</p>
                           <div className="flex gap-2">
                             <button className="flex-1 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded shadow-sm">Assign BLS-02</button>
                             <button className="flex-1 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded shadow-sm">Review</button>
                           </div>
                        </div>

                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg">
                           <p className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider mb-2">Hospital Reroute Alert</p>
                           <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">City Hospital ED is currently at capacity. Reroute INC-9914 (Stroke) to Central Stroke Center (ETA +4m).</p>
                           <button className="w-full py-1.5 bg-red-600 text-white text-xs font-bold rounded shadow-sm">Notify Crew & Reroute</button>
                        </div>
                     </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'epcr handovers' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Electronic Patient Care Records (ePCR)</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Inbound patient telemetery and digital handovers to the Emergency Department.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {/* Inbound ePCR Alert */}
                   <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                     <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                       <div>
                         <div className="flex items-center gap-2 mb-1">
                           <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded uppercase">Inbound</span>
                           <h4 className="font-bold text-lg">Suspected Stroke • ETA: 12m</h4>
                         </div>
                         <p className="text-sm text-slate-500">Unit: BLS-08 • Paramedic: John D.</p>
                       </div>
                       <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded shadow-sm">Alert Stroke Team</button>
                     </div>
                     
                     <div className="space-y-4">
                       <div>
                         <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Vitals (Last updated 2m ago)</h5>
                         <div className="grid grid-cols-4 gap-2 text-center">
                           <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-100 dark:border-slate-700">
                             <div className="text-[10px] text-slate-500">HR</div>
                             <div className="font-bold text-slate-900 dark:text-slate-100">88</div>
                           </div>
                           <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-red-100 dark:border-red-900/30">
                             <div className="text-[10px] text-red-500 font-bold">BP</div>
                             <div className="font-bold text-red-600">160/95</div>
                           </div>
                           <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-100 dark:border-slate-700">
                             <div className="text-[10px] text-slate-500">SpO2</div>
                             <div className="font-bold text-slate-900 dark:text-slate-100">97%</div>
                           </div>
                           <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-100 dark:border-slate-700">
                             <div className="text-[10px] text-slate-500">GCS</div>
                             <div className="font-bold text-slate-900 dark:text-slate-100">13</div>
                           </div>
                         </div>
                       </div>

                       <div>
                         <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pre-Hospital Interventions</h5>
                         <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
                           <li>O2 administered via nasal cannula (2L/min)</li>
                           <li>IV access established (18G Left AC)</li>
                           <li>Blood glucose: 110 mg/dL</li>
                         </ul>
                       </div>
                     </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab !== 'dispatch center' && activeTab !== 'epcr handovers' && (
             <div className="flex flex-col items-center justify-center h-full text-center pb-20">
               <Navigation className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
               <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2 capitalize">{activeTab}</h3>
               <p className="text-slate-500 max-w-md">The {activeTab} view requires active GIS and fleet tracking integrations.</p>
             </div>
          )}
          
        </div>
      </div>
    </DashboardLayout>
  );
}
