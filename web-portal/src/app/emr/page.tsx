'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Activity, FileText, Pill, Stethoscope,
  Video, Phone, MessageCircle, Printer, Download,
  Plus, Settings, HeartPulse, AlertTriangle, Trash2, Sparkles, CheckCircle, X,
  Building, UserCheck, QrCode, Globe, Send, RefreshCw, Languages,
  Loader2, Mic, FlaskConical, ScanLine, ReceiptText, ClipboardList, Syringe,
  FolderOpen, UploadCloud, Gauge, Thermometer, Weight, Wind, Ruler, PenLine,
} from 'lucide-react';
import useDashboardStore from '@/store/dashboardStore';
import {
  SUPPORTED_LANGUAGES,
  DisplayMode,
  translateMedicalText,
  getUILabel,
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
import {
  PageHeader, Badge, Button, Card, CardHeader, CardTitle, CardDescription, CardContent,
  Input, Textarea, Select, Label, Avatar, Dialog, Switch, Progress,
  Timeline, TimelineItem, EmptyState, Tabs, TabsList, TabsTrigger,
} from '@/components/ui';

const EMR_TABS = ['Overview', 'Timeline', 'Examination', 'Lab Orders', 'Imaging', 'Medications', 'Procedures', 'Documents', 'Billing'];

export default function EMRDashboard() {
  const router = useRouter();
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
    <div className="hidden md:flex items-center gap-2 text-xs font-semibold" aria-live="polite">
      {saveStatus === 'saving' ? (
        <span className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Saving…</span>
      ) : (
        <span className="flex items-center gap-1.5 text-success"><CheckCircle className="h-3.5 w-3.5" aria-hidden /> Saved</span>
      )}
    </div>
  ) : null;

  return (
    <>
      <div className="flex h-full flex-1 flex-col overflow-hidden bg-background">

        {/* TOP MAIN ROW: EMR CANVAS + PATIENT SUMMARY SIDEBAR + AI COPILOT */}
        <div className="relative flex flex-1 overflow-hidden">

          {/* CENTER MAIN EMR CANVAS */}
          <main className="flex-1 overflow-y-auto scroll-smooth p-6 scrollbar-thin">

            <PageHeader
              title="EMR Workspace"
              description="Consultation encounter ENC-992384 · Cardiology OPD"
              crumbs={[{ label: 'Clinical', href: '/dashboard' }, { label: 'Patients', href: '/patients' }, { label: 'Rohit Sharma' }]}
              actions={
                <div className="flex flex-wrap items-center gap-3">
                  {autosaveAction}
                  <Link href="/emr/patients/demo">
                    <Button variant="outline" title="Open the longitudinal Patient 360 record">
                      <UserCheck className="h-4 w-4 text-primary" aria-hidden /> Open Patient 360
                    </Button>
                  </Link>
                  <Button variant="outline" title="Print Prescription (Rx)" onClick={() => setShowPrescriptionModal(true)}>
                    <Printer className="h-4 w-4 text-primary" aria-hidden /> Preview Rx
                  </Button>
                  <Button onClick={() => router.push('/consultations')}>
                    <Plus className="h-4 w-4" aria-hidden /> New Consultation
                  </Button>
                </div>
              }
            />

            {/* Patient Header Card */}
            <Card className="mb-6 animate-fade-up">
              <CardContent className="flex flex-col items-start justify-between gap-6 p-6 lg:flex-row lg:items-center">
                <div className="flex items-center gap-5">
                  <Avatar name="Rohit Sharma" src="https://i.pravatar.cc/150?img=12" size="xl" status="online" />
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-bold tracking-tight text-foreground">Rohit Sharma</h2>
                      <Badge tone="brand">PT-0001234</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>32 Y · Male</span>
                      <span className="h-1 w-1 rounded-full bg-border" aria-hidden />
                      <span>12 May 1992</span>
                      <span className="h-1 w-1 rounded-full bg-border" aria-hidden />
                      <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" aria-hidden /> +91 98765 43210</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 px-2.5 py-1">
                    <Globe className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                    <span className="text-[10px] font-bold uppercase tracking-wide text-subtle-foreground">Rx Lang:</span>
                    <LanguageSelector
                      selectedLanguage={preferredLanguage}
                      onSelectLanguage={setPreferredLanguage}
                      compact
                    />
                  </div>
                  <Button variant="outline" size="icon" aria-label="Start video consult" onClick={() => router.push('/telemedicine')}><Video className="h-4 w-4" /></Button>
                  <Button variant="outline" size="icon" aria-label="Message patient" onClick={() => router.push('/messages')}><MessageCircle className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>

            {/* SMART SPECIALTY EMR WORKSPACE BAR */}
            <Card variant="gradient" className="mb-6 rounded-3xl">
              <CardContent className="flex flex-col items-start justify-between gap-4 p-5 md:flex-row md:items-center">
                <div className="flex items-center gap-3.5">
                  <div className="rounded-2xl bg-white/15 p-3 text-white shadow-soft">
                    <Stethoscope className="h-6 w-6" aria-hidden />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold tracking-wide text-white">
                        {activeSpecialty.name} EMR Workspace
                      </h3>
                      <span className="rounded-md border border-white/25 bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-white/90">
                        {activeSpecialty.category}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-white/80">
                      {activeSpecialty.description}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="glass"
                  size="sm"
                  className="border border-white/25 bg-white/10 text-white hover:bg-white/20"
                  onClick={() => setIsSpecialtyModalOpen(true)}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden /> Switch Specialty (27 Available)
                </Button>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="w-full justify-start overflow-x-auto no-scrollbar">
                {EMR_TABS.map(tab => (
                  <TabsTrigger key={tab} value={tab}>{tab}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

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

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

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
                    <SectionCard title="Vital Signs Summary" icon={Activity}>
                      <div className="grid grid-cols-3 gap-3">
                        <VitalItem icon={Gauge} iconClass="bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400" label="BP" value="128/84" unit="mmHg" />
                        <VitalItem icon={HeartPulse} iconClass="bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400" label="Pulse" value="82" unit="bpm" />
                        <VitalItem icon={Wind} iconClass="bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400" label="SpO2" value="98" unit="%" />
                        <VitalItem icon={Thermometer} iconClass="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400" label="Temp" value="98.6" unit="°F" />
                        <VitalItem icon={Weight} iconClass="bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400" label="Weight" value="72" unit="kg" />
                        <VitalItem icon={Ruler} iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" label="BMI" value="24.3" unit="kg/m²" />
                      </div>
                    </SectionCard>

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
                  <SectionCard title="Appended Clinical Progress Notes & Addendums" icon={ClipboardList}>
                    <div className="space-y-3">
                      {clinicalNotesList.map((note) => (
                        <div key={note.id} className="relative rounded-xl border border-border bg-muted/40 p-4">
                          <div className="mb-2 flex items-start justify-between gap-3">
                            <h4 className="text-xs font-bold uppercase tracking-wide text-primary">{note.title}</h4>
                            <span className="text-[11px] font-medium text-subtle-foreground">{note.author} · {note.date}</span>
                          </div>
                          <p className="whitespace-pre-line text-xs leading-relaxed text-foreground">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}
              </div>
            )}

            {activeTab === 'Timeline' && (
              <div className="pb-24">
                <SectionCard title="Unified Longitudinal Patient Timeline" icon={ClipboardList} description="Every clinical, financial, and diagnostic event on one chronological axis.">
                  <div className="flex flex-col gap-6 xl:flex-row">

                    {/* Left: Filter & Search */}
                    <div className="w-full shrink-0 space-y-4 xl:w-64">
                      <Input icon={<Search />} type="text" placeholder="Search events…" aria-label="Search timeline events" />

                      <div className="rounded-xl border border-border bg-muted/40 p-4">
                        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-subtle-foreground">Filters</h4>
                        <div className="space-y-2">
                          {['Consultations', 'Lab Results', 'Prescriptions', 'Imaging & PACS', 'Billing & Invoices', 'Documents'].map((f) => (
                            <label key={f} className="flex items-center gap-2 text-sm text-foreground">
                              <input type="checkbox" className="h-4 w-4 rounded border-input" defaultChecked /> {f}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: The Timeline */}
                    <div className="min-w-0 flex-1">
                      <Timeline>
                        <TimelineItem icon={ReceiptText} tone="success" title="Encounter Invoice #INV-20260724" meta="Just now">
                          <Badge tone="success" className="mb-1.5 text-[10px] uppercase">Invoice Generated</Badge>
                          <p>Total Payable: ₹1,500.00. Insurance coverage applied successfully.</p>
                          <Button variant="link" size="sm" className="mt-1 px-0" onClick={() => setActiveTab('Billing')}>View Invoice</Button>
                        </TimelineItem>
                        <TimelineItem icon={Sparkles} tone="brand" title="Medical Codes Applied" meta="10 mins ago">
                          <Badge tone="brand" className="mb-1.5 text-[10px] uppercase">AI Coding</Badge>
                          <p>ICD-10 (I20.9) and CPT (93000) generated and approved by Dr. Sharma.</p>
                        </TimelineItem>
                        <TimelineItem icon={ScanLine} tone="warning" title="ECG 12-Lead" meta="15 mins ago">
                          <Badge tone="warning" className="mb-1.5 text-[10px] uppercase">Imaging Ordered</Badge>
                          <p>Priority: STAT. Clinical Indication: R/O Stroke</p>
                        </TimelineItem>
                        <TimelineItem icon={Stethoscope} tone="neutral" title="Cardiology Encounter" meta="20 mins ago">
                          <Badge tone="neutral" className="mb-1.5 text-[10px] uppercase">Consultation Started</Badge>
                          <p>Encounter ID: ENC-992384. Dr. Raj Sharma.</p>
                        </TimelineItem>
                      </Timeline>
                      <div className="pt-3">
                        <Button variant="link" size="sm" disabled title="Coming soon">Load Older Events ↓</Button>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {activeTab === 'Medications' && (
              <div className="space-y-4 pb-24">

                {/* MULTI-LANGUAGE PRESCRIPTION BAR */}
                <Card className="animate-fade-up">
                  <CardContent className="flex flex-col items-start justify-between gap-4 p-4 lg:flex-row lg:items-center">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                        <Languages className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                            Patient Preferred Prescription Language
                          </h4>
                          <Badge tone="brand" className="text-[10px]">13 Major Indian Languages</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Preserves English generic names & dosages while translating patient instructions.
                        </p>
                      </div>
                    </div>

                    <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
                      {/* Language Selector */}
                      <div className="w-48">
                        <LanguageSelector
                          selectedLanguage={preferredLanguage}
                          onSelectLanguage={setPreferredLanguage}
                          compact
                        />
                      </div>

                      {/* Display Mode Switcher */}
                      <div className="flex items-center rounded-xl bg-muted p-1 text-xs" role="group" aria-label="Prescription display mode">
                        {([
                          { mode: 'bilingual' as DisplayMode, label: 'Bilingual' },
                          { mode: 'translated' as DisplayMode, label: 'Native Only' },
                          { mode: 'english' as DisplayMode, label: 'English' },
                        ]).map(({ mode, label }) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setDisplayMode(mode)}
                            aria-pressed={displayMode === mode}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                              displayMode === mode
                                ? 'bg-card text-foreground shadow-soft'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      {/* Send via WhatsApp / Email Button */}
                      <Button type="button" size="sm" onClick={() => setShowDispatchModal(true)}>
                        <Send className="h-3.5 w-3.5" aria-hidden /> Send Rx
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {dispatchSuccessMsg && (
                  <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft p-3 text-xs font-semibold text-success" role="status">
                    <CheckCircle className="h-4 w-4 shrink-0" aria-hidden />
                    {dispatchSuccessMsg}
                  </div>
                )}

                <SectionCard title="Prescription Builder" icon={Pill}>
                  <div className="flex flex-col gap-6 xl:flex-row">
                    {/* Form side */}
                    <div className="flex-1 space-y-4">
                      <div className="relative">
                        <Label htmlFor="emr-drug-name">Drug Name</Label>
                        <Input
                          id="emr-drug-name"
                          icon={<Search />}
                          type="text"
                          placeholder="Search medication…"
                          value={newDrug.name}
                          onChange={(e) => {
                            setNewDrug({ ...newDrug, name: e.target.value });
                            setShowDrugSuggestions(true);
                          }}
                          onBlur={() => setTimeout(() => setShowDrugSuggestions(false), 200)}
                        />
                        {showDrugSuggestions && newDrug.name && (
                          <SuggestionPopover
                            items={filteredDrugs}
                            onSelect={(drug) => {
                              setNewDrug({ ...newDrug, name: drug });
                              setShowDrugSuggestions(false);
                            }}
                          />
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="emr-drug-dose">Dose</Label>
                          <Input
                            id="emr-drug-dose"
                            type="text"
                            placeholder="e.g. 500mg"
                            value={newDrug.dose}
                            onChange={(e) => setNewDrug({ ...newDrug, dose: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="emr-drug-frequency">Frequency</Label>
                          <Select
                            id="emr-drug-frequency"
                            value={newDrug.frequency}
                            onChange={(e) => setNewDrug({ ...newDrug, frequency: e.target.value })}
                          >
                            <option>1-0-1 (BID)</option>
                            <option>1-1-1 (TID)</option>
                            <option>1-0-0 (OD)</option>
                            <option>SOS</option>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="emr-drug-duration">Duration</Label>
                          <Input
                            id="emr-drug-duration"
                            type="text"
                            placeholder="e.g. 5 days"
                            value={newDrug.duration}
                            onChange={(e) => setNewDrug({ ...newDrug, duration: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="emr-drug-instructions">Instructions</Label>
                        <Input
                          id="emr-drug-instructions"
                          type="text"
                          placeholder="e.g. After meals"
                          value={newDrug.instructions}
                          onChange={(e) => setNewDrug({ ...newDrug, instructions: e.target.value })}
                        />
                      </div>
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={handleAddPrescription}
                        disabled={!newDrug.name}
                      >
                        <Plus className="h-4 w-4" aria-hidden /> Add to Prescription
                      </Button>
                    </div>

                    {/* Cart side */}
                    <div className="flex h-full max-h-[500px] w-full flex-col rounded-2xl border border-border bg-muted/40 p-4 xl:w-96">

                      {hasInteraction ? (
                        <>
                          <div className="mb-4 flex shrink-0 items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-warning" aria-hidden />
                            <span className="text-sm font-semibold text-foreground">AI Interaction Check</span>
                          </div>
                          <div className="mb-4 shrink-0 rounded-xl border border-warning/30 bg-warning-soft p-3 text-xs leading-relaxed text-warning">
                            <strong>Warning:</strong> Potential moderate interaction between <strong>Metformin</strong> and <strong>Aspirin</strong>. Monitor blood glucose closely.
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mb-4 flex shrink-0 items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-success" aria-hidden />
                            <span className="text-sm font-semibold text-foreground">AI Interaction Check</span>
                          </div>
                          <div className="mb-4 shrink-0 rounded-xl border border-success/30 bg-success-soft p-3 text-xs leading-relaxed text-success">
                            No significant interactions detected.
                          </div>
                        </>
                      )}

                      <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-thin">
                        {prescriptions.map(p => (
                          <div key={p.id} className="group relative rounded-xl border border-border bg-card p-3 shadow-soft">
                            <h4 className="text-sm font-bold text-foreground">{p.name} {p.dose}</h4>
                            <p className="mt-1 text-xs text-muted-foreground">{p.frequency} · {p.duration} · {p.instructions}</p>
                            <button
                              onClick={() => handleRemovePrescription(p.id)}
                              aria-label={`Remove ${p.name}`}
                              className="absolute right-2 top-2 text-subtle-foreground opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </button>
                          </div>
                        ))}
                        {prescriptions.length === 0 && (
                          <EmptyState icon={Pill} title="No medications added yet" className="py-8" />
                        )}
                      </div>

                      <div className="mt-2 shrink-0 border-t border-border pt-3">
                        <Button className="w-full" size="sm" onClick={() => setShowPrescriptionModal(true)}>
                          <Printer className="h-4 w-4" aria-hidden /> Preview & Print Rx Document
                        </Button>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {activeTab === 'Lab Orders' && (
              <div className="pb-24">
                <SectionCard title="Laboratory Orders (LIS)" icon={FlaskConical}>
                  <div className="flex flex-col gap-6 xl:flex-row">
                    {/* Form side */}
                    <div className="flex-1 space-y-4">
                      <div className="relative">
                        <Label htmlFor="emr-lab-test">Test Name</Label>
                        <Input
                          id="emr-lab-test"
                          icon={<Search />}
                          type="text"
                          placeholder="Search lab test, LOINC, or panel…"
                          value={newLabTest}
                          onChange={(e) => {
                            setNewLabTest(e.target.value);
                            setShowLabSuggestions(true);
                          }}
                          onBlur={() => setTimeout(() => setShowLabSuggestions(false), 200)}
                        />
                        {showLabSuggestions && newLabTest && (
                          <SuggestionPopover
                            items={filteredLabs}
                            onSelect={(lab) => {
                              setNewLabTest(lab);
                              setShowLabSuggestions(false);
                            }}
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="emr-lab-priority">Priority</Label>
                          <Select
                            id="emr-lab-priority"
                            value={labPriority}
                            onChange={(e) => setLabPriority(e.target.value)}
                          >
                            <option>Routine</option>
                            <option>Urgent</option>
                            <option>STAT</option>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="emr-lab-notes">Clinical Notes</Label>
                          <Input id="emr-lab-notes" type="text" placeholder="e.g. Fasting sample required" />
                        </div>
                      </div>

                      <div className="pt-2">
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-subtle-foreground">Health Packages</h4>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => setNewLabTest('Fever Panel')} className="rounded-lg bg-info-soft px-3 py-1.5 text-xs font-medium text-info transition-opacity hover:opacity-80">Fever Panel</button>
                          <button type="button" onClick={() => setNewLabTest('Diabetes Care Package')} className="rounded-lg bg-info-soft px-3 py-1.5 text-xs font-medium text-info transition-opacity hover:opacity-80">Diabetes Care</button>
                          <button type="button" onClick={() => setNewLabTest('Comprehensive Health Check')} className="rounded-lg bg-info-soft px-3 py-1.5 text-xs font-medium text-info transition-opacity hover:opacity-80">Comprehensive Check</button>
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        className="mt-4 w-full"
                        onClick={handleAddLab}
                        disabled={!newLabTest}
                      >
                        <Plus className="h-4 w-4" aria-hidden /> Add to Lab Order
                      </Button>
                    </div>

                    {/* Cart side */}
                    <div className="flex h-full max-h-[500px] w-full flex-col rounded-2xl border border-border bg-muted/40 p-4 xl:w-96">

                      <div className="mb-4 flex shrink-0 items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" aria-hidden />
                        <span className="text-sm font-semibold text-foreground">AI Clinical Recommendation</span>
                      </div>

                      {labOrders.length > 0 ? (
                        <div className="mb-4 shrink-0 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-foreground">
                          Based on diagnosis (Hypertension, T2DM), consider adding <strong>HbA1c</strong> and <strong>Lipid Profile</strong> to monitor metabolic control.
                        </div>
                      ) : (
                        <div className="mb-4 shrink-0 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-foreground">
                          Add tests to receive clinical recommendations and duplicate detection alerts.
                        </div>
                      )}

                      <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-thin">
                        {labOrders.map(lab => (
                          <div key={lab.id} className="group relative rounded-xl border border-border bg-card p-3 shadow-soft">
                            <div className="flex items-start justify-between pr-6">
                              <h4 className="text-sm font-bold text-foreground">{lab.name}</h4>
                              <Badge tone={lab.priority === 'STAT' ? 'danger' : 'neutral'} className="text-[10px] uppercase">{lab.priority}</Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{lab.code} · Sample: {lab.sample}</p>
                            <button
                              onClick={() => handleRemoveLab(lab.id)}
                              aria-label={`Remove ${lab.name}`}
                              className="absolute right-2 top-2 text-subtle-foreground opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </button>
                          </div>
                        ))}
                        {labOrders.length === 0 && (
                          <EmptyState icon={FlaskConical} title="No lab tests ordered yet" className="py-8" />
                        )}
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {activeTab === 'Imaging' && (
              <div className="pb-24">
                <SectionCard title="Radiology & Imaging (RIS)" icon={ScanLine}>
                  <div className="flex flex-col gap-6 xl:flex-row">
                    {/* Form side */}
                    <div className="flex-1 space-y-4">
                      <div className="relative">
                        <Label htmlFor="emr-imaging-study">Study Name</Label>
                        <Input
                          id="emr-imaging-study"
                          icon={<Search />}
                          type="text"
                          placeholder="Search imaging study, CT, MRI…"
                          value={newImaging}
                          onChange={(e) => {
                            setNewImaging(e.target.value);
                            setShowImagingSuggestions(true);
                          }}
                          onBlur={() => setTimeout(() => setShowImagingSuggestions(false), 200)}
                        />
                        {showImagingSuggestions && newImaging && (
                          <SuggestionPopover
                            items={filteredImaging}
                            onSelect={(study) => {
                              setNewImaging(study);
                              setShowImagingSuggestions(false);
                            }}
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="emr-imaging-priority">Priority</Label>
                          <Select
                            id="emr-imaging-priority"
                            value={imagingPriority}
                            onChange={(e) => setImagingPriority(e.target.value)}
                          >
                            <option>Routine</option>
                            <option>Urgent</option>
                            <option>STAT</option>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="emr-imaging-indication">Clinical Indication</Label>
                          <Input id="emr-imaging-indication" type="text" placeholder="e.g. R/O Stroke" />
                        </div>
                      </div>

                      <div className="mt-4 border-t border-border pt-4">
                        <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-subtle-foreground">Past Imaging (DICOM Viewer)</h4>
                        {/* Radiology viewport intentionally stays a black canvas in both themes, per DICOM viewer convention */}
                        <div
                          className="group relative flex h-64 cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-black"
                          role="button"
                          tabIndex={0}
                          aria-label="Open study in viewer"
                          onClick={() => router.push('/teleradiology/worklist')}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push('/teleradiology/worklist'); }}
                        >
                          <div className="absolute left-2 top-2 z-10 rounded bg-black/60 px-2 py-1 font-mono text-[10px] text-white">CT HEAD [12 May 2026]</div>
                          <div className="absolute right-2 top-2 z-10 flex gap-2">
                            <button aria-label="Zoom study" disabled title="Coming soon" className="rounded bg-black/60 p-1.5 text-white transition-colors hover:bg-primary disabled:opacity-60" onClick={(e) => e.stopPropagation()}><Search className="h-3 w-3" aria-hidden /></button>
                            <button aria-label="Add series" disabled title="Coming soon" className="rounded bg-black/60 p-1.5 text-white transition-colors hover:bg-primary disabled:opacity-60" onClick={(e) => e.stopPropagation()}><Plus className="h-3 w-3" aria-hidden /></button>
                          </div>
                          <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-900 to-black">
                            {/* Mock DICOM Image / Brain Scan Placeholder */}
                            <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-zinc-800 opacity-20 blur-sm" aria-hidden></div>
                            <div className="absolute left-1/2 top-1/2 h-40 w-32 -translate-x-1/2 -translate-y-1/2 rounded-[40%] border border-zinc-600 opacity-40 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]" aria-hidden></div>
                            <p className="z-20 flex items-center gap-2 font-medium text-zinc-400 transition-transform group-hover:scale-105"><Video className="h-5 w-5 text-primary" aria-hidden /> Open OHIF Viewer</p>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        className="mt-4 w-full"
                        onClick={handleAddImaging}
                        disabled={!newImaging}
                      >
                        <Plus className="h-4 w-4" aria-hidden /> Order Imaging Study
                      </Button>
                    </div>

                    {/* Cart side */}
                    <div className="flex h-full max-h-[500px] w-full flex-col rounded-2xl border border-border bg-muted/40 p-4 xl:w-96">

                      <div className="mb-4 flex shrink-0 items-center gap-2">
                        <Activity className="h-5 w-5 text-info" aria-hidden />
                        <span className="text-sm font-semibold text-foreground">AI Radiology Analysis</span>
                      </div>

                      <div className="mb-4 shrink-0 rounded-xl border border-info/30 bg-info-soft p-3 text-xs leading-relaxed text-info">
                        <strong className="mb-1 block">Previous CT Head Findings (12 May 2026):</strong>
                        No acute intracranial hemorrhage. Mild periventricular white matter disease.
                        <Link href="/teleradiology/worklist" className="mt-1 block font-semibold underline-offset-2 hover:underline">View Structured Report →</Link>
                      </div>

                      <div className="mt-2 flex-1 space-y-3 overflow-y-auto border-t border-border pr-2 pt-4 scrollbar-thin">
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-subtle-foreground">Ordered Studies</h4>
                        {imagingOrders.map(img => (
                          <div key={img.id} className="group relative rounded-xl border border-border bg-card p-3 shadow-soft">
                            <div className="flex items-start justify-between pr-6">
                              <h4 className="text-sm font-bold text-foreground">{img.name}</h4>
                              <Badge tone={img.priority === 'STAT' ? 'danger' : 'neutral'} className="text-[10px] uppercase">{img.priority}</Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">Modality: {img.modality} · Status: {img.status}</p>
                            <button
                              onClick={() => handleRemoveImaging(img.id)}
                              aria-label={`Remove ${img.name}`}
                              className="absolute right-2 top-2 text-subtle-foreground opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </button>
                          </div>
                        ))}
                        {imagingOrders.length === 0 && (
                          <EmptyState icon={ScanLine} title="No imaging ordered yet" className="py-8" />
                        )}
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {activeTab === 'Documents' && (
              <div className="pb-24">
                <SectionCard title="Document Management System (DMS)" icon={FolderOpen}>
                  <div className="flex flex-col gap-6 xl:flex-row">
                    {/* Left: Upload and List */}
                    <div className="flex-1 space-y-6">
                      {/* Upload Zone */}
                      <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 text-center transition-colors hover:bg-muted/50">
                        <input
                          type="file"
                          aria-label="Upload document"
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          onChange={simulateUpload}
                          disabled={isUploading}
                        />
                        {isUploading ? (
                          <>
                            <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" aria-hidden />
                            <h4 className="text-sm font-semibold text-foreground">Uploading Document…</h4>
                            <Progress value={uploadProgress} className="mt-4 w-full max-w-xs" />
                          </>
                        ) : (
                          <>
                            <UploadCloud className="mb-3 h-8 w-8 text-subtle-foreground" aria-hidden />
                            <h4 className="text-sm font-semibold text-foreground">Drag & Drop files here</h4>
                            <p className="mt-1 text-xs text-muted-foreground">or click to browse from your computer</p>
                            <p className="mt-4 text-[10px] font-semibold uppercase text-subtle-foreground">Supports PDF, JPG, PNG, DICOM (Max 50MB)</p>
                          </>
                        )}
                      </div>

                      {/* Document List */}
                      <div>
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <h4 className="text-sm font-semibold text-foreground">Patient Documents</h4>
                          <div className="w-48">
                            <Input icon={<Search />} type="text" placeholder="Search…" aria-label="Search documents" className="h-8 text-xs" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          {documents.map(doc => (
                            <div key={doc.id} className="group flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-soft transition-colors hover:border-primary/40">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                                  <FileText className="h-5 w-5" aria-hidden />
                                </div>
                                <div>
                                  <h5 className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">{doc.name}</h5>
                                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="rounded bg-muted px-2 py-0.5">{doc.category}</span>
                                    <span aria-hidden>·</span>
                                    <span>{doc.date}</span>
                                    <span aria-hidden>·</span>
                                    <span>{doc.size}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <Button variant="ghost" size="icon-sm" aria-label={`Download ${doc.name}`} disabled title="Coming soon"><Download className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon-sm" aria-label={`Delete ${doc.name}`} className="hover:text-danger" disabled title="Coming soon"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: AI OCR & Preview */}
                    <div className="flex h-full max-h-[700px] w-full flex-col gap-6 xl:w-[400px]">
                      {/* Document Preview Placeholder */}
                      <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted/60">
                        <div className="absolute right-2 top-2 flex gap-1">
                          <Button variant="glass" size="icon-sm" aria-label="Zoom preview" disabled title="Coming soon"><Search className="h-3 w-3" /></Button>
                        </div>
                        <FileText className="h-16 w-16 text-border" aria-hidden />
                        <span className="absolute bottom-4 text-xs font-semibold text-subtle-foreground">Preview: Previous_Discharge_Summary.pdf</span>
                      </div>

                      {/* AI Extraction Panel */}
                      <div className="shrink-0 rounded-2xl border border-border bg-muted/40 p-4">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" aria-hidden />
                            <span className="text-sm font-semibold text-foreground">AI Document Intelligence</span>
                          </div>
                          <Badge tone="success" className="text-[10px] uppercase"><CheckCircle className="h-3 w-3" aria-hidden /> OCR Complete</Badge>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-subtle-foreground">Extracted Summary</h5>
                            <p className="rounded-xl border border-border bg-card p-3 text-sm leading-relaxed text-foreground">
                              Patient admitted on 05 May 2026 for acute exacerbation of Asthma. Treated with IV corticosteroids and bronchodilators. Discharged on 10 May 2026 in stable condition.
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-border bg-card p-2">
                              <span className="block text-[10px] font-semibold uppercase text-subtle-foreground">Hospital</span>
                              <span className="text-xs font-medium text-foreground">CityCare General</span>
                            </div>
                            <div className="rounded-xl border border-border bg-card p-2">
                              <span className="block text-[10px] font-semibold uppercase text-subtle-foreground">Attending Dr.</span>
                              <span className="text-xs font-medium text-foreground">Dr. M. Patel</span>
                            </div>
                            <div className="col-span-2 rounded-xl border border-border bg-card p-2">
                              <span className="block text-[10px] font-semibold uppercase text-subtle-foreground">Extracted Medications</span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                <Badge tone="info" className="text-[10px]">Budesonide Inhaler</Badge>
                                <Badge tone="info" className="text-[10px]">Prednisolone 20mg</Badge>
                              </div>
                            </div>
                          </div>

                          <Button className="w-full" size="sm" disabled title="Coming soon">
                            <Plus className="h-4 w-4" aria-hidden /> Import Data to EMR
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {activeTab === 'Billing' && (
              <div className="pb-24">
                <SectionCard title="Revenue Cycle Management (RCM)" icon={ReceiptText}>
                  <div className="flex flex-col gap-6 xl:flex-row">
                    {/* Invoice & Charges */}
                    <div className="flex-1 space-y-6">

                      {/* Active Encounter Invoice */}
                      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                        <div className="flex items-center justify-between border-b border-border bg-muted/50 p-4">
                          <div>
                            <h4 className="font-semibold text-foreground">Encounter Invoice #INV-20260724</h4>
                            <p className="mt-1 text-xs text-muted-foreground">Generated: Today, 11:30 AM</p>
                          </div>
                          <Badge tone="warning" className="uppercase tracking-wide">Payment Pending</Badge>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                              <tr>
                                <th scope="col" className="px-4 py-3">Charge Item</th>
                                <th scope="col" className="px-4 py-3">Code / Dept</th>
                                <th scope="col" className="px-4 py-3 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-foreground">
                              <tr className="transition-colors hover:bg-muted/40">
                                <td className="px-4 py-3 font-medium">Cardiology Consultation</td>
                                <td className="px-4 py-3 text-muted-foreground">CPT: 99214</td>
                                <td className="px-4 py-3 text-right tabular-nums">₹1,500.00</td>
                              </tr>
                              <tr className="bg-primary/5 transition-colors hover:bg-muted/40">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <Activity className="h-3 w-3 text-primary" aria-hidden /> Auto-Import: ECG 12-Lead
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">Imaging</td>
                                <td className="px-4 py-3 text-right tabular-nums">₹800.00</td>
                              </tr>
                              <tr className="bg-primary/5 transition-colors hover:bg-muted/40">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-3 w-3 text-primary" aria-hidden /> Auto-Import: Lipid Profile
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">Laboratory</td>
                                <td className="px-4 py-3 text-right tabular-nums">₹1,200.00</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="border-t border-border bg-muted/50 p-4">
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium tabular-nums text-foreground">₹3,500.00</span>
                          </div>
                          <div className="mb-4 flex items-center justify-between text-sm text-success">
                            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" aria-hidden /> Insurance Coverage (HDFC Ergo)</span>
                            <span className="font-medium tabular-nums">- ₹2,000.00</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-border pt-4 text-lg font-bold text-foreground">
                            <span>Patient Payable (Total)</span>
                            <span className="tabular-nums">₹1,500.00</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <Button variant="outline" className="flex-1" disabled title="Coming soon">
                          <Printer className="h-4 w-4" aria-hidden /> Print Invoice
                        </Button>
                        <Button className="flex-1" onClick={() => router.push('/billing')}>
                          Collect Payment (₹1,500)
                        </Button>
                      </div>

                    </div>

                    {/* Right: RCM Analytics & Insurance */}
                    <div className="flex w-full flex-col gap-6 xl:w-[400px]">

                      {/* Medical Coding Panel */}
                      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" aria-hidden />
                          <h4 className="text-sm font-semibold text-foreground">AI Medical Coder</h4>
                        </div>
                        <p className="mb-4 text-xs text-muted-foreground">AI has analyzed the consultation and generated the following billing codes. Review before submitting claim.</p>

                        <div className="mb-4 space-y-2">
                          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-2.5 shadow-soft">
                            <div>
                              <span className="mb-0.5 block text-[10px] font-bold uppercase text-subtle-foreground">ICD-10 (Diagnosis)</span>
                              <span className="text-sm font-semibold text-foreground">I20.9 - Angina pectoris</span>
                            </div>
                            <CheckCircle className="h-5 w-5 text-success" aria-hidden />
                          </div>
                          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-2.5 shadow-soft">
                            <div>
                              <span className="mb-0.5 block text-[10px] font-bold uppercase text-subtle-foreground">CPT (Procedure)</span>
                              <span className="text-sm font-semibold text-foreground">93000 - Electrocardiogram</span>
                            </div>
                            <CheckCircle className="h-5 w-5 text-success" aria-hidden />
                          </div>
                        </div>
                        <Button className="w-full" size="sm" disabled title="Coming soon">
                          Approve & Submit Claim
                        </Button>
                      </div>

                      {/* Insurance Tracker */}
                      <Card>
                        <CardHeader className="p-5 pb-3">
                          <CardTitle className="text-sm">Insurance Claims Status</CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                          <Timeline>
                            <TimelineItem icon={CheckCircle} tone="success" title="Eligibility Verified">
                              HDFC Ergo · Pre-auth approved
                            </TimelineItem>
                            <TimelineItem icon={PenLine} tone="brand" title="Claim Drafted">
                              Awaiting final diagnosis codes
                            </TimelineItem>
                            <TimelineItem icon={Send} tone="neutral" title={<span className="text-muted-foreground">Claim Submitted</span>} />
                          </Timeline>
                        </CardContent>
                      </Card>

                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {activeTab === 'Examination' && (
              <div className="space-y-6 pb-6">
                <SectionCard title="Systematic Physical Examination Writer" icon={Stethoscope}>
                  <div className="space-y-6">

                    {/* Quick Actions Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide text-primary">Systemic Physical Assessment</h4>
                        <p className="mt-0.5 text-xs text-muted-foreground">Perform organ-system evaluation and record physical exam findings.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setExamGeneral('Patient is conscious, cooperative, well-oriented. No pallor, icterus, cyanosis, clubbing, lymphadenopathy, or peripheral edema.');
                            setExamCvs('S1 S2 heard normal. No murmurs, gallops, or friction rubs. JVP normal.');
                            setExamRs('Bilateral air entry equal. Normal vesicular breath sounds. No ronchi, wheeze, or crepitations.');
                            setExamAbdomen('Soft, non-tender. Normal bowel sounds. No organomegaly or palpable masses.');
                            setExamCns('Conscious, oriented to time, place, & person. GCS 15/15. Motor strength 5/5 in all extremities. No focal sensory deficit.');
                          }}
                        >
                          <CheckCircle className="h-3.5 w-3.5 text-success" aria-hidden /> Mark All Systems Normal
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const combined = `GENERAL: ${examGeneral}\nCVS: ${examCvs}\nRS: ${examRs}\nP/A: ${examAbdomen}\nCNS: ${examCns}`;
                            setExamination(combined);
                            setActiveTab('Overview');
                          }}
                        >
                          Sync to Overview SOAP
                        </Button>
                      </div>
                    </div>

                    {/* Systemic Exam Grid */}
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
                </SectionCard>
              </div>
            )}

            {activeTab === 'Procedures' && (
              <div className="space-y-6 pb-6">
                <SectionCard title="Clinical Procedures & Bedside Intervention Log" icon={Syringe}>
                  <div className="space-y-6">

                    {/* Log New Procedure Form */}
                    <div className="space-y-4 rounded-2xl border border-border bg-muted/40 p-5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-subtle-foreground">Record New Procedure / Minor Intervention</h4>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="emr-procedure-name">Procedure Name</Label>
                          <Input
                            id="emr-procedure-name"
                            type="text"
                            placeholder="e.g. Bedside ECG / Central Line / Wound Dressing"
                            value={newProcedure.name}
                            onChange={(e) => setNewProcedure({ ...newProcedure, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="emr-procedure-doctor">Performing Physician</Label>
                          <Input
                            id="emr-procedure-doctor"
                            type="text"
                            value={newProcedure.doctor}
                            onChange={(e) => setNewProcedure({ ...newProcedure, doctor: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="emr-procedure-notes">Procedure Notes & Findings</Label>
                        <Textarea
                          id="emr-procedure-notes"
                          placeholder="Record procedure details, sterile precautions taken, and patient status post-procedure…"
                          className="h-24 min-h-0 resize-none text-xs"
                          value={newProcedure.notes}
                          onChange={(e) => setNewProcedure({ ...newProcedure, notes: e.target.value })}
                        />
                      </div>

                      <Button
                        type="button"
                        size="sm"
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
                      >
                        <Plus className="h-4 w-4" aria-hidden /> Save Procedure Note
                      </Button>
                    </div>

                    {/* Existing Procedure Log */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-subtle-foreground">Completed Patient Procedures</h4>
                      {procedures.map((proc) => (
                        <div key={proc.id} className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-soft md:flex-row md:items-center">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h5 className="text-sm font-bold text-foreground">{proc.name}</h5>
                              <Badge tone="success" className="text-[10px] uppercase">{proc.status}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{proc.notes}</p>
                            <div className="text-[11px] font-medium text-subtle-foreground">Performed by {proc.doctor} · {proc.date}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                </SectionCard>
              </div>
            )}

            {activeTab !== 'Overview' && activeTab !== 'Timeline' && activeTab !== 'Examination' && activeTab !== 'Lab Orders' && activeTab !== 'Imaging' && activeTab !== 'Medications' && activeTab !== 'Procedures' && activeTab !== 'Documents' && activeTab !== 'Billing' && (
              <div className="pb-6">
                <SectionCard title={`${activeTab} Clinical Notes`} icon={FileText}>
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">Enter custom clinical notes or progress reports for {activeTab}.</p>
                    <Textarea
                      rows={6}
                      placeholder={`Type clinical details for ${activeTab}…`}
                      className="text-xs"
                      aria-label={`${activeTab} clinical notes`}
                    />
                    <Button size="sm" onClick={() => alert(`Saved clinical note for ${activeTab}`)}>
                      Save {activeTab} Note
                    </Button>
                  </div>
                </SectionCard>
              </div>
            )}
          </main>

          {/* RIGHT SIDEBAR (PATIENT SUMMARY) */}
          <aside className="hidden w-80 overflow-y-auto border-l border-border bg-card p-5 scrollbar-thin xl:block" aria-label="Patient summary">

            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-subtle-foreground">Patient Summary</h3>
              <Button variant="link" size="sm" className="px-0" disabled title="Coming soon">Edit</Button>
            </div>

            <div className="mb-8 space-y-4 text-sm">
              <SummaryRow label="Blood Group" value="O+" />
              <SummaryRow label="Height" value="172 cm" />
              <SummaryRow label="Weight" value="72 kg" />
              <SummaryRow label="BMI" value="24.3 kg/m²" />
              <SummaryRow label="Insurance" value="HDFC Ergo (Gold)" />
            </div>

            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-subtle-foreground">Allergies</h3>
                <Button variant="link" size="sm" className="px-0 text-xs" disabled title="Coming soon">+ Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="danger">
                  Penicillin
                  <button aria-label="Remove Penicillin allergy" disabled title="Coming soon" className="transition-colors hover:text-foreground disabled:opacity-60"><X className="h-3 w-3" aria-hidden /></button>
                </Badge>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-subtle-foreground">Chronic Conditions</h3>
                <Button variant="link" size="sm" className="px-0 text-xs">+ Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="info">Hypertension</Badge>
                <Badge tone="info">Type 2 Diabetes</Badge>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-subtle-foreground">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="justify-center" onClick={() => setActiveTab('Medications')}>
                  <Pill className="h-4 w-4" aria-hidden /> Prescription
                </Button>
                <Button variant="outline" size="sm" className="justify-center" onClick={() => setActiveTab('Lab Orders')}>
                  <Activity className="h-4 w-4" aria-hidden /> Order Lab
                </Button>
              </div>
            </div>

          </aside>

          {/* AI COPILOT SIDEBAR */}
          {showCopilot && (
            <aside className="z-20 flex h-full w-96 shrink-0 flex-col border-l border-border bg-card shadow-float" aria-label="AI Clinical Copilot">
              {/* Copilot Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-border bg-primary/5 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" aria-hidden />
                  <h3 className="text-sm font-bold text-foreground">AI Clinical Copilot</h3>
                </div>
                <button onClick={toggleCopilot} aria-label="Close copilot" className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><X className="h-4 w-4" aria-hidden /></button>
              </div>

              {/* Copilot Content */}
              <div className="flex-1 space-y-6 overflow-y-auto p-4 scrollbar-thin">
                {/* Live Scribe / Recording */}
                <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs font-bold uppercase text-subtle-foreground"><Mic className="h-3 w-3" aria-hidden /> Live Scribe</span>
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-danger"></span>
                    </span>
                  </div>
                  <p className="mb-4 text-xs italic text-muted-foreground">&quot;Patient complains of chest pain since 2 days, worse on exertion…&quot;</p>
                  <Button size="sm" className="w-full" onClick={handleInsertAI}>
                    <Plus className="h-3 w-3" aria-hidden /> Insert SOAP Note
                  </Button>
                </div>

                {/* AI Insights & Diagnostics */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-subtle-foreground">Clinical Insights</h4>

                  <div className="rounded-xl border border-danger/30 bg-danger-soft p-3 text-xs">
                    <div className="mb-1 flex items-center gap-2 font-bold text-danger">
                      <AlertTriangle className="h-4 w-4" aria-hidden /> Potential Ischemia
                    </div>
                    <p className="text-xs text-danger">Symptoms (chest pain on exertion) + Hx (T2DM, HTN) suggest CAD. Consider ECG & Troponin.</p>
                  </div>

                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
                    <div className="mb-1 flex items-center gap-2 font-bold text-primary">
                      <FileText className="h-4 w-4" aria-hidden /> Coding Suggestion
                    </div>
                    <p className="mb-2 text-xs text-muted-foreground">ICD-10: I20.9 (Angina pectoris, unspecified)</p>
                    <Button variant="outline" size="sm" disabled title="Coming soon">Apply Code</Button>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="shrink-0 border-t border-border bg-muted/40 p-4">
                <div className="relative">
                  <Input type="text" placeholder="Ask Copilot for differentials…" aria-label="Ask Copilot" className="rounded-full pr-11 text-xs" />
                  <Button size="icon-sm" aria-label="Send question" disabled title="Coming soon" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full"><Search className="h-3 w-3" /></Button>
                </div>
              </div>
            </aside>
          )}

        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="z-10 flex h-16 shrink-0 items-center justify-between border-t border-border bg-card px-6 shadow-[0_-4px_20px_-2px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowAddNoteModal(true)}>
              <Plus className="h-4 w-4 text-primary" aria-hidden /> Add Note
            </Button>
            <Button variant={showCopilot ? 'secondary' : 'outline'} size="sm" onClick={toggleCopilot} aria-pressed={showCopilot}>
              <Sparkles className="h-4 w-4 text-violet-500 dark:text-violet-400" aria-hidden /> AI Copilot
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSaveStatus('saving');
                setTimeout(() => setSaveStatus('saved'), 1000);
              }}
            >
              Save Draft
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSaveStatus('saving');
                setTimeout(() => setSaveStatus('saved'), 1000);
              }}
            >
              <CheckCircle className="h-4 w-4" aria-hidden /> Save & Sign
            </Button>
          </div>
        </div>

      </div>

      {/* ADD CLINICAL NOTE MODAL */}
      <Dialog
        open={showAddNoteModal}
        onClose={() => setShowAddNoteModal(false)}
        title="Add Clinical Progress Note"
        description="Append a timestamped note or addendum to the patient chart."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setShowAddNoteModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
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
            >
              Save & Append to Chart
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="emr-note-title">Note Type / Title</Label>
            <Select
              id="emr-note-title"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
            >
              <option>Clinical Progress Note</option>
              <option>Nursing Shift Note</option>
              <option>Consultation Addendum</option>
              <option>Operative Bedside Note</option>
              <option>Discharge Planning Note</option>
            </Select>
          </div>

          <div>
            <Label htmlFor="emr-note-content">Clinical Observations / Note Text</Label>
            <Textarea
              id="emr-note-content"
              rows={5}
              placeholder="Type clinical progress notes, patient complaints, bedside observations, or treatment changes…"
              className="resize-none text-xs"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
            />
          </div>
        </div>
      </Dialog>

      {/* PRESCRIPTION PREVIEW & PRINT CUSTOMIZER MODAL */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm print:static print:inset-auto print:bg-white print:p-0">

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

          <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-pop print:h-auto print:border-none print:shadow-none">

            {/* Top Bar */}
            <div className="rx-no-print flex shrink-0 items-center justify-between border-b border-border bg-muted/50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <Printer className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Prescription Preview & Print Settings</h3>
                  <p className="text-xs text-muted-foreground">Configure clinic header/footer branding and print-ready Rx documents.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button size="sm" onClick={handlePrintRx}>
                  <Printer className="h-4 w-4" aria-hidden /> Print / Export PDF
                </Button>
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  aria-label="Close prescription preview"
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>

            {/* Main Split Content */}
            <div className="flex flex-1 flex-col overflow-hidden lg:flex-row print:overflow-visible">

              {/* Left Settings Panel */}
              <div className="rx-no-print w-full shrink-0 space-y-6 overflow-y-auto border-r border-border bg-muted/30 p-5 scrollbar-thin lg:w-96">

                {/* Hospital Branding */}
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                    <Building className="h-4 w-4" aria-hidden /> Hospital / Clinic Branding
                  </h4>

                  <div>
                    <Label htmlFor="rx-hospital-name" className="text-[11px] uppercase text-muted-foreground">Hospital / Clinic Name</Label>
                    <Input
                      id="rx-hospital-name"
                      type="text"
                      className="h-9 text-xs"
                      value={rxSettings.hospitalName}
                      onChange={(e) => setRxSettings({ ...rxSettings, hospitalName: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="rx-tagline" className="text-[11px] uppercase text-muted-foreground">Tagline / Subtitle</Label>
                    <Input
                      id="rx-tagline"
                      type="text"
                      className="h-9 text-xs"
                      value={rxSettings.tagline}
                      onChange={(e) => setRxSettings({ ...rxSettings, tagline: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="rx-address" className="text-[11px] uppercase text-muted-foreground">Clinic Address</Label>
                    <Input
                      id="rx-address"
                      type="text"
                      className="h-9 text-xs"
                      value={rxSettings.address}
                      onChange={(e) => setRxSettings({ ...rxSettings, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="rx-phone" className="text-[11px] uppercase text-muted-foreground">Contact Phone</Label>
                      <Input
                        id="rx-phone"
                        type="text"
                        className="h-9 text-xs"
                        value={rxSettings.phone}
                        onChange={(e) => setRxSettings({ ...rxSettings, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rx-regno" className="text-[11px] uppercase text-muted-foreground">Hospital Reg No</Label>
                      <Input
                        id="rx-regno"
                        type="text"
                        className="h-9 text-xs"
                        value={rxSettings.regNo}
                        onChange={(e) => setRxSettings({ ...rxSettings, regNo: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Doctor Info */}
                <div className="space-y-3 border-t border-border pt-4">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                    <UserCheck className="h-4 w-4" aria-hidden /> Physician Credentials
                  </h4>

                  <div>
                    <Label htmlFor="rx-doctor-name" className="text-[11px] uppercase text-muted-foreground">Doctor Name</Label>
                    <Input
                      id="rx-doctor-name"
                      type="text"
                      className="h-9 text-xs"
                      value={rxSettings.doctorName}
                      onChange={(e) => setRxSettings({ ...rxSettings, doctorName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="rx-doctor-title" className="text-[11px] uppercase text-muted-foreground">Specialization</Label>
                      <Input
                        id="rx-doctor-title"
                        type="text"
                        className="h-9 text-xs"
                        value={rxSettings.doctorTitle}
                        onChange={(e) => setRxSettings({ ...rxSettings, doctorTitle: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="rx-doctor-regno" className="text-[11px] uppercase text-muted-foreground">Medical Reg No</Label>
                      <Input
                        id="rx-doctor-regno"
                        type="text"
                        className="h-9 text-xs"
                        value={rxSettings.doctorRegNo}
                        onChange={(e) => setRxSettings({ ...rxSettings, doctorRegNo: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Multi-Language Prescription Controls */}
                <div className="space-y-3 border-t border-border pt-4">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                    <Globe className="h-4 w-4" aria-hidden /> Patient Prescription Language
                  </h4>

                  <div>
                    <Label className="text-[11px] uppercase text-muted-foreground">Preferred Language</Label>
                    <LanguageSelector
                      selectedLanguage={preferredLanguage}
                      onSelectLanguage={setPreferredLanguage}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] uppercase text-muted-foreground">Display & Print Mode</Label>
                    <div className="mt-1 grid grid-cols-3 gap-1.5">
                      {(['bilingual', 'translated', 'english'] as const).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setDisplayMode(mode)}
                          aria-pressed={displayMode === mode}
                          className={`rounded-lg border px-2 py-1.5 text-[10px] font-bold capitalize transition-all ${
                            displayMode === mode
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {mode === 'bilingual' ? 'Dual' : mode === 'translated' ? 'Native' : 'English'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Print & Layout Toggles */}
                <div className="space-y-3 border-t border-border pt-4">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                    <Settings className="h-4 w-4" aria-hidden /> Layout & Print Options
                  </h4>

                  <div>
                    <Label className="text-[11px] uppercase text-muted-foreground">Header Layout</Label>
                    <div className="mt-1 grid grid-cols-3 gap-2">
                      {(['modern', 'classic', 'centered'] as const).map(style => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setRxSettings({ ...rxSettings, headerStyle: style })}
                          aria-pressed={rxSettings.headerStyle === style}
                          className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold capitalize transition-all ${rxSettings.headerStyle === style ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <Label className="text-[11px] uppercase text-muted-foreground">Element Visibility</Label>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-foreground">Show Vital Signs Strip</span>
                      <Switch checked={rxSettings.showVitals} onCheckedChange={(v) => setRxSettings({ ...rxSettings, showVitals: v })} label="Show Vital Signs Strip" />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-foreground">Show Clinical Diagnosis</span>
                      <Switch checked={rxSettings.showDiagnosis} onCheckedChange={(v) => setRxSettings({ ...rxSettings, showDiagnosis: v })} label="Show Clinical Diagnosis" />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-foreground">Show Advised Lab & Imaging Tests</span>
                      <Switch checked={rxSettings.showLabOrders} onCheckedChange={(v) => setRxSettings({ ...rxSettings, showLabOrders: v })} label="Show Advised Lab & Imaging Tests" />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-foreground">Show Digital Signature & Stamp</span>
                      <Switch checked={rxSettings.showDigitalSignature} onCheckedChange={(v) => setRxSettings({ ...rxSettings, showDigitalSignature: v })} label="Show Digital Signature & Stamp" />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-foreground">Show QR Verification Code</span>
                      <Switch checked={rxSettings.showQrCode} onCheckedChange={(v) => setRxSettings({ ...rxSettings, showQrCode: v })} label="Show QR Verification Code" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="rx-footer-terms" className="text-[11px] uppercase text-muted-foreground">Footer Disclaimer & Terms</Label>
                    <Textarea
                      id="rx-footer-terms"
                      rows={3}
                      className="min-h-0 resize-none text-xs"
                      value={rxSettings.footerTerms}
                      onChange={(e) => setRxSettings({ ...rxSettings, footerTerms: e.target.value })}
                    />
                  </div>
                </div>

              </div>

              {/* Right Prescription Document Sheet (Printable Canvas)
                  NOTE: the sheet below is a physical print document — it intentionally
                  keeps hard white-paper styling instead of theme tokens. */}
              <div className="flex flex-1 items-start justify-center overflow-y-auto bg-muted p-6 scrollbar-thin">

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
    </>
  );
}

/* ---------- Page-local presentation helpers (design-system composition only) ---------- */

function SectionCard({
  title, icon: Icon, description, actions, children, className,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`animate-fade-up ${className ?? ''}`}>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 p-5 pb-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && (
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden>
              <Icon className="h-4 w-4" />
            </span>
          )}
          <div className="min-w-0">
            <CardTitle className="truncate text-sm sm:text-base">{title}</CardTitle>
            {description && <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>}
          </div>
        </div>
        {actions}
      </CardHeader>
      <CardContent className="p-5 pt-0">{children}</CardContent>
    </Card>
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
    <Card className="group transition-colors hover:border-primary/40">
      <CardHeader className="flex-row items-center justify-between space-y-0 p-5 pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">Direct Writing</span>
      </CardHeader>
      <CardContent className="space-y-3 p-5 pt-0">
        {/* Quick Clinical Template Chips */}
        {templates.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {templates.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const newVal = value ? `${value}\n• ${tpl}` : `• ${tpl}`;
                  onChange(newVal);
                }}
                className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                + {tpl}
              </button>
            ))}
          </div>
        )}

        <Textarea
          className="h-28 min-h-0 text-xs leading-relaxed"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Type or select clinical findings for ${title.toLowerCase()}...`}
          aria-label={title}
        />
      </CardContent>
    </Card>
  );
}

function VitalItem({
  icon: Icon, iconClass, label, value, unit,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/40 p-3">
      <span className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${iconClass}`} aria-hidden>
        <Icon className="h-4 w-4" />
      </span>
      <div className="text-lg font-bold leading-tight tabular-nums text-foreground">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-subtle-foreground">{label} ({unit})</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between border-b border-border/60 py-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function SuggestionPopover({ items, onSelect }: { items: string[]; onSelect: (value: string) => void }) {
  return (
    <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-popover shadow-pop scrollbar-thin">
      {items.length > 0 ? items.map((item, idx) => (
        <button
          key={idx}
          type="button"
          className="w-full px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
          onClick={() => onSelect(item)}
        >
          {item}
        </button>
      )) : (
        <div className="px-4 py-2 text-sm text-muted-foreground">No suggestions found</div>
      )}
    </div>
  );
}
