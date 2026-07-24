import React from 'react';
import { Badge } from '../Badge/Badge';

export interface DrugChipProps {
  name: string;
  dose?: string;
  frequency?: string;
  route?: string;
  isHighAlert?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function DrugChip({ name, dose, frequency, route, isHighAlert, onRemove, className = '' }: DrugChipProps) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 ${className}`}>
      {isHighAlert && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="High Alert Medication" />}
      <span className="font-bold">{name}</span>
      {dose && <span className="text-blue-600 dark:text-blue-400">{dose}</span>}
      {frequency && <span className="text-blue-500 dark:text-blue-400">{frequency}</span>}
      {route && <span className="text-blue-400 dark:text-blue-500">({route})</span>}
      {onRemove && (
        <button onClick={onRemove} className="ml-1 text-blue-400 hover:text-red-500 transition-colors" aria-label="Remove medication">
          ×
        </button>
      )}
    </div>
  );
}

export interface DiagnosisChipProps {
  code?: string;
  label: string;
  severity?: 'primary' | 'secondary' | 'comorbidity';
  onRemove?: () => void;
  className?: string;
}

export function DiagnosisChip({ code, label, severity = 'primary', onRemove, className = '' }: DiagnosisChipProps) {
  const severityStyle = {
    primary: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300',
    secondary: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300',
    comorbidity: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
  };
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${severityStyle[severity]} ${className}`}>
      {code && <span className="font-mono font-bold">{code}</span>}
      <span>{label}</span>
      {onRemove && (
        <button onClick={onRemove} className="ml-1 opacity-60 hover:opacity-100 hover:text-red-500 transition-colors" aria-label="Remove diagnosis">×</button>
      )}
    </div>
  );
}

export interface AllergyChipProps {
  allergen: string;
  reaction?: string;
  severity?: 'mild' | 'moderate' | 'severe';
  onRemove?: () => void;
  className?: string;
}

export function AllergyChip({ allergen, reaction, severity = 'moderate', onRemove, className = '' }: AllergyChipProps) {
  const severityStyle = {
    mild: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300',
    moderate: 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-300',
    severe: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300',
  };
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${severityStyle[severity]} ${className}`}>
      <span>⚠</span>
      <span>{allergen}</span>
      {reaction && <span className="opacity-70">({reaction})</span>}
      {onRemove && (
        <button onClick={onRemove} className="ml-1 opacity-60 hover:opacity-100 hover:text-red-600 transition-colors">×</button>
      )}
    </div>
  );
}
