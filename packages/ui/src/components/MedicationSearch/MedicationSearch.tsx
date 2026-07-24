import React from 'react';
import { SearchInput, SearchInputProps, SearchResult } from '../SearchInput/SearchInput';
import { Pill } from 'lucide-react';

export interface MedicationResult {
  genericName: string;
  form?: string;
  strength?: string;
  route?: string;
  isHighAlert?: boolean;
}

export type MedicationSearchProps = Omit<SearchInputProps<MedicationResult>, 'label' | 'placeholder'> & {
  label?: string;
};

export function MedicationSearch(props: MedicationSearchProps) {
  return (
    <SearchInput<MedicationResult>
      label={props.label ?? 'Medication'}
      placeholder="Search drug by name, generic, or brand..."
      renderResult={(result: SearchResult<MedicationResult>) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            result.data?.isHighAlert ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'
          }`}>
            <Pill className={`w-4 h-4 ${result.data?.isHighAlert ? 'text-red-600' : 'text-green-600'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{result.label}</span>
              {result.data?.isHighAlert && (
                <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded font-medium">HIGH ALERT</span>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {result.data?.genericName}
              {result.data?.form && ` • ${result.data.form}`}
              {result.data?.strength && ` ${result.data.strength}`}
              {result.data?.route && ` (${result.data.route})`}
            </div>
          </div>
        </div>
      )}
      {...props}
    />
  );
}
