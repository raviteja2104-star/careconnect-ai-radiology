'use client';

import React, { useState } from 'react';
import { 
  X, Search, Stethoscope, Baby, HeartPulse, Activity, Bone, Brain, Droplets, 
  Wind, Flame, Sparkles, Ear, Eye, Heart, Smile, Target, Shield, Zap, 
  ShieldAlert, Bug, AlertTriangle, ShieldPlus, Scissors, PenTool, Users, Apple, Check
} from 'lucide-react';
import { ALL_SPECIALTIES, Specialty } from '@/services/specialtyService';

interface SpecialtySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSpecialtyId: string;
  onSelectSpecialty: (specialty: Specialty) => void;
}

const ICON_MAP: Record<string, any> = {
  Stethoscope, Baby, HeartPulse, Activity, Bone, Brain, Droplets,
  Wind, Flame, Sparkles, Ear, Eye, Heart, Smile, Target, Shield, Zap,
  ShieldAlert, Bug, AlertTriangle, ShieldPlus, Scissors, PenTool, Users, Apple
};

export const SpecialtySelectorModal: React.FC<SpecialtySelectorModalProps> = ({
  isOpen,
  onClose,
  activeSpecialtyId,
  onSelectSpecialty
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', ...Array.from(new Set(ALL_SPECIALTIES.map(s => s.category)))];

  const filteredSpecialties = ALL_SPECIALTIES.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-slate-50 to-blue-50/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-blue-950/30">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Select Specialty Workspace
              </h2>
              <p className="text-xs text-slate-500">
                Instantly load dynamic EMR forms, clinical scores, calculators, charts & AI copilot tailored for your department.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search 27+ specialties (e.g. Pediatrics, Cardiology, ICU, Orthopedics)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Specialties Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
          {filteredSpecialties.map(spec => {
            const IconComp = ICON_MAP[spec.icon] || Stethoscope;
            const isActive = activeSpecialtyId === spec.id;

            return (
              <div
                key={spec.id}
                onClick={() => {
                  onSelectSpecialty(spec);
                  onClose();
                }}
                className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className={`p-3 rounded-2xl transition-colors ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white'
                    }`}>
                      <IconComp className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-extrabold rounded-md uppercase">
                        {spec.category}
                      </span>
                      {isActive && (
                        <span className="p-1 bg-indigo-600 text-white rounded-full">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {spec.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {spec.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold">
                    {spec.defaultWidgets.length} Dynamic Widgets
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                    Load Workspace →
                  </span>
                </div>
              </div>
            );
          })}

          {filteredSpecialties.length === 0 && (
            <div className="col-span-full p-12 text-center text-slate-400">
              <p className="text-sm font-semibold">No specialties found matching &quot;{search}&quot;</p>
              <button 
                onClick={() => { setSearch(''); setSelectedCategory('All'); }}
                className="mt-2 text-xs text-indigo-600 font-bold hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs text-slate-500">
          <span>Active Specialty: <strong className="text-slate-900 dark:text-white">{ALL_SPECIALTIES.find(s => s.id === activeSpecialtyId)?.name}</strong></span>
          <span>Enterprise Smart EMR Engine v2.4</span>
        </div>

      </div>
    </div>
  );
};
