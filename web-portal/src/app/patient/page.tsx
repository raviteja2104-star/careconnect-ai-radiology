'use client';

import React, { useState } from 'react';
import { 
  Heart, Activity, Calendar, FileText, Pill, Stethoscope, 
  CreditCard, Shield, Settings, Search, Plus, Bell, 
  MessageCircle, Video, Clock, ChevronRight, Share2, Download,
  Sparkles, CheckCircle, AlertTriangle, Users, Moon, Zap, UserCircle
} from 'lucide-react';

export default function PatientPortal() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
      
      {/* LEFT SIDEBAR - Patient Navigation */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex z-10 shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">CareConnect</span>
          </div>
        </div>

        {/* Family Switcher */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <button className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                 <img src="https://ui-avatars.com/api/?name=Ravi+Teja&background=6366f1&color=fff" alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Ravi Teja</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Self</div>
              </div>
            </div>
            <Users className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 hide-scrollbar">
          <NavItem icon={<Activity />} label="Health Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} />
          <NavItem icon={<Calendar />} label="Appointments" active={activeTab === 'Appointments'} onClick={() => setActiveTab('Appointments')} />
          <NavItem icon={<Video />} label="Telemedicine" active={activeTab === 'Telemedicine'} onClick={() => setActiveTab('Telemedicine')} />
          
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6 px-3">My Records</div>
          <NavItem icon={<Clock />} label="Health Timeline" active={activeTab === 'Timeline'} onClick={() => setActiveTab('Timeline')} />
          <NavItem icon={<Pill />} label="Medications" active={activeTab === 'Medications'} onClick={() => setActiveTab('Medications')} />
          <NavItem icon={<FileText />} label="Lab Reports" active={activeTab === 'Labs'} onClick={() => setActiveTab('Labs')} />
          <NavItem icon={<Shield />} label="Insurance & Billing" active={activeTab === 'Billing'} onClick={() => setActiveTab('Billing')} />
          
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6 px-3">Wellness</div>
          <NavItem icon={<Zap />} label="Goals & Tracking" active={activeTab === 'Wellness'} onClick={() => setActiveTab('Wellness')} />
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button className="w-full flex items-center justify-center gap-2 p-2.5 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 rounded-lg text-sm font-bold transition-colors hover:bg-rose-100 dark:hover:bg-rose-900/40">
            <AlertTriangle className="w-4 h-4" /> Emergency
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50 dark:bg-slate-950">
        
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
          <h1 className="text-xl font-bold hidden sm:block">{activeTab}</h1>
          <div className="flex items-center gap-4 ml-auto">
            <button onClick={() => setShowAIAssistant(!showAIAssistant)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-full text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-sm">
              <Sparkles className="w-4 h-4" /> Ask AI
            </button>
            <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
          
          {activeTab === 'Dashboard' && (
            <div className="max-w-6xl mx-auto space-y-6 pb-20">
               
               {/* Welcome Banner */}
               <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
                  <div className="relative z-10">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">Good morning, Ravi!</h2>
                    <p className="text-indigo-100 mb-6 max-w-lg">Your health score is looking great today. You have an upcoming cardiology follow-up tomorrow at 10:00 AM.</p>
                    <div className="flex flex-wrap gap-3">
                       <button className="px-4 py-2 bg-white text-indigo-600 font-bold rounded-lg text-sm shadow-sm hover:bg-indigo-50 transition-colors">
                         Join Teleconsultation
                       </button>
                       <button className="px-4 py-2 bg-indigo-500/30 border border-indigo-400/50 text-white font-bold rounded-lg text-sm hover:bg-indigo-500/50 transition-colors">
                         View New Lab Results
                       </button>
                    </div>
                  </div>
               </div>

               {/* Vitals & Health Score */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <HealthCard title="Health Score" value="88" unit="/100" trend="Excellent" trendType="good" icon={<Heart className="text-rose-500 w-6 h-6" />} color="rose" />
                 <HealthCard title="Blood Pressure" value="118/78" unit="mmHg" trend="Normal" trendType="good" icon={<Activity className="text-blue-500 w-6 h-6" />} color="blue" />
                 <HealthCard title="Resting Heart Rate" value="68" unit="bpm" trend="Optimal" trendType="good" icon={<Activity className="text-emerald-500 w-6 h-6" />} color="emerald" />
                 <HealthCard title="Sleep Quality" value="7h 12m" unit="avg" trend="Needs Improvement" trendType="warning" icon={<Moon className="text-indigo-500 w-6 h-6" />} color="indigo" />
               </div>
               
               <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Left Column: Appointments & Meds */}
                  <div className="xl:col-span-2 space-y-6">
                     
                     {/* Upcoming Appointments */}
                     <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="font-bold text-slate-900 dark:text-slate-100">Upcoming Appointments</h3>
                           <button className="text-sm text-indigo-600 font-bold hover:underline">View All</button>
                        </div>
                        <div className="border border-slate-100 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/30 flex flex-col sm:flex-row gap-4 sm:items-center justify-between group hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center shrink-0 shadow-sm">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Jul</span>
                                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none">25</span>
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-slate-100">Cardiology Follow-up</h4>
                                <p className="text-sm text-slate-500 mt-0.5">Dr. Raj Sharma • Apollo Hospitals, City Center</p>
                              </div>
                           </div>
                           <div className="flex gap-2">
                              <button className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Reschedule</button>
                              <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-bold shadow-sm hover:bg-indigo-700 transition-colors">Pre-Check In</button>
                           </div>
                        </div>
                     </div>

                     {/* Medication Reminders */}
                     <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="font-bold text-slate-900 dark:text-slate-100">Today's Medications</h3>
                           <button className="text-sm text-indigo-600 font-bold hover:underline">Manage</button>
                        </div>
                        <div className="space-y-3">
                           <MedicationRow name="Atorvastatin" dosage="20mg" time="08:00 AM (After Breakfast)" status="taken" />
                           <MedicationRow name="Telmisartan" dosage="40mg" time="08:00 AM (After Breakfast)" status="taken" />
                           <MedicationRow name="Metformin" dosage="500mg" time="08:00 PM (After Dinner)" status="pending" />
                        </div>
                     </div>

                  </div>

                  {/* Right Column: AI Insights & Quick Actions */}
                  <div className="space-y-6">
                     
                     {/* AI Insight Card */}
                     <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                           <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                           <h3 className="font-bold text-slate-900 dark:text-slate-100">AI Health Insight</h3>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                           Your recent Lipid Profile shows a 15% improvement in LDL cholesterol since your last visit. Continuing your current Atorvastatin dosage and Mediterranean diet is recommended.
                        </p>
                        <button onClick={() => setShowAIAssistant(true)} className="w-full py-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 text-sm font-bold rounded-lg shadow-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors">
                           Ask Copilot about Labs
                        </button>
                     </div>

                     {/* Recent Documents / Labs */}
                     <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Recent Records</h3>
                        <div className="space-y-3">
                           <div className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors group border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                             <div className="w-10 h-10 bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg flex items-center justify-center shrink-0">
                               <Activity className="w-5 h-5" />
                             </div>
                             <div className="flex-1 min-w-0">
                               <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">Lipid Profile Test</h4>
                               <p className="text-xs text-slate-500 truncate">Jul 20, 2026 • Apollo Diagnostics</p>
                             </div>
                             <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                           </div>
                           <div className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors group border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                             <div className="w-10 h-10 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg flex items-center justify-center shrink-0">
                               <FileText className="w-5 h-5" />
                             </div>
                             <div className="flex-1 min-w-0">
                               <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">Cardiology SOAP Note</h4>
                               <p className="text-xs text-slate-500 truncate">Jun 25, 2026 • Dr. Raj Sharma</p>
                             </div>
                             <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                           </div>
                        </div>
                     </div>

                  </div>
               </div>
            </div>
          )}

          {activeTab !== 'Dashboard' && (
            <div className="flex flex-col items-center justify-center py-32 text-slate-500">
               <Settings className="w-12 h-12 text-slate-300 mb-4 animate-spin-slow" />
               <p className="font-medium text-slate-600 dark:text-slate-400">The {activeTab} module is loading patient records...</p>
            </div>
          )}

        </div>
      </main>

      {/* FLOATING AI HEALTH ASSISTANT */}
      {showAIAssistant && (
        <aside className="w-full md:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-2xl z-50 absolute right-0 top-0 bottom-0 transform transition-transform">
           <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-indigo-600 text-white shrink-0 shadow-sm">
             <div className="flex items-center gap-2">
               <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center"><Sparkles className="w-4 h-4" /></div>
               <h3 className="font-bold">AI Health Assistant</h3>
             </div>
             <button onClick={() => setShowAIAssistant(false)} className="text-indigo-200 hover:text-white transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
             </button>
           </div>
           
           <div className="p-3 bg-amber-50 border-b border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50 flex gap-2 shrink-0">
             <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
             <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium leading-tight">AI guidance is for informational purposes only and does not replace professional medical advice. In an emergency, call your local emergency services.</p>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
             
             <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none p-3 shadow-sm text-sm text-slate-700 dark:text-slate-300">
                  Hello Ravi! I'm your CareConnect Health Assistant. I can help you understand your recent lab reports, medication schedules, or answer general health questions. What can I help you with today?
                </div>
             </div>

             <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-white">RT</span>
                </div>
                <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-none p-3 shadow-sm text-sm">
                  Can you explain my recent Lipid Profile results in simple terms? Is my LDL high?
                </div>
             </div>

             <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none p-3 shadow-sm text-sm text-slate-700 dark:text-slate-300">
                  <p className="mb-2">Sure! Here is a simple breakdown of your Lipid Profile from July 20:</p>
                  <ul className="list-disc pl-4 space-y-1 mb-2 font-medium">
                    <li><span className="text-green-600 dark:text-green-400">Total Cholesterol: 180 mg/dL</span> (Normal)</li>
                    <li><span className="text-amber-600 dark:text-amber-500">LDL ("Bad" Cholesterol): 110 mg/dL</span> (Borderline High)</li>
                    <li><span className="text-green-600 dark:text-green-400">HDL ("Good" Cholesterol): 55 mg/dL</span> (Normal)</li>
                  </ul>
                  <p>Your LDL is slightly elevated, but it has actually decreased from 130 mg/dL since your last test. Continuing your prescribed Atorvastatin is helping!</p>
                </div>
             </div>

           </div>

           <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
             <div className="relative">
               <input type="text" placeholder="Type a question..." className="w-full h-10 pl-4 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
               <button className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></button>
             </div>
           </div>
        </aside>
      )}

    </div>
  );
}

// Subcomponents

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all ${active ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 font-semibold'}`}>
      <div className={`w-5 h-5 mr-3 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
        {icon}
      </div>
      <span className="text-sm">{label}</span>
    </button>
  );
}

function HealthCard({ title, value, unit, trend, trendType, icon, color }: { title: string, value: string, unit: string, trend: string, trendType: 'good' | 'warning', icon: React.ReactNode, color: string }) {
  const bgColors: Record<string, string> = {
    rose: 'bg-rose-50 dark:bg-rose-900/20',
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20',
  };
  
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors cursor-pointer group">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-semibold text-slate-500">{title}</h3>
        <div className={`p-2 ${bgColors[color]} rounded-lg`}>{icon}</div>
      </div>
      <div>
        <div className="flex items-baseline gap-1">
           <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{value}</div>
           <div className="text-sm font-semibold text-slate-500">{unit}</div>
        </div>
        <div className={`text-xs font-bold mt-2 ${trendType === 'good' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-500'}`}>
           {trend}
        </div>
      </div>
    </div>
  );
}

function MedicationRow({ name, dosage, time, status }: { name: string, dosage: string, time: string, status: 'taken' | 'pending' }) {
  const isTaken = status === 'taken';
  return (
    <div className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
       <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${isTaken ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400' : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700'}`}>
             <Pill className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{name} <span className="text-xs text-slate-500 font-semibold">{dosage}</span></div>
            <div className="text-xs text-slate-500 font-medium">{time}</div>
          </div>
       </div>
       {isTaken ? (
          <div className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400">
             <CheckCircle className="w-4 h-4" /> Taken
          </div>
       ) : (
          <button className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded shadow-sm hover:border-indigo-300 transition-colors">
            Mark Taken
          </button>
       )}
    </div>
  );
}
