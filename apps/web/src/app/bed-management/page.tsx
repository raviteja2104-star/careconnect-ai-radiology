'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Bed, Users, AlertTriangle, Activity, 
  Map as MapIcon, Grid, LayoutList, CheckCircle, 
  Search, Filter, Wrench, Brush, ShieldAlert,
  ArrowRight, Shield
} from 'lucide-react';

export default function BedManagement() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');

  // Mock Data
  const stats = [
    { label: "Total Beds", value: '450', subtext: ' across 12 wards', icon: <Bed className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { label: 'Occupancy Rate', value: '82%', subtext: '369 beds occupied', icon: <Activity className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Pending Cleaning', value: '14', subtext: 'Housekeeping queue', icon: <Brush className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { label: 'Under Maintenance', value: '5', subtext: 'Biomedical / Repair', icon: <Wrench className="w-5 h-5" />, color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  ];

  const bedExplorerData = [
    { id: 'W1-101-A', type: 'General', status: 'Occupied', patient: 'Rajesh Kumar', gender: 'M', admitDate: '2 Days ago', isolation: false },
    { id: 'W1-101-B', type: 'General', status: 'Available', patient: null, gender: null, admitDate: null, isolation: false },
    { id: 'W1-102-A', type: 'Isolation', status: 'Occupied', patient: 'Sunil Sharma', gender: 'M', admitDate: '5 Days ago', isolation: true },
    { id: 'W1-103-A', type: 'Private', status: 'Cleaning', patient: null, gender: null, admitDate: null, isolation: false },
    { id: 'W1-104-A', type: 'Private', status: 'Maintenance', patient: null, gender: null, admitDate: null, isolation: false },
    { id: 'W1-105-A', type: 'General', status: 'Reserved', patient: 'Incoming ADT', gender: 'F', admitDate: 'ETA 2hrs', isolation: false },
    { id: 'W2-ICU-1', type: 'ICU', status: 'Occupied', patient: 'Vikram Singh', gender: 'M', admitDate: '1 Day ago', isolation: false },
    { id: 'W2-ICU-2', type: 'ICU', status: 'Occupied', patient: 'Meena Gupta', gender: 'F', admitDate: '12 Hours ago', isolation: true },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'Occupied': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'Cleaning': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'Maintenance': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'Reserved': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
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
                <Bed className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> Bed & Ward Management
              </h1>
              <p className="text-sm text-slate-500">Enterprise Capacity Management System</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
                <Users className="w-4 h-4" /> AI Bed Allocation
              </button>
            </div>
          </div>
          
          <div className="flex space-x-1">
            {['dashboard', 'bed explorer', 'live floor map', 'housekeeping queue', 'maintenance'].map((tab) => (
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
                        <div className="flex items-baseline gap-2">
                          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{stat.subtext}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                   
                   {/* Pending Requests */}
                   <div className="xl:col-span-1 space-y-6">
                     <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                           <h3 className="font-bold text-slate-900 dark:text-slate-100">Pending ADT Requests</h3>
                           <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold rounded-full">3 Requests</span>
                        </div>
                        <div className="p-4 space-y-3">
                           <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg">
                             <div className="flex justify-between items-start mb-2">
                               <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">Admission (ER)</span>
                               <span className="text-xs text-slate-500">10 mins ago</span>
                             </div>
                             <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Ramesh Kumar (45, M)</p>
                             <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Req: ICU Bed • Suspected MI • Isolation: No</p>
                             <button className="w-full text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 py-1.5 rounded-lg shadow-sm">Allocate Bed (AI)</button>
                           </div>
                           
                           <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg">
                             <div className="flex justify-between items-start mb-2">
                               <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded">Transfer (Internal)</span>
                               <span className="text-xs text-slate-500">25 mins ago</span>
                             </div>
                             <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Sunita Rao (65, F)</p>
                             <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">From: ICU-1 • To: General Ward • Oxygen required</p>
                             <button className="w-full text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">Review Request</button>
                           </div>
                        </div>
                     </div>
                   </div>

                   {/* Occupancy Analytics */}
                   <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                         <h3 className="font-bold text-slate-900 dark:text-slate-100">Ward Occupancy Heatmap</h3>
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-center gap-6">
                        {/* Mock Bars */}
                        {[
                          { name: 'Intensive Care Unit (ICU)', cap: 20, occ: 19, pct: 95 },
                          { name: 'General Medical (Ward 4)', cap: 60, occ: 52, pct: 86 },
                          { name: 'Maternity (Ward 2)', cap: 40, occ: 28, pct: 70 },
                          { name: 'Pediatrics (Ward 3)', cap: 30, occ: 15, pct: 50 },
                        ].map((ward, i) => (
                          <div key={i}>
                            <div className="flex justify-between text-sm mb-1.5">
                              <span className="font-medium text-slate-700 dark:text-slate-300">{ward.name}</span>
                              <span className="text-slate-500">{ward.occ} / {ward.cap} ({ward.pct}%)</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                              <div className={`h-2.5 rounded-full ${ward.pct > 90 ? 'bg-red-500' : ward.pct > 75 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${ward.pct}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                   </div>

                </div>
             </div>
          )}

          {activeTab === 'bed explorer' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex gap-2">
                   <select className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 outline-none">
                     <option>All Buildings</option>
                     <option>Main Tower</option>
                     <option>East Wing</option>
                   </select>
                   <select className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 outline-none">
                     <option>All Wards</option>
                     <option>General W1</option>
                     <option>ICU W2</option>
                   </select>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search bed, patient..." className="pl-9 pr-4 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64" />
                  </div>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                     <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}><Grid className="w-4 h-4" /></button>
                     <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}><LayoutList className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-6 bg-slate-50/50 dark:bg-slate-900/20">
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {bedExplorerData.map((bed, i) => (
                      <div key={i} className={`border rounded-xl p-4 flex flex-col justify-between ${getStatusColor(bed.status)} bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md cursor-pointer relative overflow-hidden group`}>
                         {bed.isolation && (
                           <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-sm z-10">
                             <ShieldAlert className="w-3 h-3"/> Isolation
                           </div>
                         )}
                         <div className="flex justify-between items-start mb-4">
                           <div>
                             <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{bed.id}</h3>
                             <p className="text-xs text-slate-500 font-medium">{bed.type}</p>
                           </div>
                           <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${getStatusColor(bed.status)}`}>
                             {bed.status}
                           </span>
                         </div>
                         
                         {bed.patient ? (
                           <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                             <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{bed.patient} ({bed.gender})</p>
                             <p className="text-xs text-slate-500 mt-1">{bed.admitDate}</p>
                           </div>
                         ) : (
                           <div className="pt-3 border-t border-slate-100 dark:border-slate-800 opacity-50 flex items-center justify-center py-2">
                             <span className="text-xs font-medium">— Empty —</span>
                           </div>
                         )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                          <th className="px-6 py-4 font-semibold">Bed ID</th>
                          <th className="px-6 py-4 font-semibold">Type</th>
                          <th className="px-6 py-4 font-semibold">Status</th>
                          <th className="px-6 py-4 font-semibold">Patient</th>
                          <th className="px-6 py-4 font-semibold">Duration</th>
                          <th className="px-6 py-4 font-semibold">Tags</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                         {bedExplorerData.map((bed, i) => (
                           <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                             <td className="px-6 py-4 text-sm font-bold">{bed.id}</td>
                             <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{bed.type}</td>
                             <td className="px-6 py-4">
                               <span className={`px-2 py-1 text-xs font-semibold rounded border ${getStatusColor(bed.status)}`}>
                                 {bed.status}
                               </span>
                             </td>
                             <td className="px-6 py-4 text-sm font-medium">{bed.patient || <span className="text-slate-400">-</span>}</td>
                             <td className="px-6 py-4 text-sm text-slate-500">{bed.admitDate || <span className="text-slate-400">-</span>}</td>
                             <td className="px-6 py-4">
                                {bed.isolation && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold">Isolation</span>}
                             </td>
                           </tr>
                         ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'live floor map' && (
             <div className="flex flex-col items-center justify-center h-full text-center">
               <MapIcon className="w-16 h-16 text-slate-300 mb-4" />
               <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Live Interactive Floor Map</h3>
               <p className="text-slate-500 max-w-md">The 2D visual floor plan rendering engine is loading. This feature allows spatial visualization of ward capacities, isolation zones, and nurse routes.</p>
             </div>
          )}
          
        </div>
      </div>
    </DashboardLayout>
  );
}
