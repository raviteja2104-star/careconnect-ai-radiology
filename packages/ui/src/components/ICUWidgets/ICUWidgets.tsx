import React from 'react';

// ─── Fluid Balance Card ──────────────────────────────────────────────────────
export interface FluidEntry {
  type: 'intake' | 'output';
  category: string;
  amount: number;
  unit?: string;
  time?: string;
}

export interface FluidBalanceCardProps {
  entries: FluidEntry[];
  period?: string;
  className?: string;
}

export function FluidBalanceCard({ entries, period = 'Last 24h', className = '' }: FluidBalanceCardProps) {
  const intake = entries.filter(e => e.type === 'intake').reduce((acc, e) => acc + e.amount, 0);
  const output = entries.filter(e => e.type === 'output').reduce((acc, e) => acc + e.amount, 0);
  const balance = intake - output;
  const isPositive = balance >= 0;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fluid Balance</span>
        <span className="text-xs text-slate-400">{period}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-lg font-bold text-blue-700 dark:text-blue-400">{intake}</div>
          <div className="text-xs text-blue-500 dark:text-blue-400">Intake (mL)</div>
        </div>
        <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
          <div className="text-lg font-bold text-amber-700 dark:text-amber-400">{output}</div>
          <div className="text-xs text-amber-500 dark:text-amber-400">Output (mL)</div>
        </div>
        <div className={`text-center p-2 rounded-lg ${isPositive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <div className={`text-lg font-bold ${isPositive ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {isPositive ? '+' : ''}{balance}
          </div>
          <div className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>Balance (mL)</div>
        </div>
      </div>

      {/* Bar visualization */}
      <div className="space-y-1.5">
        {entries.slice(0, 5).map((e, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shrink-0 ${e.type === 'intake' ? 'bg-blue-500' : 'bg-amber-500'}`} />
            <span className="text-xs text-slate-500 dark:text-slate-400 flex-1">{e.category}</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{e.amount} {e.unit ?? 'mL'}</span>
            {e.time && <span className="text-xs text-slate-400">{e.time}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hemodynamic Card ─────────────────────────────────────────────────────────
export interface HemodynamicCardProps {
  map: number; // Mean Arterial Pressure
  cvp?: number;
  co?: number;  // Cardiac Output
  svr?: number; // Systemic Vascular Resistance
  hr: number;
  timestamp?: string;
  className?: string;
}

export function HemodynamicCard({ map, cvp, co, svr, hr, timestamp, className = '' }: HemodynamicCardProps) {
  const mapStatus = map < 65 ? 'critical' : map > 110 ? 'warning' : 'normal';
  const statusColor = { normal: 'text-green-600', warning: 'text-amber-600', critical: 'text-red-600' };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border-2 p-4 shadow-sm ${mapStatus === 'critical' ? 'border-red-300 dark:border-red-700' : mapStatus === 'warning' ? 'border-amber-300 dark:border-amber-700' : 'border-green-300 dark:border-green-700'} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hemodynamics</span>
        {timestamp && <span className="text-xs text-slate-400">{timestamp}</span>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <div className={`text-2xl font-bold ${statusColor[mapStatus]}`}>{map}</div>
          <div className="text-xs text-slate-500">MAP (mmHg)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-800 dark:text-white">{hr}</div>
          <div className="text-xs text-slate-500">HR (bpm)</div>
        </div>
        {cvp !== undefined && (
          <div className="text-center">
            <div className="text-lg font-bold text-blue-700 dark:text-blue-400">{cvp}</div>
            <div className="text-xs text-slate-500">CVP (cmH₂O)</div>
          </div>
        )}
        {co !== undefined && (
          <div className="text-center">
            <div className="text-lg font-bold text-indigo-700 dark:text-indigo-400">{co}</div>
            <div className="text-xs text-slate-500">CO (L/min)</div>
          </div>
        )}
        {svr !== undefined && (
          <div className="text-center col-span-2">
            <div className="text-lg font-bold text-purple-700 dark:text-purple-400">{svr}</div>
            <div className="text-xs text-slate-500">SVR (dynes/s/cm⁻⁵)</div>
          </div>
        )}
      </div>
      {mapStatus === 'critical' && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs text-red-700 dark:text-red-400 font-medium text-center">
          ⚠ MAP &lt;65 — Vasopressor consideration
        </div>
      )}
    </div>
  );
}

// ─── Ventilator Widget ─────────────────────────────────────────────────────────
export interface VentilatorWidgetProps {
  mode: string;
  tidalVolume: number;
  rr: number;
  fio2: number;
  peep: number;
  pip?: number;
  plateau?: number;
  compliance?: number;
  className?: string;
}

export function VentilatorWidget({ mode, tidalVolume, rr, fio2, peep, pip, plateau, compliance, className = '' }: VentilatorWidgetProps) {
  return (
    <div className={`bg-slate-900 dark:bg-black rounded-xl border border-green-500/30 p-4 shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-bold text-green-400 uppercase tracking-wider">Ventilator</span>
        </div>
        <span className="text-xs font-mono font-bold text-green-400 bg-green-900/30 px-2 py-0.5 rounded">{mode}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Vt', value: tidalVolume, unit: 'mL' },
          { label: 'RR', value: rr, unit: 'bpm' },
          { label: 'FiO₂', value: `${fio2}%`, unit: '' },
          { label: 'PEEP', value: peep, unit: 'cmH₂O' },
          pip !== undefined ? { label: 'PIP', value: pip, unit: 'cmH₂O' } : null,
          plateau !== undefined ? { label: 'Pplat', value: plateau, unit: 'cmH₂O' } : null,
          compliance !== undefined ? { label: 'Cstat', value: compliance, unit: 'mL/cmH₂O', span: true } : null,
        ].filter(Boolean).map((item, i) => item && (
          <div key={i} className={`text-center p-1.5 rounded bg-slate-800 ${(item as { span?: boolean }).span ? 'col-span-3' : ''}`}>
            <div className="text-base font-bold font-mono text-green-300">{item.value}</div>
            <div className="text-xs text-slate-500">{item.label} {item.unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Urine Output Card ────────────────────────────────────────────────────────
export interface UrineOutputCardProps {
  hourly: number[]; // last 6h
  total24h?: number;
  weight?: number;  // kg, for ml/kg/hr calculation
  className?: string;
}

export function UrineOutputCard({ hourly, total24h, weight, className = '' }: UrineOutputCardProps) {
  const lastHour = hourly[hourly.length - 1] ?? 0;
  const mlPerKgHr = weight ? (lastHour / weight).toFixed(2) : null;
  const isOliguria = weight ? parseFloat(mlPerKgHr!) < 0.5 : lastHour < 30;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border-2 p-4 shadow-sm ${isOliguria ? 'border-red-300 dark:border-red-700' : 'border-blue-200 dark:border-blue-800'} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Urine Output</span>
        {isOliguria && <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">OLIGURIA</span>}
      </div>
      <div className="flex items-end gap-1 h-12 mb-2">
        {hourly.map((val, i) => {
          const maxVal = Math.max(...hourly, 1);
          const h = `${Math.max((val / maxVal) * 100, 5)}%`;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <div style={{ height: h }} className={`w-full rounded-sm ${val < 30 ? 'bg-red-400' : 'bg-blue-400'}`} />
              <div className="text-[9px] text-slate-400 mt-0.5">{val}</div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Last {hourly.length}h trend</span>
        {mlPerKgHr && <span>{mlPerKgHr} mL/kg/hr</span>}
        {total24h && <span>24h: {total24h} mL</span>}
      </div>
    </div>
  );
}
