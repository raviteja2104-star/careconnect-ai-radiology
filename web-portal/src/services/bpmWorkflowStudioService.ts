/**
 * CareConnect Enterprise BPM Workflow Studio Service (Phase 5.3)
 * Provides Low-Code/No-Code Forms, Rules Engine, Approval Chains, Versioning, Marketplace & AI Tasks.
 */

export interface WorkflowField {
  id: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'DROPDOWN' | 'PATIENT_SEARCH' | 'DOCTOR_SEARCH' | 'MEDICATION_SEARCH' | 'SIGNATURE' | 'FILE_UPLOAD' | 'BARCODE_QR';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface WorkflowForm {
  id: string;
  name: string;
  fields: WorkflowField[];
}

export interface WorkflowRule {
  id: string;
  name: string;
  ifCondition: string; // e.g. "patient.age < 5" or "patient.hbA1c > 9"
  thenAction: string;  // e.g. "Load Paediatric EMR" or "Show Diabetes Education"
}

export interface WorkflowApprovalStage {
  stageNumber: number;
  role: 'JUNIOR_DOCTOR' | 'SENIOR_CONSULTANT' | 'PHARMACY' | 'BILLING' | 'INSURANCE_DESK' | 'FINANCE';
  requiredApprovalCount: number;
  slaMinutes: number;
}

export interface WorkflowApprovalChain {
  id: string;
  name: string;
  stages: WorkflowApprovalStage[];
}

export interface WorkflowNotificationTemplate {
  id: string;
  name: string;
  channel: 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';
  subject?: string;
  bodyTemplate: string; // e.g. "Dear {{PatientName}}, your appointment with {{DoctorName}} is confirmed."
}

export interface WorkflowIntegrationConfig {
  id: string;
  name: string;
  protocol: 'REST_API' | 'FHIR_R4' | 'HL7_V2' | 'PACS_DICOM' | 'ABDM_ABHA' | 'PAYMENT_GATEWAY';
  endpointUrl: string;
  timeoutMs: number;
  retryPolicy: 'NONE' | 'EXPONENTIAL_BACKOFF';
}

export interface WorkflowVersionRecord {
  version: number;
  publishedAt: string;
  publishedBy: string;
  changeLog: string;
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'DEPRECATED' | 'ARCHIVED';
}

export interface WorkflowMarketplaceItem {
  id: string;
  title: string;
  category: string;
  author: string;
  downloadsCount: number;
  rating: number;
  description: string;
  tags: string[];
}

export const MARKETPLACE_TEMPLATES: WorkflowMarketplaceItem[] = [
  {
    id: 'mkt-opd-std',
    title: 'Standard OPD & AI Consultation Flow',
    category: 'OPD',
    author: 'CareConnect Health Tech',
    downloadsCount: 1420,
    rating: 4.9,
    description: 'Complete token check-in, nurse vitals, specialty EMR, AI drug safety, e-Rx & multi-channel notification dispatch.',
    tags: ['OPD', 'EMR', 'AI Scribe', 'Pharmacy']
  },
  {
    id: 'mkt-er-sepsis',
    title: 'Emergency Trauma & Sepsis 1-Hour Bundle',
    category: 'Emergency',
    author: 'Mayo Clinic Protocol Standards',
    downloadsCount: 980,
    rating: 5.0,
    description: 'Rapid ESI level 1-5 triage decision gate with automated Sepsis bundle timers and STAT lab/ICU alerts.',
    tags: ['Emergency', 'Sepsis Timer', 'ICU', 'Triage']
  },
  {
    id: 'mkt-cardio-hub',
    title: 'Cardiology Clinic & ECG/Echo Pathway',
    category: 'Cardiology',
    author: 'Apollo Hospitals Clinical Board',
    downloadsCount: 750,
    rating: 4.8,
    description: 'Auto-loads CHA₂DS₂-VASc scores, troponin-I lab triggers, ECG DICOM integration, and lipid panel alerts.',
    tags: ['Cardiology', 'ECG', 'Calculators', 'PACS']
  },
  {
    id: 'mkt-diab-care',
    title: 'Diabetology HbA1c & Foot Care Journey',
    category: 'Diabetology',
    author: 'CareConnect Clinical AI Team',
    downloadsCount: 610,
    rating: 4.9,
    description: 'IF HbA1c > 9% rule triggers dietitian auto-referral, CGMS telemetry logging, and multi-language patient education.',
    tags: ['Diabetology', 'HbA1c', 'Dietitian', 'Rule Engine']
  }
];

class BpmWorkflowStudioService {
  private forms: WorkflowForm[] = [
    {
      id: 'form-triage-1',
      name: 'Nurse Station Vitals & Acuity Form',
      fields: [
        { id: 'f1', label: 'Patient Name', type: 'PATIENT_SEARCH', required: true },
        { id: 'f2', label: 'Systolic BP (mmHg)', type: 'NUMBER', required: true, placeholder: '120' },
        { id: 'f3', label: 'Heart Rate (bpm)', type: 'NUMBER', required: true, placeholder: '72' },
        { id: 'f4', label: 'Oxygen Saturation (SpO2 %)', type: 'NUMBER', required: true, placeholder: '98' },
        { id: 'f5', label: 'Chief Complaint', type: 'TEXT', required: true, placeholder: 'Describe symptoms...' },
        { id: 'f6', label: 'Attending Doctor', type: 'DOCTOR_SEARCH', required: true }
      ]
    }
  ];

  private rules: WorkflowRule[] = [
    { id: 'r1', name: 'Paediatric EMR Trigger', ifCondition: 'patient.age < 5', thenAction: 'Load Paediatric EMR & Growth Charts' },
    { id: 'r2', name: 'Cardiology ECG Auto-Load', ifCondition: 'consultation.specialty == "Cardiology"', thenAction: 'Load ECG Widget & CHA2DS2-VASc Calculator' },
    { id: 'r3', name: 'High HbA1c Dietitian Alert', ifCondition: 'lab.hbA1c > 9.0', thenAction: 'Trigger Dietitian Auto-Referral & Diabetes Education PDF' }
  ];

  private approvalChains: WorkflowApprovalChain[] = [
    {
      id: 'app-rx-high-risk',
      name: 'High-Risk Controlled Drug Rx Approval',
      stages: [
        { stageNumber: 1, role: 'JUNIOR_DOCTOR', requiredApprovalCount: 1, slaMinutes: 15 },
        { stageNumber: 2, role: 'SENIOR_CONSULTANT', requiredApprovalCount: 1, slaMinutes: 30 },
        { stageNumber: 3, role: 'PHARMACY', requiredApprovalCount: 1, slaMinutes: 20 }
      ]
    }
  ];

  private notifications: WorkflowNotificationTemplate[] = [
    {
      id: 'notif-app-confirm',
      name: 'Appointment Confirmation WhatsApp & SMS',
      channel: 'WHATSAPP',
      bodyTemplate: 'Dear {{PatientName}}, your appointment with {{DoctorName}} at {{HospitalName}} is confirmed for {{AppointmentDate}}. Token #{{TokenNumber}}.'
    }
  ];

  private integrations: WorkflowIntegrationConfig[] = [
    {
      id: 'int-abdm',
      name: 'ABDM ABHA Health ID Gateway',
      protocol: 'ABDM_ABHA',
      endpointUrl: 'https://healthidsbx.abdm.gov.in/api/v1/registration',
      timeoutMs: 5000,
      retryPolicy: 'EXPONENTIAL_BACKOFF'
    },
    {
      id: 'int-pacs',
      name: 'Orthanc DICOM Radiology PACS Server',
      protocol: 'PACS_DICOM',
      endpointUrl: 'http://pacs.careconnect.hospital:8042/dicom-web',
      timeoutMs: 10000,
      retryPolicy: 'EXPONENTIAL_BACKOFF'
    }
  ];

  public getForms() { return this.forms; }
  public getRules() { return this.rules; }
  public getApprovalChains() { return this.approvalChains; }
  public getNotifications() { return this.notifications; }
  public getIntegrations() { return this.integrations; }
  public getMarketplaceItems() { return MARKETPLACE_TEMPLATES; }

  public addForm(form: WorkflowForm) {
    this.forms.push(form);
    return form;
  }

  public addRule(rule: WorkflowRule) {
    this.rules.push(rule);
    return rule;
  }

  public simulateWorkflow(definitionId: string) {
    return {
      simulatedId: `SIM-${Math.floor(1000 + Math.random() * 9000)}`,
      executionTimeMs: 420,
      nodesExecutedCount: 7,
      rulesTriggered: ['r2', 'r3'],
      slaBreachesCount: 0,
      status: 'SIMULATION_SUCCESS',
      outputLog: [
        '[0.00s] START: Patient Arrival Token #14',
        '[0.05s] RECEPTION: ABDM Insurance Check OK',
        '[0.12s] NURSE: Vitals Logged (BP 130/85, HR 78, SpO2 98%)',
        '[0.22s] RULE EVAL: Specialty = Cardiology -> ECG Widget Loaded',
        '[0.31s] DOCTOR: Consultation & AI Scribe SOAP Note generated',
        '[0.38s] AI TASK: No drug interactions detected with Telmisartan 40mg',
        '[0.42s] COMPLETED: Rx dispatched via WhatsApp'
      ]
    };
  }
}

export const bpmWorkflowStudioService = new BpmWorkflowStudioService();
