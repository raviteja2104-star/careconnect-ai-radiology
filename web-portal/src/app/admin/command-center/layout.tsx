import React from 'react';
import Link from 'next/link';
import { 
  ActivitySquare, LayoutDashboard, Map, Users, 
  Stethoscope, AlertOctagon, LineChart, ShieldAlert,
  Search, Bell, Settings
} from 'lucide-react';

export default function CommandCenterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden font-sans text-white">
      
      {/* Sidebar */}
      <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col flex-shrink-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800 bg-black/20">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white mr-3 shadow-[0_0_15px_rgba(37,99,235,0.5)]">
            <ActivitySquare className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">Command Center</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-3 mt-2">Operations</div>
          
          <Link href="/admin/command-center/live" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:bg-zinc-800 transition-colors">
            <LayoutDashboard className="w-5 h-5 text-zinc-400" /> <span className="font-medium text-sm">Live Dashboard</span>
          </Link>
          
          <Link href="/admin/command-center/digital-twin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:bg-zinc-800 transition-colors">
            <Map className="w-5 h-5 text-zinc-400" /> <span className="font-medium text-sm">Digital Twin</span>
          </Link>

          <Link href="/admin/command-center/patient-flow" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:bg-zinc-800 transition-colors">
            <Users className="w-5 h-5 text-zinc-400" /> <span className="font-medium text-sm">Patient Flow</span>
          </Link>

          <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-3 mt-8">Clinical</div>
          
          <Link href="/admin/command-center/clinical" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-300 hover:bg-zinc-800 transition-colors">
            <Stethoscope className="w-5 h-5 text-zinc-400" /> <span className="font-medium text-sm">Clinical Command</span>
          </Link>

          <Link href="/admin/command-center/alerts" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-zinc-300 hover:bg-zinc-800 transition-colors">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400" /> <span className="font-medium text-sm">Alert Center</span>
            </div>
            <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">3</span>
          </Link>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-black">
        {/* Top Header */}
        <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-8 flex-shrink-0">
          <div className="relative w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input type="text" placeholder="Search patients, doctors, or rooms..." className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-medium text-white outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all" />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-700/50">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Live Sync Active</span>
            </div>
            <button className="relative p-2 text-zinc-400 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
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
