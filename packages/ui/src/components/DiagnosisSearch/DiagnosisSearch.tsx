import React from 'react';
import { SearchInput, SearchInputProps, SearchResult } from '../SearchInput/SearchInput';

export interface DiagnosisResult {
  code: string;
  system: 'ICD-10' | 'SNOMED';
  category?: string;
}

export type DiagnosisSearchProps = Omit<SearchInputProps<DiagnosisResult>, 'label' | 'placeholder'> & {
  label?: string;
};

export function DiagnosisSearch(props: DiagnosisSearchProps) {
  return (
    <SearchInput<DiagnosisResult>
      label={props.label ?? 'Diagnosis'}
      placeholder="Search ICD-10 code or diagnosis name..."
      renderResult={(result: SearchResult<DiagnosisResult>) => (
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded">
            {result.data?.code}
          </span>
          <div>
            <div className="text-sm font-medium text-slate-900 dark:text-white">{result.label}</div>
            {result.data?.category && <div className="text-xs text-slate-500">{result.data.category}</div>}
          </div>
        </div>
      )}
      {...props}
    />
  );
}
