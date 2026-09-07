import React from 'react';
import { Search, Bell, MessageSquare, ChevronDown } from 'lucide-react';

export const Header = () => {
    return (
        <header className="h-20 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-8 sticky top-0 z-30">
            {/* Search */}
            <div className="flex-1 max-w-xl">
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input 
                        type="text" 
                        placeholder="Search anything..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <button className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>
                    <button className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-full transition-colors">
                        <MessageSquare className="w-5 h-5" />
                    </button>
                </div>

                <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800"></div>

                {/* Profile */}
                <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-700 bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-300">
                        P
                    </div>
                    <div className="text-left hidden md:block">
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-none mb-1">Patient</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-none">Logged in</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-zinc-400 hidden md:block" />
                </button>
            </div>
        </header>
    );
};
