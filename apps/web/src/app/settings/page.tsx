'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Settings, Building, Globe, Shield, Users, Bell, FileText, 
  Save, CheckCircle2, Lock, Cpu, Database, Mail, Phone, MessageSquare
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/services/prescriptionTranslationService';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'rx' | 'languages' | 'security' | 'integrations'>('profile');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [hospitalInfo, setHospitalInfo] = useState({
    name: 'CareConnect Super Specialty Hospital',
    tagline: 'Center for Advanced Cardiovascular & Medical Sciences',
    regNo: 'NABH Accr. Reg No: HMC-2024-8849',
    phone: '+91 (080) 4567-8900 / Emergency: 108',
    email: 'contact@careconnect.health',
    address: 'Plot 42, Health City, Electronic City Ph-1, Bangalore - 560100',
    taxId: '29ABCDE1234F1Z5'
  });

  const [defaultRxLang, setDefaultRxLang] = useState('te');
  const [enableBilingualDefault, setEnableBilingualDefault] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xs">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Enterprise Hospital & Platform Settings
              </h1>
              <p className="text-xs text-slate-500">
                Manage organization profile, multi-language defaults, security roles, & integration gateways.
              </p>
            </div>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 rounded-2xl text-xs font-bold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Settings Saved Successfully!
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4 overflow-x-auto">
          {[
            { id: 'profile', label: '🏥 Hospital Profile & Branding' },
            { id: 'rx', label: '📄 Prescription (Rx) Customization' },
            { id: 'languages', label: '🌐 Multi-Language Defaults' },
            { id: 'security', label: '🔒 Roles & Security (RBAC)' },
            { id: 'integrations', label: '⚡ APIs & Messaging Gateways' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`pb-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === t.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: HOSPITAL PROFILE */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Organization Legal Identity & Contact Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Hospital / Clinic Full Name</label>
                <input
                  type="text"
                  value={hospitalInfo.name}
                  onChange={(e) => setHospitalInfo({...hospitalInfo, name: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={hospitalInfo.tagline}
                  onChange={(e) => setHospitalInfo({...hospitalInfo, tagline: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">NABH / Medical License Reg No</label>
                <input
                  type="text"
                  value={hospitalInfo.regNo}
                  onChange={(e) => setHospitalInfo({...hospitalInfo, regNo: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">GSTIN / Tax Registration ID</label>
                <input
                  type="text"
                  value={hospitalInfo.taxId}
                  onChange={(e) => setHospitalInfo({...hospitalInfo, taxId: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Official Address</label>
                <input
                  type="text"
                  value={hospitalInfo.address}
                  onChange={(e) => setHospitalInfo({...hospitalInfo, address: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all"
              >
                <Save className="w-4 h-4" /> Save Profile Settings
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: MULTI-LANGUAGE DEFAULTS */}
        {activeTab === 'languages' && (
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Default Patient Prescription Language Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Default System Preferred Language</label>
                <select
                  value={defaultRxLang}
                  onChange={(e) => setDefaultRxLang(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name} ({lang.nativeName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableBilingualDefault}
                    onChange={(e) => setEnableBilingualDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Default to Bilingual Render Mode</span>
                    <span className="text-[11px] text-slate-500">Always print English generic names alongside patient native language instructions.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all"
              >
                <Save className="w-4 h-4" /> Save Multi-Language Settings
              </button>
            </div>
          </form>
        )}

        {/* TAB 5: INTEGRATIONS */}
        {activeTab === 'integrations' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Communication & Hospital Hardware APIs
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 font-bold">
                  <MessageSquare className="w-4 h-4" /> WhatsApp Business API
                </div>
                <p className="text-[11px] text-slate-500">Connected to Meta Business Gateway (+91 98765 00000). Sends automated Rx PDFs.</p>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">Status: Active</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-blue-600 font-bold">
                  <Mail className="w-4 h-4" /> Email SendGrid Gateway
                </div>
                <p className="text-[11px] text-slate-500">SMTP: smtp.sendgrid.net | Port: 587. Sends patient lab results and invoices.</p>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">Status: Active</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-purple-600 font-bold">
                  <Cpu className="w-4 h-4" /> DICOM / PACS Radiology Server
                </div>
                <p className="text-[11px] text-slate-500">Orthanc DICOM Server (192.168.1.100:4242). Live imaging integration.</p>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">Status: Connected</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
