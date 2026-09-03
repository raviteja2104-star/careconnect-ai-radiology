'use client';

import React, { useState } from 'react';
import { Brain, Activity, Zap, AlertTriangle } from 'lucide-react';
import { CLINICAL_CALCULATORS } from '@/services/specialtyService';

export const NeurologyWidget: React.FC = () => {
  const [nihInputs, setNihInputs] = useState({
    loc: '0 - Alert',
    gaze: '0 - Normal',
    motorArm: '1 - Drift',
    facial: '1 - Minor paralysis'
  });

  const nihResult = CLINICAL_CALCULATORS['nih-stroke'].calculate(nihInputs);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-600 text-white rounded-2xl shadow-xs">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Neurology & Acute Stroke Pathway</h3>
              <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[10px] font-extrabold rounded-full">
                Door-to-Needle Time: 32 Mins
              </span>
            </div>
            <p className="text-xs text-slate-500">MRI Brain: Acute Ischemic Infarct Left MCA Territory | GCS Score: 14/15 (E4V4M6)</p>
          </div>
        </div>

        <span className="px-3 py-1 bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800 text-violet-800 dark:text-violet-200 text-xs font-black rounded-xl">
          NIHSS Score: {nihResult.score}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>NIH Stroke Scale (NIHSS) Deficit Matrix</span>
            <span className="text-[10px] text-violet-600 font-bold">rtPA Thrombolytic Pathway</span>
          </h4>

          <div className="space-y-1.5 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block">Level of Consciousness</label>
              <select 
                value={nihInputs.loc} 
                onChange={(e) => setNihInputs({...nihInputs, loc: e.target.value})}
                className="w-full p-1.5 mt-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value="0 - Alert">0 - Alert</option>
                <option value="1 - Drowsy">1 - Drowsy (+1)</option>
                <option value="2 - Stuporous">2 - Stuporous (+2)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold block">Motor Arm Drift</label>
              <select 
                value={nihInputs.motorArm} 
                onChange={(e) => setNihInputs({...nihInputs, motorArm: e.target.value})}
                className="w-full p-1.5 mt-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value="0 - No drift">0 - No drift</option>
                <option value="1 - Drift">1 - Drift (+1)</option>
                <option value="2 - Some effort">2 - Some effort (+2)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-violet-50 text-violet-950 dark:bg-violet-950/60 dark:text-violet-200 border border-violet-200 dark:border-violet-800 rounded-2xl flex flex-col justify-between space-y-2">
          <div>
            <span className="text-[10px] font-bold uppercase text-violet-700 dark:text-violet-400 block">AI Clinical Decision Support</span>
            <h5 className="text-xs font-black pt-1">NIHSS Score Interpretation: {nihResult.interpretation}</h5>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 border-t border-violet-200 dark:border-violet-800 pt-2">
            Non-contrast CT Brain excludes intracranial hemorrhage. Patient within 4.5 hour window for IV Alteplase / Tenecteplase.
          </p>
        </div>
      </div>
    </div>
  );
};
