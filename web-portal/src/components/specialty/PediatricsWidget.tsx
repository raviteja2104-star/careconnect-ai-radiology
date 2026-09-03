'use client';

import React, { useState } from 'react';
import { Baby, Syringe, TrendingUp, Calculator, CheckCircle2, AlertCircle, Award, Plus, FileText } from 'lucide-react';
import { INITIAL_PEDIATRIC_VACCINES, VaccineItem, CLINICAL_CALCULATORS } from '@/services/specialtyService';

export const PediatricsWidget: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'growth' | 'vaccines' | 'calculators'>('vaccines');
  const [vaccines, setVaccines] = useState<VaccineItem[]>(INITIAL_PEDIATRIC_VACCINES);
  const [showCert, setShowCert] = useState(false);

  // Weight calculator state
  const [childWeight, setChildWeight] = useState(14);
  const [mgPerKg, setMgPerKg] = useState(15);
  const [frequency, setFrequency] = useState('3 (TID)');

  const toggleVaccineStatus = (id: string) => {
    setVaccines(prev => prev.map(v => {
      if (v.id === id) {
        const nextStatus = v.status === 'given' ? 'due' : 'given';
        return {
          ...v,
          status: nextStatus,
          givenDate: nextStatus === 'given' ? new Date().toISOString().split('T')[0] : undefined,
          batchNo: nextStatus === 'given' ? `LOT-${Math.floor(1000 + Math.random() * 9000)}` : undefined
        };
      }
      return v;
    }));
  };

  const doseCalcResult = CLINICAL_CALCULATORS['pediatric-dose'].calculate({
    weightKg: childWeight,
    mgPerKg,
    frequency
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-pink-500 text-white rounded-2xl shadow-xs">
            <Baby className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pediatric Growth & Vaccination Hub</h3>
              <span className="px-2 py-0.5 bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-[10px] font-extrabold rounded-full">
                WHO / IAP Certified
              </span>
            </div>
            <p className="text-xs text-slate-500">Child Age: 2 Months 12 Days | UHID: PT-0001234</p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs">
          <button
            onClick={() => setActiveTab('vaccines')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'vaccines' ? 'bg-white dark:bg-slate-900 text-pink-600 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            💉 Vaccines
          </button>
          <button
            onClick={() => setActiveTab('growth')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'growth' ? 'bg-white dark:bg-slate-900 text-pink-600 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            📈 Growth Chart
          </button>
          <button
            onClick={() => setActiveTab('calculators')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'calculators' ? 'bg-white dark:bg-slate-900 text-pink-600 shadow-2xs' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            🧮 Dosing
          </button>
        </div>
      </div>

      {/* TAB 1: VACCINES */}
      {activeTab === 'vaccines' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Syringe className="w-4 h-4 text-pink-500" />
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Immunization Record (IAP Schedule)</span>
            </div>
            <button
              onClick={() => setShowCert(!showCert)}
              className="px-3 py-1.5 bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-800 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-pink-100 transition-all"
            >
              <Award className="w-3.5 h-3.5" />
              {showCert ? 'Hide Certificate' : 'Generate Immunization Cert'}
            </button>
          </div>

          {showCert ? (
            <div className="p-6 bg-amber-50/50 dark:bg-amber-950/20 border-2 border-dashed border-amber-300 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto font-black text-xl">
                🏆
              </div>
              <h4 className="text-sm font-black text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                CareConnect Official Immunization Certificate
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-400 max-w-md mx-auto">
                Certifies that <strong>Rohit Sharma (Child)</strong> has completed all 6-week and birth vaccinations per WHO guidelines.
              </p>
              <div className="flex justify-center gap-4 text-[11px] font-mono text-amber-700 pt-2">
                <span>Completed Vaccines: 6/11</span>
                <span>•</span>
                <span>Verified by: Dr. Raj Sharma</span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-200 dark:border-slate-800">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">Vaccine</th>
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">Due Age</th>
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">Route & Site</th>
                    <th className="p-2 border-r border-slate-200 dark:border-slate-800">Status</th>
                    <th className="p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {vaccines.map((v) => (
                    <tr key={v.id} className="border-b border-slate-200 dark:border-slate-800 odd:bg-white even:bg-slate-50/50 dark:odd:bg-slate-900 dark:even:bg-slate-800/40">
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                        {v.name}
                        <span className="block text-[10px] text-slate-400 font-normal">{v.targetDisease}</span>
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 font-semibold">{v.dueAge}</td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                        {v.route} ({v.site})
                      </td>
                      <td className="p-2.5 border-r border-slate-200 dark:border-slate-800">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                          v.status === 'given' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                          v.status === 'due' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {v.status} {v.givenDate ? `(${v.givenDate})` : ''}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <button
                          onClick={() => toggleVaccineStatus(v.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            v.status === 'given'
                              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                          }`}
                        >
                          {v.status === 'given' ? 'Undo' : 'Mark Administered'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GROWTH CHART */}
      {activeTab === 'growth' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-pink-50 dark:bg-pink-950/40 border border-pink-100 dark:border-pink-900 rounded-2xl">
              <span className="text-[10px] font-bold text-pink-700 dark:text-pink-300 uppercase block">Weight Percentile</span>
              <span className="text-lg font-black text-pink-900 dark:text-pink-100">54th %tile</span>
              <span className="text-[10px] text-slate-500 block">5.4 kg (Normal Growth)</span>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-2xl">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase block">Height / Length</span>
              <span className="text-lg font-black text-blue-900 dark:text-blue-100">62nd %tile</span>
              <span className="text-[10px] text-slate-500 block">58.2 cm</span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 rounded-2xl">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase block">Head Circumference</span>
              <span className="text-lg font-black text-emerald-900 dark:text-emerald-100">50th %tile</span>
              <span className="text-[10px] text-slate-500 block">39.1 cm</span>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900 rounded-2xl">
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase block">Development Milestone</span>
              <span className="text-xs font-extrabold text-purple-900 dark:text-purple-100">Social Smile (+)</span>
              <span className="text-[10px] text-slate-500 block">Holds Head Steady</span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>WHO Growth Standard Trajectory</span>
              <span className="text-[10px] text-pink-600 font-bold">2 Months Age Benchmark</span>
            </h4>
            <div className="h-24 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex items-end justify-between gap-2">
              {[35, 42, 54, 68, 75, 84].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-pink-500 rounded-t-md transition-all" style={{ height: `${h}%` }}></div>
                  <span className="text-[9px] text-slate-400 font-bold">{['Birth', '1M', '2M', '3M', '4M', '6M'][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CALCULATORS */}
      {activeTab === 'calculators' && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-pink-500" />
            <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              Weight-Based Pediatric Medication Dosing Calculator
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Child Weight (kg)</label>
              <input 
                type="number"
                value={childWeight}
                onChange={(e) => setChildWeight(Number(e.target.value))}
                className="w-full p-2 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Dosage Rate (mg/kg/day)</label>
              <input 
                type="number"
                value={mgPerKg}
                onChange={(e) => setMgPerKg(Number(e.target.value))}
                className="w-full p-2 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase">Frequency Schedule</label>
              <select 
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full p-2 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="1 (OD)">1 (OD)</option>
                <option value="2 (BID)">2 (BID)</option>
                <option value="3 (TID)">3 (TID)</option>
                <option value="4 (QID)">4 (QID)</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-pink-50 text-pink-900 dark:bg-pink-950/60 dark:text-pink-200 border border-pink-200 dark:border-pink-800 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-pink-600 block">Calculated Single Dose</span>
              <strong className="text-base font-black">{doseCalcResult.score}</strong>
            </div>
            <div className="text-right text-[11px]">
              <span>{doseCalcResult.interpretation}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
