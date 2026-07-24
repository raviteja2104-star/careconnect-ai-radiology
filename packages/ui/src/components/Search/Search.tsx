import React from 'react';
import { Search as SearchIcon } from 'lucide-react';

export interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Search({ className = '', ...props }: SearchProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <SearchIcon className="h-4 w-4 text-slate-400" />
      </div>
      <input
        type="search"
        className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md leading-5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
        placeholder="Search..."
        {...props}
      />
    </div>
  );
}
