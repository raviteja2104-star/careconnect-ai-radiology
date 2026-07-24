import React from 'react';

export interface VitalReading {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'normal' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
}

export interface VitalCardProps {
  title: string;
  readings: VitalReading[];
  timestamp?: string;
  source?: string;
  className?: string;
  onClick?: () => void;
}

const statusStyles = {
  normal: { dot: 'bg-green-500', text: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
  warning: { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  critical: { dot: 'bg-red-500 animate-pulse', text: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
};

const trendIcons = { up: '↑', down: '↓', stable: '→' };

export function VitalCard({ title, readings, timestamp, source, className = '', onClick }: VitalCardProps) {
  const overallStatus = readings.some(r => r.status === 'critical') ? 'critical'
    : readings.some(r => r.status === 'warning') ? 'warning' : 'normal';

  const style = statusStyles[overallStatus];

  return (
    <div
      className={`rounded-xl border-2 p-4 shadow-sm ${style.bg} ${onClick ? 'cursor-pointer hover:shadow-md transition-all' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${style.dot}`} />
          <span className="text-sm font-bold text-slate-800 dark:text-white">{title}</span>
        </div>
        {timestamp && <span className="text-xs text-slate-400">{timestamp}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {readings.map((reading, i) => (
          <div key={i} className="text-center">
            <div className={`text-xl font-bold leading-none ${reading.status ? statusStyles[reading.status].text : 'text-slate-900 dark:text-white'}`}>
              {reading.value}
              {reading.unit && <span className="text-xs font-normal ml-0.5">{reading.unit}</span>}
              {reading.trend && <span className="text-xs ml-1">{trendIcons[reading.trend]}</span>}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{reading.label}</div>
          </div>
        ))}
      </div>
      {source && <p className="text-xs text-slate-400 mt-2 border-t border-current/10 pt-2">via {source}</p>}
    </div>
  );
}
