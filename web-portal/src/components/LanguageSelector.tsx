'use client';

import React, { useState } from 'react';
import { SUPPORTED_LANGUAGES, LanguageOption } from '@/services/prescriptionTranslationService';
import { Globe, Search, Check, ChevronDown } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onSelectLanguage: (langCode: string) => void;
  className?: string;
  compact?: boolean;
}

export function LanguageSelector({
  selectedLanguage,
  onSelectLanguage,
  className = '',
  compact = false
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(
    l =>
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-xs font-medium'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-base">{selectedObj.flag}</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
            {selectedObj.nativeName} ({selectedObj.name})
          </span>
          {selectedObj.dir === 'rtl' && (
            <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold rounded">
              RTL
            </span>
          )}
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-64 max-h-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-950">
              <Search className="w-3.5 h-3.5 text-slate-400 ml-1" />
              <input
                type="text"
                placeholder="Search language (e.g. తెలుగు, Hindi)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto p-1 space-y-0.5">
              {filteredLanguages.map(lang => {
                const isSelected = lang.code === selectedLanguage;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      onSelectLanguage(lang.code);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{lang.flag}</span>
                      <div className="text-left">
                        <div className="font-bold text-slate-900 dark:text-slate-100 leading-tight">
                          {lang.nativeName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">{lang.name}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}

              {filteredLanguages.length === 0 && (
                <div className="p-3 text-center text-xs text-slate-400">No language matches search</div>
              )}
            </div>

            <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center bg-slate-50 dark:bg-slate-950">
              Preserving English medico-legal accuracy
            </div>
          </div>
        </>
      )}
    </div>
  );
}
