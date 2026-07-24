import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '../Input/Input';
import { Spinner } from '../Spinner/Spinner';

export interface SearchResult<T = unknown> {
  id: string;
  label: string;
  sublabel?: string;
  data?: T;
}

export interface SearchInputProps<T = unknown> extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onSelect'> {
  label?: string;
  error?: string;
  results?: SearchResult<T>[];
  isLoading?: boolean;
  onSearch: (query: string) => void;
  onSelect: (result: SearchResult<T>) => void;
  selectedValue?: string;
  onClear?: () => void;
  renderResult?: (result: SearchResult<T>) => React.ReactNode;
}

export function SearchInput<T = unknown>({
  label, error, results = [], isLoading, onSearch, onSelect, selectedValue, onClear, renderResult, ...props
}: SearchInputProps<T>) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onSearch(val);
    setIsOpen(true);
  };

  const handleSelect = (result: SearchResult<T>) => {
    setQuery(result.label);
    setIsOpen(false);
    onSelect(result);
  };

  return (
    <div className="relative w-full" ref={ref}>
      <Input
        {...props}
        label={label}
        error={error}
        value={selectedValue ?? query}
        onChange={handleChange}
        onFocus={() => query && setIsOpen(true)}
        leftAddon={<Search className="w-4 h-4" />}
        rightAddon={
          isLoading ? <Spinner size="sm" /> :
          (selectedValue || query) ? (
            <button onClick={() => { setQuery(''); onClear?.(); }} className="pointer-events-auto">
              <X className="w-4 h-4 hover:text-red-500" />
            </button>
          ) : null
        }
      />
      {isOpen && (results.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map(result => (
            <button
              key={result.id}
              className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
              onMouseDown={() => handleSelect(result)}
            >
              {renderResult ? renderResult(result) : (
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{result.label}</div>
                  {result.sublabel && <div className="text-xs text-slate-500 dark:text-slate-400">{result.sublabel}</div>}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
