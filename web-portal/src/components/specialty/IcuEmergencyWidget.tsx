'use client';

import React, { useState } from 'react';
import { ShieldPlus, AlertTriangle, Activity, Clock, Wind, Flame } from 'lucide-react';
import { CLINICAL_CALCULATORS } from '@/services/specialtyService';

export const IcuEmergencyWidget: React.FC = () => {
  const [sofaInputs, setSofaInputs] = useState({
    pao2fio2: '2 - <= 300',
    platelets: '1 - <= 150',
    map: '1 - MAP < 70 mmHg',
    creatinine: '2 - 2.0 - 3.4'
  });

  const sofaResult = CLINICAL_CALCULATORS['sofa-icu'].calculate(sofaInputs);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-700 text-white rounded-2xl shadow-xs animate-pulse">
            <ShieldPlus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">ICU & Emergency Resuscitation Suite</h3>
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[10px] font-extrabold rounded-full">
                ESI Level 2 (Emergent)
              </span>
            </div>
            <p className="text-xs text-slate-500">Mode: PRVC Ventilator | FiO2: 45% | PEEP: 8 cmH2O | MAP: 68 mmHg</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 text-xs font-black rounded-xl">
            SOFA Score: {sofaResult.score}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Sepsis 1-Hour Bundle Timer */}
        <div className="p-3.5 bg-red-50/70 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-red-700 dark:text-red-300 uppercase">Sepsis 1-Hour Bundle Timer</span>
            <Clock className="w-3.5 h-3.5 text-red-600 animate-spin" />
          </div>
          <div className="flex items-baseline gap-2">
            <strong className="text-xl font-black text-red-900 dark:text-red-100">42:15 Mins</strong>
            <span className="text-[10px] text-emerald-700 font-bold">Lactate Taken (+)</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Broad-spectrum IV Antibiotic Administered</span>
        </div>

        {/* Ventilator Settings */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Ventilator & ABG Gas Log</span>
          <div className="grid grid-cols-2 gap-1 text-[11px] font-bold text-slate-800 dark:text-slate-200 pt-1">
            <div>pH: <strong className="text-slate-900 dark:text-white">7.32</strong></div>
            <div>PaCO2: <strong className="text-slate-900 dark:text-white">48 mmHg</strong></div>
            <div>PaO2: <strong className="text-slate-900 dark:text-white">88 mmHg</strong></div>
            <div>HCO3: <strong className="text-slate-900 dark:text-white">22 mEq/L</strong></div>
          </div>
        </div>

        {/* SOFA Score Matrix */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">SOFA Organ Dysfunction Assessment</span>
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{sofaResult.interpretation}</p>
          <span className="text-[10px] text-red-600 font-bold block">Risk Tier: {sofaResult.riskLevel.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};
