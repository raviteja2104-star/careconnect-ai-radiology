import React from 'react';
import { SearchInput, SearchInputProps, SearchResult } from '../SearchInput/SearchInput';
import { User } from 'lucide-react';

export interface PatientResult {
  mrn: string;
  age?: number;
  gender?: string;
}

export type PatientSearchProps = Omit<SearchInputProps<PatientResult>, 'label' | 'placeholder'> & {
  label?: string;
  placeholder?: string;
};

export function PatientSearch(props: PatientSearchProps) {
  return (
    <SearchInput<PatientResult>
      label={props.label ?? 'Patient'}
      placeholder={props.placeholder ?? 'Search by Name, MRN, or Phone...'}
      renderResult={(result: SearchResult<PatientResult>) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">{result.label}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              MRN: {result.data?.mrn}
              {result.data?.age && ` • ${result.data.age}y`}
              {result.data?.gender && ` ${result.data.gender}`}
            </div>
          </div>
        </div>
      )}
      {...props}
    />
  );
}
