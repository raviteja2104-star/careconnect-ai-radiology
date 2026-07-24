import React from 'react';
import { Badge } from '../Badge/Badge';

// ─── LabResultCard ─────────────────────────────────────────────────────────────
export interface LabResult {
  test: string;
  value: number | string;
  unit: string;
  referenceRange?: string;
  status: 'normal' | 'low' | 'high' | 'critical-low' | 'critical-high';
  delta?: number;   // change from last reading
  loincCode?: string;
}

export interface LabResultCardProps {
  panelName: string;
  orderedAt: string;
  reportedAt?: string;
  status: 'pending' | 'partial' | 'final' | 'corrected';
  results: LabResult[];
  orderedBy?: string;
  className?: string;
  onViewReport?: () => void;
}

const resultStatusConfig = {
  normal:        { label: 'N',  color: 'text-green-700 dark:text-green-400',  bg: '' },
  low:           { label: 'L',  color: 'text-blue-700 dark:text-blue-400',    bg: '' },
  high:          { label: 'H',  color: 'text-amber-700 dark:text-amber-400',  bg: '' },
  'critical-low':  { label: 'LL', color: 'text-red-700 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-900/20' },
  'critical-high': { label: 'HH', color: 'text-red-700 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-900/20' },
};

export function LabResultCard({ panelName, orderedAt, reportedAt, status, results, orderedBy, className = '', onViewReport }: LabResultCardProps) {
  const panelStatusVariant = status === 'final' ? 'success' : status === 'pending' ? 'neutral' : status === 'partial' ? 'warning' : 'info';
  const hasCritical = results.some(r => r.status === 'critical-low' || r.status === 'critical-high');

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden ${hasCritical ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-800'} ${className}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${hasCritical ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">{panelName}</span>
              {hasCritical && <span className="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">CRITICAL</span>}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Ordered: {orderedAt}
              {orderedBy && ` · Dr. ${orderedBy}`}
              {reportedAt && ` · Reported: ${reportedAt}`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={panelStatusVariant}>{status.toUpperCase()}</Badge>
            {onViewReport && <button onClick={onViewReport} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">View Report</button>}
          </div>
        </div>
      </div>

      {/* Results table */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {results.map((r, i) => {
          const cfg = resultStatusConfig[r.status];
          return (
            <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${cfg.bg}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-700 dark:text-slate-300">{r.test}</span>
                  {r.loincCode && <span className="text-xs text-slate-400 font-mono">{r.loincCode}</span>}
                </div>
                {r.referenceRange && <div className="text-xs text-slate-400 mt-0.5">Ref: {r.referenceRange}</div>}
              </div>
              <div className="text-right">
                <div className={`font-bold text-sm ${cfg.color}`}>
                  {r.value} <span className="text-xs font-normal">{r.unit}</span>
                </div>
                {r.delta !== undefined && (
                  <div className={`text-xs ${r.delta > 0 ? 'text-amber-500' : r.delta < 0 ? 'text-blue-500' : 'text-slate-400'}`}>
                    {r.delta > 0 ? '↑' : r.delta < 0 ? '↓' : '→'} {Math.abs(r.delta)} from last
                  </div>
                )}
              </div>
              <div className={`w-6 text-right font-bold text-xs ${cfg.color}`}>{cfg.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── CriticalResultBanner ─────────────────────────────────────────────────────
export interface CriticalResultBannerProps {
  test: string;
  value: string;
  unit: string;
  direction: 'high' | 'low';
  patient?: string;
  reportedAt?: string;
  onAcknowledge?: () => void;
  className?: string;
}

export function CriticalResultBanner({ test, value, unit, direction, patient, reportedAt, onAcknowledge, className = '' }: CriticalResultBannerProps) {
  return (
    <div className={`flex items-center gap-3 p-3 bg-red-600 text-white rounded-xl shadow-lg ${className}`}>
      <div className="text-2xl">🚨</div>
      <div className="flex-1">
        <div className="font-bold text-sm">CRITICAL VALUE: {test}</div>
        <div className="text-xs text-red-100">
          {direction === 'high' ? '▲ CRITICALLY HIGH' : '▼ CRITICALLY LOW'}: {value} {unit}
          {patient && ` · Patient: ${patient}`}
          {reportedAt && ` · ${reportedAt}`}
        </div>
      </div>
      {onAcknowledge && (
        <button onClick={onAcknowledge} className="shrink-0 bg-white text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
          Acknowledge
        </button>
      )}
    </div>
  );
}
