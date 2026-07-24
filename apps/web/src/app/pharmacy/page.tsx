'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Pill, AlertTriangle, PackageSearch, Snowflake, IndianRupee, 
  CheckCircle, ShieldAlert, ScanBarcode, Filter, Search, Printer,
  MoreVertical, Clock
} from 'lucide-react';
import { DrugService } from '@/services/drugService';

export default function PharmacyDashboard() {
  const [activeTab, setActiveTab] = useState('queue');

  // Mock Data for Dashboard
  const stats = [
    { label: "Today's Rx", value: '142', icon: <Pill className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Pending Dispense', value: '18', icon: <Clock className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { label: 'AI Alerts (Interactions)', value: '2', icon: <ShieldAlert className="w-5 h-5" />, color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    { label: 'Low Stock Items', value: '14', icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  ];

  const rxQueue = [
    { rxId: 'RX-2026-881', patient: 'Rohit Sharma', doctor: 'Dr. Raj Sharma', time: '10 mins ago', status: 'Verification', items: 4, aiFlag: false },
    { rxId: 'RX-2026-882', patient: 'Priya Patel', doctor: 'Dr. Anita Desai', time: '15 mins ago', status: 'Ready', items: 2, aiFlag: true, aiMsg: 'Potential duplicate therapy detected.' },
    { rxId: 'RX-2026-883', patient: 'Amit Singh', doctor: 'Dr. Raj Sharma', time: '1 hour ago', status: 'Dispensed', items: 1, aiFlag: false },
  ];

  const inventory = DrugService.getAllDrugs().map(d => ({
    ...d,
    stock: Math.floor(Math.random() * 500) + 10,
    status: Math.random() > 0.8 ? 'Low Stock' : 'In Stock'
  }));

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
        
        {/* Pharmacy Header & Tabs */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-10 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><Pill className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> Central Pharmacy</h1>
              <p className="text-sm text-slate-500">Enterprise Pharmacy Information System (PIS)</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm hover:opacity-90 transition-opacity">
                <ScanBarcode className="w-4 h-4" /> Scan Barcode
              </button>
            </div>
          </div>
          
          <div className="flex space-x-1">
            {['Dashboard', 'queue', 'Inventory', 'Purchase Orders', 'Cold Chain'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg capitalize transition-colors ${activeTab === tab ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {tab === 'queue' ? 'Prescription Queue' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          
          {activeTab === 'Dashboard' && (
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
                   {/* Urgent AI Alerts */}
                   <div className="xl:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-red-50/50 dark:bg-red-900/10 flex items-center gap-2">
                         <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
                         <h3 className="font-bold text-slate-900 dark:text-slate-100">AI Safety Alerts</h3>
                      </div>
                      <div className="p-4 flex-1">
                         <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg mb-3">
                           <div className="flex justify-between items-start mb-1">
                             <span className="text-xs font-bold text-red-700 dark:text-red-400">Severe Interaction</span>
                             <span className="text-xs text-red-500">RX-2026-885</span>
                           </div>
                           <p className="text-xs text-slate-700 dark:text-slate-300 mb-2">Patient prescribed Warfarin + Aspirin. High risk of bleeding.</p>
                           <button className="text-xs font-semibold text-red-700 dark:text-red-400 hover:underline">Review & Hold</button>
                         </div>
                      </div>
                   </div>

                   {/* Quick Dispense Feed */}
                   <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                         <h3 className="font-bold text-slate-900 dark:text-slate-100">Ready for Dispensing</h3>
                         <button className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">View Queue</button>
                      </div>
                      <table className="w-full text-left border-collapse">
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {rxQueue.filter(r => r.status === 'Ready').map((rx, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-4">
                                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{rx.rxId}</p>
                                <p className="text-xs text-slate-500">{rx.patient} • {rx.items} items</p>
                              </td>
                              <td className="p-4 text-right">
                                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm">Dispense</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'queue' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-md">All Prescriptions</button>
                  <button className="px-3 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium rounded-md">Pending Verification</button>
                  <button className="px-3 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium rounded-md">Ready</button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search Rx ID or Patient..." className="pl-9 pr-4 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64" />
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
                      <th className="px-6 py-4 font-semibold">Rx ID</th>
                      <th className="px-6 py-4 font-semibold">Patient</th>
                      <th className="px-6 py-4 font-semibold">Doctor</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">AI Validation</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rxQueue.map((rx, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{rx.rxId}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{rx.patient}</p>
                          <p className="text-xs text-slate-500">{rx.time}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{rx.doctor}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-md ${rx.status === 'Verification' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30' : rx.status === 'Ready' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 'bg-green-50 text-green-600 dark:bg-green-900/30'}`}>
                            {rx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {rx.aiFlag ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400"><ShieldAlert className="w-4 h-4"/> Flagged</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400"><CheckCircle className="w-4 h-4"/> Passed</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             {rx.status === 'Verification' && <button className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg shadow-sm hover:opacity-90">Verify Rx</button>}
                             {rx.status === 'Ready' && <button className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-indigo-700">Dispense</button>}
                             <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Printer className="w-4 h-4"/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'Inventory' && (
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                 <h2 className="text-lg font-bold">Master Drug Inventory</h2>
                 <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search Brand, Generic, ID..." className="pl-9 pr-4 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-80" />
                  </div>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4 font-semibold">Item ID</th>
                      <th className="px-6 py-4 font-semibold">Brand Name</th>
                      <th className="px-6 py-4 font-semibold">Generic Name</th>
                      <th className="px-6 py-4 font-semibold">Strength</th>
                      <th className="px-6 py-4 font-semibold">Price (MRP)</th>
                      <th className="px-6 py-4 font-semibold">Stock Level</th>
                      <th className="px-6 py-4 font-semibold">Tags</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {inventory.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4 text-xs font-mono text-slate-500">{item.id}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{item.brandName}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{item.genericName}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{item.strength} • {item.form}</td>
                        <td className="px-6 py-4 text-sm font-medium">₹{(item.basePrice * (1 + item.gstRate/100)).toFixed(2)}</td>
                        <td className="px-6 py-4">
                           <span className={`flex items-center gap-1.5 text-sm font-semibold ${item.status === 'Low Stock' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                             <span className={`w-2 h-2 rounded-full ${item.status === 'Low Stock' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                             {item.stock} Units
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex gap-1">
                             {item.schedule && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 text-[10px] font-bold rounded" title="Controlled Substance">Rx ({item.schedule})</span>}
                             {item.requiresColdChain && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 text-[10px] font-bold rounded flex items-center gap-0.5"><Snowflake className="w-3 h-3"/> Cold</span>}
                           </div>
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
