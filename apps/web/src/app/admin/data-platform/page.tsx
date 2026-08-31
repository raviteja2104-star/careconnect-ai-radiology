'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Database, Activity, Cpu, Layers, Heart, ShieldAlert, BarChart3, 
  GitBranch, Play, RefreshCw, Users, FileText, Sparkles, Check, 
  AlertTriangle, Server, ArrowRight, CornerDownRight, HardDrive, Download
} from 'lucide-react';
import { 
  enterpriseDataPlatformService, MasterPatientIndexRecord, DataAssetRecord, 
  PopulationHealthMetric, PredictiveModelInsight, DigitalTwinHospitalState 
} from '@/services/enterpriseDataPlatformService';

export default function EnterpriseDataPlatformPage() {
  const [activeTab, setActiveTab] = useState<'TWIN' | 'POPULATION' | 'PREDICTIVE' | 'EMPI' | 'LAKEHOUSE' | 'RESEARCH'>('TWIN');
  
  // States
  const [empi] = useState<MasterPatientIndexRecord[]>(enterpriseDataPlatformService.getEMPI());
  const [assets] = useState<DataAssetRecord[]>(enterpriseDataPlatformService.getAssets());
  const [popHealth] = useState<PopulationHealthMetric[]>(enterpriseDataPlatformService.getPopulationHealth());
  const [predictive] = useState<PredictiveModelInsight[]>(enterpriseDataPlatformService.getPredictiveInsights());
  const [twin, setTwin] = useState<DigitalTwinHospitalState>(enterpriseDataPlatformService.getDigitalTwinState());

  // Research Query Form
  const [cohortName, setCohortName] = useState('Cardiovascular & Type 2 Diabetes High-Risk Cohort');
  const [researchReport, setResearchReport] = useState<any>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  const handleRefreshTwin = () => {
    setTwin(enterpriseDataPlatformService.getDigitalTwinState());
  };

  const handleRunResearchQuery = (e: React.FormEvent) => {
    e.preventDefault();
    setIsQuerying(true);
    setTimeout(() => {
      setResearchReport(enterpriseDataPlatformService.runResearchQuery(cohortName, true));
      setIsQuerying(false);
    }, 600);
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
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">Enterprise Data Platform (EDP)</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold rounded-md uppercase">
                  Data Lakehouse & Digital Twin Active
                </span>
              </div>
              <p className="text-xs text-slate-400">Master Patient Index (EMPI), BI Studio, Population Health & ML Feature Store</p>
            </div>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button 
              onClick={() => setActiveTab('TWIN')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'TWIN' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Activity className="w-3.5 h-3.5" /> Digital Twin
            </button>
            <button 
              onClick={() => setActiveTab('POPULATION')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'POPULATION' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Heart className="w-3.5 h-3.5" /> Population Health
            </button>
            <button 
              onClick={() => setActiveTab('PREDICTIVE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'PREDICTIVE' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Predictive AI
            </button>
            <button 
              onClick={() => setActiveTab('EMPI')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'EMPI' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Users className="w-3.5 h-3.5" /> EMPI Patient Index
            </button>
            <button 
              onClick={() => setActiveTab('LAKEHOUSE')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'LAKEHOUSE' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <Layers className="w-3.5 h-3.5" /> Data Lakehouse
            </button>
            <button 
              onClick={() => setActiveTab('RESEARCH')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'RESEARCH' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <FileText className="w-3.5 h-3.5" /> Research & ML
            </button>
          </div>
        </div>

        {/* TAB 1: HOSPITAL DIGITAL TWIN */}
        {activeTab === 'TWIN' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Live Hospital Operations Digital Twin</h2>
                <p className="text-xs text-slate-500">Real-time simulation of patient flows across OPD, IPD, ICU, OT, Lab & Pharmacy.</p>
              </div>

              <button onClick={handleRefreshTwin} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Twin Stream
              </button>
            </div>

            {twin.bottleneckAlert && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs flex items-center gap-3 font-semibold text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span><strong>DIGITAL TWIN BOTTLENECK ALERT:</strong> {twin.bottleneckAlert}</span>
              </div>
            )}

            {/* Visual Process Flow Simulation */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Operational Flow Telemetry</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">1. OPD Triage Queue</span>
                  <span className="text-2xl font-black text-indigo-600">{twin.opdTriageQueue}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Avg 14 min wait</span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">2. Doctor Consultations</span>
                  <span className="text-2xl font-black text-cyan-600">{twin.consultationActive}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Active Consultations</span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">3. Lab & Radiology</span>
                  <span className="text-2xl font-black text-purple-600">{twin.labSpecimensInQueue + twin.radiologyScansActive}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">In Diagnostics</span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">4. Pharmacy Dispense</span>
                  <span className="text-2xl font-black text-emerald-600">{twin.pharmacyDispenseQueue}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Dispensing Queue</span>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">5. IPD / ICU / OT</span>
                  <span className="text-2xl font-black text-rose-600">{twin.ipdBedsOccupied + twin.icuBedsOccupied}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Occupied Beds</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: POPULATION HEALTH */}
        {activeTab === 'POPULATION' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Population Health & Chronic Disease Outcomes</h2>
              <p className="text-xs text-slate-500">Track disease prevalence, 30-day readmissions, & screening compliance across patient cohorts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {popHealth.map(ph => (
                <div key={ph.condition} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 font-bold text-[10px] rounded uppercase">{ph.condition}</span>
                    <span className="text-xs font-bold text-emerald-600">{ph.controlledPct}% Controlled</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">{ph.cohortSize.toLocaleString()}</h3>
                    <p className="text-xs text-slate-400">Total Enrolled Cohort Patients</p>
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">30d Readmission Rate</span>
                      <span className="font-bold text-slate-900 dark:text-white">{ph.readmissionRate30d}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Screening Compliance</span>
                      <span className="font-bold text-slate-900 dark:text-white">{ph.screeningCompliancePct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PREDICTIVE AI */}
        {activeTab === 'PREDICTIVE' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Predictive AI Clinical Insights & Risk Models</h2>
              <p className="text-xs text-slate-500">Early sepsis alerts, 30-day readmission risk, and ICU SOFA deterioration scores.</p>
            </div>

            <div className="space-y-4">
              {predictive.map(pred => (
                <div key={pred.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 font-mono text-[10px] font-bold rounded uppercase">{pred.modelName}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{pred.patientName}</span>
                    </div>
                    <span className="px-3 py-1 bg-rose-500 text-white font-bold rounded-full text-xs">
                      {pred.riskScorePct}% {pred.riskLevel} RISK
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-mono">
                    <strong className="text-indigo-600 block mb-1">Triggering Risk Factors:</strong>
                    <span>{pred.keyFactors.join(' | ')}</span>
                  </div>

                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    💡 <strong>AI Recommendation:</strong> {pred.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: EMPI PATIENT INDEX */}
        {activeTab === 'EMPI' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Enterprise Master Patient Index (EMPI)</h2>
              <p className="text-xs text-slate-500">Cross-hospital identity resolution, deduplication, & ABHA address mapping.</p>
            </div>

            <div className="space-y-4">
              {empi.map(p => (
                <div key={p.empiId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{p.patientName} ({p.gender}, DOB: {p.dob})</h3>
                      <p className="text-xs font-mono text-indigo-600">{p.empiId} | ABHA: {p.abhaAddress}</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">{p.confidenceScorePct}% Match Confidence</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-bold">Linked Hospitals:</span>
                    {p.matchedHospitals.map(h => (
                      <span key={h} className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] rounded">{h}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: DATA LAKEHOUSE */}
        {activeTab === 'LAKEHOUSE' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Data Lakehouse & Clinical Catalog</h2>
              <p className="text-xs text-slate-500">Unified PostgreSQL, ClickHouse, Apache Iceberg, & PgVector storage assets.</p>
            </div>

            <div className="space-y-4">
              {assets.map(asset => (
                <div key={asset.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{asset.name}</h3>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold rounded uppercase">{asset.format}</span>
                    </div>
                    <p className="text-xs text-slate-500">{asset.recordCount.toLocaleString()} Records | {(asset.sizeBytes / 1000000).toFixed(1)} MB</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">{asset.qualityScorePct}% Quality Score</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: RESEARCH & ML FEATURE STORE */}
        {activeTab === 'RESEARCH' && (
          <div className="flex-1 p-8 overflow-y-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">De-Identified Research Workspace & Feature Store</h2>
              <p className="text-xs text-slate-500">Build HIPAA compliant research cohorts & query ML time-series features.</p>
            </div>

            <form onSubmit={handleRunResearchQuery} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <input
                type="text"
                placeholder="Cohort Definition (e.g. Cardiovascular & Diabetes Dual Cohort)"
                value={cohortName}
                onChange={(e) => setCohortName(e.target.value)}
                className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold"
              />
              <button type="submit" className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0">
                <Play className="w-4 h-4" /> {isQuerying ? 'Querying Cohort...' : 'Extract Research Cohort'}
              </button>
            </form>

            {researchReport && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 text-xs font-mono">
                <div className="flex justify-between items-center border-b pb-3">
                  <span className="font-bold text-slate-900 dark:text-white">{researchReport.cohortName}</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                    {researchReport.status}
                  </span>
                </div>
                <p>Query ID: {researchReport.queryId}</p>
                <p>Matched De-Identified Patients: {researchReport.patientCount}</p>
                <p>Export Format: {researchReport.exportFormat}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
