'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { 
  Users, Clock, AlertTriangle, IndianRupee, Video, 
  Phone, MoreVertical, Search, CheckCircle, Calendar, 
  FileText, ArrowRight, Activity, Filter
} from 'lucide-react';

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState('queue');

  // Mock Data
  const stats = [
    { label: "Today's Appointments", value: '42', icon: <Users className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Waiting Queue', value: '12', icon: <Clock className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { label: 'Critical Lab Alerts', value: '3', icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    { label: 'Revenue (Today)', value: '₹45k', icon: <IndianRupee className="w-5 h-5" />, color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  ];

  const queue = [
    { token: 'A-01', name: 'Rohit Sharma', age: '32', gender: 'M', type: 'Follow-up', time: '10:00 AM', waitTime: '15 mins', risk: 'Low', status: 'Waiting' },
    { token: 'A-02', name: 'Priya Patel', age: '45', gender: 'F', type: 'New Consult', time: '10:15 AM', waitTime: '5 mins', risk: 'High', status: 'Vitals Taken' },
    { token: 'A-03', name: 'Anil Kumar', age: '58', gender: 'M', type: 'Telemedicine', time: '10:30 AM', waitTime: '0 mins', risk: 'Medium', status: 'Scheduled' },
  ];

  const tasks = [
    { title: 'Review MRI Brain', patient: 'Suresh Verma', time: '2 hours ago', type: 'radiology' },
    { title: 'Sign Prescription Refill', patient: 'Meena Gupta', time: '4 hours ago', type: 'prescription' },
    { title: 'Critical Lab: HbA1c 9.2%', patient: 'Vikram Singh', time: '1 hour ago', type: 'lab' },
  ];

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto hide-scrollbar">
        
        {/* Page Header */}
        <div className="px-8 py-6 pb-2">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Good Morning, Dr. Sharma</h1>
              <p className="text-slate-500 text-sm">Here is your schedule for today, {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Manage Schedule
              </button>
              <Link href="/emr" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                <Activity className="w-4 h-4" /> Start Next Consult
              </Link>
            </div>
          </div>

          {/* KPI Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="px-8 pb-8 flex-1 flex flex-col xl:flex-row gap-6">
          
          {/* Left Column (Queue & Tasks) */}
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Patient Queue */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    Patient Queue
                    <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-full">12</span>
                  </h2>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-md">All</button>
                    <button className="px-3 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium rounded-md">OPD</button>
                    <button className="px-3 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium rounded-md">Video</button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search patient..." className="pl-9 pr-4 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64" />
                  </div>
                  <button className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4 font-semibold">Token</th>
                      <th className="px-6 py-4 font-semibold">Patient</th>
                      <th className="px-6 py-4 font-semibold">Visit Type</th>
                      <th className="px-6 py-4 font-semibold">Time</th>
                      <th className="px-6 py-4 font-semibold">Wait Time</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {queue.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{p.token}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={`https://i.pravatar.cc/150?img=${i + 15}`} alt="Avatar" className="w-8 h-8 rounded-full bg-slate-200" />
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{p.name}</p>
                              <p className="text-xs text-slate-500">{p.age}y • {p.gender}</p>
                            </div>
                            {p.risk === 'High' && <span className="w-2 h-2 rounded-full bg-red-500 ml-1" title="High Risk Patient"></span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-md ${p.type === 'Telemedicine' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/30' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30'}`}>
                            {p.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{p.time}</td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-medium ${parseInt(p.waitTime) > 10 ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}`}>
                            {p.waitTime}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                            <span className={`w-2 h-2 rounded-full ${p.status === 'Waiting' ? 'bg-amber-500' : p.status === 'Vitals Taken' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {p.type === 'Telemedicine' ? (
                              <Link href="/emr" className="p-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-600 rounded-lg transition-colors" title="Join Video Call">
                                <Video className="w-4 h-4" />
                              </Link>
                            ) : null}
                            <Link href="/emr" className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap">
                              Open Chart
                            </Link>
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>

          {/* Right Column (Tasks & AI Insights) */}
          <div className="w-full xl:w-[400px] shrink-0 flex flex-col gap-6">
            
            {/* Task Center */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-slate-100">Task Center</h3>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold rounded-full">3 Due</span>
              </div>
              <div className="p-2">
                {tasks.map((task, i) => (
                  <div key={i} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors flex gap-3 cursor-pointer group">
                    <div className={`mt-1 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                      task.type === 'radiology' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' :
                      task.type === 'prescription' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {task.type === 'radiology' ? <Video className="w-4 h-4" /> : task.type === 'prescription' ? <FileText className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 transition-colors">{task.title}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-500 truncate">{task.patient}</span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{task.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <button className="w-full mt-2 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                  View All Tasks <ArrowRight className="w-3 h-3 inline ml-1" />
                </button>
              </div>
            </div>

            {/* AI Daily Briefing */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-md p-6 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl translate-x-10 -translate-y-10"></div>
               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-4">
                   <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm"><Activity className="w-4 h-4" /></div>
                   <h3 className="font-bold text-sm tracking-wide">AI Daily Briefing</h3>
                 </div>
                 <p className="text-sm text-indigo-100 mb-4 leading-relaxed">
                   Dr. Sharma, you have <strong>3 high-risk patients</strong> scheduled today. <strong>Suresh Verma's</strong> recent MRI shows minor ischemia (requires review).
                 </p>
                 <button className="w-full py-2 bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-bold rounded-lg transition-colors shadow-sm">
                   Open AI Copilot
                 </button>
               </div>
            </div>

          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
