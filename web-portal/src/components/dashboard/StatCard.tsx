import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string;
    subtitle: string;
    icon: LucideIcon;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    iconColor?: string;
    iconBg?: string;
}

export const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, iconColor = "text-indigo-600", iconBg = "bg-indigo-50" }: StatCardProps) => {
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:shadow-lg transition-shadow duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{title}</p>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", iconBg)}>
                    <Icon className={cn("w-5 h-5", iconColor)} />
                </div>
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mb-1">{value}</h3>
                    <p className="text-sm text-indigo-600 font-medium">{subtitle}</p>
                </div>
                {trend && (
                    <div className="h-8 w-16 bg-zinc-50 dark:bg-zinc-800 rounded-md">
                        {/* Placeholder for small sparkline chart */}
                        <svg viewBox="0 0 100 30" className="w-full h-full text-green-500 stroke-current stroke-2 fill-none stroke-linecap-round stroke-linejoin-round">
                            <polyline points="0,20 20,25 40,10 60,15 80,5 100,10" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
};
