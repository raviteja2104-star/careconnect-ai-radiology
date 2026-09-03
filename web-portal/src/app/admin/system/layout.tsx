import React from 'react';
import Link from 'next/link';
import { 
  ServerCrash, ShieldCheck, Activity, Cloud, 
  Database, Gauge, Network, Settings
} from 'lucide-react';

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden font-mono text-zinc-300">
      
      {/* Sidebar */}
      <div className="w-64 bg-black border-r border-zinc-900 flex flex-col flex-shrink-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-zinc-900">
          <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 rounded flex items-center justify-center text-white mr-3">
            <ServerCrash className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="font-bold text-sm text-white tracking-widest uppercase">SysOps</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          
          <Link href="/admin/system/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
            <Gauge className="w-4 h-4" /> <span className="text-xs uppercase tracking-wider">Production Cluster</span>
          </Link>

          <Link href="/admin/system/security" className="flex items-center gap-3 px-3 py-2.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
            <ShieldCheck className="w-4 h-4" /> <span className="text-xs uppercase tracking-wider">SecOps & Compliance</span>
          </Link>
          
          <Link href="/admin/system/observability" className="flex items-center gap-3 px-3 py-2.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
            <Activity className="w-4 h-4" /> <span className="text-xs uppercase tracking-wider">Observability</span>
          </Link>

          <Link href="/admin/system/cloud" className="flex items-center gap-3 px-3 py-2.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
            <Cloud className="w-4 h-4" /> <span className="text-xs uppercase tracking-wider">Cloud Deployment</span>
          </Link>

          <Link href="/admin/system/database" className="flex items-center gap-3 px-3 py-2.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
            <Database className="w-4 h-4" /> <span className="text-xs uppercase tracking-wider">Database & Redis</span>
          </Link>

          <Link href="/admin/system/network" className="flex items-center gap-3 px-3 py-2.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
            <Network className="w-4 h-4" /> <span className="text-xs uppercase tracking-wider">API Gateway</span>
          </Link>
        </nav>
        
        <div className="p-4 border-t border-zinc-900">
          <div className="flex items-center justify-between px-3 py-2 text-xs text-zinc-500">
            <span>v2.0.0-rc1</span>
            <span className="flex items-center gap-1 text-emerald-500"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> All Systems Go</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
