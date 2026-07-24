'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Bell, MessageSquare, Calendar, Mic, Moon, Sun, 
  Activity, Users, FileText, Pill, FileHeart, Stethoscope, 
  Video, Phone, MessageCircle, Printer, Share, Download, 
  Plus, Edit2, ChevronLeft, ChevronRight, Settings, LogOut,
  ChevronDown, HeartPulse, AlertTriangle, Trash2, Sparkles, CheckCircle, X
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import useDashboardStore from '@/store/dashboardStore';

export default function EMRDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const { showCopilot, toggleCopilot } = useDashboardStore();

  // Consultation State
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [chiefComplaint, setChiefComplaint] = useState('Chest pain and mild shortness of breath since 2 days. Pain is centralized, non-radiating, pressure-like sensation, aggravated on exertion.');
  const [hpi, setHpi] = useState('Patient complains of centralized chest pain, non-radiating, pressure like sensation, aggravated on exertion and relieved on rest. Associated with mild shortness of breath and fatigue. No history of syncope, palpitations, or orthopnea.');
  const [examination, setExamination] = useState('RS: Clear breath sounds bilaterally\nCVS: S1 S2 normal, no murmurs\nP/A: Soft, non-tender\nCNS: Conscious, oriented');
  const [assessment, setAssessment] = useState('Diagnosis:\n1. Atypical Chest Pain – rule out CAD\n2. Hypertension\n3. Type 2 Diabetes Mellitus');
  const [plan, setPlan] = useState('ECG & TMT ordered\nCBC, RBS, Lipid Profile ordered\nContinue current medications (Telmisartan, Metformin)\nFollow up after test results');
  const [pastHistory, setPastHistory] = useState('- Hypertension (Since 2 years)\n- Type 2 Diabetes Mellitus (Since 1 year)\n- No known drug allergies');

  // Autosave simulation
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1500);
    return () => clearTimeout(timer);
  }, [chiefComplaint, hpi, examination, assessment, plan, pastHistory]);

  const handleInsertAI = () => {
    setChiefComplaint("32yo male presents with central chest pain x 2 days. Pain is pressure-like, non-radiating, worsened by exertion.");
    setExamination("BP 128/84, HR 82. Chest clear to auscultation. S1/S2 normal.");
    setAssessment("Diagnosis:\n1. Atypical chest pain\n2. Hypertension\n3. Type 2 Diabetes");
    setPlan("ECG, TMT, CBC, Lipid panel ordered.\nContinue Telmisartan/Metformin.");
    if (showCopilot) toggleCopilot();
  };

  // Prescription State
  const [prescriptions, setPrescriptions] = useState([
    { id: '1', name: 'Metformin', dose: '500mg', frequency: '1-0-1 (BID)', duration: '30 days', instructions: 'After Meals' },
    { id: '2', name: 'Aspirin', dose: '75mg', frequency: '0-0-1 (OD)', duration: '30 days', instructions: 'After Dinner' }
  ]);
  const [newDrug, setNewDrug] = useState({ name: '', dose: '', frequency: '1-0-1 (BID)', duration: '', instructions: '' });
  const [showDrugSuggestions, setShowDrugSuggestions] = useState(false);

  // Mock Drug Database
  const drugDatabase = ['Atorvastatin', 'Amoxicillin', 'Lisinopril', 'Omeprazole', 'Azithromycin', 'Paracetamol', 'Ibuprofen', 'Pantoprazole', 'Telmisartan', 'Amlodipine'];
  const filteredDrugs = drugDatabase.filter(d => d.toLowerCase().includes(newDrug.name.toLowerCase()));

  const handleAddPrescription = () => {
    if (!newDrug.name) return;
    setPrescriptions([...prescriptions, { ...newDrug, id: Date.now().toString() }]);
    setNewDrug({ name: '', dose: '', frequency: '1-0-1 (BID)', duration: '', instructions: '' });
  };

  const handleRemovePrescription = (id: string) => {
    setPrescriptions(prescriptions.filter(p => p.id !== id));
  };
  
  const hasInteraction = prescriptions.some(p => p.name.includes('Metformin')) && prescriptions.some(p => p.name.includes('Aspirin'));

  // Lab Orders State
  const [labOrders, setLabOrders] = useState([
    { id: '1', name: 'Complete Blood Count (CBC)', code: 'LOINC 57021-8', priority: 'Routine', sample: 'Blood' }
  ]);
  const [newLabTest, setNewLabTest] = useState('');
  const [labPriority, setLabPriority] = useState('Routine');
  const [showLabSuggestions, setShowLabSuggestions] = useState(false);

  // Mock Lab Database
  const labDatabase = ['Complete Blood Count (CBC)', 'Lipid Profile', 'HbA1c', 'Thyroid Profile (T3, T4, TSH)', 'Liver Function Test (LFT)', 'Kidney Function Test (KFT)', 'Serum Electrolytes', 'Urinalysis', 'Vitamin D', 'CRP (C-Reactive Protein)'];
  const filteredLabs = labDatabase.filter(l => l.toLowerCase().includes(newLabTest.toLowerCase()));

  const handleAddLab = () => {
    if (!newLabTest) return;
    setLabOrders([...labOrders, { id: Date.now().toString(), name: newLabTest, code: 'LOINC ' + Math.floor(Math.random() * 90000 + 10000) + '-1', priority: labPriority, sample: newLabTest.includes('Urine') ? 'Urine' : 'Blood' }]);
    setNewLabTest('');
  };

  const handleRemoveLab = (id: string) => {
    setLabOrders(labOrders.filter(l => l.id !== id));
  };

  // Imaging State
  const [imagingOrders, setImagingOrders] = useState([
    { id: '1', name: 'CT Head w/o Contrast', modality: 'CT', priority: 'STAT', status: 'Pending' }
  ]);
  const [newImaging, setNewImaging] = useState('');
  const [imagingPriority, setImagingPriority] = useState('Routine');
  const [showImagingSuggestions, setShowImagingSuggestions] = useState(false);

  // Mock Imaging Database
  const imagingDatabase = ['CT Head w/o Contrast', 'MRI Brain w/ Contrast', 'Chest X-Ray PA View', 'USG Abdomen & Pelvis', 'Echocardiogram', 'ECG 12-Lead', 'PET-CT Whole Body'];
  const filteredImaging = imagingDatabase.filter(l => l.toLowerCase().includes(newImaging.toLowerCase()));

  const handleAddImaging = () => {
    if (!newImaging) return;
    setImagingOrders([...imagingOrders, { id: Date.now().toString(), name: newImaging, modality: newImaging.split(' ')[0], priority: imagingPriority, status: 'Pending' }]);
    setNewImaging('');
  };
  
  const handleRemoveImaging = (id: string) => {
    setImagingOrders(imagingOrders.filter(l => l.id !== id));
  };

  // Documents State
  const [documents, setDocuments] = useState([
    { id: '1', name: 'Previous_Discharge_Summary.pdf', category: 'Discharge Summary', date: '10 May 2026', aiExtracted: true, size: '2.4 MB' },
    { id: '2', name: 'PathLabs_Blood_Test_Report.pdf', category: 'Lab Report', date: '05 May 2026', aiExtracted: true, size: '1.1 MB' }
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const simulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      setUploadProgress(0);
      
      const fileName = e.target.files[0].name;
      
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            setDocuments([{ id: Date.now().toString(), name: fileName, category: 'Unclassified', date: 'Today', aiExtracted: false, size: 'Unknown' }, ...documents]);
          }, 500);
        }
      }, 300);
    }
  };

  const autosaveAction = saveStatus !== 'idle' ? (
    <div className="hidden md:flex items-center gap-2 text-xs font-semibold mr-2 transition-all">
      {saveStatus === 'saving' ? (
        <span className="flex items-center gap-1 text-slate-500"><Activity className="w-3 h-3 animate-spin" /> Saving...</span>
      ) : (
        <span className="flex items-center gap-1 text-green-600"><CheckCircle className="w-3 h-3" /> Saved</span>
      )}
    </div>
  ) : null;

  return (
    <DashboardLayout headerAction={autosaveAction}>
      
      {/* EMR WORKSPACE (CENTER + RIGHT SIDEBAR) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* 3. CENTER COLUMN (MAIN EMR) */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
            
            {/* Back to patients */}
            <button className="flex items-center text-sm text-blue-600 font-medium mb-6 hover:underline">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Patients
            </button>

            {/* Patient Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <img src="https://i.pravatar.cc/150?img=12" alt="Patient" className="w-20 h-20 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-md" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold">Rohit Sharma</h1>
                    <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-md">PT-0001234</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span>32 Y • Male</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span>12 May 1992</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> +91 98765 43210</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <ActionBtn icon={<Video />} />
                <ActionBtn icon={<MessageCircle />} />
                <ActionBtn icon={<Printer />} />
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                  <Plus className="w-4 h-4" /> New Consultation
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-800 mb-6 flex gap-6 overflow-x-auto hide-scrollbar">
              {['Overview', 'Timeline', 'Examination', 'Lab Orders', 'Imaging', 'Medications', 'Procedures', 'Documents', 'Billing'].map(tab => (
                 <Tab key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
              ))}
            </div>

            {/* Content Grid */}
            {activeTab === 'Overview' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-24">
                
                {/* Left Column of Main Workspace */}
                <div className="space-y-6">
                  
                  <EditableCard title="Chief Complaint" value={chiefComplaint} onChange={setChiefComplaint} />
                  <EditableCard title="History of Present Illness" value={hpi} onChange={setHpi} />
                  <EditableCard title="Past Medical History" value={pastHistory} onChange={setPastHistory} />

                </div>

                {/* Right Column of Main Workspace */}
                <div className="space-y-6">
                  
                  {/* Vital Signs */}
                  <Card title="Vital Signs" actionable>
                    <div className="grid grid-cols-3 gap-4">
                      <VitalItem icon={<Activity className="text-red-500 w-5 h-5" />} label="BP" value="128/84" unit="mmHg" />
                      <VitalItem icon={<HeartPulse className="text-rose-500 w-5 h-5" />} label="Pulse" value="82" unit="bpm" />
                      <VitalItem icon={<Activity className="text-blue-500 w-5 h-5" />} label="SpO2" value="98" unit="%" />
                      <VitalItem icon={<Activity className="text-orange-500 w-5 h-5" />} label="Temp" value="36.6" unit="°C" />
                      <VitalItem icon={<Activity className="text-indigo-500 w-5 h-5" />} label="Weight" value="72" unit="kg" />
                      <VitalItem icon={<Activity className="text-teal-500 w-5 h-5" />} label="BMI" value="24.3" unit="kg/m²" />
                    </div>
                    <button className="text-blue-600 text-sm font-medium mt-4 flex items-center hover:underline">
                      <Activity className="w-4 h-4 mr-1" /> View Trends
                    </button>
                  </Card>

                  <EditableCard title="Examination" value={examination} onChange={setExamination} />
                  <EditableCard title="Assessment" value={assessment} onChange={setAssessment} />
                  <EditableCard title="Plan" value={plan} onChange={setPlan} />
                  
                </div>
              </div>
            )}

            {activeTab === 'Timeline' && (
              <div className="pb-24">
                <Card title="Unified Longitudinal Patient Timeline">
                  <div className="flex flex-col xl:flex-row gap-6 mt-4">
                    
                    {/* Left: Filter & Search */}
                    <div className="w-full xl:w-64 shrink-0 space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Search events..." className="w-full h-10 pl-9 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Filters</h4>
                        <div className="space-y-2">
                           <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" className="rounded" defaultChecked /> Consultations</label>
                           <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" className="rounded" defaultChecked /> Lab Results</label>
                           <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" className="rounded" defaultChecked /> Prescriptions</label>
                           <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" className="rounded" defaultChecked /> Imaging & PACS</label>
                           <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" className="rounded" defaultChecked /> Billing & Invoices</label>
                           <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" className="rounded" defaultChecked /> Documents</label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right: The Timeline */}
                    <div className="flex-1 border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 relative space-y-8">
                       
                       {/* Event 1 - Now */}
                       <div className="relative">
                          <div className="absolute -left-[35px] bg-blue-500 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 shadow"></div>
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm relative group hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                             <span className="absolute top-4 right-4 text-xs font-semibold text-slate-400">Just Now</span>
                             <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold uppercase rounded-full">Invoice Generated</span>
                             </div>
                             <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Encounter Invoice #INV-20260724</h4>
                             <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Total Payable: ₹1,500.00. Insurance coverage applied successfully.</p>
                             <div className="flex gap-2">
                                <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">View Invoice</button>
                             </div>
                          </div>
                       </div>
                       
                       {/* Event 2 - 10 mins ago */}
                       <div className="relative">
                          <div className="absolute -left-[35px] bg-indigo-500 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 shadow"></div>
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:border-indigo-300 transition-colors">
                             <span className="absolute top-4 right-4 text-xs font-semibold text-slate-400">10 mins ago</span>
                             <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-[10px] font-bold uppercase rounded-full flex items-center gap-1"><Sparkles className="w-3 h-3"/> AI Coding</span>
                             </div>
                             <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Medical Codes Applied</h4>
                             <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">ICD-10 (I20.9) and CPT (93000) generated and approved by Dr. Sharma.</p>
                          </div>
                       </div>
                       
                       {/* Event 3 - 15 mins ago */}
                       <div className="relative">
                          <div className="absolute -left-[35px] bg-purple-500 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 shadow"></div>
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:border-purple-300 transition-colors">
                             <span className="absolute top-4 right-4 text-xs font-semibold text-slate-400">15 mins ago</span>
                             <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[10px] font-bold uppercase rounded-full">Imaging Ordered</span>
                             </div>
                             <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">ECG 12-Lead</h4>
                             <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Priority: STAT. Clinical Indication: R/O Stroke</p>
                          </div>
                       </div>

                       {/* Event 4 - 20 mins ago */}
                       <div className="relative">
                          <div className="absolute -left-[35px] bg-slate-300 dark:bg-slate-700 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 shadow"></div>
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                             <span className="absolute top-4 right-4 text-xs font-semibold text-slate-400">20 mins ago</span>
                             <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px] font-bold uppercase rounded-full">Consultation Started</span>
                             </div>
                             <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">Cardiology Encounter</h4>
                             <p className="text-sm text-slate-600 dark:text-slate-400">Encounter ID: ENC-992384. Dr. Raj Sharma.</p>
                          </div>
                       </div>
                       
                       {/* Load More */}
                       <div className="relative pt-4">
                          <div className="absolute -left-[28px] w-0.5 h-full bg-gradient-to-b from-slate-200 to-transparent dark:from-slate-800 top-0"></div>
                          <button className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline ml-4">Load Older Events ↓</button>
                       </div>

                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'Medications' && (
              <div className="pb-24">
                <Card title="Prescription Builder">
                  <div className="flex flex-col xl:flex-row gap-6 mt-4">
                    {/* Form side */}
                    <div className="flex-1 space-y-4">
                      <div className="relative">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Drug Name</label>
                        <div className="relative mt-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Search medication..." 
                            className="w-full h-10 pl-9 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={newDrug.name}
                            onChange={(e) => {
                              setNewDrug({...newDrug, name: e.target.value});
                              setShowDrugSuggestions(true);
                            }}
                            onBlur={() => setTimeout(() => setShowDrugSuggestions(false), 200)}
                          />
                        </div>
                        {showDrugSuggestions && newDrug.name && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredDrugs.length > 0 ? filteredDrugs.map((drug, idx) => (
                              <button 
                                key={idx} 
                                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                onClick={() => {
                                  setNewDrug({...newDrug, name: drug});
                                  setShowDrugSuggestions(false);
                                }}
                              >
                                {drug}
                              </button>
                            )) : (
                              <div className="px-4 py-2 text-sm text-slate-500">No suggestions found</div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Dose</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 500mg" 
                            className="w-full h-10 px-3 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={newDrug.dose}
                            onChange={(e) => setNewDrug({...newDrug, dose: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Frequency</label>
                          <select 
                            className="w-full h-10 px-3 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100"
                            value={newDrug.frequency}
                            onChange={(e) => setNewDrug({...newDrug, frequency: e.target.value})}
                          >
                            <option>1-0-1 (BID)</option>
                            <option>1-1-1 (TID)</option>
                            <option>1-0-0 (OD)</option>
                            <option>SOS</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Duration</label>
                          <input 
                            type="text" 
                            placeholder="e.g. 5 days" 
                            className="w-full h-10 px-3 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={newDrug.duration}
                            onChange={(e) => setNewDrug({...newDrug, duration: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Instructions</label>
                        <input 
                          type="text" 
                          placeholder="e.g. After meals" 
                          className="w-full h-10 px-3 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                          value={newDrug.instructions}
                          onChange={(e) => setNewDrug({...newDrug, instructions: e.target.value})}
                        />
                      </div>
                      <button 
                        onClick={handleAddPrescription}
                        className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                        disabled={!newDrug.name}
                      >
                        <Plus className="w-4 h-4" /> Add to Prescription
                      </button>
                    </div>

                    {/* Cart side */}
                    <div className="w-full xl:w-96 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col h-full max-h-[500px]">
                      
                      {hasInteraction ? (
                        <>
                          <div className="flex items-center gap-2 mb-4 shrink-0">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">AI Interaction Check</span>
                          </div>
                          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg text-xs text-orange-800 dark:text-orange-300 mb-4 leading-relaxed shrink-0">
                            <strong>Warning:</strong> Potential moderate interaction between <strong>Metformin</strong> and <strong>Aspirin</strong>. Monitor blood glucose closely.
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-4 shrink-0">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">AI Interaction Check</span>
                          </div>
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-xs text-green-800 dark:text-green-300 mb-4 leading-relaxed shrink-0">
                            No significant interactions detected.
                          </div>
                        </>
                      )}

                      <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                        {prescriptions.map(p => (
                          <div key={p.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm relative group">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.name} {p.dose}</h4>
                            <p className="text-xs text-slate-500 mt-1">{p.frequency} • {p.duration} • {p.instructions}</p>
                            <button 
                              onClick={() => handleRemovePrescription(p.id)}
                              className="absolute right-2 top-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {prescriptions.length === 0 && (
                          <div className="text-center text-sm text-slate-400 py-8">
                            No medications added yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'Lab Orders' && (
              <div className="pb-24">
                <Card title="Laboratory Orders (LIS)">
                  <div className="flex flex-col xl:flex-row gap-6 mt-4">
                    {/* Form side */}
                    <div className="flex-1 space-y-4">
                      <div className="relative">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Test Name</label>
                        <div className="relative mt-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Search lab test, LOINC, or panel..." 
                            className="w-full h-10 pl-9 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={newLabTest}
                            onChange={(e) => {
                              setNewLabTest(e.target.value);
                              setShowLabSuggestions(true);
                            }}
                            onBlur={() => setTimeout(() => setShowLabSuggestions(false), 200)}
                          />
                        </div>
                        {showLabSuggestions && newLabTest && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredLabs.length > 0 ? filteredLabs.map((lab, idx) => (
                              <button 
                                key={idx} 
                                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                onClick={() => {
                                  setNewLabTest(lab);
                                  setShowLabSuggestions(false);
                                }}
                              >
                                {lab}
                              </button>
                            )) : (
                              <div className="px-4 py-2 text-sm text-slate-500">No suggestions found</div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Priority</label>
                          <select 
                            className="w-full h-10 px-3 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100"
                            value={labPriority}
                            onChange={(e) => setLabPriority(e.target.value)}
                          >
                            <option>Routine</option>
                            <option>Urgent</option>
                            <option>STAT</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Clinical Notes</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Fasting sample required" 
                            className="w-full h-10 px-3 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                          />
                        </div>
                      </div>
                      
                      <div className="pt-2">
                         <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Health Packages</h4>
                         <div className="flex flex-wrap gap-2">
                           <button onClick={() => setNewLabTest('Fever Panel')} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">Fever Panel</button>
                           <button onClick={() => setNewLabTest('Diabetes Care Package')} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">Diabetes Care</button>
                           <button onClick={() => setNewLabTest('Comprehensive Health Check')} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">Comprehensive Check</button>
                         </div>
                      </div>

                      <button 
                        onClick={handleAddLab}
                        className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
                        disabled={!newLabTest}
                      >
                        <Plus className="w-4 h-4" /> Add to Lab Order
                      </button>
                    </div>

                    {/* Cart side */}
                    <div className="w-full xl:w-96 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col h-full max-h-[500px]">
                      
                      <div className="flex items-center gap-2 mb-4 shrink-0">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">AI Clinical Recommendation</span>
                      </div>
                      
                      {labOrders.length > 0 ? (
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg text-xs text-purple-800 dark:text-purple-300 mb-4 leading-relaxed shrink-0">
                          Based on diagnosis (Hypertension, T2DM), consider adding <strong>HbA1c</strong> and <strong>Lipid Profile</strong> to monitor metabolic control.
                        </div>
                      ) : (
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg text-xs text-purple-800 dark:text-purple-300 mb-4 leading-relaxed shrink-0">
                          Add tests to receive clinical recommendations and duplicate detection alerts.
                        </div>
                      )}

                      <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                        {labOrders.map(lab => (
                          <div key={lab.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm relative group">
                            <div className="flex justify-between items-start pr-6">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{lab.name}</h4>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${lab.priority === 'STAT' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                {lab.priority}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{lab.code} • Sample: {lab.sample}</p>
                            <button 
                              onClick={() => handleRemoveLab(lab.id)}
                              className="absolute right-2 top-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {labOrders.length === 0 && (
                          <div className="text-center text-sm text-slate-400 py-8">
                            No lab tests ordered yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'Imaging' && (
              <div className="pb-24">
                <Card title="Radiology & Imaging (RIS)">
                  <div className="flex flex-col xl:flex-row gap-6 mt-4">
                    {/* Form side */}
                    <div className="flex-1 space-y-4">
                      <div className="relative">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Study Name</label>
                        <div className="relative mt-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Search imaging study, CT, MRI..." 
                            className="w-full h-10 pl-9 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={newImaging}
                            onChange={(e) => {
                              setNewImaging(e.target.value);
                              setShowImagingSuggestions(true);
                            }}
                            onBlur={() => setTimeout(() => setShowImagingSuggestions(false), 200)}
                          />
                        </div>
                        {showImagingSuggestions && newImaging && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredImaging.length > 0 ? filteredImaging.map((study, idx) => (
                              <button 
                                key={idx} 
                                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                onClick={() => {
                                  setNewImaging(study);
                                  setShowImagingSuggestions(false);
                                }}
                              >
                                {study}
                              </button>
                            )) : (
                              <div className="px-4 py-2 text-sm text-slate-500">No suggestions found</div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Priority</label>
                          <select 
                            className="w-full h-10 px-3 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100"
                            value={imagingPriority}
                            onChange={(e) => setImagingPriority(e.target.value)}
                          >
                            <option>Routine</option>
                            <option>Urgent</option>
                            <option>STAT</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Clinical Indication</label>
                          <input 
                            type="text" 
                            placeholder="e.g. R/O Stroke" 
                            className="w-full h-10 px-3 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                         <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Past Imaging (DICOM Viewer)</h4>
                         <div className="bg-slate-950 rounded-xl overflow-hidden relative group h-64 border border-slate-800 flex flex-col cursor-pointer">
                            <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white font-mono z-10">CT HEAD [12 May 2026]</div>
                            <div className="absolute top-2 right-2 flex gap-2 z-10">
                              <button className="bg-black/60 p-1.5 rounded text-white hover:bg-blue-600 transition-colors"><Search className="w-3 h-3" /></button>
                              <button className="bg-black/60 p-1.5 rounded text-white hover:bg-blue-600 transition-colors"><Plus className="w-3 h-3" /></button>
                            </div>
                            <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 to-black">
                               {/* Mock DICOM Image / Brain Scan Placeholder */}
                               <div className="w-48 h-48 rounded-full border-4 border-slate-800 opacity-20 blur-sm absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                               <div className="w-32 h-40 rounded-[40%] border border-slate-600 opacity-40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]"></div>
                               <p className="text-slate-500 font-medium z-20 flex items-center gap-2 group-hover:scale-105 transition-transform"><Video className="w-5 h-5 text-blue-500" /> Open OHIF Viewer</p>
                            </div>
                         </div>
                      </div>

                      <button 
                        onClick={handleAddImaging}
                        className="w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 mt-4"
                        disabled={!newImaging}
                      >
                        <Plus className="w-4 h-4" /> Order Imaging Study
                      </button>
                    </div>

                    {/* Cart side */}
                    <div className="w-full xl:w-96 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col h-full max-h-[500px]">
                      
                      <div className="flex items-center gap-2 mb-4 shrink-0">
                        <Activity className="w-5 h-5 text-blue-500" />
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">AI Radiology Analysis</span>
                      </div>
                      
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-300 mb-4 leading-relaxed shrink-0">
                        <strong className="block mb-1">Previous CT Head Findings (12 May 2026):</strong>
                        No acute intracranial hemorrhage. Mild periventricular white matter disease. 
                        <a href="#" className="text-blue-600 dark:text-blue-400 font-semibold mt-1 block">View Structured Report →</a>
                      </div>

                      <div className="space-y-3 flex-1 overflow-y-auto pr-2 mt-2 border-t border-slate-200 dark:border-slate-700 pt-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Ordered Studies</h4>
                        {imagingOrders.map(img => (
                          <div key={img.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm relative group">
                            <div className="flex justify-between items-start pr-6">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{img.name}</h4>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${img.priority === 'STAT' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                {img.priority}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Modality: {img.modality} • Status: {img.status}</p>
                            <button 
                              onClick={() => handleRemoveImaging(img.id)}
                              className="absolute right-2 top-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {imagingOrders.length === 0 && (
                          <div className="text-center text-sm text-slate-400 py-8">
                            No imaging ordered yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'Documents' && (
              <div className="pb-24">
                <Card title="Document Management System (DMS)">
                  <div className="flex flex-col xl:flex-row gap-6 mt-4">
                    {/* Left: Upload and List */}
                    <div className="flex-1 space-y-6">
                      {/* Upload Zone */}
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors relative">
                        <input 
                          type="file" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                          onChange={simulateUpload}
                          disabled={isUploading}
                        />
                        {isUploading ? (
                          <>
                            <Activity className="w-8 h-8 text-blue-500 mb-3 animate-spin" />
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Uploading Document...</h4>
                            <div className="w-full max-w-xs bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-4">
                              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                          </>
                        ) : (
                          <>
                            <FileText className="w-8 h-8 text-slate-400 mb-3" />
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Drag & Drop files here</h4>
                            <p className="text-xs text-slate-500 mt-1">or click to browse from your computer</p>
                            <p className="text-[10px] text-slate-400 mt-4 uppercase font-semibold">Supports PDF, JPG, PNG, DICOM (Max 50MB)</p>
                          </>
                        )}
                      </div>

                      {/* Document List */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Patient Documents</h4>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                            <input type="text" placeholder="Search..." className="w-48 h-8 pl-8 pr-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          {documents.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer group">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                  <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{doc.name}</h5>
                                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">{doc.category}</span>
                                    <span>•</span>
                                    <span>{doc.date}</span>
                                    <span>•</span>
                                    <span>{doc.size}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"><Download className="w-4 h-4" /></button>
                                <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: AI OCR & Preview */}
                    <div className="w-full xl:w-[400px] flex flex-col h-full max-h-[700px] gap-6">
                      {/* Document Preview Placeholder */}
                      <div className="flex-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center relative overflow-hidden">
                         <div className="absolute top-2 right-2 flex gap-1">
                           <button className="bg-white/80 dark:bg-black/60 p-1.5 rounded shadow text-slate-600 hover:text-blue-600"><Search className="w-3 h-3" /></button>
                         </div>
                         <FileText className="w-16 h-16 text-slate-300 dark:text-slate-700" />
                         <span className="absolute bottom-4 text-xs font-semibold text-slate-400">Preview: Previous_Discharge_Summary.pdf</span>
                      </div>

                      {/* AI Extraction Panel */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shrink-0">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">AI Document Intelligence</span>
                          </div>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold uppercase rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> OCR Complete
                          </span>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Extracted Summary</h5>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-700">
                              Patient admitted on 05 May 2026 for acute exacerbation of Asthma. Treated with IV corticosteroids and bronchodilators. Discharged on 10 May 2026 in stable condition.
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                             <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                               <span className="block text-[10px] font-semibold text-slate-500 uppercase">Hospital</span>
                               <span className="text-xs font-medium text-slate-900 dark:text-slate-100">CityCare General</span>
                             </div>
                             <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                               <span className="block text-[10px] font-semibold text-slate-500 uppercase">Attending Dr.</span>
                               <span className="text-xs font-medium text-slate-900 dark:text-slate-100">Dr. M. Patel</span>
                             </div>
                             <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 col-span-2">
                               <span className="block text-[10px] font-semibold text-slate-500 uppercase">Extracted Medications</span>
                               <div className="flex flex-wrap gap-1 mt-1">
                                 <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-[10px] border border-blue-100 dark:border-blue-800">Budesonide Inhaler</span>
                                 <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-[10px] border border-blue-100 dark:border-blue-800">Prednisolone 20mg</span>
                               </div>
                             </div>
                          </div>

                          <button className="w-full py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
                            <Plus className="w-4 h-4" /> Import Data to EMR
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}



            {activeTab === 'Billing' && (
              <div className="pb-24">
                <Card title="Revenue Cycle Management (RCM)">
                  <div className="flex flex-col xl:flex-row gap-6 mt-4">
                    {/* Invoice & Charges */}
                    <div className="flex-1 space-y-6">
                      
                      {/* Active Encounter Invoice */}
                      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                         <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <div>
                               <h4 className="font-semibold text-slate-900 dark:text-slate-100">Encounter Invoice #INV-20260724</h4>
                               <p className="text-xs text-slate-500 mt-1">Generated: Today, 11:30 AM</p>
                            </div>
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs font-bold uppercase tracking-wide rounded-full">Payment Pending</span>
                         </div>
                         
                         <div className="p-0">
                            <table className="w-full text-sm text-left">
                               <thead className="bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-700">
                                 <tr>
                                   <th className="px-4 py-3">Charge Item</th>
                                   <th className="px-4 py-3">Code / Dept</th>
                                   <th className="px-4 py-3 text-right">Amount</th>
                                 </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                 <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                   <td className="px-4 py-3 font-medium">Cardiology Consultation</td>
                                   <td className="px-4 py-3 text-slate-500">CPT: 99214</td>
                                   <td className="px-4 py-3 text-right">₹1,500.00</td>
                                 </tr>
                                 <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20 bg-blue-50/30 dark:bg-blue-900/10">
                                   <td className="px-4 py-3">
                                     <div className="flex items-center gap-2">
                                       <Activity className="w-3 h-3 text-blue-500" /> Auto-Import: ECG 12-Lead
                                     </div>
                                   </td>
                                   <td className="px-4 py-3 text-slate-500">Imaging</td>
                                   <td className="px-4 py-3 text-right">₹800.00</td>
                                 </tr>
                                 <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/20 bg-blue-50/30 dark:bg-blue-900/10">
                                   <td className="px-4 py-3">
                                     <div className="flex items-center gap-2">
                                       <FileText className="w-3 h-3 text-blue-500" /> Auto-Import: Lipid Profile
                                     </div>
                                   </td>
                                   <td className="px-4 py-3 text-slate-500">Laboratory</td>
                                   <td className="px-4 py-3 text-right">₹1,200.00</td>
                                 </tr>
                               </tbody>
                            </table>
                         </div>
                         
                         <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-2 text-sm">
                              <span className="text-slate-500">Subtotal</span>
                              <span className="font-medium text-slate-900 dark:text-slate-100">₹3,500.00</span>
                            </div>
                            <div className="flex justify-between items-center mb-4 text-sm text-green-600 dark:text-green-400">
                              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Insurance Coverage (HDFC Ergo)</span>
                              <span className="font-medium">- ₹2,000.00</span>
                            </div>
                            <div className="flex justify-between items-center text-lg font-bold text-slate-900 dark:text-white pt-4 border-t border-slate-200 dark:border-slate-700">
                              <span>Patient Payable (Total)</span>
                              <span>₹1,500.00</span>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex gap-4">
                         <button className="flex-1 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                           <Printer className="w-4 h-4" /> Print Invoice
                         </button>
                         <button className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors">
                           Collect Payment (₹1,500)
                         </button>
                      </div>

                    </div>

                    {/* Right: RCM Analytics & Insurance */}
                    <div className="w-full xl:w-[400px] flex flex-col gap-6">
                      
                      {/* Medical Coding Panel */}
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">AI Medical Coder</h4>
                        </div>
                        <p className="text-xs text-indigo-800 dark:text-indigo-300 mb-4">AI has analyzed the consultation and generated the following billing codes. Review before submitting claim.</p>
                        
                        <div className="space-y-2 mb-4">
                           <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-indigo-100 dark:border-indigo-800 flex justify-between items-center shadow-sm">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">ICD-10 (Diagnosis)</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">I20.9 - Angina pectoris</span>
                              </div>
                              <CheckCircle className="w-5 h-5 text-green-500" />
                           </div>
                           <div className="bg-white dark:bg-slate-900 p-2.5 rounded border border-indigo-100 dark:border-indigo-800 flex justify-between items-center shadow-sm">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">CPT (Procedure)</span>
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">93000 - Electrocardiogram</span>
                              </div>
                              <CheckCircle className="w-5 h-5 text-green-500" />
                           </div>
                        </div>
                        <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors">
                           Approve & Submit Claim
                        </button>
                      </div>

                      {/* Insurance Tracker */}
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Insurance Claims Status</h4>
                        
                        <div className="relative pl-6 pb-4 border-l-2 border-green-500 last:border-0 last:pb-0 ml-2 mt-2">
                          <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-green-500 border-4 border-white dark:border-slate-900"></div>
                          <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Eligibility Verified</h5>
                          <p className="text-xs text-slate-500 mt-1">HDFC Ergo • Pre-auth approved</p>
                        </div>
                        <div className="relative pl-6 pb-4 border-l-2 border-slate-200 dark:border-slate-700 last:border-0 last:pb-0 ml-2">
                          <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white dark:border-slate-900"></div>
                          <h5 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Claim Drafted</h5>
                          <p className="text-xs text-slate-500 mt-1">Awaiting final diagnosis codes</p>
                        </div>
                        <div className="relative pl-6 border-l-2 border-transparent ml-2">
                          <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 border-4 border-white dark:border-slate-900"></div>
                          <h5 className="text-sm font-semibold text-slate-400">Claim Submitted</h5>
                        </div>

                      </div>

                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab !== 'Overview' && activeTab !== 'Timeline' && activeTab !== 'Medications' && activeTab !== 'Lab Orders' && activeTab !== 'Imaging' && activeTab !== 'Documents' && activeTab !== 'Billing' && (
              <div className="pb-24">
                <Card title={`${activeTab} Module`} actionable>
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <Activity className="w-12 h-12 text-slate-300 mb-4" />
                    <p>The {activeTab.toLowerCase()} component will be rendered here dynamically via React state.</p>
                  </div>
                </Card>
              </div>
            )}
          </main>

          {/* 4. RIGHT SIDEBAR (PATIENT SUMMARY) */}
          <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-y-auto hidden xl:block p-5">
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Patient Summary</h3>
              <button className="text-blue-600 text-sm font-medium hover:underline">Edit</button>
            </div>

            <div className="space-y-4 text-sm mb-8">
              <SummaryRow label="Blood Group" value="O+" />
              <SummaryRow label="Height" value="172 cm" />
              <SummaryRow label="Weight" value="72 kg" />
              <SummaryRow label="BMI" value="24.3 kg/m²" />
              <SummaryRow label="Insurance" value="HDFC Ergo (Gold)" />
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Allergies</h3>
                <button className="text-blue-600 text-xs font-medium hover:underline">+ Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium rounded-full border border-red-100 dark:border-red-800 flex items-center gap-1">
                  Penicillin <button><Plus className="w-3 h-3 rotate-45" /></button>
                </span>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Chronic Conditions</h3>
                <button className="text-blue-600 text-xs font-medium hover:underline">+ Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-100 dark:border-blue-800">
                  Hypertension
                </span>
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full border border-blue-100 dark:border-blue-800">
                  Type 2 Diabetes
                </span>
              </div>
            </div>

             <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <Pill className="w-4 h-4" /> Prescription
                </button>
                <button className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <Activity className="w-4 h-4" /> Order Lab
                </button>
              </div>
            </div>

          </aside>

        </div>
        
        {/* BOTTOM ACTION BAR */}
        <div className="h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-10 shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" /> Add Note
            </button>
            <button onClick={toggleCopilot} className={`px-4 py-2 border text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${showCopilot ? 'border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-inner' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
              <Sparkles className="w-4 h-4" /> AI Copilot
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium rounded-lg transition-colors">
              Save Draft
            </button>
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-sm">
              Save & Sign
            </button>
          </div>
        </div>

      {/* AI COPILOT SIDEBAR */}
          {showCopilot && (
            <aside className="w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-2xl z-20 shrink-0">
               {/* Copilot Header */}
               <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 shrink-0">
                 <div className="flex items-center gap-2">
                   <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                   <h3 className="font-bold text-slate-900 dark:text-slate-100">AI Clinical Copilot</h3>
                 </div>
                 <button onClick={toggleCopilot} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
               </div>
               
               {/* Copilot Content */}
               <div className="flex-1 overflow-y-auto p-4 space-y-6">
                 {/* Live Scribe / Recording */}
                 <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1"><Mic className="w-3 h-3"/> Live Scribe</span>
                     <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                     </span>
                   </div>
                   <p className="text-sm text-slate-700 dark:text-slate-300 italic mb-4">"Patient complains of chest pain since 2 days, worse on exertion..."</p>
                   <button onClick={handleInsertAI} className="w-full py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
                     <Plus className="w-3 h-3" /> Insert SOAP Note
                   </button>
                 </div>

                 {/* AI Insights & Diagnostics */}
                 <div className="space-y-3">
                   <h4 className="text-xs font-semibold text-slate-500 uppercase">Clinical Insights</h4>
                   
                   <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm">
                     <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold mb-1">
                       <AlertTriangle className="w-4 h-4" /> Potential Ischemia
                     </div>
                     <p className="text-red-600 dark:text-red-300 text-xs">Symptoms (chest pain on exertion) + Hx (T2DM, HTN) suggest CAD. Consider ECG & Troponin.</p>
                   </div>
                   
                   <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                     <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold mb-1">
                       <FileText className="w-4 h-4" /> Coding Suggestion
                     </div>
                     <p className="text-blue-600 dark:text-blue-300 text-xs mb-2">ICD-10: I20.9 (Angina pectoris, unspecified)</p>
                     <button className="px-2 py-1 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700 rounded text-xs font-medium text-blue-600 dark:text-blue-400 shadow-sm hover:bg-blue-50 dark:hover:bg-blue-900/30">Apply Code</button>
                   </div>
                 </div>
               </div>

               {/* Chat Input */}
               <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
                 <div className="relative">
                   <input type="text" placeholder="Ask Copilot for differentials..." className="w-full h-10 pl-4 pr-10 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
                   <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"><Search className="w-3 h-3" /></button>
                 </div>
               </div>
            </aside>
          )}
    </DashboardLayout>
  );
}

/* Subcomponents for cleaner code */

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-all ${active ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 font-medium'}`}>
      <div className={`w-5 h-5 mr-3 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
        {icon}
      </div>
      <span className="text-sm">{label}</span>
    </button>
  );
}

function ActionBtn({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="p-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors shadow-sm bg-white dark:bg-slate-900">
      <div className="w-4 h-4">{icon}</div>
    </button>
  );
}

function Tab({ label, active = false, onClick }: { label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`pb-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${active ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'}`}>
      {label}
    </button>
  );
}

function Card({ title, children, actionable = false }: { title: string, children: React.ReactNode, actionable?: boolean }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        {actionable && <button className="text-slate-400 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button>}
      </div>
      {children}
    </div>
  );
}

function EditableCard({ title, value, onChange }: { title: string, value: string, onChange: (val: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative group">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <button onClick={() => setIsEditing(!isEditing)} className="text-slate-400 hover:text-blue-600 transition-colors">
           {isEditing ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Edit2 className="w-4 h-4" />}
        </button>
      </div>
      {isEditing ? (
        <textarea 
          className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      ) : (
        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line cursor-text" onClick={() => setIsEditing(true)}>
          {value || <span className="text-slate-400 italic">Click to add {title.toLowerCase()}...</span>}
        </div>
      )}
    </div>
  );
}

function VitalItem({ icon, label, value, unit }: { icon: React.ReactNode, label: string, value: string, unit: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
      <div className="mb-2">{icon}</div>
      <div className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">{value}</div>
      <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">{label} ({unit})</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  );
}
