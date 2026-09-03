import React from 'react';
import Link from 'next/link';
import { 
  MonitorDot, Users, CalendarCheck, UserPlus, 
  CreditCard, Activity, FileText, Settings, Bell, Search,
  QrCode
} from 'lucide-react';

export default function ReceptionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col flex-shrink-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white mr-3">
            <MonitorDot className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-zinc-900 dark:text-white tracking-tight">Front Office</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 px-3 mt-4">Operations</div>
          
          <Link href="/reception/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <Activity className="w-5 h-5" /> <span className="font-medium text-sm">Command Dashboard</span>
          </Link>
          
          <Link href="/reception/checkin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <CalendarCheck className="w-5 h-5" /> <span className="font-medium text-sm">Appointment Check-in</span>
          </Link>

          <Link href="/reception/walkin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 font-bold transition-colors">
            <UserPlus className="w-5 h-5" /> <span className="text-sm">Walk-in Registration</span>
          </Link>
          
          <Link href="/reception/queue" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <Users className="w-5 h-5" /> <span className="font-medium text-sm">Live Queue Monitor</span>
          </Link>

          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 px-3 mt-8">Billing & Records</div>
          
          <Link href="/reception/payments" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <CreditCard className="w-5 h-5" /> <span className="font-medium text-sm">Payments & Cash</span>
          </Link>
          
          <Link href="/reception/reports" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <FileText className="w-5 h-5" /> <span className="font-medium text-sm">Daily Reports</span>
          </Link>
        </nav>
        
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <Settings className="w-5 h-5" /> <span className="font-medium text-sm">Settings</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 flex-shrink-0">
          <div className="relative w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input type="text" placeholder="Search by UHID, Phone, Name or Scan QR..." className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-zinc-100 dark:bg-zinc-700 rounded-lg cursor-pointer">
              <QrCode className="w-4 h-4 text-zinc-500" />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">SYSTEM ONLINE</span>
            </div>
            <button className="relative p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm">
              R
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
