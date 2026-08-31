'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Bell, MessageSquare, Calendar, Mic, Moon, Sun, 
  Activity, Users, FileText, Pill, FileHeart, Stethoscope, 
  Video, Phone, MessageCircle, Printer, Share, Download, 
  Plus, Edit2, ChevronLeft, ChevronRight, Settings, LogOut,
  ChevronDown, HeartPulse, AlertTriangle, Trash2, Sparkles, CheckCircle, X,
  Building, UserCheck, QrCode, Check, Globe, Send, RefreshCw, Languages
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import useDashboardStore from '@/store/dashboardStore';
import { 
  SUPPORTED_LANGUAGES, 
  DisplayMode, 
  translateMedicalText, 
  getUILabel, 
  translationCache 
} from '@/services/prescriptionTranslationService';
import { LanguageSelector } from '@/components/LanguageSelector';
import { DispatchRxModal } from '@/components/DispatchRxModal';
import { ALL_SPECIALTIES, Specialty } from '@/services/specialtyService';
import { SpecialtySelectorModal } from '@/components/specialty/SpecialtySelectorModal';
import { PediatricsWidget } from '@/components/specialty/PediatricsWidget';
import { CardiologyWidget } from '@/components/specialty/CardiologyWidget';
import { DiabetologyWidget } from '@/components/specialty/DiabetologyWidget';
import { ObGynWidget } from '@/components/specialty/ObGynWidget';
import { OrthopedicsWidget } from '@/components/specialty/OrthopedicsWidget';
import { NeurologyWidget } from '@/components/specialty/NeurologyWidget';
import { PsychiatryWidget } from '@/components/specialty/PsychiatryWidget';
import { IcuEmergencyWidget } from '@/components/specialty/IcuEmergencyWidget';
import { SpecialtyAiCopilot } from '@/components/specialty/SpecialtyAiCopilot';

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

  // Systemic Physical Examination State
  const [examGeneral, setExamGeneral] = useState('Patient is conscious, cooperative, well-oriented. No pallor, icterus, cyanosis, clubbing, lymphadenopathy, or peripheral edema.');
  const [examCvs, setExamCvs] = useState('S1 S2 heard normal. No murmurs, gallops, or friction rubs. JVP normal.');
  const [examRs, setExamRs] = useState('Bilateral air entry equal. Normal vesicular breath sounds. No ronchi, wheeze, or crepitations.');
  const [examAbdomen, setExamAbdomen] = useState('Soft, non-tender. Normal bowel sounds. No organomegaly or palpable masses.');
  const [examCns, setExamCns] = useState('Conscious, oriented to time, place, & person. GCS 15/15. Motor strength 5/5 in all extremities. No focal sensory deficit.');

  // Procedure State
  const [procedures, setProcedures] = useState([
    { id: '1', name: '12-Lead Diagnostic Electrocardiogram (ECG)', date: 'Today, 10:15 AM', doctor: 'Dr. Raj Sharma', notes: 'Normal sinus rhythm, HR 82 bpm. ST-T wave changes within normal limits.', status: 'Completed' }
  ]);
  const [newProcedure, setNewProcedure] = useState({ name: '', notes: '', doctor: 'Dr. Raj Sharma' });

  // Add Note Modal & Custom Clinical Notes
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('Clinical Progress Note');
  const [noteContent, setNoteContent] = useState('');
  const [clinicalNotesList, setClinicalNotesList] = useState([
    { id: '1', title: 'Initial Triage Note', content: 'Patient arrived with BP 128/84, HR 82 bpm. SpO2 98% on room air. Complained of chest tightness.', author: 'Nurse Desk', date: 'Today, 09:30 AM' }
  ]);

  // Prescription Print Modal & Customization Settings State
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [rxSettings, setRxSettings] = useState({
    hospitalName: 'CareConnect Super Specialty Hospital',
    tagline: 'Center for Advanced Cardiovascular & Medical Sciences',
    address: 'Plot 42, Health City, Electronic City Ph-1, Bangalore - 560100',
    phone: '+91 (080) 4567-8900 / Emergency: 108',
    email: 'rx@careconnect.health',
    regNo: 'NABH Accr. Reg No: HMC-2024-8849',
    doctorName: 'Dr. Raj Sharma',
    doctorTitle: 'Senior Consultant Cardiologist',
    doctorRegNo: 'KMC Reg No: 54932',
    headerStyle: 'modern' as 'classic' | 'modern' | 'centered',
    primaryColor: 'indigo' as 'indigo' | 'emerald' | 'blue' | 'slate',
    paperSize: 'A4' as 'A4' | 'A5' | 'Letter',
    showVitals: true,
    showDiagnosis: true,
    showLabOrders: true,
    showDigitalSignature: true,
    showQrCode: true,
    showFooter: true,
    footerTerms: '1. Valid for 15 days from date of issue.\n2. Do not substitute medications without physician consultation.\n3. In emergency, report to ER or call 108.'
  });

  // Smart Specialty-Based EMR State (27 Specialties)
  const [activeSpecialty, setActiveSpecialty] = useState<Specialty>(ALL_SPECIALTIES[0]);
  const [isSpecialtyModalOpen, setIsSpecialtyModalOpen] = useState<boolean>(false);

  // Multi-Language Prescription State
  const [preferredLanguage, setPreferredLanguage] = useState<string>('te'); // Default: Telugu
  const [displayMode, setDisplayMode] = useState<DisplayMode>('bilingual'); // 'english' | 'translated' | 'bilingual'
  const [showDispatchModal, setShowDispatchModal] = useState<boolean>(false);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);
  const [translationVersion, setTranslationVersion] = useState<number>(1);

  const handlePrintRx = () => {
    const printContent = document.getElementById('printable-rx-area');
    if (!printContent) {
      window.print();
      return;
    }
    
    const printWindow = window.open('', '_blank', 'width=850,height=1100');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Prescription - ${rxSettings.hospitalName}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page { size: A4; margin: 10mm; }
              body { font-family: system-ui, -apple-system, sans-serif; background: white; color: black; padding: 0; margin: 0; }
              table { width: 100%; border-collapse: collapse; }
            </style>
          </head>
          <body class="bg-white text-slate-900 p-6">
            <div style="width: 100%; max-width: 760px; margin: 0 auto;">
              ${printContent.innerHTML}
            </div>
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 400);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      window.print();
    }
  };

  // Autosave simulation
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1500);
    return () => clearTimeout(timer);
  }, [chiefComplaint, hpi, examination, assessment, plan, pastHistory, examGeneral, examCvs, examRs, examAbdomen, examCns]);

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
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950">
        
        {/* TOP MAIN ROW: EMR CANVAS + PATIENT SUMMARY SIDEBAR + AI COPILOT */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* CENTER MAIN EMR CANVAS */}
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

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-xl shadow-2xs">
                  <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">Rx Lang:</span>
                  <LanguageSelector
                    selectedLanguage={preferredLanguage}
                    onSelectLanguage={setPreferredLanguage}
                    compact
                  />
                </div>
                <ActionBtn icon={<Video />} />
                <ActionBtn icon={<MessageCircle />} />
                <button 
                  onClick={() => setShowPrescriptionModal(true)}
                  title="Print Prescription (Rx)"
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-xs"
                >
                  <Printer className="w-4 h-4 text-indigo-600" /> Preview Rx
                </button>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm">
                  <Plus className="w-4 h-4" /> New Consultation
                </button>
              </div>
            </div>

            {/* SMART SPECIALTY EMR WORKSPACE BAR */}
            <div className="mb-6 p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-lg border border-indigo-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-md">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black tracking-wide text-white">
                      {activeSpecialty.name} EMR Workspace
                    </h3>
                    <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black rounded-md uppercase">
                      {activeSpecialty.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {activeSpecialty.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setIsSpecialtyModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl flex items-center gap-2 transition-all shadow-md hover:scale-105"
                >
                  <RefreshCw className="w-4 h-4" /> Switch Specialty (27 Available)
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
              <div className="space-y-6 pb-6">
                {/* DYNAMIC SPECIALTY WIDGET BASED ON ACTIVE SPECIALTY */}
                {activeSpecialty.id === 'pediatrics' && <PediatricsWidget />}
                {activeSpecialty.id === 'cardiology' && <CardiologyWidget />}
                {activeSpecialty.id === 'diabetology' && <DiabetologyWidget />}
                {activeSpecialty.id === 'obgyn' && <ObGynWidget />}
                {activeSpecialty.id === 'orthopedics' && <OrthopedicsWidget />}
                {activeSpecialty.id === 'neurology' && <NeurologyWidget />}
                {activeSpecialty.id === 'psychiatry' && <PsychiatryWidget />}
                {(activeSpecialty.id === 'icu' || activeSpecialty.id === 'emergency-medicine') && <IcuEmergencyWidget />}

                {/* SPECIALTY AI COPILOT CARD */}
                <SpecialtyAiCopilot specialty={activeSpecialty} />

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  
                  {/* Left Column of Main Workspace */}
                  <div className="space-y-6">
                    <EditableCard 
                      title="Chief Complaint" 
                      value={chiefComplaint} 
                      onChange={setChiefComplaint} 
                      templates={['Chest pain x 2d', 'Shortness of breath on exertion', 'Acute fatigue & dizziness', 'Fever & dry cough']}
                    />
                    <EditableCard 
                      title="History of Present Illness (HPI)" 
                      value={hpi} 
                      onChange={setHpi} 
                      templates={['Worse on exertion', 'Relieved by rest', 'No syncope/palpitations', 'Associated with diaphoresis']}
                    />
                    <EditableCard 
                      title="Past Medical History" 
                      value={pastHistory} 
                      onChange={setPastHistory} 
                      templates={['Hypertension (2 yrs)', 'Type 2 Diabetes Mellitus', 'No Prior Surgeries', 'NKDA (No Known Drug Allergies)']}
                    />
                  </div>

                  {/* Right Column of Main Workspace */}
                  <div className="space-y-6">
                    {/* Vital Signs */}
                    <Card title="Vital Signs Summary" actionable>
                      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                        <VitalItem icon={<Activity className="text-red-500 w-4 h-4" />} label="BP" value="128/84" unit="mmHg" />
                        <VitalItem icon={<HeartPulse className="text-rose-500 w-4 h-4" />} label="Pulse" value="82" unit="bpm" />
                        <VitalItem icon={<Activity className="text-blue-500 w-4 h-4" />} label="SpO2" value="98" unit="%" />
                        <VitalItem icon={<Activity className="text-amber-500 w-4 h-4" />} label="Temp" value="98.6" unit="°F" />
                        <VitalItem icon={<Activity className="text-indigo-500 w-4 h-4" />} label="Weight" value="72" unit="kg" />
                        <VitalItem icon={<Activity className="text-emerald-500 w-4 h-4" />} label="BMI" value="24.3" unit="kg/m²" />
                      </div>
                    </Card>

                    <EditableCard 
                      title="Clinical Examination (SOAP)" 
                      value={examination} 
                      onChange={setExamination} 
                      templates={['S1 S2 normal, no murmurs', 'Bilateral air entry equal', 'Abdomen soft, non-tender', 'CNS conscious & oriented']}
                    />
                    <EditableCard 
                      title="Assessment & Diagnosis" 
                      value={assessment} 
                      onChange={setAssessment} 
                      templates={['Atypical Chest Pain - r/o CAD', 'Essential Hypertension', 'Type 2 Diabetes Control', 'Upper Respiratory Infection']}
                    />
                    <EditableCard 
                      title="Treatment Plan" 
                      value={plan} 
                      onChange={setPlan} 
                      templates={['Order 12-Lead ECG & Troponin', 'Prescribe Antihypertensives', 'Lab Panel (CBC, Lipid, HbA1c)', 'Review in 3 Days']}
                    />
                  </div>
                </div>

                {/* Appended Clinical Notes Log */}
                {clinicalNotesList.length > 0 && (
                  <Card title="Appended Clinical Progress Notes & Addendums">
                    <div className="space-y-3 mt-3">
                      {clinicalNotesList.map((note) => (
                        <div key={note.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl relative">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{note.title}</h4>
                            <span className="text-[11px] text-slate-400 font-medium">{note.author} • {note.date}</span>
                          </div>
                          <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
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
              <div className="pb-24 space-y-4">
                
                {/* MULTI-LANGUAGE PRESCRIPTION BAR */}
                <div className="p-4 bg-gradient-to-r from-indigo-50/90 via-blue-50/60 to-slate-50 dark:from-indigo-950/50 dark:via-blue-950/40 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xs">
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                      <Languages className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                          Patient Preferred Prescription Language
                        </h4>
                        <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold rounded-full">
                          13 Major Indian Languages
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Preserves English generic names & dosages while translating patient instructions.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Language Selector */}
                    <div className="w-48">
                      <LanguageSelector
                        selectedLanguage={preferredLanguage}
                        onSelectLanguage={setPreferredLanguage}
                        compact
                      />
                    </div>

                    {/* Display Mode Switcher */}
                    <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setDisplayMode('bilingual')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          displayMode === 'bilingual'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        🌐 Bilingual
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisplayMode('translated')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          displayMode === 'translated'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        💬 Native Only
                      </button>
                      <button
                        type="button"
                        onClick={() => setDisplayMode('english')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          displayMode === 'english'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        🇬🇧 English
                      </button>
                    </div>

                    {/* Send via WhatsApp / Email Button */}
                    <button
                      type="button"
                      onClick={() => setShowDispatchModal(true)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" /> Send Rx
                    </button>
                  </div>

                </div>

                {dispatchSuccessMsg && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    {dispatchSuccessMsg}
                  </div>
                )}

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

                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mt-2 shrink-0">
                        <button
                          onClick={() => setShowPrescriptionModal(true)}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                          <Printer className="w-4 h-4" /> Preview & Print Rx Document
                        </button>
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

            {activeTab === 'Examination' && (
              <div className="pb-6 space-y-6">
                <Card title="Systematic Physical Examination Writer">
                  <div className="mt-4 space-y-6">
                    
                    {/* Quick Actions Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                      <div>
                        <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wide">Systemic Physical Assessment</h4>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">Perform organ-system evaluation and record physical exam findings.</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => {
                            setExamGeneral('Patient is conscious, cooperative, well-oriented. No pallor, icterus, cyanosis, clubbing, lymphadenopathy, or peripheral edema.');
                            setExamCvs('S1 S2 heard normal. No murmurs, gallops, or friction rubs. JVP normal.');
                            setExamRs('Bilateral air entry equal. Normal vesicular breath sounds. No ronchi, wheeze, or crepitations.');
                            setExamAbdomen('Soft, non-tender. Normal bowel sounds. No organomegaly or palpable masses.');
                            setExamCns('Conscious, oriented to time, place, & person. GCS 15/15. Motor strength 5/5 in all extremities. No focal sensory deficit.');
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                        >
                          ✓ Mark All Systems Normal
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            const combined = `GENERAL: ${examGeneral}\nCVS: ${examCvs}\nRS: ${examRs}\nP/A: ${examAbdomen}\nCNS: ${examCns}`;
                            setExamination(combined);
                            setActiveTab('Overview');
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                        >
                          Sync to Overview SOAP
                        </button>
                      </div>
                    </div>

                    {/* Systemic Exam Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <EditableCard 
                        title="General Physical Examination (PICLE)" 
                        value={examGeneral} 
                        onChange={setExamGeneral} 
                        templates={['No Pallor / Icterus / Cyanosis', 'Mild Ankle Edema', 'Lymphadenopathy Absent', 'Normal Hydration Status']}
                      />
                      <EditableCard 
                        title="Cardiovascular System (CVS)" 
                        value={examCvs} 
                        onChange={setExamCvs} 
                        templates={['S1 S2 Normal', 'No Murmurs', 'Systolic Murmur at Apex', 'Normal JVP']}
                      />
                      <EditableCard 
                        title="Respiratory System (RS)" 
                        value={examRs} 
                        onChange={setExamRs} 
                        templates={['Bilateral Air Entry Equal', 'Clear Vesicular Breath Sounds', 'End-Expiratory Wheeze Present', 'Bilateral Basal Crepitations']}
                      />
                      <EditableCard 
                        title="Gastrointestinal & Abdomen (P/A)" 
                        value={examAbdomen} 
                        onChange={setExamAbdomen} 
                        templates={['Soft, Non-Tender', 'Mild Epigastric Tenderness', 'No Hepatosplenomegaly', 'Normal Bowel Sounds']}
                      />
                      <EditableCard 
                        title="Central Nervous System (CNS)" 
                        value={examCns} 
                        onChange={setExamCns} 
                        templates={['Conscious & Oriented', 'GCS 15/15', 'No Focal Neurological Deficit', 'Pupils Equal & Reactive to Light']}
                      />
                    </div>

                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'Procedures' && (
              <div className="pb-6 space-y-6">
                <Card title="Clinical Procedures & Bedside Intervention Log">
                  <div className="mt-4 space-y-6">
                    
                    {/* Log New Procedure Form */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Record New Procedure / Minor Intervention</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Procedure Name</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Bedside ECG / Central Line / Wound Dressing" 
                            className="w-full h-10 px-3 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" 
                            value={newProcedure.name}
                            onChange={(e) => setNewProcedure({...newProcedure, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Performing Physician</label>
                          <input 
                            type="text" 
                            className="w-full h-10 px-3 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" 
                            value={newProcedure.doctor}
                            onChange={(e) => setNewProcedure({...newProcedure, doctor: e.target.value})}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Procedure Notes & Findings</label>
                        <textarea 
                          placeholder="Record procedure details, sterile precautions taken, and patient status post-procedure..." 
                          className="w-full h-24 p-3 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none" 
                          value={newProcedure.notes}
                          onChange={(e) => setNewProcedure({...newProcedure, notes: e.target.value})}
                        />
                      </div>

                      <button 
                        type="button"
                        disabled={!newProcedure.name}
                        onClick={() => {
                          if (!newProcedure.name) return;
                          setProcedures([
                            {
                              id: Date.now().toString(),
                              name: newProcedure.name,
                              date: 'Just Now',
                              doctor: newProcedure.doctor,
                              notes: newProcedure.notes || 'Procedure completed under aseptic precautions without complications.',
                              status: 'Completed'
                            },
                            ...procedures
                          ]);
                          setNewProcedure({ name: '', notes: '', doctor: 'Dr. Raj Sharma' });
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Save Procedure Note
                      </button>
                    </div>

                    {/* Existing Procedure Log */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed Patient Procedures</h4>
                      {procedures.map((proc) => (
                        <div key={proc.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100">{proc.name}</h5>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold uppercase rounded-full">{proc.status}</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300">{proc.notes}</p>
                            <div className="text-[11px] text-slate-400 font-medium">Performed by {proc.doctor} • {proc.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                </Card>
              </div>
            )}

            {activeTab !== 'Overview' && activeTab !== 'Timeline' && activeTab !== 'Examination' && activeTab !== 'Lab Orders' && activeTab !== 'Imaging' && activeTab !== 'Medications' && activeTab !== 'Procedures' && activeTab !== 'Documents' && activeTab !== 'Billing' && (
              <div className="pb-6">
                <Card title={`${activeTab} Clinical Notes`}>
                  <div className="p-4 space-y-4">
                    <p className="text-xs text-slate-500">Enter custom clinical notes or progress reports for {activeTab}.</p>
                    <textarea 
                      rows={6}
                      placeholder={`Type clinical details for ${activeTab}...`}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button 
                      onClick={() => alert(`Saved clinical note for ${activeTab}`)}
                      className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      Save {activeTab} Note
                    </button>
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

          {/* AI COPILOT SIDEBAR */}
          {showCopilot && (
            <aside className="w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col h-full shadow-2xl z-20 shrink-0">
               {/* Copilot Header */}
               <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 shrink-0">
                 <div className="flex items-center gap-2">
                   <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                   <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">AI Clinical Copilot</h3>
                 </div>
                 <button onClick={toggleCopilot} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"><X className="w-4 h-4" /></button>
               </div>
               
               {/* Copilot Content */}
               <div className="flex-1 overflow-y-auto p-4 space-y-6">
                 {/* Live Scribe / Recording */}
                 <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Mic className="w-3 h-3"/> Live Scribe</span>
                     <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                     </span>
                   </div>
                   <p className="text-xs text-slate-700 dark:text-slate-300 italic mb-4">"Patient complains of chest pain since 2 days, worse on exertion..."</p>
                   <button onClick={handleInsertAI} className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
                     <Plus className="w-3 h-3" /> Insert SOAP Note
                   </button>
                 </div>

                 {/* AI Insights & Diagnostics */}
                 <div className="space-y-3">
                   <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clinical Insights</h4>
                   
                   <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs">
                     <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold mb-1">
                       <AlertTriangle className="w-4 h-4" /> Potential Ischemia
                     </div>
                     <p className="text-red-600 dark:text-red-300 text-xs">Symptoms (chest pain on exertion) + Hx (T2DM, HTN) suggest CAD. Consider ECG & Troponin.</p>
                   </div>
                   
                   <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs">
                     <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold mb-1">
                       <FileText className="w-4 h-4" /> Coding Suggestion
                     </div>
                     <p className="text-indigo-600 dark:text-indigo-300 text-xs mb-2">ICD-10: I20.9 (Angina pectoris, unspecified)</p>
                     <button className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-700 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-xs hover:bg-indigo-50">Apply Code</button>
                   </div>
                 </div>
               </div>

               {/* Chat Input */}
               <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
                 <div className="relative">
                   <input type="text" placeholder="Ask Copilot for differentials..." className="w-full h-10 pl-4 pr-10 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-full text-xs focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs" />
                   <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"><Search className="w-3 h-3" /></button>
                 </div>
               </div>
            </aside>
          )}

        </div>
        
        {/* BOTTOM ACTION BAR */}
        <div className="h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 z-10 shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAddNoteModal(true)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl flex items-center gap-2 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 text-indigo-600" /> Add Note
            </button>
            <button onClick={toggleCopilot} className={`px-4 py-2 border text-xs font-bold rounded-xl flex items-center gap-2 transition-colors ${showCopilot ? 'border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-inner' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
              <Sparkles className="w-4 h-4 text-purple-500" /> AI Copilot
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 rounded-xl transition-colors">
              Save Draft
            </button>
            <button 
              onClick={() => {
                setSaveStatus('saving');
                setTimeout(() => setSaveStatus('saved'), 1000);
              }}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-md"
            >
              <CheckCircle className="w-4 h-4" /> Save & Sign
            </button>
          </div>
        </div>

      </div>

      {/* ADD CLINICAL NOTE MODAL */}
      {showAddNoteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" /> Add Clinical Progress Note
              </h3>
              <button onClick={() => setShowAddNoteModal(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Note Type / Title</label>
                <select 
                  className="w-full h-10 px-3 mt-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                >
                  <option>Clinical Progress Note</option>
                  <option>Nursing Shift Note</option>
                  <option>Consultation Addendum</option>
                  <option>Operative Bedside Note</option>
                  <option>Discharge Planning Note</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Clinical Observations / Note Text</label>
                <textarea 
                  rows={5}
                  placeholder="Type clinical progress notes, patient complaints, bedside observations, or treatment changes..."
                  className="w-full p-3 mt-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowAddNoteModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                disabled={!noteContent.trim()}
                onClick={() => {
                  if (!noteContent.trim()) return;
                  setClinicalNotesList([
                    { id: Date.now().toString(), title: noteTitle, content: noteContent, author: 'Dr. Raj Sharma', date: 'Just Now' },
                    ...clinicalNotesList
                  ]);
                  setNoteContent('');
                  setShowAddNoteModal(false);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Save & Append to Chart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRESCRIPTION PREVIEW & PRINT CUSTOMIZER MODAL */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
          
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body, html {
                background: white !important;
                color: black !important;
              }
              .rx-no-print, nav, header, aside, .no-print {
                display: none !important;
              }
              #printable-rx-area {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                margin: 0 !important;
                padding: 12mm !important;
                background: white !important;
                color: black !important;
                box-shadow: none !important;
                border: none !important;
                z-index: 999999 !important;
              }
              #printable-rx-area * {
                visibility: visible !important;
              }
            }
          `}} />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:h-auto">
            
            {/* Top Bar */}
            <div className="rx-no-print px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Prescription Preview & Print Settings</h3>
                  <p className="text-xs text-slate-500">Configure clinic header/footer branding and print-ready Rx documents.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={handlePrintRx}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-md"
                >
                  <Printer className="w-4 h-4" /> Print / Export PDF
                </button>
                <button 
                  onClick={() => setShowPrescriptionModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Split Content */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden print:overflow-visible">
              
              {/* Left Settings Panel */}
              <div className="rx-no-print w-full lg:w-96 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-5 space-y-6 shrink-0">
                
                {/* Hospital Branding */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                    <Building className="w-4 h-4" /> Hospital / Clinic Branding
                  </h4>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase">Hospital / Clinic Name</label>
                    <input 
                      type="text" 
                      className="w-full h-9 px-3 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={rxSettings.hospitalName}
                      onChange={(e) => setRxSettings({...rxSettings, hospitalName: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase">Tagline / Subtitle</label>
                    <input 
                      type="text" 
                      className="w-full h-9 px-3 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={rxSettings.tagline}
                      onChange={(e) => setRxSettings({...rxSettings, tagline: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase">Clinic Address</label>
                    <input 
                      type="text" 
                      className="w-full h-9 px-3 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={rxSettings.address}
                      onChange={(e) => setRxSettings({...rxSettings, address: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase">Contact Phone</label>
                      <input 
                        type="text" 
                        className="w-full h-9 px-3 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={rxSettings.phone}
                        onChange={(e) => setRxSettings({...rxSettings, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase">Hospital Reg No</label>
                      <input 
                        type="text" 
                        className="w-full h-9 px-3 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={rxSettings.regNo}
                        onChange={(e) => setRxSettings({...rxSettings, regNo: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Doctor Info */}
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" /> Physician Credentials
                  </h4>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase">Doctor Name</label>
                    <input 
                      type="text" 
                      className="w-full h-9 px-3 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={rxSettings.doctorName}
                      onChange={(e) => setRxSettings({...rxSettings, doctorName: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase">Specialization</label>
                      <input 
                        type="text" 
                        className="w-full h-9 px-3 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={rxSettings.doctorTitle}
                        onChange={(e) => setRxSettings({...rxSettings, doctorTitle: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase">Medical Reg No</label>
                      <input 
                        type="text" 
                        className="w-full h-9 px-3 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none" 
                        value={rxSettings.doctorRegNo}
                        onChange={(e) => setRxSettings({...rxSettings, doctorRegNo: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Multi-Language Prescription Controls */}
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Patient Prescription Language
                  </h4>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase">Preferred Language</label>
                    <LanguageSelector
                      selectedLanguage={preferredLanguage}
                      onSelectLanguage={setPreferredLanguage}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase">Display & Print Mode</label>
                    <div className="grid grid-cols-3 gap-1.5 mt-1">
                      {(['bilingual', 'translated', 'english'] as const).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setDisplayMode(mode)}
                          className={`py-1.5 px-2 text-[10px] font-bold rounded-lg capitalize border transition-all ${
                            displayMode === mode
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-white'
                          }`}
                        >
                          {mode === 'bilingual' ? '🌐 Dual' : mode === 'translated' ? '💬 Native' : '🇬🇧 English'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Print & Layout Toggles */}
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Layout & Print Options
                  </h4>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase">Header Layout</label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {(['modern', 'classic', 'centered'] as const).map(style => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setRxSettings({...rxSettings, headerStyle: style})}
                          className={`py-1.5 px-2 text-[11px] font-bold rounded-lg capitalize border transition-all ${rxSettings.headerStyle === style ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-white'}`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase">Element Visibility</label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={rxSettings.showVitals} 
                        onChange={(e) => setRxSettings({...rxSettings, showVitals: e.target.checked})} 
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      Show Vital Signs Strip
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={rxSettings.showDiagnosis} 
                        onChange={(e) => setRxSettings({...rxSettings, showDiagnosis: e.target.checked})} 
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      Show Clinical Diagnosis
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={rxSettings.showLabOrders} 
                        onChange={(e) => setRxSettings({...rxSettings, showLabOrders: e.target.checked})} 
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      Show Advised Lab & Imaging Tests
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={rxSettings.showDigitalSignature} 
                        onChange={(e) => setRxSettings({...rxSettings, showDigitalSignature: e.target.checked})} 
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      Show Digital Signature & Stamp
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={rxSettings.showQrCode} 
                        onChange={(e) => setRxSettings({...rxSettings, showQrCode: e.target.checked})} 
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      Show QR Verification Code
                    </label>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase">Footer Disclaimer & Terms</label>
                    <textarea 
                      rows={3} 
                      className="w-full p-2 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      value={rxSettings.footerTerms}
                      onChange={(e) => setRxSettings({...rxSettings, footerTerms: e.target.value})}
                    />
                  </div>
                </div>

              </div>

              {/* Right Prescription Document Sheet (Printable Canvas) */}
              <div className="flex-1 bg-slate-200 dark:bg-slate-950 p-6 overflow-y-auto flex items-start justify-center">
                
                <div 
                  id="printable-rx-area"
                  className="bg-white text-slate-900 w-full max-w-[720px] min-h-[960px] p-8 shadow-2xl border border-slate-200 flex flex-col justify-between"
                >
                  <div>
                    {/* BRANDED HEADER */}
                    {rxSettings.headerStyle === 'modern' && (
                      <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-5 mb-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-lg">C</div>
                            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{rxSettings.hospitalName}</h1>
                          </div>
                          <p className="text-xs text-indigo-700 font-semibold">{rxSettings.tagline}</p>
                          <p className="text-[11px] text-slate-600">{rxSettings.address}</p>
                          <p className="text-[10px] text-slate-500">Ph: {rxSettings.phone} • Email: {rxSettings.email}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <h2 className="text-base font-bold text-slate-900">{rxSettings.doctorName}</h2>
                          <p className="text-xs text-indigo-700 font-semibold">{rxSettings.doctorTitle}</p>
                          <p className="text-[11px] font-mono text-slate-600">{rxSettings.doctorRegNo}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{rxSettings.regNo}</p>
                        </div>
                      </div>
                    )}

                    {rxSettings.headerStyle === 'classic' && (
                      <div className="border-b-2 border-slate-900 pb-4 mb-5">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <HeartPulse className="w-7 h-7 text-indigo-600" />
                            <h1 className="text-lg font-bold uppercase tracking-wider text-slate-900">{rxSettings.hospitalName}</h1>
                          </div>
                          <span className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-300">{rxSettings.regNo}</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
                          <div>
                            <strong>Doctor:</strong> {rxSettings.doctorName} ({rxSettings.doctorRegNo})
                          </div>
                          <div>
                            <strong>Contact:</strong> {rxSettings.phone}
                          </div>
                        </div>
                      </div>
                    )}

                    {rxSettings.headerStyle === 'centered' && (
                      <div className="text-center border-b-2 border-indigo-600 pb-5 mb-5 space-y-1">
                        <h1 className="text-2xl font-black text-slate-900 tracking-wide uppercase">{rxSettings.hospitalName}</h1>
                        <p className="text-xs text-indigo-700 font-semibold">{rxSettings.tagline}</p>
                        <p className="text-[11px] text-slate-600">{rxSettings.address} | Ph: {rxSettings.phone}</p>
                        <div className="pt-2 text-xs font-bold text-slate-800">
                          {rxSettings.doctorName} — {rxSettings.doctorTitle} ({rxSettings.doctorRegNo})
                        </div>
                      </div>
                    )}

                    {/* PATIENT & VISIT METADATA BANNER */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Patient Name</span>
                        <strong className="text-slate-900 font-bold text-sm">Rohit Sharma</strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">UHID / Patient ID</span>
                        <span className="font-mono text-slate-800 font-bold">PT-0001234</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Age / Gender</span>
                        <span className="text-slate-800 font-semibold">32 Y / Male</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Date & Time</span>
                        <span className="text-slate-800 font-semibold">25 Jul 2026, 15:30</span>
                      </div>
                    </div>

                    {/* VITALS STRIP (IF ENABLED) */}
                    {rxSettings.showVitals && (
                      <div className="mb-6 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex justify-between items-center text-xs">
                        <div><span className="text-slate-400 font-medium">BP:</span> <strong className="text-slate-800">128/84 mmHg</strong></div>
                        <div><span className="text-slate-400 font-medium">Pulse:</span> <strong className="text-slate-800">82 bpm</strong></div>
                        <div><span className="text-slate-400 font-medium">SpO2:</span> <strong className="text-slate-800">98%</strong></div>
                        <div><span className="text-slate-400 font-medium">Temp:</span> <strong className="text-slate-800">98.6 °F</strong></div>
                        <div><span className="text-slate-400 font-medium">Weight:</span> <strong className="text-slate-800">72 kg</strong></div>
                        <div><span className="text-slate-400 font-medium">BMI:</span> <strong className="text-slate-800">24.3</strong></div>
                      </div>
                    )}

                    {/* DIAGNOSIS & CHIEF COMPLAINT (IF ENABLED) */}
                    {rxSettings.showDiagnosis && (
                      <div className="mb-6 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-indigo-700 tracking-wider">
                          {getUILabel('clinicalDiagnosis', preferredLanguage)}
                        </span>
                        <div className="text-xs text-slate-800 font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                          <div>{assessment || '1. Atypical Chest Pain - r/o Coronary Artery Disease  2. Essential Hypertension'}</div>
                          {preferredLanguage !== 'en' && displayMode !== 'english' && (
                            <div dir={SUPPORTED_LANGUAGES.find(l => l.code === preferredLanguage)?.dir || 'ltr'} className="text-indigo-800 pt-1 border-t border-slate-200 text-[11px] font-bold">
                              {translateMedicalText(assessment || 'Atypical Chest Pain', preferredLanguage)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* PRESCRIPTION MEDICATION TABLE (Rx) */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-serif italic font-black text-3xl text-indigo-600">Rx</span>
                          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                            {getUILabel('prescribedMedications', preferredLanguage)}
                          </span>
                        </div>
                        {preferredLanguage !== 'en' && (
                          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold rounded-md">
                            {SUPPORTED_LANGUAGES.find(l => l.code === preferredLanguage)?.nativeName} ({displayMode})
                          </span>
                        )}
                      </div>

                      <table className="w-full text-xs text-left border-collapse border border-slate-200">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                            <th className="p-2 border-r border-slate-200 w-8">#</th>
                            <th className="p-2 border-r border-slate-200">{getUILabel('medicationHeader', preferredLanguage)}</th>
                            <th className="p-2 border-r border-slate-200">{getUILabel('frequencyHeader', preferredLanguage)}</th>
                            <th className="p-2 border-r border-slate-200">{getUILabel('durationHeader', preferredLanguage)}</th>
                            <th className="p-2">{getUILabel('instructionsHeader', preferredLanguage)}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prescriptions.map((p, idx) => {
                            const translatedFreq = translateMedicalText(p.frequency, preferredLanguage);
                            const translatedInst = translateMedicalText(p.instructions || 'After meals', preferredLanguage);
                            const isRtl = SUPPORTED_LANGUAGES.find(l => l.code === preferredLanguage)?.dir === 'rtl';

                            return (
                              <tr key={p.id} className="border-b border-slate-200 odd:bg-white even:bg-slate-50/50">
                                <td className="p-2.5 border-r border-slate-200 font-mono text-center font-bold">{idx + 1}</td>
                                <td className="p-2.5 border-r border-slate-200">
                                  {/* Generic and Brand names stay English as medico-legal source of truth */}
                                  <strong className="text-slate-900 text-xs">{p.name}</strong>
                                  <span className="text-slate-500 font-medium ml-1">({p.dose})</span>
                                </td>
                                
                                <td className="p-2.5 border-r border-slate-200 font-semibold text-slate-800">
                                  {displayMode === 'english' && <div>{p.frequency}</div>}
                                  {displayMode === 'translated' && <div dir={isRtl ? 'rtl' : 'ltr'}>{translatedFreq}</div>}
                                  {displayMode === 'bilingual' && (
                                    <div className="space-y-0.5">
                                      <div>{p.frequency}</div>
                                      {preferredLanguage !== 'en' && (
                                        <div dir={isRtl ? 'rtl' : 'ltr'} className="text-[11px] text-indigo-700 font-bold">
                                          {translatedFreq}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>

                                <td className="p-2.5 border-r border-slate-200 text-slate-700">{p.duration}</td>

                                <td className="p-2.5 text-slate-700 italic">
                                  {displayMode === 'english' && <div>{p.instructions || 'After meals'}</div>}
                                  {displayMode === 'translated' && <div dir={isRtl ? 'rtl' : 'ltr'} className="font-semibold text-slate-900 not-italic">{translatedInst}</div>}
                                  {displayMode === 'bilingual' && (
                                    <div className="space-y-0.5">
                                      <div>{p.instructions || 'After meals'}</div>
                                      {preferredLanguage !== 'en' && (
                                        <div dir={isRtl ? 'rtl' : 'ltr'} className="text-[11px] text-indigo-700 font-bold not-italic">
                                          {translatedInst}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {prescriptions.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-slate-400 italic">No medications prescribed.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* INVESTIGATIONS & ADVICE (IF ENABLED) */}
                    {rxSettings.showLabOrders && (labOrders.length > 0 || imagingOrders.length > 0) && (
                      <div className="mb-6 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-indigo-700 tracking-wider">
                          {getUILabel('advisedTests', preferredLanguage)}
                        </span>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {labOrders.map(l => (
                            <span key={l.id} className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-300 rounded text-xs font-semibold">
                              • {l.name}
                            </span>
                          ))}
                          {imagingOrders.map(i => (
                            <span key={i.id} className="px-2.5 py-1 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded text-xs font-semibold">
                              • {i.name} ({i.modality})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FOOTER & SIGNATURE SECTION */}
                  <div className="pt-6 border-t-2 border-slate-200 space-y-6 mt-8">
                    <div className="flex justify-between items-end">
                      {/* QR Code Verification (If enabled) */}
                      {rxSettings.showQrCode ? (
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded flex items-center justify-center p-1">
                            <QrCode className="w-12 h-12 text-slate-800" />
                          </div>
                          <div className="text-[10px] text-slate-500 max-w-[140px] leading-tight">
                            <strong>Scan to Verify</strong>
                            <p>Digital signature verified via CareConnect EHR Blockchain.</p>
                          </div>
                        </div>
                      ) : <div />}

                      {/* Digital Signature & Stamp */}
                      {rxSettings.showDigitalSignature && (
                        <div className="text-center space-y-1">
                          <div className="font-serif italic text-indigo-900 text-sm font-bold border-b border-slate-400 pb-1 px-4">
                            {rxSettings.doctorName}
                          </div>
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">Digitally Signed & Stamped</span>
                          <span className="text-[9px] font-mono text-slate-400">{rxSettings.doctorRegNo}</span>
                        </div>
                      )}
                    </div>

                    {/* Hospital Disclaimer / Terms */}
                    {rxSettings.showFooter && (
                      <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-2 whitespace-pre-line leading-relaxed">
                        {rxSettings.footerTerms}
                      </div>
                    )}
                  </div>

                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* DISPATCH RX MODAL */}
      <DispatchRxModal
        isOpen={showDispatchModal}
        onClose={() => setShowDispatchModal(false)}
        patientName="Rohit Sharma"
        patientPhone="+91 98765 43210"
        patientEmail="rohit.sharma@example.com"
        selectedLanguage={preferredLanguage}
        displayMode={displayMode}
        onDispatchSuccess={(msg) => {
          setDispatchSuccessMsg(msg);
          setTimeout(() => setDispatchSuccessMsg(null), 4000);
        }}
      />
      {/* SMART SPECIALTY SELECTOR MODAL (27 SPECIALTIES) */}
      <SpecialtySelectorModal 
        isOpen={isSpecialtyModalOpen}
        onClose={() => setIsSpecialtyModalOpen(false)}
        activeSpecialtyId={activeSpecialty.id}
        onSelectSpecialty={setActiveSpecialty}
      />
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

function EditableCard({ 
  title, 
  value, 
  onChange, 
  templates = [] 
}: { 
  title: string, 
  value: string, 
  onChange: (val: string) => void,
  templates?: string[]
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative group hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
          {title}
        </h3>
        <span className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Direct Writing</span>
      </div>

      {/* Quick Clinical Template Chips */}
      {templates.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {templates.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                const newVal = value ? `${value}\n• ${tpl}` : `• ${tpl}`;
                onChange(newVal);
              }}
              className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-100 dark:border-indigo-800 transition-colors"
            >
              + {tpl}
            </button>
          ))}
        </div>
      )}

      <textarea
        className="w-full h-28 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Type or select clinical findings for ${title.toLowerCase()}...`}
      />
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
