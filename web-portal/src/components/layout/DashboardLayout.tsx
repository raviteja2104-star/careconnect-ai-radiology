'use client';

import React from 'react';
import Sidebar from '@/components/sidebar/Sidebar';
import { 
  Search, Bell, MessageSquare, Sun, Moon, ChevronDown, 
  ChevronRight, Activity, CheckCircle 
} from 'lucide-react';
import useDashboardStore from '@/store/dashboardStore';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children, headerAction }: { children: React.ReactNode, headerAction?: React.ReactNode }) {
  const { darkMode, toggleDarkMode } = useDashboardStore();
  const pathname = usePathname();

  // Generate breadcrumbs from pathname
  const paths = pathname === '/' ? ['Home'] : ['Home', ...pathname.split('/').filter(Boolean)];

  return (
    <div className={`h-screen w-full flex overflow-hidden font-sans ${darkMode ? 'dark bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* 1. LEFT SIDEBAR */}
      <Sidebar />

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* HEADER */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center flex-1">
             <div className="relative w-96 hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search patients, appointments, records..." 
                className="w-full h-10 pl-10 pr-4 bg-slate-100 dark:bg-slate-800 border-transparent rounded-lg text-sm focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 transition-all outline-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 border border-slate-300 dark:border-slate-700 rounded px-1">⌘K</div>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            {headerAction}
            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
            </button>
            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <MessageSquare className="w-5 h-5" />
            </button>
            <button onClick={toggleDarkMode} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
            
            <div className="flex items-center gap-3 cursor-pointer group">
              <img src="https://i.pravatar.cc/150?img=11" alt="Dr. Avatar" className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 group-hover:border-indigo-400 transition-colors" />
              <div className="hidden md:block">
                <p className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">Dr. Raj Sharma</p>
                <p className="text-xs text-slate-500 mt-1">Cardiologist</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
            </div>
          </div>
        </header>

        {/* BREADCRUMBS BAR */}
        <div className="h-10 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center px-6 shrink-0">
           <div className="flex items-center text-xs font-medium text-slate-500 gap-1.5">
             {paths.map((path, index) => (
               <React.Fragment key={index}>
                 <span className={`capitalize ${index === paths.length - 1 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'hover:text-slate-800 dark:hover:text-slate-300'}`}>
                   {path.replace(/-/g, ' ')}
                 </span>
                 {index < paths.length - 1 && <ChevronRight className="w-3 h-3" />}
               </React.Fragment>
             ))}
           </div>
        </div>

        {/* 3. CONTENT AREA */}
        <div className="flex-1 flex overflow-hidden">
           {children}
        </div>
      </div>

    </div>
  );
}
