import React from 'react';
import { Search } from 'lucide-react';

export interface CommandPaletteProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose, className = '', ...props }: CommandPaletteProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24">
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className={`relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 transition-all ${className}`} {...props}>
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            className="h-14 w-full bg-transparent border-0 px-4 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-0 sm:text-sm"
            placeholder="Search commands, patients, or settings..."
            autoFocus
          />
          <kbd className="hidden sm:inline-block rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            ESC
          </kbd>
        </div>
        <div className="max-h-96 overflow-y-auto p-4">
          <div className="text-center text-sm text-slate-500 py-8">
            Start typing to see results...
          </div>
        </div>
      </div>
    </div>
  );
}
