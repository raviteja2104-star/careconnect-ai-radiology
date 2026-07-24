'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Hammer } from 'lucide-react';

export default function PrescriptionsPage() {
  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 h-full">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm max-w-lg">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Hammer className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Module Under Development</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            The <strong>Prescriptions</strong> module is currently being built. It will be available in the next release phase.
          </p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
            <div className="bg-indigo-600 h-2 rounded-full w-1/3 animate-pulse"></div>
          </div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Building in progress...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
