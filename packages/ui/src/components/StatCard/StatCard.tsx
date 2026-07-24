import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label?: string };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
  onClick?: () => void;
}

export function StatCard({ title, value, subtitle, icon, trend, variant = 'default', className = '', onClick }: StatCardProps) {
  const variants = {
    default: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
    primary: 'bg-indigo-600 border-indigo-600 text-white',
    success: 'bg-green-600 border-green-600 text-white',
    warning: 'bg-amber-500 border-amber-500 text-white',
    danger: 'bg-red-600 border-red-600 text-white',
  };

  const isColored = variant !== 'default';

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm transition-all ${variants[variant]} ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isColored ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
            {title}
          </p>
          <p className={`text-3xl font-bold leading-none ${isColored ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`text-xs mt-1.5 ${isColored ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}`}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
              trend.value >= 0
                ? (isColored ? 'text-white/90' : 'text-green-600 dark:text-green-400')
                : (isColored ? 'text-white/90' : 'text-red-600 dark:text-red-400')
            }`}>
              <span>{trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value)}%</span>
              {trend.label && <span className={isColored ? 'text-white/70' : 'text-slate-400'}>{trend.label}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-2.5 rounded-lg ${isColored ? 'bg-white/20' : 'bg-indigo-50 dark:bg-indigo-900/30'}`}>
            <div className={`w-5 h-5 ${isColored ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
}
