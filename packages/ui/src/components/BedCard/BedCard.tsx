import React from 'react';

export interface BedCardProps {
  bedNumber: string;
  ward?: string;
  status: 'available' | 'occupied' | 'cleaning' | 'reserved' | 'maintenance';
  patientName?: string;
  patientMrn?: string;
  admittedSince?: string;
  onClick?: () => void;
  className?: string;
}

const bedStatusConfig = {
  available: { label: 'Available', bg: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700', dot: 'bg-green-500', text: 'text-green-700 dark:text-green-400' },
  occupied: { label: 'Occupied', bg: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700', dot: 'bg-red-500', text: 'text-red-700 dark:text-red-400' },
  cleaning: { label: 'Cleaning', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700', dot: 'bg-amber-500 animate-pulse', text: 'text-amber-700 dark:text-amber-400' },
  reserved: { label: 'Reserved', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700', dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400' },
  maintenance: { label: 'Maintenance', bg: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700', dot: 'bg-slate-400', text: 'text-slate-600 dark:text-slate-400' },
};

export function BedCard({ bedNumber, ward, status, patientName, patientMrn, admittedSince, onClick, className = '' }: BedCardProps) {
  const config = bedStatusConfig[status];
  return (
    <div
      className={`rounded-xl border-2 p-3 shadow-sm transition-all ${config.bg} ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-slate-800 dark:text-white">Bed {bedNumber}</span>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${config.dot}`} />
          <span className={`text-xs font-semibold ${config.text}`}>{config.label}</span>
        </div>
      </div>
      {ward && <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">{ward}</div>}
      {patientName && (
        <div className="border-t border-current/10 pt-2 mt-2">
          <div className="text-xs font-semibold text-slate-800 dark:text-white">{patientName}</div>
          {patientMrn && <div className="text-xs text-slate-500 font-mono">MRN: {patientMrn}</div>}
          {admittedSince && <div className="text-xs text-slate-400 mt-0.5">Since: {admittedSince}</div>}
        </div>
      )}
    </div>
  );
}
