'use client';

import React, { useState } from 'react';
import { Heart, Calendar, Baby, Activity, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ObGynWidget: React.FC = () => {
  const [lmpDate, setLmpDate] = useState('2024-01-15');
  const [kickCount, setKickCount] = useState(12);

  // Naegele's rule for EDD: LMP + 9 months + 7 days
  const calculateEdd = (lmp: string) => {
    const d = new Date(lmp);
    if (isNaN(d.getTime())) return '22-Oct-2024';
    d.setDate(d.getDate() + 280);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const eddStr = calculateEdd(lmpDate);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-xs">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Obstetrics & Maternal Care Suite</h3>
              <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-extrabold rounded-full">
                28 Weeks Gestation (2nd Trimester)
              </span>
            </div>
            <p className="text-xs text-slate-500">LMP: 15-Jan-2024 | Parity: G2P1L1A0</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-right">
            <span className="text-[10px] text-rose-700 dark:text-rose-300 font-bold block uppercase">Estimated Date of Delivery (EDD)</span>
            <strong className="text-xs font-black text-slate-900 dark:text-white">{eddStr}</strong>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* ANC Visit Progress */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Antenatal Care (ANC) Visits</span>
          <div className="flex items-center justify-between text-xs font-bold">
            <span>ANC Visit #4 of 8</span>
            <span className="text-emerald-600">Completed</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
            <div className="bg-rose-500 h-full w-3/5 rounded-full"></div>
          </div>
        </div>

        {/* Fetal Heart Rate */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Fetal Doppler Heart Rate</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-xl font-black text-rose-600">144 bpm</strong>
            <span className="text-[10px] text-emerald-600 font-bold">Reassuring CTG</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Normal Range: 110 - 160 bpm</span>
        </div>

        {/* Fetal Kick Count Tracker */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">24h Fetal Kick Count</span>
            <button 
              onClick={() => setKickCount(k => k + 1)}
              className="px-2 py-0.5 bg-rose-600 text-white rounded-lg text-[10px] font-bold"
            >
              + Log Kick
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-xl font-black text-slate-900 dark:text-white">{kickCount} Kicks</strong>
            <span className="text-[10px] text-emerald-600 font-bold">Good Fetal Movement</span>
          </div>
        </div>
      </div>
    </div>
  );
};
