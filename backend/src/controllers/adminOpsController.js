const AdminOpsRecord = require('../models/AdminOpsRecord');

// Seed data inserted the first time a type is queried with no records.
const SEEDS = {
  project: [
    { id: 'proj-101', hospitalName: 'Apollo Super Specialty Hospital Main', stage: 'HYPERCARE', implementationPct: 98, healthScorePct: 96, targetGoLiveDate: '2026-07-20', assignedProjectManager: 'Vikram Mehta', raidRiskCount: 1 },
    { id: 'proj-102', hospitalName: 'Fortis Healthcare Jubilee Hills', stage: 'DATA_MIGRATION', implementationPct: 65, healthScorePct: 92, targetGoLiveDate: '2026-08-15', assignedProjectManager: 'Ananya Roy', raidRiskCount: 2 },
    { id: 'proj-103', hospitalName: 'Manipal Academic Medical Centre', stage: 'IMPLEMENTATION', implementationPct: 40, healthScorePct: 88, targetGoLiveDate: '2026-09-01', assignedProjectManager: 'Karan Malhotra', raidRiskCount: 3 },
  ],
  device: [
    { id: 'dev-inst-01', deviceName: 'Orthanc PACS DICOM Gateway 01', category: 'PACS', department: 'Radiology', status: 'CERTIFIED', certifiedBy: 'Eng. Ramesh' },
    { id: 'dev-inst-02', deviceName: 'Beckman Coulter LIS Analyzer 02', category: 'LIS_ANALYZER', department: 'Central Lab', status: 'TESTED', certifiedBy: 'Eng. Sneha' },
    { id: 'dev-inst-03', deviceName: 'Mindray ICU Monitor Bed 04-12', category: 'ICU_MONITOR', department: 'ICU Ward', status: 'INSTALLED', certifiedBy: 'Pending Certification' },
  ],
  lms_course: [
    { id: 'lms-101', role: 'DOCTOR', courseName: 'Smart Specialty EMR & Ambient AI Scribe Workflow', completionPct: 94, certifiedUsersCount: 142, totalEnrolledCount: 150 },
    { id: 'lms-102', role: 'NURSE', courseName: 'Nurse Station Vitals & ICU Monitor Flow', completionPct: 98, certifiedUsersCount: 280, totalEnrolledCount: 285 },
    { id: 'lms-103', role: 'BILLER', courseName: 'RCM Billing Masters & ABDM Claims Engine', completionPct: 90, certifiedUsersCount: 45, totalEnrolledCount: 50 },
  ],
  release: [
    { environment: 'PRODUCTION_MAIN', version: 'v1.1.0-hardened', deployedAt: '2026-07-25T18:00:00Z', status: 'HEALTHY', activeTrafficPct: 90 },
    { environment: 'PRODUCTION_CANARY', version: 'v1.1.1-canary', deployedAt: '2026-07-25T19:00:00Z', status: 'HEALTHY', activeTrafficPct: 10 },
    { environment: 'STAGING', version: 'v1.2.0-rc1', deployedAt: '2026-07-25T19:30:00Z', status: 'HEALTHY', activeTrafficPct: 0 },
  ],
  ai_agent: [
    {
      id: 'agent-drug-safety',
      name: 'Drug Interaction Safety Agent',
      type: 'SAFETY_CHECK',
      description: 'Checks every new prescription against RxNorm contraindication tables and patient allergy profile before sign-off.',
      model: 'claude-haiku-4-5-20251001',
      trigger: 'On prescription draft saved',
      status: 'ACTIVE',
      totalRunsToday: 98,
      avgResponseMs: 840,
      successRatePct: 99.5,
      lastTriggeredAt: new Date(Date.now() - 4 * 60000).toISOString(),
    },
    {
      id: 'agent-icd-coder',
      name: 'ICD-10 / CPT Auto-Coding Agent',
      type: 'CODING',
      description: 'Suggests ICD-10 diagnosis codes and CPT procedure codes from completed SOAP notes to streamline billing.',
      model: 'BioMedLM-ICD10-v2',
      trigger: 'On SOAP note signed by doctor',
      status: 'ACTIVE',
      totalRunsToday: 74,
      avgResponseMs: 190,
      successRatePct: 97.3,
      lastTriggeredAt: new Date(Date.now() - 9 * 60000).toISOString(),
    },
    {
      id: 'agent-lab-alert',
      name: 'Critical Lab Value Alerting Agent',
      type: 'ALERTING',
      description: 'Monitors lab results in real-time and fires WhatsApp + in-app alerts to the ordering doctor when values breach critical thresholds.',
      model: 'BioMedLM-ICD10-v2',
      trigger: 'On lab result verified by technician',
      status: 'ACTIVE',
      totalRunsToday: 23,
      avgResponseMs: 120,
      successRatePct: 100,
      lastTriggeredAt: new Date(Date.now() - 22 * 60000).toISOString(),
    },
    {
      id: 'agent-fhir-summary',
      name: 'ABDM FHIR Discharge Summary Agent',
      type: 'SUMMARISATION',
      description: 'Auto-generates ABDM-compliant FHIR R4 discharge summaries from inpatient EMR data and pushes to the patient\'s ABHA health locker.',
      model: 'claude-sonnet-5',
      trigger: 'On IPD discharge order created',
      status: 'ACTIVE',
      totalRunsToday: 11,
      avgResponseMs: 3200,
      successRatePct: 98.9,
      lastTriggeredAt: new Date(Date.now() - 47 * 60000).toISOString(),
    },
    {
      id: 'agent-cxr-screen',
      name: 'Chest X-Ray Pre-Screening Agent',
      type: 'IMAGING',
      description: 'Runs preliminary CXR classification (normal / consolidation / pleural effusion / cardiomegaly) and flags for radiologist triage.',
      model: 'CXR-Classifier-ResNet50-v3',
      trigger: 'On DICOM study uploaded to PACS',
      status: 'STAGING',
      totalRunsToday: 0,
      avgResponseMs: 340,
      successRatePct: 95.1,
      lastTriggeredAt: null,
    },
    {
      id: 'agent-patient-edu',
      name: 'Multilingual Patient Education Agent',
      type: 'TRANSLATION',
      description: 'Translates discharge instructions, medication guides, and diet plans into Hindi, Telugu, and Tamil for patient comprehension.',
      model: 'IndicTrans2-En-Hi',
      trigger: 'On discharge instruction PDF generated',
      status: 'ACTIVE',
      totalRunsToday: 34,
      avgResponseMs: 220,
      successRatePct: 99.6,
      lastTriggeredAt: new Date(Date.now() - 15 * 60000).toISOString(),
    },
  ],
  ai_review: [
    {
      id: 'rev-001',
      type: 'SOAP_NOTE',
      patientDisplay: 'Patient #APL-20453 (M, 62y)',
      summary: 'AI-generated SOAP note for hypertension follow-up with ACE inhibitor adjustment.',
      generatedBy: 'AI Scribe (claude-haiku-4-5-20251001)',
      assignedTo: 'Dr. Priya Sharma',
      priority: 'HIGH',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    },
    {
      id: 'rev-002',
      type: 'DRUG_INTERACTION',
      patientDisplay: 'Patient #APL-20401 (F, 45y)',
      summary: 'Potential interaction flagged: Warfarin + newly prescribed Amoxicillin. Confidence 91%.',
      generatedBy: 'Drug Interaction Safety Agent',
      assignedTo: 'Dr. Rajan Pillai',
      priority: 'HIGH',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    },
    {
      id: 'rev-003',
      type: 'ICD_CODING',
      patientDisplay: 'Patient #APL-20389 (M, 38y)',
      summary: 'ICD-10 suggestion: I10 (Essential Hypertension) + E11.9 (Type 2 Diabetes). CPT: 99214.',
      generatedBy: 'ICD-10 / CPT Auto-Coding Agent',
      assignedTo: 'Billing Team',
      priority: 'MEDIUM',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 31 * 60000).toISOString(),
    },
    {
      id: 'rev-004',
      type: 'DISCHARGE_SUMMARY',
      patientDisplay: 'Patient #APL-20310 (F, 71y)',
      summary: 'ABDM FHIR discharge summary generated for 5-day IPD admission (cholecystitis). Awaiting consultant approval.',
      generatedBy: 'ABDM FHIR Discharge Summary Agent',
      assignedTo: 'Dr. Suresh Nair',
      priority: 'MEDIUM',
      status: 'APPROVED',
      createdAt: new Date(Date.now() - 90 * 60000).toISOString(),
    },
    {
      id: 'rev-005',
      type: 'IMAGING',
      patientDisplay: 'Patient #APL-20267 (M, 55y)',
      summary: 'CXR pre-screen: Possible right lower lobe consolidation (confidence 78%). Flagged for radiologist review.',
      generatedBy: 'Chest X-Ray Pre-Screening Agent',
      assignedTo: 'Dr. Meera Krishnan (Radiology)',
      priority: 'HIGH',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 55 * 60000).toISOString(),
    },
    {
      id: 'rev-006',
      type: 'DRUG_INTERACTION',
      patientDisplay: 'Patient #APL-20198 (F, 29y)',
      summary: 'No critical interactions found for new antibiotic course. Safety agent cleared for auto-approval.',
      generatedBy: 'Drug Interaction Safety Agent',
      assignedTo: 'Dr. Arjun Menon',
      priority: 'LOW',
      status: 'APPROVED',
      createdAt: new Date(Date.now() - 130 * 60000).toISOString(),
    },
  ],
  ai_model: [
    {
      id: 'model-haiku-scribe',
      name: 'claude-haiku-4-5-20251001',
      provider: 'Anthropic',
      useCase: 'Clinical AI Scribe — SOAP Note Generation',
      status: 'ACTIVE',
      deployedAt: '2026-09-01',
      avgLatencyMs: 1240,
      p99LatencyMs: 2850,
      successRatePct: 99.2,
      costPer1kTokens: 0.025,
      totalCallsToday: 142,
      maxTokens: 1024,
      region: 'us-east-1',
    },
    {
      id: 'model-claude-cds',
      name: 'claude-sonnet-5',
      provider: 'Anthropic',
      useCase: 'Clinical Decision Support & Drug Interaction Check',
      status: 'ACTIVE',
      deployedAt: '2026-09-10',
      avgLatencyMs: 3100,
      p99LatencyMs: 6200,
      successRatePct: 98.8,
      costPer1kTokens: 0.30,
      totalCallsToday: 58,
      maxTokens: 4096,
      region: 'us-east-1',
    },
    {
      id: 'model-icd-coder',
      name: 'BioMedLM-ICD10-v2',
      provider: 'CareConnect AI Labs (on-premise)',
      useCase: 'ICD-10 & CPT Automatic Medical Coding',
      status: 'ACTIVE',
      deployedAt: '2026-07-15',
      avgLatencyMs: 180,
      p99LatencyMs: 420,
      successRatePct: 97.4,
      costPer1kTokens: 0,
      totalCallsToday: 310,
      maxTokens: 512,
      region: 'on-premise',
    },
    {
      id: 'model-radiology-ai',
      name: 'CXR-Classifier-ResNet50-v3',
      provider: 'CareConnect AI Labs (on-premise)',
      useCase: 'Chest X-Ray Preliminary Screening',
      status: 'STAGING',
      deployedAt: '2026-09-20',
      avgLatencyMs: 340,
      p99LatencyMs: 680,
      successRatePct: 95.1,
      costPer1kTokens: 0,
      totalCallsToday: 0,
      maxTokens: null,
      region: 'on-premise',
    },
    {
      id: 'model-translation',
      name: 'IndicTrans2-En-Hi',
      provider: 'AI4Bharat (open-source)',
      useCase: 'Patient Education Content — Hindi / Telugu / Tamil Translation',
      status: 'ACTIVE',
      deployedAt: '2026-08-05',
      avgLatencyMs: 210,
      p99LatencyMs: 450,
      successRatePct: 99.6,
      costPer1kTokens: 0,
      totalCallsToday: 87,
      maxTokens: 2048,
      region: 'on-premise',
    },
  ],
  workflow_form: [
    {
      id: 'form-triage-1', name: 'Nurse Station Vitals & Acuity Form',
      fields: [
        { id: 'f1', label: 'Patient Name', type: 'PATIENT_SEARCH', required: true },
        { id: 'f2', label: 'Systolic BP (mmHg)', type: 'NUMBER', required: true, placeholder: '120' },
        { id: 'f3', label: 'Heart Rate (bpm)', type: 'NUMBER', required: true, placeholder: '72' },
        { id: 'f4', label: 'Oxygen Saturation (SpO2 %)', type: 'NUMBER', required: true, placeholder: '98' },
        { id: 'f5', label: 'Chief Complaint', type: 'TEXT', required: true, placeholder: 'Describe symptoms...' },
        { id: 'f6', label: 'Attending Doctor', type: 'DOCTOR_SEARCH', required: true },
      ],
    },
  ],
  workflow_rule: [
    { id: 'r1', name: 'Paediatric EMR Trigger', ifCondition: 'patient.age < 5', thenAction: 'Load Paediatric EMR & Growth Charts' },
    { id: 'r2', name: 'Cardiology ECG Auto-Load', ifCondition: 'consultation.specialty == "Cardiology"', thenAction: 'Load ECG Widget & CHA2DS2-VASc Calculator' },
    { id: 'r3', name: 'High HbA1c Dietitian Alert', ifCondition: 'lab.hbA1c > 9.0', thenAction: 'Trigger Dietitian Auto-Referral & Diabetes Education PDF' },
  ],
  workflow_approval: [
    {
      id: 'app-rx-high-risk', name: 'High-Risk Controlled Drug Rx Approval',
      stages: [
        { stageNumber: 1, role: 'JUNIOR_DOCTOR', requiredApprovalCount: 1, slaMinutes: 15 },
        { stageNumber: 2, role: 'SENIOR_CONSULTANT', requiredApprovalCount: 1, slaMinutes: 30 },
        { stageNumber: 3, role: 'PHARMACY', requiredApprovalCount: 1, slaMinutes: 20 },
      ],
    },
  ],
  workflow_notification: [
    {
      id: 'notif-app-confirm', name: 'Appointment Confirmation WhatsApp & SMS',
      channel: 'WHATSAPP',
      bodyTemplate: 'Dear {{PatientName}}, your appointment with {{DoctorName}} at {{HospitalName}} is confirmed for {{AppointmentDate}}. Token #{{TokenNumber}}.',
    },
  ],
  workflow_integration: [
    { id: 'int-abdm', name: 'ABDM ABHA Health ID Gateway', protocol: 'ABDM_ABHA', endpointUrl: 'https://healthidsbx.abdm.gov.in/api/v1/registration', timeoutMs: 5000, retryPolicy: 'EXPONENTIAL_BACKOFF' },
    { id: 'int-pacs', name: 'Orthanc DICOM Radiology PACS Server', protocol: 'PACS_DICOM', endpointUrl: 'http://pacs.careconnect.hospital:8042/dicom-web', timeoutMs: 10000, retryPolicy: 'EXPONENTIAL_BACKOFF' },
  ],
  workflow_definition: [
    { id: 'tmpl-opd-01', key: 'opd-consultation', name: 'OPD Consultation & EMR Workflow', category: 'OPD', description: 'Standard outpatient workflow from registration token to multi-language e-prescription and billing checkout.', version: 1, status: 'PUBLISHED', updatedAt: '2026-07-25', nodes: [ { id: 'n1', type: 'START', label: 'Patient Arrival & Token Generated', position: { x: 50, y: 150 } }, { id: 'n2', type: 'USER_TASK', label: 'Reception Check-in & Insurance Verification', assignedRole: 'RECEPTIONIST', slaMinutes: 10, position: { x: 250, y: 150 } }, { id: 'n3', type: 'USER_TASK', label: 'Nurse Station Vitals Entry', assignedRole: 'NURSE', slaMinutes: 15, position: { x: 450, y: 150 } }, { id: 'n4', type: 'USER_TASK', label: 'Doctor Specialty Consultation', assignedRole: 'DOCTOR', slaMinutes: 30, position: { x: 650, y: 150 } }, { id: 'n5', type: 'AI_TASK', label: 'AI Scribe & Drug Interaction Check', assignedRole: 'AI_AGENT', aiTaskType: 'DRUG_INTERACTION', position: { x: 850, y: 150 } }, { id: 'n6', type: 'EXCLUSIVE_GATEWAY', label: 'Investigations Ordered?', position: { x: 1050, y: 150 } }, { id: 'n7', type: 'USER_TASK', label: 'Pharmacy Medicine Dispense', assignedRole: 'PHARMACY', slaMinutes: 20, position: { x: 1250, y: 80 } }, { id: 'n8', type: 'USER_TASK', label: 'Billing Counter Settlement', assignedRole: 'BILLING', slaMinutes: 15, position: { x: 1250, y: 220 } }, { id: 'n9', type: 'END', label: 'Consultation Completed', position: { x: 1450, y: 150 } } ], transitions: [ { id: 't1', sourceNodeId: 'n1', targetNodeId: 'n2' }, { id: 't2', sourceNodeId: 'n2', targetNodeId: 'n3' }, { id: 't3', sourceNodeId: 'n3', targetNodeId: 'n4' }, { id: 't4', sourceNodeId: 'n4', targetNodeId: 'n5' }, { id: 't5', sourceNodeId: 'n5', targetNodeId: 'n6' }, { id: 't6', sourceNodeId: 'n6', targetNodeId: 'n7', conditionLabel: 'No Labs / Prescribed Only' }, { id: 't7', sourceNodeId: 'n6', targetNodeId: 'n8', conditionLabel: 'Labs Required' }, { id: 't8', sourceNodeId: 'n7', targetNodeId: 'n9' }, { id: 't9', sourceNodeId: 'n8', targetNodeId: 'n9' } ] },
    { id: 'tmpl-er-02', key: 'emergency-trauma', name: 'Emergency Room (ER) & Sepsis Protocol', category: 'EMERGENCY', description: 'High-acuity triage (ESI Level 1-5), Sepsis 1-hour bundle execution, and rapid ICU bed allocation.', version: 1, status: 'PUBLISHED', updatedAt: '2026-07-25', nodes: [ { id: 'n10', type: 'START', label: 'Ambulance / Walk-in Trauma Triage', position: { x: 50, y: 150 } }, { id: 'n11', type: 'DECISION', label: 'Evaluate ESI Triage Level (1-5)', conditionExpression: 'patient.esiLevel <= 2', position: { x: 250, y: 150 } }, { id: 'n12', type: 'SLA_MONITOR', label: 'Sepsis 1-Hour Bundle Timer', slaMinutes: 60, position: { x: 450, y: 80 } }, { id: 'n13', type: 'USER_TASK', label: 'Resuscitation & STAT Blood Gas', assignedRole: 'DOCTOR', slaMinutes: 15, position: { x: 650, y: 150 } }, { id: 'n14', type: 'END', label: 'Admitted to ICU / OT', position: { x: 850, y: 150 } } ], transitions: [ { id: 't10', sourceNodeId: 'n10', targetNodeId: 'n11' }, { id: 't11', sourceNodeId: 'n11', targetNodeId: 'n12', conditionLabel: 'Emergent (ESI 1-2)' }, { id: 't12', sourceNodeId: 'n12', targetNodeId: 'n13' }, { id: 't13', sourceNodeId: 'n13', targetNodeId: 'n14' } ] },
    { id: 'tmpl-discharge-03', key: 'ipd-discharge', name: 'IPD Discharge & ABDM FHIR Summary', category: 'IPD', description: 'Inpatient discharge workflow with pharmacy reconciliation, billing clearance, and ABDM FHIR health record generation.', version: 1, status: 'DRAFT', updatedAt: '2026-07-25', nodes: [ { id: 'dn1', type: 'START', label: 'Discharge Initiated by Consultant', position: { x: 50, y: 150 } }, { id: 'dn2', type: 'USER_TASK', label: 'Final Bill Generation & Insurance Claim', assignedRole: 'BILLING', slaMinutes: 30, position: { x: 250, y: 150 } }, { id: 'dn3', type: 'USER_TASK', label: 'Pharmacy Final Reconciliation', assignedRole: 'PHARMACY', slaMinutes: 20, position: { x: 450, y: 150 } }, { id: 'dn4', type: 'AI_TASK', label: 'ABDM FHIR Discharge Summary AI', assignedRole: 'AI_AGENT', aiTaskType: 'SUMMARISE', position: { x: 650, y: 150 } }, { id: 'dn5', type: 'END', label: 'Patient Discharged & Records Filed', position: { x: 850, y: 150 } } ], transitions: [ { id: 'dt1', sourceNodeId: 'dn1', targetNodeId: 'dn2' }, { id: 'dt2', sourceNodeId: 'dn2', targetNodeId: 'dn3' }, { id: 'dt3', sourceNodeId: 'dn3', targetNodeId: 'dn4' }, { id: 'dt4', sourceNodeId: 'dn4', targetNodeId: 'dn5' } ] },
  ],
  commercial_partner: [
    { id: 'cp-01', partnerName: 'Philips HealthSuite', type: 'DEVICE_ISV', tier: 'STRATEGIC', revenueSharePct: 12, activeDeployments: 8 },
    { id: 'cp-02', partnerName: 'AWS HealthLake', type: 'AI_VENDOR', tier: 'GOLD_PARTNER', revenueSharePct: 8, activeDeployments: 5 },
    { id: 'cp-03', partnerName: 'Siemens Healthineers India', type: 'DEVICE_ISV', tier: 'GOLD_PARTNER', revenueSharePct: 10, activeDeployments: 4 },
    { id: 'cp-04', partnerName: 'Optum Healthcare', type: 'IMPLEMENTATION_SI', tier: 'SILVER_PARTNER', revenueSharePct: 15, activeDeployments: 3 },
    { id: 'cp-05', partnerName: 'MedEngage Solutions', type: 'RESELLER', tier: 'SILVER_PARTNER', revenueSharePct: 20, activeDeployments: 7 },
  ],
  developer_app: [
    { id: 'app-cardio-pack', name: 'Apollo Cardiology & ECG Intelligence Pack', category: 'CLINICAL', publisher: 'Apollo Clinical Technologies', version: 'v3.2', rating: 4.9, installCount: 142, description: 'CHA2DS2-VASc stroke scoring, automatic 12-lead ECG telemetry widget, and AHA hypertension pathway.', isVerified: true, status: 'INSTALLED', icon: 'Heart' },
    { id: 'app-ai-scribe-pro', name: 'Ambient AI Scribe & SOAP Generator', category: 'AI', publisher: 'CareConnect AI Labs', version: 'v2.8', rating: 4.95, installCount: 380, description: 'Real-time ambient consultation dictation scribe with automatic ICD-10 coding and bilingual translation.', isVerified: true, status: 'INSTALLED', icon: 'Sparkles' },
    { id: 'app-whatsapp-hub', name: 'WhatsApp Business Patient Engagement Hub', category: 'INTEGRATION', publisher: 'Infobip Enterprise', version: 'v4.0', rating: 4.8, installCount: 520, description: 'Automated appointment reminders, lab PDF dispatches, and WhatsApp prescription notifications.', isVerified: true, status: 'INSTALLED', icon: 'MessageSquare' },
    { id: 'app-pacs-orthanc', name: 'Orthanc DICOM PACS Cloud Bridge', category: 'INTEGRATION', publisher: 'Radiology Open Source Foundation', version: 'v1.9', rating: 4.7, installCount: 94, description: 'Zero-footprint web DICOM viewer integration with automated HL7 ORU result signoff.', isVerified: true, status: 'AVAILABLE', icon: 'Film' },
  ],
  developer_sdk: [
    { id: 'sdk-ts', language: 'TypeScript', version: '2.4.0', packageName: '@careconnect/sdk-node', downloadsCount: 18400, documentationUrl: 'https://developer.careconnect.hospital/sdk/typescript' },
    { id: 'sdk-py', language: 'Python', version: '2.3.1', packageName: 'careconnect-py', downloadsCount: 24200, documentationUrl: 'https://developer.careconnect.hospital/sdk/python' },
    { id: 'sdk-java', language: 'Java', version: '2.1.0', packageName: 'com.careconnect.sdk', downloadsCount: 12100, documentationUrl: 'https://developer.careconnect.hospital/sdk/java' },
    { id: 'sdk-flutter', language: 'Flutter', version: '1.8.0', packageName: 'careconnect_flutter', downloadsCount: 9800, documentationUrl: 'https://developer.careconnect.hospital/sdk/flutter' },
  ],
  developer_webhook: [
    { id: 'wh-101', targetUrl: 'https://api.apollohospitals.com/careconnect/webhooks/lab-results', events: ['lab.result.ready', 'prescription.signed'], signingSecret: 'whsec_88492019481029384710', status: 'ACTIVE', successPct: 99.8, lastDelivery: '2 mins ago' },
    { id: 'wh-102', targetUrl: 'https://integrations.starhealth.in/claims/notify', events: ['invoice.paid', 'patient.discharged'], signingSecret: 'whsec_99182374619283746192', status: 'ACTIVE', successPct: 99.4, lastDelivery: '14 mins ago' },
  ],
  developer_event: [
    { id: 'evt-901', eventTopic: 'lab.result.ready', sourceModule: 'LIS_LABORATORY', timestamp: '2026-07-25T12:30:00Z', status: 'DELIVERED', payload: { labOrderId: 'LAB-9012', testName: 'Fasting HbA1c', resultValue: '9.2%', patientId: 'P-90214' } },
    { id: 'evt-902', eventTopic: 'patient.registered', sourceModule: 'PATIENT_REGISTRATION', timestamp: '2026-07-25T12:40:00Z', status: 'DELIVERED', payload: { patientId: 'P-90217', name: 'Ananya Sharma', abhaAddress: 'ananya@abdm', phone: '+919876543210' } },
  ],
};

function toPayload(rec) {
  return { ...rec.data, _id: rec._id };
}

exports.listOpsRecords = async (req, res) => {
  try {
    const { type } = req.params;
    let records = await AdminOpsRecord.find({ recordType: type }).sort({ createdAt: -1 }).lean();

    if (records.length === 0 && SEEDS[type]) {
      await AdminOpsRecord.insertMany(SEEDS[type].map(d => ({ recordType: type, data: d })));
      records = await AdminOpsRecord.find({ recordType: type }).sort({ createdAt: -1 }).lean();
    }

    res.json({ success: true, data: records.map(toPayload) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createOpsRecord = async (req, res) => {
  try {
    const record = await AdminOpsRecord.create({ recordType: req.params.type, data: req.body });
    res.status(201).json({ success: true, data: toPayload(record) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateOpsRecord = async (req, res) => {
  try {
    const record = await AdminOpsRecord.findOneAndUpdate(
      { _id: req.params.id, recordType: req.params.type },
      { data: req.body },
      { new: true }
    ).lean();
    if (!record) return res.status(404).json({ success: false, error: 'Record not found' });
    res.json({ success: true, data: toPayload(record) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteOpsRecord = async (req, res) => {
  try {
    const record = await AdminOpsRecord.findOneAndDelete({ _id: req.params.id, recordType: req.params.type });
    if (!record) return res.status(404).json({ success: false, error: 'Record not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
