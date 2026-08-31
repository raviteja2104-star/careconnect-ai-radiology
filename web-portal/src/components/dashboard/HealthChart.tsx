'use client';
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const data = [
    { name: 'Mon', heartRate: 72, bloodPressure: 120 },
    { name: 'Tue', heartRate: 75, bloodPressure: 118 },
    { name: 'Wed', heartRate: 71, bloodPressure: 122 },
    { name: 'Thu', heartRate: 74, bloodPressure: 121 },
    { name: 'Fri', heartRate: 70, bloodPressure: 119 },
    { name: 'Sat', heartRate: 68, bloodPressure: 117 },
    { name: 'Sun', heartRate: 72, bloodPressure: 120 },
];

export const HealthChart = () => {
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Health Overview</h3>
                <select className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs rounded-lg px-3 py-1.5 outline-none font-medium">
                    <option>This Week</option>
                    <option>This Month</option>
                </select>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                    <p className="text-xs text-zinc-500 mb-1">Heart Rate</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-zinc-900 dark:text-white">72</span>
                        <span className="text-xs font-semibold text-zinc-500">bpm</span>
                    </div>
                    <span className="text-xs text-green-500 font-semibold bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full inline-block mt-1">Normal</span>
                </div>
                <div>
                    <p className="text-xs text-zinc-500 mb-1">Blood Pressure</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-zinc-900 dark:text-white">120/80</span>
                        <span className="text-xs font-semibold text-zinc-500">mmHg</span>
                    </div>
                    <span className="text-xs text-green-500 font-semibold bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full inline-block mt-1">Normal</span>
                </div>
            </div>

            <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                        />
                        <Line type="monotone" dataKey="heartRate" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }} />
                        <Line type="monotone" dataKey="bloodPressure" stroke="#6366f1" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            
            {/* Steps & Sleep summary at bottom */}
            <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                    <p className="text-xs text-zinc-500 mb-1">Steps</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-zinc-900 dark:text-white">7,532</span>
                    </div>
                    <div className="w-full h-10 mt-2">
                        {/* Bar chart placeholder */}
                        <div className="flex items-end justify-between h-full gap-1">
                            {[40, 70, 45, 90, 60, 30, 80].map((h, i) => (
                                <div key={i} className="w-full bg-indigo-100 dark:bg-indigo-900/40 rounded-t-sm" style={{ height: `${h}%` }}>
                                    {i === 3 && <div className="w-full h-full bg-indigo-500 rounded-t-sm" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div>
                    <p className="text-xs text-zinc-500 mb-1">Sleep</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-zinc-900 dark:text-white">7h 45m</span>
                    </div>
                    <div className="w-full h-10 mt-2">
                         {/* Sparkline placeholder */}
                         <svg viewBox="0 0 100 30" className="w-full h-full text-blue-500 stroke-current stroke-2 fill-none">
                            <path d="M0,20 Q10,10 20,25 T40,15 T60,20 T80,5 T100,10" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};
