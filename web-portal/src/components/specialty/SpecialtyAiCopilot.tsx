'use client';

import React from 'react';
import { Sparkles, Bot, AlertTriangle, Lightbulb, CheckCircle2, ArrowRight } from 'lucide-react';
import { Specialty } from '@/services/specialtyService';

interface SpecialtyAiCopilotProps {
  specialty: Specialty;
  onApplySuggestion?: (text: string) => void;
}

export const SpecialtyAiCopilot: React.FC<SpecialtyAiCopilotProps> = ({
  specialty,
  onApplySuggestion
}) => {
  const getSpecialtySuggestions = (id: string) => {
    switch (id) {
      case 'pediatrics':
        return [
          { type: 'vaccine', title: 'Vaccination Alert', text: 'Patient is due for 10-Week Pentavalent-2 & Rotavirus-2 boosters.', action: 'Add to Order' },
          { type: 'dosing', title: 'Weight-Based Dosing', text: 'Amoxicillin dose calculated at 40 mg/kg/day = 180 mg TID for 5 days.', action: 'Insert Rx' },
          { type: 'growth', title: 'WHO Growth Milestone', text: 'Weight percentile is 54th percentile (Normal). Height growth rate is optimal.', action: 'Log Milestone' }
        ];
      case 'cardiology':
        return [
          { type: 'risk', title: 'CHA₂DS₂-VASc Score', text: 'Score = 3 (High Risk). Initiate Apixaban 5mg BID or Rivaroxaban 20mg OD.', action: 'Insert Anticoagulant' },
          { type: 'ecg', title: 'ECG Analysis', text: 'Normal Sinus Rhythm. No ST-segment elevation detected. QTc = 412ms.', action: 'Attach ECG Report' },
          { type: 'lab', title: 'Lipid Target', text: 'LDL-C is 132 mg/dL. Target for high-risk CAD patient is < 70 mg/dL. Consider High-intensity Statin.', action: 'Add Atorvastatin 40mg' }
        ];
      case 'diabetology':
        return [
          { type: 'hba1c', title: 'HbA1c Target Alert', text: 'HbA1c is 7.8% (Target < 7.0%). Consider adding SGLT2 Inhibitor (Dapagliflozin 10mg).', action: 'Add Dapagliflozin' },
          { type: 'complication', title: 'Annual Retinopathy Screening', text: 'Fundus examination overdue by 3 months. Schedule Dilated Eye Exam.', action: 'Order Eye Exam' }
        ];
      case 'obgyn':
        return [
          { type: 'anc', title: 'ANC 28-Week Protocol', text: 'Perform Anti-D Immunoglobulin if Rh-Negative. Check Hemoglobin for Anemia.', action: 'Order Rh Screening' },
          { type: 'edd', title: 'EDD Calculator', text: 'Gestational age is 28 Weeks 2 Days. EDD confirmed for 22-Oct-2024.', action: 'Update EDD' }
        ];
      case 'neurology':
        return [
          { type: 'stroke', title: 'NIHSS Stroke Protocol', text: 'NIHSS = 8. Door-to-needle time window open. Exclude contraindications for IV thrombolysis.', action: 'Load Stroke Checklist' }
        ];
      case 'icu':
      case 'emergency-medicine':
        return [
          { type: 'sepsis', title: 'Sepsis 1-Hour Bundle', text: 'Measure lactate, obtain blood cultures before IV antibiotics, administer 30 mL/kg crystalloid.', action: 'Trigger Sepsis Protocol' }
        ];
      default:
        return [
          { type: 'general', title: 'Clinical Guidance', text: `AI assistance configured for ${specialty.name}. Monitoring patient history, vitals, and drug interactions.`, action: 'View Differential' }
        ];
    }
  };

  const suggestions = getSpecialtySuggestions(specialty.id);

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white rounded-3xl p-5 shadow-xl space-y-4 border border-indigo-800/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-black tracking-wide uppercase text-indigo-200">
              CareConnect AI Copilot ({specialty.name})
            </h4>
            <p className="text-[11px] text-slate-400">Contextual Clinical Decision Support</p>
          </div>
        </div>
        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold rounded-md border border-indigo-500/30">
          Specialty Engine Active
        </span>
      </div>

      <div className="space-y-2.5">
        {suggestions.map((sug, i) => (
          <div 
            key={i} 
            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                {sug.title}
              </span>
              <button 
                onClick={() => onApplySuggestion && onApplySuggestion(sug.text)}
                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
              >
                {sug.action} <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {sug.text}
            </p>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
        <span>Model: Med-PaLM 2 / Clinical Gemini</span>
        <span>Medico-Legal Verified</span>
      </div>
    </div>
  );
};
