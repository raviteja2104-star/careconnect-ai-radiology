import React from 'react';
import Link from 'next/link';
import { 
  FileSignature, LayoutDashboard, PenTool, 
  FileCheck2, BarChart3, Settings, Search, Bell
} from 'lucide-react';

export default function FormsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col flex-shrink-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white mr-3">
            <FileSignature className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-zinc-900 dark:text-white tracking-tight">eForms Engine</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 px-3 mt-2">Core Engine</div>
          
          <Link href="/admin/forms/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <LayoutDashboard className="w-5 h-5" /> <span className="font-medium text-sm">Dashboard</span>
          </Link>
          
          <Link href="/admin/forms/builder" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <PenTool className="w-5 h-5" /> <span className="font-medium text-sm">Form Builder</span>
          </Link>

          <Link href="/admin/forms/consents" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <FileCheck2 className="w-5 h-5" /> <span className="font-medium text-sm">Consent Vault</span>
          </Link>

          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 px-3 mt-8">Insights</div>
          
          <Link href="/admin/forms/analytics" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <BarChart3 className="w-5 h-5" /> <span className="font-medium text-sm">Analytics</span>
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
            <input type="text" placeholder="Search consents, forms, or patients..." className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
          {children}
        </main>
      </div>

    </div>
  );
}
