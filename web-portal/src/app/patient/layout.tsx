import React from 'react';
import Link from 'next/link';
import { 
  Home, Calendar, FileText, User, Bell
} from 'lucide-react';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-[100dvh] bg-zinc-50 dark:bg-zinc-950 font-sans max-w-md mx-auto border-x border-zinc-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden">
      
      {/* Mobile Top App Bar */}
      <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 flex-shrink-0 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
            JD
          </div>
          <span className="font-bold text-lg text-zinc-900 dark:text-white tracking-tight">CareConnect</span>
        </div>
        
        <button className="relative p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-zinc-900"></span>
        </button>
      </header>

      {/* Main Content Area (Scrollable) */}
      <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 pb-20">
        {children}
      </main>

      {/* Bottom Navigation (PWA Style) */}
      <nav className="absolute bottom-0 w-full h-16 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-around px-2 z-20 pb-safe">
        <Link href="/patient/wallet" className="flex flex-col items-center justify-center w-full h-full text-indigo-600 dark:text-indigo-400">
          <Home className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link href="/patient/appointments" className="flex flex-col items-center justify-center w-full h-full text-zinc-400 hover:text-indigo-600 transition-colors">
          <Calendar className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Visits</span>
        </Link>
        <Link href="/patient/records" className="flex flex-col items-center justify-center w-full h-full text-zinc-400 hover:text-indigo-600 transition-colors">
          <FileText className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Records</span>
        </Link>
        <Link href="/patient/profile" className="flex flex-col items-center justify-center w-full h-full text-zinc-400 hover:text-indigo-600 transition-colors">
          <User className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Profile</span>
        </Link>
      </nav>

    </div>
  );
}
