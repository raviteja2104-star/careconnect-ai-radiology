'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Activity, Users, Calendar, FileHeart, Pill, FileText, 
  MessageSquare, Sparkles, Settings, LogOut, LayoutDashboard, Store, ActivitySquare, Bed, ArrowRightLeft, Siren, HeartPulse, Scissors, Ambulance
} from 'lucide-react';
import useDashboardStore from '@/store/dashboardStore';

function NavItem({ icon, label, href, active, onClick }: { icon: React.ReactNode, label: string, href?: string, active?: boolean, onClick?: () => void }) {
  const content = (
    <>
      <div className={`w-5 h-5 mr-3 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
        {icon}
      </div>
      <span className="text-sm">{label}</span>
    </>
  );

  const className = `w-full flex items-center px-3 py-2.5 rounded-lg transition-all ${active ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 font-medium'}`;

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, showCopilot, toggleCopilot } = useDashboardStore();

  if (!isSidebarOpen) return null;

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <Activity className="w-6 h-6 text-indigo-600 mr-2" />
        <span className="text-xl font-bold tracking-tight">CareConnect</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 hide-scrollbar">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">Patient Care</div>
        <NavItem href="/dashboard" icon={<LayoutDashboard />} label="Dashboard" active={pathname === '/dashboard'} />
        <NavItem href="/patients" icon={<Users />} label="Patients" active={pathname === '/patients'} />
        <NavItem href="/appointments" icon={<Calendar />} label="Appointments" active={pathname === '/appointments'} />
        <NavItem href="/consultations" icon={<FileHeart />} label="Consultations" active={pathname === '/consultations'} />
        <NavItem href="/emr" icon={<Activity />} label="EMR" active={pathname === '/emr'} />
        <NavItem href="/prescriptions" icon={<Pill />} label="Prescriptions" active={pathname === '/prescriptions'} />
        <NavItem href="/lab-orders" icon={<FileText />} label="Lab Orders" active={pathname === '/lab-orders'} />
        
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6 px-3">Clinical Operations</div>
        <NavItem href="/ems" icon={<Ambulance />} label="Ambulance & EMS" active={pathname === '/ems'} />
        <NavItem href="/ot" icon={<Scissors />} label="Operation Theatre" active={pathname === '/ot'} />
        <NavItem href="/icu" icon={<HeartPulse />} label="ICU / Critical Care" active={pathname === '/icu'} />
        <NavItem href="/emergency" icon={<Siren />} label="Emergency Room" active={pathname === '/emergency'} />
        <NavItem href="/adt" icon={<ArrowRightLeft />} label="IPD / ADT" active={pathname === '/adt'} />
        <NavItem href="/bed-management" icon={<Bed />} label="Bed Management" active={pathname === '/bed-management'} />
        <NavItem href="/pharmacy" icon={<Store />} label="Pharmacy" active={pathname === '/pharmacy'} />
        <NavItem href="/nurse-station" icon={<ActivitySquare />} label="Nurse Station" active={pathname === '/nurse-station'} />
        
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6 px-3">Management</div>
        <NavItem href="/messages" icon={<MessageSquare />} label="Messages" active={pathname === '/messages'} />
        <NavItem href="/reports" icon={<FileText />} label="Reports" active={pathname === '/reports'} />
        
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6 px-3">Tools</div>
        <NavItem icon={<Sparkles />} label="AI Copilot" active={showCopilot} onClick={toggleCopilot} />
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <NavItem href="/settings" icon={<Settings />} label="Settings" active={pathname === '/settings'} />
        <NavItem icon={<LogOut />} label="Logout" />
      </div>
    </aside>
  );
}
