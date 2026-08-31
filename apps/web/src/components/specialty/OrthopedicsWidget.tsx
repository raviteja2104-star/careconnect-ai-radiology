'use client';

import React, { useState } from 'react';
import { Bone, Activity, AlertCircle, CheckCircle } from 'lucide-react';

export const OrthopedicsWidget: React.FC = () => {
  const [painLevel, setPainLevel] = useState(6);
  const [selectedJoint, setSelectedJoint] = useState('Right Knee');
  const [flexion, setFlexion] = useState(115);
  const [extension, setExtension] = useState(0);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-600 text-white rounded-2xl shadow-xs">
            <Bone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Orthopedic & Joint Goniometry Suite</h3>
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold rounded-full">
                AI Fracture Scanner Ready
              </span>
            </div>
            <p className="text-xs text-slate-500">Diagnosis: Closed Comminuted Fracture Right Femur Shaft | AO/OTA 32-B2</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-black rounded-xl">
            Pain Scale VAS: {painLevel} / 10
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Pain Scale Bar */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Visual Analog Scale (VAS Pain)</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
              <button
                key={val}
                onClick={() => setPainLevel(val)}
                className={`flex-1 h-7 rounded-md text-[10px] font-black transition-all ${
                  painLevel === val 
                    ? 'bg-amber-600 text-white scale-110 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* ROM Goniometry */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Joint Range of Motion (Goniometry)</span>
          <div className="flex items-center justify-between text-xs pt-1">
            <span>Flexion: <strong className="text-amber-700 font-bold">{flexion}°</strong> (Target 135°)</span>
            <span>Extension: <strong className="text-emerald-700 font-bold">{extension}°</strong></span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-1">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(flexion / 135) * 100}%` }}></div>
          </div>
        </div>

        {/* Implant & Surgical Hardware Log */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Surgical Implants & Fixation</span>
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Depuy Synthes Titanium Intramedullary Nail</p>
          <span className="text-[10px] text-slate-500 block">Locking Screws x 4 | Serial # SY-99120</span>
        </div>
      </div>
    </div>
  );
};
