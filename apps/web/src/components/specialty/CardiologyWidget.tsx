'use client';

import React, { useState } from 'react';
import { HeartPulse, Activity, AlertTriangle, ShieldCheck, Calculator, LineChart, FileSpreadsheet } from 'lucide-react';
import { CLINICAL_CALCULATORS } from '@/services/specialtyService';

export const CardiologyWidget: React.FC = () => {
  const [chadsState, setChadsState] = useState({
    age: '65-74 years (+1)',
    female: false,
    chf: true,
    hypertension: true,
    stroke: false,
    vascular: false,
    diabetes: true
  });

  const chadsResult = CLINICAL_CALCULATORS['chads-vasc'].calculate(chadsState);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-600 text-white rounded-2xl shadow-xs animate-pulse">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cardiology & Hemodynamics Suite</h3>
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[10px] font-extrabold rounded-full">
                ECG Lead II Active
              </span>
            </div>
            <p className="text-xs text-slate-500">Echo LVEF: 55% | BP Trend: 128/84 mmHg | Troponin-I: Negative</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/50 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-800">
          <Activity className="w-4 h-4" /> Normal Sinus Rhythm (78 bpm)
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* ECG Rhythm Trace & Echo Summary */}
        <div className="p-4 bg-slate-900 text-emerald-400 rounded-2xl font-mono text-xs space-y-3 relative overflow-hidden border border-slate-800">
          <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-2">
            <span>ECG LEAD II (25mm/s, 10mm/mV)</span>
            <span className="text-emerald-400 font-bold">HR: 78 bpm</span>
          </div>

          {/* Simulated Waveform */}
          <div className="h-16 flex items-center justify-between gap-1 overflow-hidden opacity-90">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex items-end h-full gap-0.5">
                <div className="w-1 bg-emerald-500 rounded-t" style={{ height: `${(i % 5 === 2 ? 85 : i % 3 === 0 ? 35 : 15)}%` }}></div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
            <div><span className="text-slate-500">PR Interval:</span> <strong className="text-white">142 ms</strong></div>
            <div><span className="text-slate-500">QRS Duration:</span> <strong className="text-white">88 ms</strong></div>
            <div><span className="text-slate-500">QTc:</span> <strong className="text-white">412 ms</strong></div>
          </div>
        </div>

        {/* CHA2DS2-VASc Stroke Risk Calculator */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-red-600" />
              <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                CHA₂DS₂-VASc Stroke Risk Calculator
              </h4>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
              chadsResult.riskLevel === 'critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {chadsResult.score}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={chadsState.chf} 
                onChange={(e) => setChadsState({...chadsState, chf: e.target.checked})}
                className="rounded text-red-600 focus:ring-red-500" 
              />
              Congestive Heart Failure (+1)
            </label>
            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={chadsState.hypertension} 
                onChange={(e) => setChadsState({...chadsState, hypertension: e.target.checked})}
                className="rounded text-red-600 focus:ring-red-500" 
              />
              Hypertension (+1)
            </label>
            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={chadsState.diabetes} 
                onChange={(e) => setChadsState({...chadsState, diabetes: e.target.checked})}
                className="rounded text-red-600 focus:ring-red-500" 
              />
              Diabetes Mellitus (+1)
            </label>
            <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
              <input 
                type="checkbox" 
                checked={chadsState.stroke} 
                onChange={(e) => setChadsState({...chadsState, stroke: e.target.checked})}
                className="rounded text-red-600 focus:ring-red-500" 
              />
              Prior Stroke / TIA (+2)
            </label>
          </div>

          <div className="p-2.5 bg-red-50 text-red-900 dark:bg-red-950/60 dark:text-red-200 rounded-xl text-[11px] font-semibold">
            {chadsResult.interpretation}
          </div>
        </div>

      </div>
    </div>
  );
};
