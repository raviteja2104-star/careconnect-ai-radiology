import React from 'react';

// ─── Occupancy Heatmap ────────────────────────────────────────────────────────
export interface OccupancyCell {
  id: string;
  label: string;
  occupancy: number; // 0–100
  capacity?: number;
  status?: string;
}

export function OccupancyHeatmap({ cells, title = 'Occupancy', className = '' }:
  { cells: OccupancyCell[]; title?: string; className?: string }) {

  const getColor = (pct: number) =>
    pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-green-500';

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{'<50%'}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />75%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{'≥90%'}</span>
        </div>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {cells.map(cell => (
          <div key={cell.id} className="flex flex-col items-center" title={`${cell.label}: ${cell.occupancy}%`}>
            <div className={`w-full h-12 rounded-lg ${getColor(cell.occupancy)} flex items-center justify-center text-white font-bold text-sm shadow-inner`}>
              {cell.occupancy}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center truncate w-full">{cell.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ED Tracking Board ─────────────────────────────────────────────────────────
export interface EDPatient {
  id: string;
  name: string;
  triage: 1 | 2 | 3 | 4 | 5;
  chiefComplaint: string;
  location: string;
  los: string; // Length of Stay formatted
  status: 'waiting' | 'in-treatment' | 'admitted' | 'discharged' | 'transferred';
  assignedDoctor?: string;
  flags?: string[];
}

const triageColors = {
  1: 'bg-black text-white',
  2: 'bg-red-600 text-white',
  3: 'bg-amber-500 text-white',
  4: 'bg-green-500 text-white',
  5: 'bg-blue-500 text-white',
};
const triageLabels = { 1: 'Resus', 2: 'Emergent', 3: 'Urgent', 4: 'Semi-urgent', 5: 'Non-urgent' };

const edStatusColors = {
  'waiting':     'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  'in-treatment':'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  'admitted':    'text-green-600 bg-green-50 dark:bg-green-900/20',
  'discharged':  'text-slate-500 bg-slate-100 dark:bg-slate-800',
  'transferred': 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
};

export function EDTrackingBoard({ patients, onPatientClick, className = '' }:
  { patients: EDPatient[]; onPatientClick?: (p: EDPatient) => void; className?: string }) {

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm ${className}`}>
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm text-slate-900 dark:text-white">ED Tracking Board</span>
          <span className="text-xs text-slate-500">{patients.length} patients</span>
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {patients.map(p => (
          <div
            key={p.id}
            className={`flex items-center gap-3 px-4 py-3 ${onPatientClick ? 'cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-800' : ''} transition-colors`}
            onClick={() => onPatientClick?.(p)}
          >
            <div className={`w-12 h-8 rounded-lg flex flex-col items-center justify-center shrink-0 text-[10px] font-bold ${triageColors[p.triage]}`}>
              <div>P{p.triage}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-900 dark:text-white">{p.name}</div>
              <div className="text-xs text-slate-500 truncate">{p.chiefComplaint}</div>
            </div>
            <div className="text-xs text-slate-500 hidden sm:block">{p.location}</div>
            <div className="text-xs font-mono text-slate-600 dark:text-slate-400 hidden sm:block">{p.los}</div>
            <span className={`text-xs font-medium px-2 py-1 rounded-lg ${edStatusColors[p.status]}`}>
              {p.status.replace('-', ' ').toUpperCase()}
            </span>
          </div>
        ))}
        {patients.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">No active patients</div>
        )}
      </div>
    </div>
  );
}

// ─── ICU Census Grid ───────────────────────────────────────────────────────────
export interface ICUBed {
  id: string;
  bedNumber: string;
  patientName?: string;
  diagnosis?: string;
  news2?: number;
  ventilated?: boolean;
  los?: string;
  status: 'available' | 'occupied' | 'cleaning';
}

export function ICUCensusGrid({ beds, onBedClick, className = '' }:
  { beds: ICUBed[]; onBedClick?: (bed: ICUBed) => void; className?: string }) {

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 ${className}`}>
      {beds.map(bed => {
        const isOccupied = bed.status === 'occupied';
        const news2Severity = bed.news2 !== undefined ? (bed.news2 >= 7 ? 'border-red-500 dark:border-red-600' : bed.news2 >= 5 ? 'border-amber-400' : 'border-green-400') : 'border-slate-200 dark:border-slate-700';

        return (
          <div
            key={bed.id}
            onClick={() => onBedClick?.(bed)}
            className={`rounded-xl border-2 p-3 shadow-sm transition-all ${isOccupied ? news2Severity : 'border-slate-200 dark:border-slate-700'} ${bed.status === 'available' ? 'bg-green-50 dark:bg-green-900/20' : bed.status === 'cleaning' ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-white dark:bg-slate-900'} ${onBedClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Bed {bed.bedNumber}</span>
              <div className="flex items-center gap-1">
                {bed.ventilated && <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1 rounded font-bold">VENT</span>}
                {bed.news2 !== undefined && (
                  <span className={`text-[10px] px-1 rounded font-bold ${bed.news2 >= 7 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : bed.news2 >= 5 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    N2:{bed.news2}
                  </span>
                )}
              </div>
            </div>
            {isOccupied && bed.patientName ? (
              <>
                <div className="text-xs font-semibold text-slate-800 dark:text-white truncate">{bed.patientName}</div>
                {bed.diagnosis && <div className="text-xs text-slate-500 truncate">{bed.diagnosis}</div>}
                {bed.los && <div className="text-xs text-slate-400 mt-1">LOS: {bed.los}</div>}
              </>
            ) : (
              <div className={`text-xs font-medium mt-1 ${bed.status === 'available' ? 'text-green-600' : 'text-amber-600'}`}>
                {bed.status === 'available' ? '✓ Available' : '🧹 Cleaning'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
