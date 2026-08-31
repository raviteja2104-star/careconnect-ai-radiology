'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    LayoutDashboard, Calendar, FileText, ClipboardList, Activity, 
    Pill, Stethoscope, FilePlus, CreditCard, ShieldCheck, Video, 
    Bot, Users, MessageSquare, Bell, Settings, HelpCircle, LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this utility exists

const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Appointments', icon: Calendar, path: '/appointments' },
    { name: 'Health Records', icon: FileText, path: '/health-records' },
    { name: 'Prescriptions', icon: ClipboardList, path: '/prescriptions' },
    { name: 'Lab Reports', icon: FilePlus, path: '/lab-reports' },
    { name: 'Radiology', icon: Activity, path: '/radiology' },
    { name: 'Medications', icon: Pill, path: '/medications' },
    { name: 'Billing', icon: CreditCard, path: '/billing' },
    { name: 'Insurance', icon: ShieldCheck, path: '/insurance' },
    { name: 'Telemedicine', icon: Video, path: '/telemedicine' },
    { name: 'AI Health Assistant', icon: Bot, path: '/ai-assistant' },
    { name: 'Family Members', icon: Users, path: '/family' },
    { name: 'Messages', icon: MessageSquare, path: '/messages', badge: 4 },
    { name: 'Notifications', icon: Bell, path: '/notifications', badge: 12 },
];

const bottomNavItems = [
    { name: 'Support', icon: HelpCircle, path: '/support' },
    { name: 'Settings', icon: Settings, path: '/settings' },
];

export const Sidebar = () => {
    const pathname = usePathname();
    
    return (
        <aside className="w-64 h-screen bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col fixed left-0 top-0 overflow-y-auto no-scrollbar">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white">HealthCore</span>
            </div>

            {/* Main Nav */}
            <nav className="flex-1 px-4 pb-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
                    return (
                        <Link 
                            key={item.name} 
                            href={item.path}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative",
                                isActive 
                                    ? "bg-indigo-600 text-white" 
                                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300")} />
                            {item.name}
                            {item.badge && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Upgrade Premium Card */}
            <div className="px-4 py-4">
                <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-4 text-center">
                    <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-2">Upgrade to Premium</h4>
                    <p className="text-xs text-indigo-700/80 dark:text-indigo-400/80 mb-3 leading-relaxed">
                        Unlock advanced features and priority support.
                    </p>
                    <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors">
                        Upgrade Now
                    </button>
                </div>
            </div>

            {/* Bottom Nav */}
            <div className="px-4 pb-6 space-y-1 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                {bottomNavItems.map((item) => (
                    <Link 
                        key={item.name} 
                        href={item.path}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group"
                    >
                        <item.icon className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300" />
                        {item.name}
                    </Link>
                ))}
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors group">
                    <LogOut className="w-5 h-5 text-red-500" />
                    Logout
                </button>
            </div>
        </aside>
    );
};
