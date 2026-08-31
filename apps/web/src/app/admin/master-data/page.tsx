'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Building, Layers, Database, Globe, Palette, ToggleLeft, ToggleRight, 
  Plus, Edit2, Trash2, Save, CheckCircle, ShieldCheck, RefreshCw, 
  Search, FileText, ChevronRight, CornerDownLeft, Sparkles, Sliders, Check
} from 'lucide-react';
import { 
  masterDataService, MasterDataItem, HospitalHierarchyNode, 
  FeatureFlagConfig, LanguageResourceConfig 
} from '@/services/masterDataService';

export default function MasterDataManagementPage() {
  const [activeTab, setActiveTab] = useState<'HIERARCHY' | 'MASTERS' | 'LANGUAGES' | 'BRANDING' | 'FEATURE_FLAGS' | 'VERSIONS'>('HIERARCHY');
  
  // Service States
  const [hierarchy] = useState<HospitalHierarchyNode[]>(masterDataService.getHierarchy());
  const [masterItems, setMasterItems] = useState<MasterDataItem[]>(masterDataService.getMasterItems());
  const [selectedCategory, setSelectedCategory] = useState<string>('CLINICAL');
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagConfig[]>(masterDataService.getFeatureFlags());
  const [languages] = useState<LanguageResourceConfig[]>(masterDataService.getLanguages());
  const [branding, setBranding] = useState(masterDataService.getBranding());
  const [versions] = useState(masterDataService.getVersions());

  // Modal / Form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemSubCategory, setNewItemSubCategory] = useState('Diagnosis');
  const [saveToast, setSaveToast] = useState(false);

  const handleToggleFlag = (key: string) => {
    masterDataService.toggleFeatureFlag(key);
    setFeatureFlags([...masterDataService.getFeatureFlags()]);
  };

  const handleAddMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemCode) return;

    const created = masterDataService.addMasterItem({
      id: `m-custom-${Date.now()}`,
      category: selectedCategory as any,
      subCategory: newItemSubCategory,
      code: newItemCode,
      name: newItemName,
      status: 'ACTIVE'
    });

    setMasterItems([...masterDataService.getMasterItems()]);
    setNewItemName('');
    setNewItemCode('');
  };

  const handleSaveBranding = () => {
    masterDataService.updateBranding(branding);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
        
        {/* TOP HEADER */}
        <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">Master Data & Config Hub</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold rounded-md uppercase">
                  v{versions[0].version}.0 Active
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">{branding.hospitalName}</p>
            </div>
          </div>

          {/* SECTION NAVIGATION TABS */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button 
              onClick={() => setActiveTab('HIERARCHY')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'HIERARCHY' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Building className="w-3.5 h-3.5" /> Structure
            </button>
            <button 
              onClick={() => setActiveTab('MASTERS')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'MASTERS' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Layers className="w-3.5 h-3.5" /> Masters
            </button>
            <button 
              onClick={() => setActiveTab('LANGUAGES')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'LANGUAGES' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Globe className="w-3.5 h-3.5" /> Multilingual
            </button>
            <button 
              onClick={() => setActiveTab('BRANDING')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'BRANDING' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Palette className="w-3.5 h-3.5" /> Branding
            </button>
            <button 
              onClick={() => setActiveTab('FEATURE_FLAGS')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'FEATURE_FLAGS' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Sliders className="w-3.5 h-3.5" /> Feature Flags
            </button>
            <button 
              onClick={() => setActiveTab('VERSIONS')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'VERSIONS' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Audit & Versions
            </button>
          </div>

          <div className="flex items-center gap-2">
            {saveToast && (
              <span className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 animate-pulse">
                <Check className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
            <button 
              onClick={() => {
                masterDataService.publishConfiguration('Master Data Configuration published via Admin Hub.');
                setSaveToast(true);
                setTimeout(() => setSaveToast(false), 3000);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Save className="w-4 h-4" /> Publish Config
            </button>
          </div>
        </div>

        {/* TAB 1: ORGANISATION HIERARCHY */}
        {activeTab === 'HIERARCHY' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Hospital Organisation Hierarchy</h2>
                <p className="text-xs text-slate-500">Configure Multi-Tenant Groups, Campuses, Departments, Wards, & Beds.</p>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Node
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
              {hierarchy.map(node => (
                <div key={node.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-indigo-500" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{node.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">ID: {node.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-mono text-[10px] font-bold rounded-lg uppercase">
                      {node.type}
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                      {node.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: MASTER DATA CATALOGUES */}
        {activeTab === 'MASTERS' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Master Data Catalogue Management</h2>
                <p className="text-xs text-slate-500">Configure clinical diagnoses, pharmacy generic drugs, lab tests, & charge masters.</p>
              </div>

              <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                {['PATIENT', 'CLINICAL', 'PHARMACY', 'LABORATORY', 'RADIOLOGY', 'BILLING'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${selectedCategory === cat ? 'bg-white dark:bg-slate-900 text-indigo-600 font-extrabold shadow-xs' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAddMaster} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <input
                type="text"
                placeholder="Item Code (e.g. LAB-LIPID)"
                value={newItemCode}
                onChange={(e) => setNewItemCode(e.target.value)}
                className="w-48 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              />
              <input
                type="text"
                placeholder="Item Name (e.g. Fasting Lipid Profile)"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              />
              <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0">
                <Plus className="w-4 h-4" /> Add to {selectedCategory} Master
              </button>
            </form>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3.5">Code</th>
                    <th className="px-6 py-3.5">Sub-Category</th>
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                  {masterItems.filter(m => m.category === selectedCategory).map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600">{item.code}</td>
                      <td className="px-6 py-4">{item.subCategory}</td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white font-bold">{item.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">{item.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MULTILINGUAL DEFAULTS */}
        {activeTab === 'LANGUAGES' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Multilingual Resources & Patient Defaults</h2>
              <p className="text-xs text-slate-500">Manage 13 Indian & global languages for prescriptions, patient portal, & WhatsApp dispatches.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {languages.map(lang => (
                <div key={lang.code} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-slate-900 dark:text-white">{lang.name} ({lang.nativeName})</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-mono font-bold rounded uppercase">{lang.code}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 border-t pt-2">
                    <span>Coverage</span>
                    <span className="text-emerald-600 font-bold">{lang.translatedCount} keys</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: BRANDING & IDENTITY */}
        {activeTab === 'BRANDING' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Branding & Hospital Legal Identity</h2>
                <p className="text-xs text-slate-500">Configure Hospital logo, accent colors, NABH registration, & prescription headers.</p>
              </div>
              <button onClick={handleSaveBranding} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Branding
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Hospital Official Name</label>
                  <input type="text" value={branding.hospitalName} onChange={(e) => setBranding({ ...branding, hospitalName: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">NABH Registration No.</label>
                  <input type="text" value={branding.nabhRegistrationNo} onChange={(e) => setBranding({ ...branding, nabhRegistrationNo: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">GSTIN Tax ID</label>
                  <input type="text" value={branding.gstinNo} onChange={(e) => setBranding({ ...branding, gstinNo: e.target.value })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Prescription Header Layout</label>
                  <select value={branding.prescriptionHeaderLayout} onChange={(e) => setBranding({ ...branding, prescriptionHeaderLayout: e.target.value as any })} className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold">
                    <option value="HEADER_FULL">Full Standard Header with Logo</option>
                    <option value="HEADER_COMPACT">Compact Modern Header</option>
                    <option value="LETTERHEAD_PREPRINTED">Pre-Printed Letterhead Margins</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FEATURE FLAGS MANAGER */}
        {activeTab === 'FEATURE_FLAGS' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Feature Flags & Module Switches</h2>
              <p className="text-xs text-slate-500">Toggle live platform capabilities across Telemedicine, AI Scribe, Multilingual Rx, & ABDM Sync.</p>
            </div>

            <div className="space-y-4">
              {featureFlags.map(flag => (
                <div key={flag.key} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{flag.name}</h3>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold rounded uppercase">{flag.category}</span>
                    </div>
                    <p className="text-xs text-slate-500">{flag.description}</p>
                  </div>
                  <button onClick={() => handleToggleFlag(flag.key)} className="transition-transform">
                    {flag.isEnabled ? (
                      <ToggleRight className="w-9 h-9 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-slate-300" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT & VERSIONS */}
        {activeTab === 'VERSIONS' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Master Configuration Version Audit</h2>
              <p className="text-xs text-slate-500">Track all master data additions, feature flag toggles, and pricing updates.</p>
            </div>

            <div className="space-y-4">
              {versions.map(ver => (
                <div key={ver.version} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">Version v{ver.version}.0</span>
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${ver.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {ver.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{ver.changeSummary}</p>
                    <span className="text-[10px] font-mono text-slate-400 mt-1 block">Published on {ver.publishedAt} by {ver.publishedBy}</span>
                  </div>
                  {ver.status !== 'PUBLISHED' && (
                    <button className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center gap-1">
                      <CornerDownLeft className="w-3.5 h-3.5" /> Rollback to v{ver.version}.0
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
