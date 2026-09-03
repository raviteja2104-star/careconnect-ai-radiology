'use client';

import React, { useState } from 'react';
import { Smile, Activity, AlertTriangle, ShieldCheck, Heart } from 'lucide-react';
import { CLINICAL_CALCULATORS } from '@/services/specialtyService';

export const PsychiatryWidget: React.FC = () => {
  const [phqInputs, setPhqInputs] = useState({
    q1: '2 - More than half the days',
    q2: '2 - More than half the days',
    q3: '1 - Several days',
    q4: '2 - More than half the days'
  });

  const phqResult = CLINICAL_CALCULATORS['phq9-depression'].calculate(phqInputs);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-600 text-white rounded-2xl shadow-xs">
            <Smile className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Psychiatry & Behavioral Health Module</h3>
              <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[10px] font-extrabold rounded-full">
                PHQ-9 + GAD-7 Active
              </span>
            </div>
            <p className="text-xs text-slate-500">Diagnosis: Major Depressive Disorder (Recurrent, Moderate) | GAD-7 Score: 11 (Moderate Anxiety)</p>
          </div>
        </div>

        <span className="px-3 py-1 bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs font-black rounded-xl">
          PHQ-9: {phqResult.score}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
            PHQ-9 Screen Question Items
          </h4>
          <div className="space-y-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400 font-bold block">1. Anhedonia (Little interest in activities)</label>
              <select 
                value={phqInputs.q1} 
                onChange={(e) => setPhqInputs({...phqInputs, q1: e.target.value})}
                className="w-full p-1.5 mt-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value="0 - Not at all">0 - Not at all</option>
                <option value="1 - Several days">1 - Several days</option>
                <option value="2 - More than half the days">2 - More than half the days</option>
                <option value="3 - Nearly every day">3 - Nearly every day</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold block">2. Feeling down, depressed, or hopeless</label>
              <select 
                value={phqInputs.q2} 
                onChange={(e) => setPhqInputs({...phqInputs, q2: e.target.value})}
                className="w-full p-1.5 mt-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              >
                <option value="0 - Not at all">0 - Not at all</option>
                <option value="1 - Several days">1 - Several days</option>
                <option value="2 - More than half the days">2 - More than half the days</option>
                <option value="3 - Nearly every day">3 - Nearly every day</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900 rounded-2xl space-y-2">
          <h4 className="text-xs font-bold uppercase text-teal-800 dark:text-teal-300">
            Mental Status Examination (MSE)
          </h4>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-teal-100 dark:border-slate-800">
              <span className="text-slate-400 font-bold text-[10px] block">Appearance & Affect</span>
              <strong className="text-slate-800 dark:text-slate-200">Well-groomed, Restricted affect</strong>
            </div>
            <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-teal-100 dark:border-slate-800">
              <span className="text-slate-400 font-bold text-[10px] block">Thought Process</span>
              <strong className="text-slate-800 dark:text-slate-200">Linear, Goal-directed</strong>
            </div>
            <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-teal-100 dark:border-slate-800">
              <span className="text-slate-400 font-bold text-[10px] block">Suicidal Ideation</span>
              <strong className="text-emerald-700 dark:text-emerald-400">Negative (-)</strong>
            </div>
            <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-teal-100 dark:border-slate-800">
              <span className="text-slate-400 font-bold text-[10px] block">Insight & Judgment</span>
              <strong className="text-slate-800 dark:text-slate-200">Good Insight (4/5)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
