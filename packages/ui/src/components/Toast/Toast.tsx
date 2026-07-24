import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

export interface ToastProps {
  id?: string;
  variant?: ToastVariant;
  title: string;
  description?: string;
  onDismiss?: () => void;
}

const variantConfig = {
  success: { icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800', iconColor: 'text-green-600', titleColor: 'text-green-900 dark:text-green-100' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800', iconColor: 'text-amber-600', titleColor: 'text-amber-900 dark:text-amber-100' },
  error: { icon: XCircle, bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800', iconColor: 'text-red-600', titleColor: 'text-red-900 dark:text-red-100' },
  info: { icon: Info, bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800', iconColor: 'text-blue-600', titleColor: 'text-blue-900 dark:text-blue-100' },
};

export function Toast({ variant = 'info', title, description, onDismiss }: ToastProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 w-80 p-4 rounded-xl border shadow-lg ${config.bg} ${config.border}`} role="alert">
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${config.titleColor}`}>{title}</p>
        {description && <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-600 transition-colors" aria-label="Dismiss">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ToastVariant;
  title?: string;
  children?: React.ReactNode;
  onDismiss?: () => void;
}

export function Alert({ variant = 'info', title, children, onDismiss, className = '' }: AlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${config.bg} ${config.border} ${className}`} role="alert">
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1">
        {title && <p className={`text-sm font-semibold ${config.titleColor}`}>{title}</p>}
        {children && <div className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{children}</div>}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
