/**
 * CareConnect Enterprise AI Platform Service (Phase 7)
 * Orchestrates AI Scribe, Medical Coding (ICD-10/CPT), Clinical Decision Support (CDS),
 * RAG Knowledge Hub, Multilingual Translation, Human Review Queue, & Model Registry.
 */

export interface AIAgentRecord {
  id: string;
  name: string;
  role: 'EMR_SCRIBE' | 'CDS_ASSISTANT' | 'NURSE_ASSISTANT' | 'PHARMACY_ASSISTANT' | 'LAB_ASSISTANT' | 'RADIOLOGY_ASSISTANT' | 'ICU_ASSISTANT' | 'BILLING_ASSISTANT' | 'PATIENT_ASSISTANT';
  model: string;
  systemPrompt: string;
  allowedTools: string[];
  confidenceThreshold: number;
  humanApprovalRequired: boolean;
  status: 'ACTIVE' | 'PAUSED';
}

export interface AIReviewRecord {
  id: string;
  agentName: string;
  taskType: 'SOAP_SCRIBE' | 'ICD10_CODING' | 'DRUG_INTERACTION' | 'TRANSLATION';
  patientId: string;
  clinicianName: string;
  aiOutput: string;
  status: 'PENDING' | 'ACCEPTED' | 'EDITED' | 'REJECTED';
  confidencePct: number;
  timestamp: string;
  clinicianNotes?: string;
}

export interface AIModelRecord {
  id: string;
  name: string;
  provider: 'OPENAI' | 'ANTHROPIC' | 'GOOGLE_VERTEX' | 'MICROSOFT_AZURE' | 'LOCAL_LLAMA';
  version: string;
  type: 'LLM_REASONING' | 'MEDICAL_SCRIBE' | 'EMBEDDING' | 'VISION_DICOM' | 'SPEECH_STT';
  costPer1kTokensUSD: number;
  avgLatencyMs: number;
  status: 'PRODUCTION' | 'STAGING' | 'DEPRECATED';
}

export interface AIAnalyticsData {
  totalRequests24h: number;
  acceptedPct: number;
  overridePct: number;
  timeSavedHours: number;
  avgLatencyMs: number;
  codingAccuracyPct: number;
  translationsCount: number;
  costTotalUSD: number;
}

export const INITIAL_AI_AGENTS: AIAgentRecord[] = [
  {
    id: 'agent-scribe-01',
    name: 'Clinical Ambient AI Scribe',
    role: 'EMR_SCRIBE',
    model: 'Med-PaLM 2 Clinical / GPT-4o',
    systemPrompt: 'You are an expert medical scribe assistant. Extract Chief Complaint, HPI, Examination, Assessment, and Plan into structured SOAP Notes from doctor-patient dialog.',
    allowedTools: ['SOAP_GENERATOR', 'ICD10_SUGGESTER', 'RX_SAFETY_CHECK'],
    confidenceThreshold: 85,
    humanApprovalRequired: true,
    status: 'ACTIVE'
  },
  {
    id: 'agent-cds-02',
    name: 'Cardiology & Intensive Care CDS Copilot',
    role: 'CDS_ASSISTANT',
    model: 'Claude 3.5 Sonnet Medical',
    systemPrompt: 'Monitor vital sign trends, NEWS2 scores, ECG waveforms, and lab values to flag early sepsis, cardiac deterioration, and drug-drug contraindications.',
    allowedTools: ['NEWS2_CALCULATOR', 'CHA2DS2_VASc_SCORER', 'DRUG_INTERACTION_DB'],
    confidenceThreshold: 90,
    humanApprovalRequired: true,
    status: 'ACTIVE'
  },
  {
    id: 'agent-coding-03',
    name: 'Autonomous Medical Coding & Billing AI',
    role: 'BILLING_ASSISTANT',
    model: 'GPT-4o Medical Coding',
    systemPrompt: 'Analyze clinical consultation notes and procedure logs to generate draft ICD-10-CM diagnoses, CPT codes, and SNOMED CT terms.',
    allowedTools: ['ICD10_DB', 'CPT_DB', 'LOINC_MAPPER'],
    confidenceThreshold: 88,
    humanApprovalRequired: true,
    status: 'ACTIVE'
  }
];

export const INITIAL_AI_REVIEWS: AIReviewRecord[] = [
  {
    id: 'rev-101',
    agentName: 'Clinical Ambient AI Scribe',
    taskType: 'SOAP_SCRIBE',
    patientId: 'P-90214 (Rajesh Rao)',
    clinicianName: 'Dr. Raj Sharma',
    aiOutput: 'SOAP Note: Patient reports 3-day history of dyspnea and bilateral ankle edema. BP 142/88, HR 82. Assessment: Stage 2 Hypertensive Heart Disease. Plan: Telmisartan 40mg PO QD, Furosemide 20mg PO QD.',
    status: 'ACCEPTED',
    confidencePct: 96,
    timestamp: '2026-07-25T11:40:00Z'
  },
  {
    id: 'rev-102',
    agentName: 'Autonomous Medical Coding AI',
    taskType: 'ICD10_CODING',
    patientId: 'P-90215 (Sunita Patel)',
    clinicianName: 'Dr. Anita Desai',
    aiOutput: 'ICD-10 Code Draft: I11.9 (Hypertensive heart disease without heart failure), E11.9 (Type 2 diabetes mellitus without complications).',
    status: 'ACCEPTED',
    confidencePct: 94,
    timestamp: '2026-07-25T12:05:00Z'
  },
  {
    id: 'rev-103',
    agentName: 'Cardiology & Intensive Care CDS Copilot',
    taskType: 'DRUG_INTERACTION',
    patientId: 'P-90216 (Vikram Singh)',
    clinicianName: 'Dr. Raj Sharma',
    aiOutput: 'Alert: Potential moderate interaction between Clopidogrel and Omeprazole (reduced antiplatelet effect). Recommend Pantoprazole alternative.',
    status: 'EDITED',
    confidencePct: 89,
    timestamp: '2026-07-25T12:20:00Z',
    clinicianNotes: 'Accepted recommendation; switched to Pantoprazole 40mg.'
  }
];

export const INITIAL_AI_MODELS: AIModelRecord[] = [
  { id: 'mod-gpt4o', name: 'GPT-4o Omnimodal', provider: 'OPENAI', version: '2026-05-01', type: 'LLM_REASONING', costPer1kTokensUSD: 0.005, avgLatencyMs: 340, status: 'PRODUCTION' },
  { id: 'mod-medpalm', name: 'Med-PaLM 2 Clinical', provider: 'GOOGLE_VERTEX', version: 'v2.4', type: 'MEDICAL_SCRIBE', costPer1kTokensUSD: 0.004, avgLatencyMs: 380, status: 'PRODUCTION' },
  { id: 'mod-claude35', name: 'Claude 3.5 Sonnet Health', provider: 'ANTHROPIC', version: '3.5.1', type: 'LLM_REASONING', costPer1kTokensUSD: 0.003, avgLatencyMs: 310, status: 'PRODUCTION' },
  { id: 'mod-whisper', name: 'Whisper v3 Speech-to-Text', provider: 'OPENAI', version: 'v3-large', type: 'SPEECH_STT', costPer1kTokensUSD: 0.001, avgLatencyMs: 180, status: 'PRODUCTION' }
];

class AIPlatformService {
  private agents: AIAgentRecord[] = [...INITIAL_AI_AGENTS];
  private reviews: AIReviewRecord[] = [...INITIAL_AI_REVIEWS];
  private models: AIModelRecord[] = [...INITIAL_AI_MODELS];

  public getAgents() { return this.agents; }
  public getReviews() { return this.reviews; }
  public getModels() { return this.models; }

  public addAgent(agent: AIAgentRecord) {
    this.agents.push(agent);
    return agent;
  }

  public submitReviewDecision(reviewId: string, status: 'ACCEPTED' | 'EDITED' | 'REJECTED', notes?: string) {
    const rev = this.reviews.find(r => r.id === reviewId);
    if (rev) {
      rev.status = status;
      if (notes) rev.clinicianNotes = notes;
    }
    return rev;
  }

  public generateSOAPScribe(dictationText: string) {
    return {
      soapNote: {
        subjective: `Patient reports: "${dictationText || 'Shortness of breath for 2 days, mild fever.'}"`,
        objective: 'Vitals: BP 130/84 mmHg, HR 78 bpm, SpO2 97%, Temp 98.6°F. Chest clear to auscultation.',
        assessment: '1. Acute Upper Respiratory Tract Infection (ICD-10 J06.9)\n2. Essential Hypertension (ICD-10 I10)',
        plan: '1. Paracetamol 650mg PO TDS for 3 days.\n2. Steam inhalation & warm fluids.\n3. Continue regular Telmisartan 40mg PO QD.\n4. Review in 5 days if symptoms persist.'
      },
      icd10Draft: ['J06.9', 'I10'],
      confidencePct: 95,
      ragCitations: ['CareConnect Outpatient Treatment Protocol 2026', 'WHO Respiratory Guidelines']
    };
  }

  public getAnalytics(): AIAnalyticsData {
    return {
      totalRequests24h: 1420,
      acceptedPct: 94.6,
      overridePct: 5.4,
      timeSavedHours: 42.5,
      avgLatencyMs: 330,
      codingAccuracyPct: 96.2,
      translationsCount: 384,
      costTotalUSD: 14.80
    };
  }
}

export const aiPlatformService = new AIPlatformService();
