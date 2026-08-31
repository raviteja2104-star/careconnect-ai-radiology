'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Activity, ShieldAlert, Cpu, HeartPulse, Bed, Stethoscope, Clock, 
  DollarSign, TrendingUp, Sparkles, AlertCircle, CheckCircle2, 
  Wifi, Server, RefreshCw, BarChart3, Users, Zap, Layers, RefreshCcw
} from 'lucide-react';
import { integrationHubService, CommandCenterData } from '@/services/integrationHubService';

export default function HospitalCommandCenterPage() {
  const [data, setData] = useState<CommandCenterData>(integrationHubService.getCommandCenterData());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setData(integrationHubService.getCommandCenterData());
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-y-auto bg-slate-950 text-slate-100 font-sans p-6 space-y-6">
        
        {/* COMMAND CENTER HEADER */}
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-600/20 text-red-500 rounded-2xl border border-red-500/30 animate-pulse">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-black tracking-wide text-white uppercase">Hospital Command Center</h1>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-extrabold rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span> LIVE STREAM
                </span>
              </div>
              <p className="text-xs text-slate-400">Real-Time Operational, Clinical, Financial & AI Nervous System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefresh}
              className={`p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCcw className="w-4 h-4" /> Refresh Telemetry
            </button>
            <a 
              href="/admin/enterprise"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all"
            >
              <Server className="w-4 h-4" /> Integration Hub ➔
            </a>
          </div>
        </div>

        {/* SECTION 1: CLINICAL CRITICAL ALERTS BANNER */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Code Blue</span>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">{data.clinicalAlerts.codeBlueCount}</h3>
              <p className="text-[10px] text-slate-500">Active Cardiac Arrests</p>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><HeartPulse className="w-6 h-6" /></div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Sepsis Bundle</span>
              <h3 className="text-2xl font-black text-amber-400 mt-1">{data.clinicalAlerts.sepsisRiskAlerts}</h3>
              <p className="text-[10px] text-slate-500">1-Hour Protocol Timers</p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><AlertCircle className="w-6 h-6" /></div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Stroke Alerts</span>
              <h3 className="text-2xl font-black text-purple-400 mt-1">{data.clinicalAlerts.strokeAlerts}</h3>
              <p className="text-[10px] text-slate-500">STAT CT Imaging Gate</p>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl"><Zap className="w-6 h-6" /></div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">High NEWS2</span>
              <h3 className="text-2xl font-black text-rose-400 mt-1">{data.clinicalAlerts.highNews2Count}</h3>
              <p className="text-[10px] text-slate-500">Score &ge; 7 Deterioration</p>
            </div>
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl"><ShieldAlert className="w-6 h-6" /></div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Critical Labs</span>
              <h3 className="text-2xl font-black text-cyan-400 mt-1">{data.clinicalAlerts.criticalLabValues}</h3>
              <p className="text-[10px] text-slate-500">STAT Panic Value Alerts</p>
            </div>
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl"><Activity className="w-6 h-6" /></div>
          </div>
        </div>

        {/* SECTION 2: HOSPITAL CAPACITY & OPERATIONS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Capacity Gauges */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bed className="w-4 h-4 text-indigo-400" /> Facility Occupancy & Capacity
            </h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>ICU Occupancy ({data.hospital.ipdOccupiedBeds} Beds)</span>
                  <span className="text-amber-400 font-mono">{data.hospital.icuOccupancyPct}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${data.hospital.icuOccupancyPct}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-bold mb-1">
                  <span>Operation Theatre (OT) Utilisation</span>
                  <span className="text-indigo-400 font-mono">{data.hospital.otUtilisationPct}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${data.hospital.otUtilisationPct}%` }}></div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block">Available Ward Beds</span>
                  <span className="text-xl font-extrabold text-emerald-400">{data.operations.availableBeds}</span>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block">Avg OPD Wait Time</span>
                  <span className="text-xl font-extrabold text-cyan-400">{data.hospital.waitingPatientsAvgMins}m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Turnaround Times & Logistics */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" /> Turnaround & Logistics TAT
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block">Laboratory Stat TAT</span>
                  <span className="text-[10px] text-slate-400">Specimen to Result Delivery</span>
                </div>
                <span className="text-lg font-mono font-bold text-emerald-400">{data.operations.labTurnaroundAvgMins} mins</span>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block">Radiology PACS TAT</span>
                  <span className="text-[10px] text-slate-400">DICOM Scan to Report Signoff</span>
                </div>
                <span className="text-lg font-mono font-bold text-indigo-400">{data.operations.radiologyTurnaroundAvgMins} mins</span>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block">Pharmacy Stock Health</span>
                  <span className="text-[10px] text-slate-400">Critical Medication Availability</span>
                </div>
                <span className="text-lg font-mono font-bold text-teal-400">{data.operations.pharmacyStockHealthPct}%</span>
              </div>
            </div>
          </div>

          {/* Financial Operations */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Real-Time Financial Stream
            </h3>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-950/40 border border-emerald-900/60 rounded-2xl">
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">Revenue Today</span>
                <h2 className="text-2xl font-black text-white mt-1">₹{(data.financial.revenueTodayINR / 100000).toFixed(2)} Lakhs</h2>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block">Pending Insurance</span>
                  <span className="text-sm font-bold text-amber-400">₹{(data.financial.pendingInsuranceClaimsINR / 100000).toFixed(2)}L</span>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block">Open Invoices</span>
                  <span className="text-sm font-bold text-cyan-400">{data.financial.outstandingInvoicesCount} Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: AI COPILOT & GATEWAY TELEMETRY */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" /> AI Clinical Gateway & LLM Telemetry
            </h3>
            <span className="text-xs font-mono text-purple-400 font-bold">Avg Latency: {data.aiGateway.avgLatencyMs}ms</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">AI Consultations Today</span>
              <span className="text-xl font-bold text-purple-300">{data.aiGateway.aiConsultationsCount}</span>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Clinician Acceptance Rate</span>
              <span className="text-xl font-bold text-emerald-400">{data.aiGateway.acceptedRecommendationsPct}%</span>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Clinician Overrides</span>
              <span className="text-xl font-bold text-amber-400">{data.aiGateway.overrideCount}</span>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Rx Translation Dispatches</span>
              <span className="text-xl font-bold text-cyan-400">{data.aiGateway.translationDispatches}</span>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
