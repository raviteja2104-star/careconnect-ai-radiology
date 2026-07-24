import React from 'react';
import { Bell } from 'lucide-react';

export interface NotificationBellProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  count?: number;
}

export function NotificationBell({ count = 0, className = '', ...props }: NotificationBellProps) {
  return (
    <button
      className={`relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 ${className}`}
      {...props}
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
