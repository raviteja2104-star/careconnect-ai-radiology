import React from 'react';
import { Bot, Sparkles, ChevronRight, Search, FileText, Pill } from 'lucide-react';

export const AIAssistant = () => {
    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-6 relative overflow-hidden h-full flex flex-col">
            <Sparkles className="absolute top-6 right-6 w-8 h-8 text-indigo-300 dark:text-indigo-700 opacity-50" />
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center">
                    <Bot className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-none mb-1">AI Health Assistant</h3>
                    <p className="text-xs text-zinc-500">Your personal health companion</p>
                </div>
            </div>

            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-xl p-4 mb-6 shadow-sm border border-white/20 dark:border-zinc-800 relative z-10">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">Hello John! 👋</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">How can I help you today?</p>
            </div>

            <div className="space-y-3 mb-auto relative z-10">
                <button className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors group shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                            <Search className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Check my symptoms</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-indigo-500 transition-colors" />
                </button>
                <button className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors group shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Explain my lab report</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-indigo-500 transition-colors" />
                </button>
                <button className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors group shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                            <Pill className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Suggest healthy habits</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-indigo-500 transition-colors" />
                </button>
            </div>

            <div className="mt-6 relative z-10">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Type your message..." 
                        className="w-full pl-4 pr-12 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:border-indigo-500 shadow-sm text-zinc-900 dark:text-white placeholder:text-zinc-400"
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-sm">
                        <Search className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
};
