'use client';

import React, { useState } from 'react';
import { 
  Building, Users, Shield, Settings, Server, FileText, 
  Activity, Search, Plus, MoreVertical, Edit2, Trash2, 
  CheckCircle, XCircle, AlertTriangle, Key, Bell, Database,
  PieChart, Menu, Monitor, GitMerge, Sparkles, Code2, ShieldCheck, Building2, DollarSign, FolderKanban
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
      
      {/* LEFT SIDEBAR */}
      <aside className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
              <Server className="w-5 h-5 text-white" />
            </div>
            {isSidebarOpen && <span className="font-bold text-lg tracking-tight whitespace-nowrap">Super Admin</span>}
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 hide-scrollbar">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-2 px-3">Core</div>
          <NavItem icon={<PieChart />} label="Dashboard" active={activeTab === 'Dashboard'} onClick={() => setActiveTab('Dashboard')} isExpanded={isSidebarOpen} />
          <NavItem icon={<Building />} label="Organizations" active={activeTab === 'Organizations'} onClick={() => setActiveTab('Organizations')} isExpanded={isSidebarOpen} />
          <NavItem icon={<Users />} label="Users & Teams" active={activeTab === 'Users'} onClick={() => setActiveTab('Users')} isExpanded={isSidebarOpen} />
          
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6 px-3">Security & Compliance</div>
          <NavItem icon={<Shield />} label="RBAC & Roles" active={activeTab === 'RBAC'} onClick={() => setActiveTab('RBAC')} isExpanded={isSidebarOpen} />
          <NavItem icon={<FileText />} label="Audit Logs" active={activeTab === 'Audit'} onClick={() => setActiveTab('Audit')} isExpanded={isSidebarOpen} />
          <NavItem icon={<AlertTriangle />} label="Compliance" active={activeTab === 'Compliance'} onClick={() => setActiveTab('Compliance')} isExpanded={isSidebarOpen} />
          
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6 px-3">System</div>
          <NavItem icon={<Activity />} label="Health & Metrics" active={activeTab === 'Health'} onClick={() => setActiveTab('Health')} isExpanded={isSidebarOpen} />
          <NavItem icon={<Database />} label="Integrations" active={activeTab === 'Integrations'} onClick={() => setActiveTab('Integrations')} isExpanded={isSidebarOpen} />
          <NavItem icon={<Settings />} label="Platform Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} isExpanded={isSidebarOpen} />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
          <h1 className="text-xl font-bold">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <div className="relative w-64 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search resources..." className="w-full h-9 pl-9 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" />
            </div>
            <button className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm border border-indigo-200">
              SA
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
          
          {activeTab === 'Dashboard' && (
            <div className="space-y-6 pb-20">
               {/* Metrics Row */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <MetricCard title="Total Organizations" value="124" trend="+3 this month" icon={<Building className="text-blue-500 w-6 h-6" />} />
                 <MetricCard title="Active Users" value="14,290" trend="+12% vs last week" icon={<Users className="text-green-500 w-6 h-6" />} />
                 <MetricCard title="Platform Uptime" value="99.99%" trend="Last 30 days" icon={<Activity className="text-purple-500 w-6 h-6" />} />
                 <MetricCard title="API Requests (24h)" value="2.4M" trend="Normal volume" icon={<Database className="text-orange-500 w-6 h-6" />} />
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Active Incidents / Health */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                     <div className="flex justify-between items-center mb-4">
                       <h3 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2"><Monitor className="w-5 h-5 text-slate-400" /> System Health Status</h3>
                       <button className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">View All</button>
                     </div>
                     <div className="space-y-3">
                       <HealthRow service="Primary Database Cluster (AWS RDS)" status="Operational" />
                       <HealthRow service="Event Broker (Kafka)" status="Operational" />
                       <HealthRow service="AI Copilot Inference API" status="Degraded" message="High latency detected in US-East-1" />
                       <HealthRow service="Payment Gateway (Stripe)" status="Operational" />
                       <HealthRow service="FHIR Interoperability Layer" status="Operational" />
                     </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
                        <a href="/admin/workflow-builder" className="w-full flex items-center justify-between p-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">
                          <span className="flex items-center gap-3"><GitMerge className="w-4 h-4 text-indigo-200" /> Workflow Builder (No-Code OS)</span>
                          <span className="text-xs px-2 py-0.5 bg-indigo-500 rounded font-mono">Launch</span>
                        </a>
                        <a href="/admin/production" className="w-full flex items-center justify-between p-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm">
                          <span className="flex items-center gap-3"><ShieldCheck className="w-4 h-4 text-emerald-200" /> Production Hardening & QA</span>
                          <span className="text-xs px-2 py-0.5 bg-emerald-500 rounded font-mono">v1.1</span>
                        </a>
                        <a href="/admin/operations" className="w-full flex items-center justify-between p-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
                          <span className="flex items-center gap-3"><Building2 className="w-4 h-4 text-blue-200" /> Delivery & Operations OS</span>
                          <span className="text-xs px-2 py-0.5 bg-blue-500 rounded font-mono">Ops</span>
                        </a>
                        <a href="/admin/commercial" className="w-full flex items-center justify-between p-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm">
                          <span className="flex items-center gap-3"><DollarSign className="w-4 h-4 text-emerald-200" /> Commercial SaaS & Revenue</span>
                          <span className="text-xs px-2 py-0.5 bg-emerald-500 rounded font-mono">Monetize</span>
                        </a>
                        <a href="/admin/program" className="w-full flex items-center justify-between p-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">
                          <span className="flex items-center gap-3"><FolderKanban className="w-4 h-4 text-indigo-200" /> Enterprise Program & PMO</span>
                          <span className="text-xs px-2 py-0.5 bg-indigo-500 rounded font-mono">DevSecOps</span>
                        </a>
                        <a href="/admin/ai-platform" className="w-full flex items-center justify-between p-3 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-sm">
                          <span className="flex items-center gap-3"><Sparkles className="w-4 h-4 text-purple-200" /> Enterprise AI Platform</span>
                          <span className="text-xs px-2 py-0.5 bg-purple-500 rounded font-mono">Studio</span>
                        </a>
                        <a href="/admin/developer" className="w-full flex items-center justify-between p-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
                          <span className="flex items-center gap-3"><Code2 className="w-4 h-4 text-blue-200" /> Developer Platform & SDK</span>
                          <span className="text-xs px-2 py-0.5 bg-blue-500 rounded font-mono">HPaaS</span>
                        </a>
                        <a href="/admin/data-platform" className="w-full flex items-center justify-between p-3 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors shadow-sm">
                          <span className="flex items-center gap-3"><Database className="w-4 h-4 text-cyan-200" /> Enterprise Data Platform & Twin</span>
                          <span className="text-xs px-2 py-0.5 bg-cyan-500 rounded font-mono">EDP</span>
                        </a>
                        <a href="/admin/command-center" className="w-full flex items-center justify-between p-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm">
                          <span className="flex items-center gap-3"><Activity className="w-4 h-4 text-red-200" /> Hospital Command Center</span>
                          <span className="text-xs px-2 py-0.5 bg-red-500 rounded font-mono">Live</span>
                        </a>
                        <a href="/admin/enterprise" className="w-full flex items-center justify-between p-3 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-sm">
                          <span className="flex items-center gap-3"><Server className="w-4 h-4 text-purple-200" /> Enterprise Integration Hub</span>
                          <span className="text-xs px-2 py-0.5 bg-purple-500 rounded font-mono">FHIR/HL7</span>
                        </a>
                        <a href="/admin/master-data" className="w-full flex items-center justify-between p-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm">
                          <span className="flex items-center gap-3"><Database className="w-4 h-4 text-emerald-200" /> Master Data & Config Hub</span>
                          <span className="text-xs px-2 py-0.5 bg-emerald-500 rounded font-mono">Manage</span>
                        </a>
                        <button className="w-full flex items-center gap-3 p-3 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
                          <Building className="w-4 h-4 text-indigo-500" /> Onboard New Organization
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
                          <Users className="w-4 h-4 text-green-500" /> Invite Super Admin
                        </button>
                        <button className="w-full flex items-center gap-3 p-3 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
                          <Shield className="w-4 h-4 text-orange-500" /> Review Compliance Alerts (2)
                        </button>
                       <button className="w-full flex items-center gap-3 p-3 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm">
                         <Settings className="w-4 h-4 text-slate-500" /> Global Feature Flags
                       </button>
                     </div>
                  </div>
               </div>
          )}

          {activeTab === 'Organizations' && (
            <div className="space-y-6 pb-20">
               <div className="flex justify-between items-center">
                 <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search organizations..." className="w-full h-10 pl-9 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                 </div>
                 <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-colors">
                   <Plus className="w-4 h-4" /> Add Organization
                 </button>
               </div>

               <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
                     <tr>
                       <th className="px-6 py-4">Organization Name</th>
                       <th className="px-6 py-4">Region</th>
                       <th className="px-6 py-4">Plan</th>
                       <th className="px-6 py-4">Users</th>
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4 text-right">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                     <OrgRow name="Apollo Hospitals Enterprise" region="APAC (India)" plan="Enterprise" users="5,240" status="Active" />
                     <OrgRow name="Mayo Clinic Network" region="US-East" plan="Enterprise+" users="12,050" status="Active" />
                     <OrgRow name="CityCare Clinics" region="EMEA (UK)" plan="Professional" users="120" status="Active" />
                     <OrgRow name="TeleMed Global" region="Global" plan="Enterprise" users="850" status="Suspended" />
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {activeTab === 'RBAC' && (
            <div className="space-y-6 pb-20">
               <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">Enterprise Role Matrix</h3>
                      <p className="text-sm text-slate-500 mt-1">Manage global roles, permissions, and inheritance mapping.</p>
                    </div>
                    <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2">
                       <Plus className="w-4 h-4"/> Create Custom Role
                    </button>
                 </div>

                 <div className="space-y-4">
                    <RoleCard title="System Administrator" type="Global" users={12} desc="Full access to all platform settings, infrastructure, and all tenant organizations." />
                    <RoleCard title="Organization Admin" type="Tenant" users={450} desc="Full access within their specific organization. Cannot view other organizations." />
                    <RoleCard title="Chief Medical Officer" type="Clinical" users={120} desc="View-all access to clinical records, analytics, and quality compliance across the organization." />
                    <RoleCard title="Attending Physician" type="Clinical" users="4,200" desc="Standard EMR access. Can create/edit clinical notes, prescribe, and order labs." />
                    <RoleCard title="Billing Specialist" type="Financial" users="1,150" desc="Access to RCM, claims, invoices, and payment gateways. No clinical note editing." />
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'Audit' && (
            <div className="space-y-6 pb-20">
               <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg mb-1">Global Audit Logs</h3>
                  <p className="text-sm text-slate-500 mb-6">Immutable records of all platform activity for HIPAA and SOC2 compliance.</p>
                  
                  <div className="space-y-3">
                     <AuditRow time="Just Now" user="sysadmin@careconnect.com" action="Updated Feature Flag" resource="telemedicine_enabled (Apollo Hospitals)" ip="192.168.1.42" />
                     <AuditRow time="2 mins ago" user="billing@mayoclinic.org" action="Downloaded Report" resource="Q3_Revenue_Summary.pdf" ip="203.0.113.15" />
                     <AuditRow time="15 mins ago" user="dr.sharma@apollo.com" action="Viewed Record" resource="Patient #PT-992384" ip="198.51.100.2" />
                     <AuditRow time="1 hour ago" user="api_service_acct" action="Data Sync" resource="FHIR Endpoint (HDFC Ergo)" ip="10.0.0.5" />
                  </div>
               </div>
            </div>
          )}

          {activeTab !== 'Dashboard' && activeTab !== 'Organizations' && activeTab !== 'RBAC' && activeTab !== 'Audit' && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
               <Settings className="w-12 h-12 text-slate-300 mb-4" />
               <p>The {activeTab} module will be rendered here dynamically.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// Subcomponents

function NavItem({ icon, label, active = false, isExpanded, onClick }: { icon: React.ReactNode, label: string, active?: boolean, isExpanded: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center p-2.5 rounded-lg transition-colors ${active ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 font-medium'} ${!isExpanded && 'justify-center'}`} title={!isExpanded ? label : undefined}>
      <div className={`w-5 h-5 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} ${isExpanded && 'mr-3'}`}>
        {icon}
      </div>
      {isExpanded && <span className="text-sm">{label}</span>}
    </button>
  );
}

function MetricCard({ title, value, trend, icon }: { title: string, value: string, trend: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-semibold text-slate-500">{title}</h3>
        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">{icon}</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
        <div className="text-xs text-slate-500 mt-1 font-medium">{trend}</div>
      </div>
    </div>
  );
}

function HealthRow({ service, status, message }: { service: string, status: 'Operational' | 'Degraded' | 'Down', message?: string }) {
  const isOp = status === 'Operational';
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
      <div className="flex items-center gap-3">
        {isOp ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-yellow-500" />}
        <div>
           <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{service}</div>
           {message && <div className="text-xs text-slate-500">{message}</div>}
        </div>
      </div>
      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${isOp ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
        {status}
      </span>
    </div>
  );
}

function OrgRow({ name, region, plan, users, status }: { name: string, region: string, plan: string, users: string, status: string }) {
  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">{name}</td>
      <td className="px-6 py-4">{region}</td>
      <td className="px-6 py-4">
        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-md">{plan}</span>
      </td>
      <td className="px-6 py-4">{users}</td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-slate-400 hover:text-indigo-600 transition-colors"><MoreVertical className="w-4 h-4" /></button>
      </td>
    </tr>
  );
}

function RoleCard({ title, type, users, desc }: { title: string, type: string, users: string | number, desc: string }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group bg-slate-50 dark:bg-slate-800/30">
       <div className="flex-1 mb-4 md:mb-0 pr-4">
         <div className="flex items-center gap-3 mb-1">
           <h4 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
           <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-md">{type}</span>
         </div>
         <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
       </div>
       <div className="flex items-center gap-6">
         <div className="text-right">
           <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{users}</div>
           <div className="text-xs text-slate-400">Assigned</div>
         </div>
         <button className="p-2 border border-slate-200 dark:border-slate-600 rounded-md text-slate-500 hover:text-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-700 bg-white dark:bg-slate-900 transition-colors">
           <Edit2 className="w-4 h-4" />
         </button>
       </div>
    </div>
  );
}

function AuditRow({ time, user, action, resource, ip }: { time: string, user: string, action: string, resource: string, ip: string }) {
  return (
    <div className="flex items-start md:items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50 text-sm">
       <div className="flex-1">
         <div className="font-mono text-xs text-slate-400 mb-1">{time}</div>
         <div><span className="font-semibold text-slate-900 dark:text-slate-100">{user}</span> {action} <span className="font-semibold text-indigo-600 dark:text-indigo-400">{resource}</span></div>
       </div>
       <div className="text-right mt-2 md:mt-0 text-slate-400 font-mono text-xs">
         IP: {ip}
       </div>
    </div>
  );
}
