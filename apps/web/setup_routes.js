const fs = require('fs');
const path = require('path');

const routes = [
  'patients',
  'appointments',
  'consultations',
  'prescriptions',
  'lab-orders',
  'messages',
  'reports',
  'settings'
];

const basePath = path.join(__dirname, 'src/app');

// Ensure components directories exist
fs.mkdirSync(path.join(__dirname, 'src/components/layout'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'src/components/sidebar'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'src/store'), { recursive: true });

routes.forEach(route => {
  const routePath = path.join(basePath, route);
  fs.mkdirSync(routePath, { recursive: true });

  const title = route.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const pageContent = `'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Hammer } from 'lucide-react';

export default function ${title.replace(' ', '')}Page() {
  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 h-full">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm max-w-lg">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Hammer className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Module Under Development</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            The <strong>${title}</strong> module is currently being built. It will be available in the next release phase.
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
`;

  fs.writeFileSync(path.join(routePath, 'page.tsx'), pageContent);

  const loadingContent = `export default function Loading() {
  return (
    <div className="h-screen w-full flex bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Sidebar Skeleton */}
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 animate-pulse">
           <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-md mr-2"></div>
           <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
        </div>
        <div className="p-4 space-y-4">
          {[1,2,3,4,5,6,7].map(i => (
             <div key={i} className="flex items-center animate-pulse">
               <div className="w-5 h-5 bg-slate-200 dark:bg-slate-800 rounded-md mr-3"></div>
               <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
             </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Skeleton */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 shrink-0 animate-pulse">
           <div className="h-10 w-96 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        </header>
        
        {/* Content Skeleton */}
        <div className="flex-1 p-8">
           <div className="h-12 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg mb-8 animate-pulse"></div>
           <div className="grid grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                 <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
`;

  fs.writeFileSync(path.join(routePath, 'loading.tsx'), loadingContent);
});

// Also create loading.tsx for emr
const emrRoutePath = path.join(basePath, 'emr');
if (fs.existsSync(emrRoutePath)) {
  fs.writeFileSync(path.join(emrRoutePath, 'loading.tsx'), `
export default function Loading() {
  return (
    <div className="h-screen w-full flex bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 animate-pulse">
           <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-md mr-2"></div>
           <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden animate-pulse">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 shrink-0">
           <div className="h-10 w-96 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        </header>
        <div className="flex-1 p-8">
           <div className="h-12 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg mb-8"></div>
        </div>
      </div>
    </div>
  );
}
  `);
}

console.log('Routes created successfully.');
