import React from 'react';
import { Avatar } from '../Avatar/Avatar';
import { Badge, BadgeProps } from '../Badge/Badge';

export interface PatientCardProps {
  name: string;
  mrn: string;
  age: number;
  gender: string;
  dob?: string;
  status?: string;
  statusVariant?: BadgeProps['variant'];
  ward?: string;
  bed?: string;
  consultant?: string;
  diagnosis?: string;
  allergies?: string[];
  onClick?: () => void;
  className?: string;
  compact?: boolean;
}

export function PatientCard({
  name, mrn, age, gender, dob, status, statusVariant = 'neutral', ward, bed, consultant, diagnosis, allergies, onClick, className = '', compact = false
}: PatientCardProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar fallback={name.substring(0, 2).toUpperCase()} size={compact ? 'sm' : 'md'} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 dark:text-white truncate">{name}</h3>
              {status && <Badge variant={statusVariant}>{status}</Badge>}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              MRN: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{mrn}</span>
              {` • ${age}y ${gender}`}
              {dob && ` • DOB: ${dob}`}
            </p>
          </div>
        </div>

        {!compact && (
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
            {ward && <div className="text-xs"><span className="text-slate-400">Ward</span> <span className="text-slate-700 dark:text-slate-300 font-medium">{ward}</span></div>}
            {bed && <div className="text-xs"><span className="text-slate-400">Bed</span> <span className="text-slate-700 dark:text-slate-300 font-medium">{bed}</span></div>}
            {consultant && <div className="text-xs col-span-2"><span className="text-slate-400">Consultant</span> <span className="text-slate-700 dark:text-slate-300 font-medium">{consultant}</span></div>}
            {diagnosis && <div className="text-xs col-span-2"><span className="text-slate-400">Diagnosis</span> <span className="text-slate-700 dark:text-slate-300 font-medium">{diagnosis}</span></div>}
            {allergies && allergies.length > 0 && (
              <div className="text-xs col-span-2">
                <span className="text-red-500 font-semibold">⚠ Allergies: </span>
                {allergies.join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
