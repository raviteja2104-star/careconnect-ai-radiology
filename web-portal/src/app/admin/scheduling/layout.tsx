import React from 'react';
import Link from 'next/link';
import { 
  Calendar, Clock, UserCheck, ShieldOff, LayoutTemplate, 
  Settings, Activity, BarChart, Bell, Search, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SchedulingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      
      {/* Mini Sidebar */}
      <div className="w-16 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col items-center py-4 space-y-6 flex-shrink-0 z-10">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-4">
          <Calendar className="w-5 h-5" />
        </div>
        
        <nav className="flex-1 w-full flex flex-col gap-2 px-2">
          {[
            { icon: Calendar, path: '/admin/scheduling/calendar', tooltip: 'Calendar' },
            { icon: UserCheck, path: '/admin/scheduling/doctors', tooltip: 'Doctors' },
            { icon: Clock, path: '/admin/scheduling/shifts', tooltip: 'Shifts' },
            { icon: ShieldOff, path: '/admin/scheduling/leaves', tooltip: 'Leaves' },
            { icon: LayoutTemplate, path: '/admin/scheduling/templates', tooltip: 'Templates' },
            { icon: BarChart, path: '/admin/scheduling/analytics', tooltip: 'Analytics' },
          ].map((item, i) => (
            <Link key={i} href={item.path} className="w-full aspect-square rounded-xl flex items-center justify-center text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
              <item.icon className="w-5 h-5" />
            </Link>
          ))}
        </nav>
        
        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white">Schedule Studio</h1>
            <p className="text-xs text-zinc-500">CareConnect Enterprise Administrator</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="text" placeholder="Search doctors, shifts..." className="w-full pl-9 pr-4 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none" />
            </div>
            <button className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><Bell className="w-5 h-5" /></button>
            <button className="bg-indigo-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Schedule
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>

    </div>
  );
}
