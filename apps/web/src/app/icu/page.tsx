'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  HeartPulse, Activity, AlertTriangle, Wind, 
  Droplets, Stethoscope, ChevronRight, CheckCircle,
  Siren, Thermometer, Info, ActivitySquare, Pill, Clipboard
} from 'lucide-react';

export default function ICUDashboard() {
  const [activeTab, setActiveTab] = useState('central monitor');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time for real-time feel
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // KPI Stats
  const stats = [
    { label: "ICU Census", value: '18 / 20', icon: <HeartPulse className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { label: 'On Ventilator', value: '12', icon: <Wind className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'On Vasopressors', value: '8', icon: <Droplets className="w-5 h-5" />, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    { label: 'Critical Alerts', value: '3', icon: <AlertTriangle className="w-5 h-5 animate-pulse" />, color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  ];

  // Mock Central Monitor Data
  const monitors = [
    { bed: 'ICU-1', patient: 'Rohit S.', age: 45, status: 'Critical', hr: 112, bp: '85/50', map: 61, spo2: 92, rr: 28, temp: 38.5, vent: 'SIMV', pressor: 'NorAd' },
    { bed: 'ICU-2', patient: 'Meena G.', age: 62, status: 'Stable', hr: 78, bp: '120/80', map: 93, spo2: 98, rr: 16, temp: 37.1, vent: 'CPAP', pressor: null },
    { bed: 'ICU-3', patient: 'Anil K.', age: 55, status: 'Warning', hr: 95, bp: '145/90', map: 108, spo2: 94, rr: 22, temp: 37.8, vent: null, pressor: null },
    { bed: 'ICU-4', patient: 'Sunita R.', age: 38, status: 'Critical', hr: 130, bp: '70/40', map: 50, spo2: 88, rr: 32, temp: 39.2, vent: 'PRVC', pressor: 'Adren/NorAd' },
    { bed: 'ICU-5', patient: 'Vikram M.', age: 70, status: 'Stable', hr: 82, bp: '130/85', map: 100, spo2: 96, rr: 18, temp: 36.8, vent: null, pressor: null },
    { bed: 'ICU-6', patient: 'Priya P.', age: 28, status: 'Stable', hr: 88, bp: '110/70', map: 83, spo2: 99, rr: 14, temp: 37.0, vent: null, pressor: null },
  ];

  // Helper for conditional styling
  const getAlertColor = (status: string) => {
    switch(status) {
      case 'Critical': return 'border-red-500 bg-red-50/10 dark:bg-red-900/10';
      case 'Warning': return 'border-amber-500 bg-amber-50/10 dark:bg-amber-900/10';
      default: return 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900';
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
                <HeartPulse className="w-6 h-6 text-red-600 dark:text-red-500" /> Critical Care (ICU)
              </h1>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Live Command Center • {currentTime.toLocaleTimeString()}
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors">
                <Stethoscope className="w-4 h-4" /> Start Rounds
              </button>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors animate-pulse border border-red-400">
                <Siren className="w-4 h-4" /> Code Blue
              </button>
            </div>
          </div>
          
          <div className="flex space-x-1 overflow-x-auto hide-scrollbar pb-1">
            {['dashboard', 'central monitor', 'ventilators', 'infusions', 'severity scores', 'rounds'].map((tab) => (
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

          {activeTab === 'central monitor' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
              {monitors.map((m, i) => (
                <div key={i} className={`rounded-xl border-2 overflow-hidden shadow-sm flex flex-col ${getAlertColor(m.status)}`}>
                   <div className="px-4 py-2 bg-slate-900 dark:bg-black text-white flex justify-between items-center shrink-0">
                     <div className="flex items-center gap-2">
                       <span className="font-mono font-bold text-lg text-indigo-400">{m.bed}</span>
                       <span className="font-semibold">{m.patient}</span>
                     </div>
                     <div className="flex gap-2">
                       {m.vent && <span className="px-1.5 py-0.5 bg-blue-900 text-blue-200 text-[10px] font-bold rounded uppercase flex items-center gap-1"><Wind className="w-3 h-3"/> {m.vent}</span>}
                       {m.pressor && <span className="px-1.5 py-0.5 bg-purple-900 text-purple-200 text-[10px] font-bold rounded uppercase flex items-center gap-1"><Droplets className="w-3 h-3"/> {m.pressor}</span>}
                     </div>
                   </div>
                   
                   <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-6 bg-slate-50 dark:bg-slate-950 flex-1">
                      
                      {/* HR */}
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-green-600 dark:text-green-500 tracking-wider">HR (bpm)</span>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className={`text-4xl font-mono font-bold ${m.hr > 100 ? 'text-red-600 animate-pulse' : 'text-green-600 dark:text-green-400'}`}>{m.hr}</span>
                          <Activity className="w-5 h-5 text-green-500 opacity-50" />
                        </div>
                      </div>

                      {/* BP */}
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-red-600 dark:text-red-500 tracking-wider">NIBP (mmHg)</span>
                          <span className="text-[10px] font-mono text-slate-400">MAP: {m.map}</span>
                        </div>
                        <div className="flex items-baseline mt-1">
                          <span className={`text-3xl font-mono font-bold ${(m.map < 65 || m.map > 105) ? 'text-red-600 animate-pulse' : 'text-red-600 dark:text-red-400'}`}>{m.bp}</span>
                        </div>
                      </div>

                      {/* SpO2 */}
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-500 tracking-wider">SpO2 (%)</span>
                        <div className="flex items-baseline mt-1">
                          <span className={`text-4xl font-mono font-bold ${m.spo2 < 94 ? 'text-red-600 animate-pulse' : 'text-blue-600 dark:text-blue-400'}`}>{m.spo2}</span>
                        </div>
                      </div>

                      {/* RR */}
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-yellow-600 dark:text-yellow-500 tracking-wider">RR (rpm)</span>
                        <div className="flex items-baseline mt-1">
                          <span className={`text-4xl font-mono font-bold ${m.rr > 25 ? 'text-red-600' : 'text-yellow-600 dark:text-yellow-400'}`}>{m.rr}</span>
                        </div>
                      </div>

                   </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ventilators' && (
             <div className="flex flex-col items-center justify-center h-full text-center pb-20">
               <Wind className="w-16 h-16 text-blue-300 dark:text-blue-900 mb-4" />
               <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Ventilator Management</h3>
               <p className="text-slate-500 max-w-md">Track FiO2, PEEP, Peak Pressures, and Respiratory modes across the ICU.</p>
             </div>
          )}

          {activeTab === 'severity scores' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
               
               <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold">APACHE II Score</h3>
                   <ActivitySquare className="w-5 h-5 text-indigo-500" />
                 </div>
                 <div className="text-4xl font-bold text-indigo-600 mb-2">24</div>
                 <p className="text-sm text-slate-500">Predicted Mortality: ~50%. Calculated 2 hours ago for Patient Rohit S.</p>
                 <button className="mt-4 w-full py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm font-semibold rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">Recalculate</button>
               </div>

               <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                 <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold">SOFA Score</h3>
                   <ActivitySquare className="w-5 h-5 text-emerald-500" />
                 </div>
                 <div className="text-4xl font-bold text-emerald-600 mb-2">9</div>
                 <p className="text-sm text-slate-500">Suggests significant organ failure (Resp, CV, Renal). Patient Sunita R.</p>
                 <button className="mt-4 w-full py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">Recalculate</button>
               </div>
               
             </div>
          )}

          {activeTab !== 'central monitor' && activeTab !== 'ventilators' && activeTab !== 'severity scores' && (
             <div className="flex flex-col items-center justify-center h-full text-center pb-20">
               <Clipboard className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
               <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2 capitalize">{activeTab} Module</h3>
               <p className="text-slate-500 max-w-md">The {activeTab} workspace will be rendered here.</p>
             </div>
          )}
          
        </div>
      </div>
    </DashboardLayout>
  );
}
