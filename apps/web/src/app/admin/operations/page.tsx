'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Building2, HardDrive, GraduationCap, LifeBuoy, TrendingUp, 
  GitBranch, CheckCircle, AlertTriangle, Clock, Users, Plus, 
  ShieldCheck, RefreshCw, Award, ArrowUpRight, Play
} from 'lucide-react';
import { 
  enterpriseOperationsService, HospitalCustomerProject, DeviceInstallationRecord, 
  SupportTicketRecord, LMSTrainingCourse, ReleaseEnvironmentStatus 
} from '@/services/enterpriseOperationsService';

export default function EnterpriseOperationsPage() {
  const [activeTab, setActiveTab] = useState<'PROJECTS' | 'DEVICES' | 'LMS' | 'SUPPORT' | 'ADOPTION' | 'RELEASES'>('PROJECTS');
  
  // States
  const [projects] = useState<HospitalCustomerProject[]>(enterpriseOperationsService.getProjects());
  const [devices] = useState<DeviceInstallationRecord[]>(enterpriseOperationsService.getDevices());
  const [tickets, setTickets] = useState<SupportTicketRecord[]>(enterpriseOperationsService.getTickets());
  const [courses] = useState<LMSTrainingCourse[]>(enterpriseOperationsService.getLMS());
  const [releases] = useState<ReleaseEnvironmentStatus[]>(enterpriseOperationsService.getReleases());
  const [adoption] = useState(enterpriseOperationsService.getCustomerAdoptionMetrics());

  // Ticket Form State
  const [newHosp, setNewHosp] = useState('Apollo Super Specialty Hospital Main');
  const [newTitle, setNewTitle] = useState('PACS DICOM Gateway WADO-RS connection latency check');
  const [newSev, setNewSev] = useState<'MINOR' | 'MAJOR' | 'CRITICAL'>('MINOR');

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    enterpriseOperationsService.createTicket(newHosp, newTitle, newSev);
    setTickets([...enterpriseOperationsService.getTickets()]);
  };

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
        
        {/* TOP HEADER */}
        <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">Enterprise Delivery & Operations Platform</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold rounded-md uppercase">
                  Phase 18 Active
                </span>
              </div>
              <p className="text-xs text-slate-400">Hospital Onboarding, Device Certifications, LMS Training, Support & Release Rollouts</p>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button 
              onClick={() => setActiveTab('PROJECTS')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'PROJECTS' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Building2 className="w-3.5 h-3.5" /> Implementation Workspaces
            </button>
            <button 
              onClick={() => setActiveTab('DEVICES')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'DEVICES' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <HardDrive className="w-3.5 h-3.5" /> Device Installations
            </button>
            <button 
              onClick={() => setActiveTab('LMS')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'LMS' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> LMS Training
            </button>
            <button 
              onClick={() => setActiveTab('SUPPORT')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'SUPPORT' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <LifeBuoy className="w-3.5 h-3.5" /> Support & Hypercare
            </button>
            <button 
              onClick={() => setActiveTab('ADOPTION')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'ADOPTION' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Customer Success
            </button>
            <button 
              onClick={() => setActiveTab('RELEASES')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'RELEASES' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <GitBranch className="w-3.5 h-3.5" /> Release Canary
            </button>
          </div>
        </div>

        {/* TAB 1: HOSPITAL WORKSPACES */}
        {activeTab === 'PROJECTS' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Hospital Customer Onboarding & Implementation Workspaces</h2>
              <p className="text-xs text-slate-500">Track project milestones, implementation progress %, target go-lives, & RAID logs.</p>
            </div>

            <div className="space-y-4">
              {projects.map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{p.hospitalName}</h3>
                      <p className="text-xs text-slate-500">PM: {p.assignedProjectManager} | Target Go-Live: {p.targetGoLiveDate}</p>
                    </div>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 font-bold text-xs rounded-full">{p.stage}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs font-mono">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Implementation Progress</span>
                      <strong className="text-indigo-600 text-sm">{p.implementationPct}%</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">Health Score</span>
                      <strong className="text-emerald-600 text-sm">{p.healthScorePct}%</strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-slate-400 block text-[10px]">RAID Risks Active</span>
                      <strong className="text-amber-600 text-sm">{p.raidRiskCount} Open Risks</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: DEVICE INSTALLATIONS */}
        {activeTab === 'DEVICES' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Device Installation & Calibration Manager</h2>
              <p className="text-xs text-slate-500">Certified readiness tracking for PACS, LIS analyzers, ICU monitors, & barcode printers.</p>
            </div>

            <div className="space-y-4">
              {devices.map(d => (
                <div key={d.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{d.deviceName}</h3>
                    <p className="text-xs text-slate-500">Department: {d.department} | Category: {d.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full inline-block mb-1">{d.status}</span>
                    <p className="text-[10px] text-slate-400">Certified by: {d.certifiedBy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: LMS TRAINING */}
        {activeTab === 'LMS' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Hospital Staff LMS Training & Certification Centre</h2>
              <p className="text-xs text-slate-500">Role-based interactive video courses for Doctors, Nurses, Billers, & Administrators.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {courses.map(c => (
                <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold rounded uppercase">{c.role}</span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{c.courseName}</h3>
                  <div className="flex justify-between items-center text-xs">
                    <span>Completion Rate</span>
                    <strong className="text-indigo-600 font-bold">{c.completionPct}%</strong>
                  </div>
                  <p className="text-[11px] text-slate-400 border-t pt-3">
                    Certified Staff: <strong>{c.certifiedUsersCount}</strong> / {c.totalEnrolledCount} Enrolled
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SUPPORT & HYPERCARE */}
        {activeTab === 'SUPPORT' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Hospital Support & 24/7 Hypercare Incident Centre</h2>
              <p className="text-xs text-slate-500">Real-time ticketing, SLA countdown timers, and engineer assignment telemetry.</p>
            </div>

            <form onSubmit={handleCreateTicket} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <input
                type="text"
                placeholder="Incident Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold"
              />
              <select value={newSev} onChange={(e) => setNewSev(e.target.value as any)} className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                <option value="MINOR">MINOR</option>
                <option value="MAJOR">MAJOR</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
              <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0">
                <Plus className="w-4 h-4" /> Open Hypercare Ticket
              </button>
            </form>

            <div className="space-y-4">
              {tickets.map(t => (
                <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-mono text-[10px] font-bold rounded">{t.severity}</span>
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white">{t.title}</h3>
                    </div>
                    <p className="text-[11px] text-slate-400">{t.hospitalName} | Assigned: {t.assignedEngineer}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-full inline-block mb-1">{t.status}</span>
                    <p className="text-[10px] font-mono text-indigo-600">SLA: {t.slaExpiresInMins} mins left</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CUSTOMER SUCCESS */}
        {activeTab === 'ADOPTION' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Customer Success & Clinical Adoption Analytics</h2>
              <p className="text-xs text-slate-500">Track monthly active clinicians, AI scribe usage volume, & satisfaction scores.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
              <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm space-y-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Monthly Active Users</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{adoption.activeMonthlyUsers.toLocaleString()}</h3>
                <span className="text-[10px] text-emerald-600 font-bold">+18% growth this month</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm space-y-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">AI Scribe Adoption Rate</span>
                <h3 className="text-2xl font-black text-indigo-600">{adoption.aiScribeAdoptionPct}%</h3>
                <span className="text-[10px] text-slate-400">Clinician Usage</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm space-y-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">30d EMR Prescriptions</span>
                <h3 className="text-2xl font-black text-emerald-600">{adoption.emrPrescriptionVolume30d.toLocaleString()}</h3>
                <span className="text-[10px] text-slate-400">Prescriptions Signed</span>
              </div>
              <div className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm space-y-2">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer CSAT Rating</span>
                <h3 className="text-2xl font-black text-amber-500">{adoption.customerSatisfactionCSAT} / 5.0</h3>
                <span className="text-[10px] text-slate-400">CSAT Survey Score</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: RELEASE CANARY */}
        {activeTab === 'RELEASES' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Multi-Hospital Release & Blue-Green Canary Manager</h2>
              <p className="text-xs text-slate-500">Safely orchestrate canary rollouts across Staging & Production environments.</p>
            </div>

            <div className="space-y-4">
              {releases.map(rel => (
                <div key={rel.environment} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{rel.environment}</h3>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold rounded">{rel.version}</span>
                    </div>
                    <p className="text-xs text-slate-500">Deployed At: {rel.deployedAt} | Active Traffic: <strong>{rel.activeTrafficPct}%</strong></p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">{rel.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
