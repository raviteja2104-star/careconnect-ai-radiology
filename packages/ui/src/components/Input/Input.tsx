import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export function Input({ label, error, hint, leftAddon, rightAddon, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {leftAddon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">{leftAddon}</div>
        )}
        <input
          className={`block w-full rounded-lg border text-sm transition-colors px-3 py-2
            ${leftAddon ? 'pl-10' : ''} ${rightAddon ? 'pr-10' : ''}
            ${error
              ? 'border-red-400 bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-300 focus:ring-red-500 focus:border-red-500'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500'
            }
            placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed
            ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined}
          {...props}
        />
        {rightAddon && (
          <div className="absolute right-3 flex items-center pointer-events-none text-slate-400">{rightAddon}</div>
        )}
      </div>
      {error && <p id={`${props.id}-error`} className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">{error}</p>}
      {hint && !error && <p id={`${props.id}-hint`} className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}
