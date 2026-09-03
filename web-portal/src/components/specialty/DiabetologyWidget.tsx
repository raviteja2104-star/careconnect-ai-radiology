'use client';

import React, { useState } from 'react';
import { Activity, Flame, ShieldAlert, CheckCircle, TrendingDown, Eye, Footprints, Droplet } from 'lucide-react';

export const DiabetologyWidget: React.FC = () => {
  const [fasting, setFasting] = useState(138);
  const [ppSugar, setPpSugar] = useState(195);
  const [hba1c, setHba1c] = useState(7.8);

  const getHba1cColor = (val: number) => {
    if (val < 6.5) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (val < 7.5) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Diabetology & CGM Glycemic Dashboard</h3>
              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold rounded-full">
                CGM Connected
              </span>
            </div>
            <p className="text-xs text-slate-500">Target Range: 70-180 mg/dL | Time-in-Range (TIR): 68%</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-xl text-xs font-black border ${getHba1cColor(hba1c)}`}>
            HbA1c: {hba1c}%
          </span>
        </div>
      </div>

      {/* Glycemic Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Fasting Blood Glucose</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-xl font-black text-slate-900 dark:text-white">{fasting}</strong>
            <span className="text-xs text-slate-500">mg/dL</span>
          </div>
          <span className="text-[10px] text-amber-600 font-bold block mt-1">↑ Elevated (Target &lt; 110)</span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Post-Prandial (2h PP)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-xl font-black text-slate-900 dark:text-white">{ppSugar}</strong>
            <span className="text-xs text-slate-500">mg/dL</span>
          </div>
          <span className="text-[10px] text-red-600 font-bold block mt-1">↑ Above Target (&lt; 160)</span>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Estimated Avg Glucose (eAG)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="text-xl font-black text-slate-900 dark:text-white">177</strong>
            <span className="text-xs text-slate-500">mg/dL</span>
          </div>
          <span className="text-[10px] text-purple-600 font-bold block mt-1">Correlates to HbA1c 7.8%</span>
        </div>
      </div>

      {/* Diabetic Organ Complications Matrix */}
      <div className="p-4 bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 rounded-2xl space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-200 flex items-center justify-between">
          <span>Diabetes Organ Screening & Complications Matrix</span>
          <span className="text-[10px] text-purple-600 font-normal">Annual Screening Log</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
          <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-purple-100 dark:border-slate-800 flex items-center gap-2">
            <Footprints className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">Foot Exam</span>
              <strong className="text-emerald-700 text-[11px]">Normal (10g Monofilament +)</strong>
            </div>
          </div>

          <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-purple-100 dark:border-slate-800 flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">Retinopathy</span>
              <strong className="text-amber-700 text-[11px]">Mild NPDR (Fundus)</strong>
            </div>
          </div>

          <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-purple-100 dark:border-slate-800 flex items-center gap-2">
            <Droplet className="w-4 h-4 text-purple-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">Microalbuminuria</span>
              <strong className="text-purple-700 text-[11px]">UACR: 42 mg/g</strong>
            </div>
          </div>

          <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-purple-100 dark:border-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-bold">Neuropathy Score</span>
              <strong className="text-blue-700 text-[11px]">Vibration Sensation Intact</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
