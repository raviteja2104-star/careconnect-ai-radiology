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
  rbac_role: [
    { id: 'role-super-admin', name: 'Super Admin', description: 'Full platform access including billing, system config and audit logs', permissions: ['ALL_PERMISSIONS'], userCount: 2, isSystemRole: true, color: 'rose' },
    { id: 'role-admin', name: 'Admin', description: 'Hospital administration including patient management, appointments, staff and reports', permissions: ['PATIENTS.VIEW', 'PATIENTS.CREATE', 'APPOINTMENTS.VIEW', 'APPOINTMENTS.CREATE', 'REPORTS.VIEW', 'BILLING.VIEW', 'STAFF.VIEW', 'ADMIN.VIEW_DASHBOARD'], userCount: 5, isSystemRole: true, color: 'violet' },
    { id: 'role-doctor', name: 'Doctor', description: 'Full EMR access to view and create encounters, prescribe, and order investigations', permissions: ['PATIENTS.VIEW', 'EMR.VIEW', 'EMR.CREATE', 'PRESCRIPTIONS.CREATE', 'LABS.ORDER', 'STAFF.VIEW_APPOINTMENTS'], userCount: 24, isSystemRole: true, color: 'brand' },
    { id: 'role-nurse', name: 'Nurse', description: 'Nursing station access for vitals recording, eMAR administration and shift handover', permissions: ['PATIENTS.VIEW', 'VITALS.RECORD', 'MEDICATIONS.ADMINISTER', 'STAFF.VIEW_APPOINTMENTS', 'CHECKIN_PATIENTS'], userCount: 48, isSystemRole: true, color: 'emerald' },
    { id: 'role-receptionist', name: 'Receptionist', description: 'Front desk operations including check-in, walk-ins, queue display and billing summary', permissions: ['PATIENTS.VIEW', 'PATIENTS.CREATE', 'APPOINTMENTS.VIEW', 'STAFF.RECEPTION', 'CHECKIN_PATIENTS', 'BILLING.VIEW'], userCount: 12, isSystemRole: true, color: 'amber' },
    { id: 'role-pharmacist', name: 'Pharmacist', description: 'Pharmacy dispensing, drug inventory management and prescription fulfillment', permissions: ['PATIENTS.VIEW', 'PRESCRIPTIONS.VIEW', 'PHARMACY.DISPENSE', 'INVENTORY.MANAGE'], userCount: 8, isSystemRole: false, color: 'info' },
  ],
  hospital_unit: [
    { id: 'hu-01', name: 'Apollo Super Specialty Hospital Main Campus', type: 'HOSPITAL', parentId: null, code: 'APL-MAIN', floor: null, bedCapacity: null, status: 'ACTIVE' },
    { id: 'hu-02', name: 'Internal Medicine and General OPD', type: 'DEPARTMENT', parentId: 'hu-01', code: 'APL-INTMED', floor: 'Ground', bedCapacity: null, status: 'ACTIVE' },
    { id: 'hu-03', name: 'Cardiology and CATH Lab', type: 'DEPARTMENT', parentId: 'hu-01', code: 'APL-CARDIO', floor: '1st', bedCapacity: null, status: 'ACTIVE' },
    { id: 'hu-04', name: 'Neurology and Neurosurgery', type: 'DEPARTMENT', parentId: 'hu-01', code: 'APL-NEURO', floor: '2nd', bedCapacity: null, status: 'ACTIVE' },
    { id: 'hu-05', name: 'ICU Medical Intensive Care', type: 'WARD', parentId: 'hu-02', code: 'APL-MICU', floor: '3rd', bedCapacity: 20, status: 'ACTIVE' },
    { id: 'hu-06', name: 'ICU Cardiac Care Unit', type: 'WARD', parentId: 'hu-03', code: 'APL-CCU', floor: '3rd', bedCapacity: 12, status: 'ACTIVE' },
    { id: 'hu-07', name: 'General Ward Male', type: 'WARD', parentId: 'hu-02', code: 'APL-GWM', floor: '4th', bedCapacity: 40, status: 'ACTIVE' },
    { id: 'hu-08', name: 'General Ward Female', type: 'WARD', parentId: 'hu-02', code: 'APL-GWF', floor: '4th', bedCapacity: 40, status: 'ACTIVE' },
    { id: 'hu-09', name: 'Fortis Healthcare Jubilee Hills', type: 'HOSPITAL', parentId: null, code: 'FRT-JH', floor: null, bedCapacity: null, status: 'ACTIVE' },
    { id: 'hu-10', name: 'Oncology and Haematology', type: 'DEPARTMENT', parentId: 'hu-09', code: 'FRT-ONC', floor: '5th', bedCapacity: null, status: 'ACTIVE' },
  ],
  i18n_locale: [
    { id: 'loc-en', code: 'en', name: 'English', nativeName: 'English', isDefault: true, isEnabled: true, rxPrintLanguage: true, reportLanguage: true, patientPortalLanguage: true },
    { id: 'loc-hi', code: 'hi', name: 'Hindi', nativeName: 'Hindi', isDefault: false, isEnabled: true, rxPrintLanguage: true, reportLanguage: false, patientPortalLanguage: true },
    { id: 'loc-te', code: 'te', name: 'Telugu', nativeName: 'Telugu', isDefault: false, isEnabled: true, rxPrintLanguage: true, reportLanguage: false, patientPortalLanguage: true },
    { id: 'loc-ta', code: 'ta', name: 'Tamil', nativeName: 'Tamil', isDefault: false, isEnabled: true, rxPrintLanguage: false, reportLanguage: false, patientPortalLanguage: false },
    { id: 'loc-kn', code: 'kn', name: 'Kannada', nativeName: 'Kannada', isDefault: false, isEnabled: false, rxPrintLanguage: false, reportLanguage: false, patientPortalLanguage: false },
    { id: 'loc-mr', code: 'mr', name: 'Marathi', nativeName: 'Marathi', isDefault: false, isEnabled: false, rxPrintLanguage: false, reportLanguage: false, patientPortalLanguage: false },
  ],
  branding_config: [
    { id: 'br-01', key: 'hospital_name', label: 'Hospital Name', value: 'Apollo Super Specialty Hospital', category: 'IDENTITY', dataType: 'TEXT' },
    { id: 'br-02', key: 'hospital_short_name', label: 'Short Name', value: 'Apollo Main', category: 'IDENTITY', dataType: 'TEXT' },
    { id: 'br-03', key: 'nabh_registration_number', label: 'NABH Accreditation Number', value: 'NABH/H/AP/1234/2024', category: 'REGISTRATION', dataType: 'TEXT' },
    { id: 'br-04', key: 'rohini_id', label: 'Rohini ID', value: 'ROH-9812-AP', category: 'REGISTRATION', dataType: 'TEXT' },
    { id: 'br-05', key: 'gstin', label: 'GSTIN', value: '36AAACH0190R1ZX', category: 'REGISTRATION', dataType: 'TEXT' },
    { id: 'br-06', key: 'rx_header_address', label: 'Prescription Header Address', value: '7-1-621/48, Balkampet, Hyderabad 500016, Telangana', category: 'PRESCRIPTION', dataType: 'TEXTAREA' },
    { id: 'br-07', key: 'rx_header_phone', label: 'Prescription Header Phone', value: '+91 40 2345 6789', category: 'PRESCRIPTION', dataType: 'TEXT' },
    { id: 'br-08', key: 'rx_header_email', label: 'Prescription Header Email', value: 'care@apollomain.hospital', category: 'PRESCRIPTION', dataType: 'TEXT' },
    { id: 'br-09', key: 'primary_color', label: 'Primary Brand Color', value: '#0ea5e9', category: 'COLORS', dataType: 'COLOR' },
    { id: 'br-10', key: 'accent_color', label: 'Accent Color', value: '#6366f1', category: 'COLORS', dataType: 'COLOR' },
  ],
  config_audit: [
    { id: 'aud-01', module: 'FEATURE_FLAGS', action: 'UPDATED', key: 'TELEMEDICINE_ENABLED', changedBy: 'Admin Vikram Mehta', changedAt: new Date(Date.now() - 7200000).toISOString(), summary: 'Enabled Telemedicine module for all doctors', oldValue: 'false', newValue: 'true' },
    { id: 'aud-02', module: 'MASTER_DATA', action: 'CREATED', key: 'LAB-LIPID', changedBy: 'Admin Ananya Roy', changedAt: new Date(Date.now() - 14400000).toISOString(), summary: 'Added Fasting Lipid Profile to Clinical catalogue', oldValue: null, newValue: 'LAB-LIPID: Fasting Lipid Profile' },
    { id: 'aud-03', module: 'BRANDING', action: 'UPDATED', key: 'rx_header_address', changedBy: 'Admin Vikram Mehta', changedAt: new Date(Date.now() - 21600000).toISOString(), summary: 'Updated prescription header address', oldValue: '7-1-621, Balkampet', newValue: '7-1-621/48, Balkampet, Hyderabad 500016' },
    { id: 'aud-04', module: 'FEATURE_FLAGS', action: 'UPDATED', key: 'AI_SCRIBE_ENABLED', changedBy: 'Admin Karan Malhotra', changedAt: new Date(Date.now() - 86400000).toISOString(), summary: 'Enabled AI Scribe across all OPD doctors', oldValue: 'false', newValue: 'true' },
    { id: 'aud-05', module: 'HOSPITAL_HIERARCHY', action: 'CREATED', key: 'hu-10', changedBy: 'Admin Ananya Roy', changedAt: new Date(Date.now() - 172800000).toISOString(), summary: 'Added Oncology department to Fortis JH', oldValue: null, newValue: 'Department: Oncology, Floor: 5th' },
    { id: 'aud-06', module: 'I18N', action: 'UPDATED', key: 'loc-te', changedBy: 'Admin Vikram Mehta', changedAt: new Date(Date.now() - 259200000).toISOString(), summary: 'Enabled Telugu for Rx print in Hyderabad region', oldValue: 'rxPrintLanguage: false', newValue: 'rxPrintLanguage: true' },
  ],
  enterprise_predictive: [
    { id: 'pred-01', modelName: 'SEPSIS_EARLY_WARNING', patientName: 'Rajesh Kumar (IPD-4412)', riskScorePct: 87, riskLevel: 'CRITICAL', keyFactors: ['Lactate 4.2 mmol/L', 'Temp 39.8°C', 'HR 118 bpm', 'WBC 18.4 K/μL'], recommendation: 'Initiate Sepsis-3 bundle immediately. Obtain blood cultures × 2, administer broad-spectrum antibiotics within 1 hour, 30 mL/kg IV crystalloid bolus.', generatedAt: new Date(Date.now() - 15 * 60000).toISOString() },
    { id: 'pred-02', modelName: '30_DAY_READMISSION_RISK', patientName: 'Sunitha Rao (OPD-7219)', riskScorePct: 74, riskLevel: 'HIGH', keyFactors: ['HbA1c 11.2%', '3 prior admissions (12 months)', 'Non-adherence flag', 'eGFR 41 mL/min'], recommendation: 'Schedule post-discharge care coordinator call within 48h. Enrol in diabetes management programme. Review metformin dose given CKD stage.', generatedAt: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: 'pred-03', modelName: 'ICU_SOFA_DETERIORATION', patientName: 'Amit Verma (ICU-Bed-06)', riskScorePct: 61, riskLevel: 'MODERATE', keyFactors: ['SOFA Δ +3 (12 h)', 'PaO₂/FiO₂ 210', 'Creatinine rising'], recommendation: 'Escalate ventilator support discussion. Nephrology consult for AKI. Repeat ABG in 4 hours.', generatedAt: new Date(Date.now() - 5 * 3600000).toISOString() },
    { id: 'pred-04', modelName: 'FALLS_RISK_ASSESSMENT', patientName: 'Kamala Devi (IPD-3307)', riskScorePct: 55, riskLevel: 'MODERATE', keyFactors: ['Morse Score 65', 'Benzodiazepine on medication list', 'Age 78', 'Previous fall 2 months ago'], recommendation: 'Activate fall prevention protocol — bed alarm, non-slip footwear, side rails up. Physical therapy consult for gait assessment.', generatedAt: new Date(Date.now() - 8 * 3600000).toISOString() },
  ],
  ward_vital: [
    { id: 'vit-01', bed: 'W4-01', patient: 'Rajesh Kumar', recordedAt: new Date(Date.now() - 45 * 60000).toISOString(), hr: 118, systolic: 94, diastolic: 62, spo2: 94, temp: 39.8, rr: 24, gcs: 14, pain: 6, status: 'OVERDUE', intakeml: 480, outputml: 220 },
    { id: 'vit-02', bed: 'W4-02', patient: 'Sunitha Rao',  recordedAt: new Date(Date.now() - 2.5 * 3600000).toISOString(), hr: 88, systolic: 148, diastolic: 92, spo2: 97, temp: 37.2, rr: 16, gcs: 15, pain: 3, status: 'DUE', intakeml: 860, outputml: 550 },
    { id: 'vit-03', bed: 'W4-03', patient: 'Prakash Nair', recordedAt: new Date(Date.now() - 1.5 * 3600000).toISOString(), hr: 72, systolic: 122, diastolic: 78, spo2: 99, temp: 36.8, rr: 14, gcs: 15, pain: 1, status: 'OK', intakeml: 1200, outputml: 950 },
    { id: 'vit-04', bed: 'W4-05', patient: 'Meera Iyer',   recordedAt: new Date(Date.now() - 3 * 3600000).toISOString(), hr: 96, systolic: 108, diastolic: 70, spo2: 96, temp: 38.1, rr: 19, gcs: 15, pain: 4, status: 'OVERDUE', intakeml: 320, outputml: 180 },
    { id: 'vit-05', bed: 'W4-06', patient: 'Anand Sharma', recordedAt: new Date(Date.now() - 55 * 60000).toISOString(), hr: 64, systolic: 132, diastolic: 84, spo2: 98, temp: 36.6, rr: 13, gcs: 15, pain: 2, status: 'OK', intakeml: 1450, outputml: 1100 },
    { id: 'vit-06', bed: 'W4-07', patient: 'Kavita Reddy', recordedAt: new Date(Date.now() - 4 * 3600000).toISOString(), hr: 104, systolic: 100, diastolic: 65, spo2: 93, temp: 39.1, rr: 22, gcs: 13, pain: 7, status: 'OVERDUE', intakeml: 240, outputml: 90 },
  ],
  ward_task: [
    { id: 'tsk-01', bed: 'W4-01', patient: 'Rajesh Kumar', type: 'ASSESSMENT', title: 'Sepsis bundle — lactate recheck', priority: 'URGENT', dueAt: new Date(Date.now() + 15 * 60000).toISOString(), status: 'PENDING', assignedTo: 'Sr. Nurse Divya', notes: 'Repeat serum lactate; if >2 mmol/L escalate to RMO' },
    { id: 'tsk-02', bed: 'W4-06', patient: 'Kavita Reddy', type: 'WOUND',      title: 'Surgical wound dressing change', priority: 'URGENT', dueAt: new Date(Date.now() + 30 * 60000).toISOString(), status: 'PENDING', assignedTo: 'Sr. Nurse Divya', notes: 'Post-laparotomy Day-2. Check for serosanguineous discharge' },
    { id: 'tsk-03', bed: 'W4-02', patient: 'Sunitha Rao',  type: 'MEDICATION',  title: 'Insulin 8U SC pre-breakfast',     priority: 'ROUTINE', dueAt: new Date(Date.now() + 20 * 60000).toISOString(), status: 'PENDING', assignedTo: 'Nurse Priya', notes: 'Check capillary BG before administering; hold if <70 mg/dL' },
    { id: 'tsk-04', bed: 'W4-03', patient: 'Prakash Nair', type: 'PROCEDURE',   title: 'Foley catheter care',             priority: 'ROUTINE', dueAt: new Date(Date.now() + 60 * 60000).toISOString(), status: 'PENDING', assignedTo: 'Nurse Priya', notes: 'Pericare + irrigation. Document urine colour and output' },
    { id: 'tsk-05', bed: 'W4-05', patient: 'Meera Iyer',   type: 'ASSESSMENT', title: 'Pain reassessment (NRS)',          priority: 'ROUTINE', dueAt: new Date(Date.now() - 10 * 60000).toISOString(), status: 'OVERDUE', assignedTo: 'Nurse Priya', notes: 'Last NRS 4 — 30 min post analgesia. Document response' },
    { id: 'tsk-06', bed: 'W4-07', patient: 'Kavita Reddy', type: 'MONITORING',  title: 'Neuro obs — GCS q1h',             priority: 'URGENT', dueAt: new Date(Date.now() - 5 * 60000).toISOString(), status: 'OVERDUE', assignedTo: 'Sr. Nurse Divya', notes: 'GCS 13 — document pupil response and motor score' },
    { id: 'tsk-07', bed: 'W4-01', patient: 'Rajesh Kumar', type: 'MEDICATION',  title: 'Piperacillin/Tazobactam 4.5g IV', priority: 'URGENT', dueAt: new Date(Date.now() + 45 * 60000).toISOString(), status: 'PENDING', assignedTo: 'Sr. Nurse Divya', notes: 'Infuse over 30 min. Flush with NS before and after' },
    { id: 'tsk-08', bed: 'W4-06', patient: 'Kavita Reddy', type: 'POSITIONING', title: '2-hourly repositioning (pressure)', priority: 'ROUTINE', dueAt: new Date(Date.now() + 10 * 60000).toISOString(), status: 'PENDING', assignedTo: 'Nurse Priya', notes: 'Waterlow score 18 — high risk. Document position and skin integrity' },
  ],
  developer_event: [
    { id: 'evt-901', eventTopic: 'lab.result.ready', sourceModule: 'LIS_LABORATORY', timestamp: '2026-07-25T12:30:00Z', status: 'DELIVERED', payload: { labOrderId: 'LAB-9012', testName: 'Fasting HbA1c', resultValue: '9.2%', patientId: 'P-90214' } },
    { id: 'evt-902', eventTopic: 'patient.registered', sourceModule: 'PATIENT_REGISTRATION', timestamp: '2026-07-25T12:40:00Z', status: 'DELIVERED', payload: { patientId: 'P-90217', name: 'Ananya Sharma', abhaAddress: 'ananya@abdm', phone: '+919876543210' } },
  ],
  icu_vent: [
    { id: 'vent-01', bed: 'ICU-B1', patient: 'Rajesh Kumar, 58M', mode: 'SIMV-PC', fio2Pct: 60, peep: 8, pip: 28, vt: 480, rrSet: 14, rrTotal: 18, etco2: 38, spo2: 94, status: 'CONCERN' },
    { id: 'vent-02', bed: 'ICU-B3', patient: 'Meena Devi, 72F',   mode: 'AC/VC',   fio2Pct: 80, peep: 10, pip: 34, vt: 420, rrSet: 16, rrTotal: 22, etco2: 42, spo2: 90, status: 'CRITICAL' },
    { id: 'vent-03', bed: 'ICU-B5', patient: 'Arjun Singh, 45M',  mode: 'PSV',     fio2Pct: 45, peep: 6,  pip: 22, vt: 520, rrSet: 12, rrTotal: 14, etco2: 36, spo2: 97, status: 'WEANING' },
  ],
  icu_infusion: [
    { id: 'inf-01', bed: 'ICU-B1', patient: 'Rajesh Kumar', drug: 'Norepinephrine',  concentration: '4 mg/50 mL NS',   rateMLph: 8,  doseUgkgmin: 0.18, titration: 'Hold if MAP > 75 mmHg', site: 'R-CVC Port 1' },
    { id: 'inf-02', bed: 'ICU-B1', patient: 'Rajesh Kumar', drug: 'Propofol',         concentration: '200 mg/20 mL',     rateMLph: 12, doseUgkgmin: null, titration: 'RASS target −2', site: 'R-CVC Port 2' },
    { id: 'inf-03', bed: 'ICU-B2', patient: 'Sunita Sharma', drug: 'Insulin (Regular)',concentration: '50 U/50 mL NS',   rateMLph: 4,  doseUgkgmin: null, titration: 'Target BG 140–180 mg/dL', site: 'L-PIV 20G' },
    { id: 'inf-04', bed: 'ICU-B3', patient: 'Meena Devi',    drug: 'Vasopressin',     concentration: '20 U/100 mL NS',  rateMLph: 6,  doseUgkgmin: null, titration: 'Fixed 0.04 U/min — do not titrate', site: 'R-CVC Port 1' },
    { id: 'inf-05', bed: 'ICU-B3', patient: 'Meena Devi',    drug: 'Norepinephrine',  concentration: '4 mg/50 mL NS',   rateMLph: 14, doseUgkgmin: 0.32, titration: 'Titrate to MAP ≥ 65 mmHg', site: 'R-CVC Port 2' },
    { id: 'inf-06', bed: 'ICU-B4', patient: 'Vikram Patel',  drug: 'Dopamine',        concentration: '200 mg/50 mL NS', rateMLph: 10, doseUgkgmin: 5.2,  titration: 'Wean if CI > 2.2 L/min/m²', site: 'L-CVC Port 1' },
    { id: 'inf-07', bed: 'ICU-B6', patient: 'Lakshmi Iyer',  drug: 'Insulin (Regular)',concentration: '50 U/50 mL NS',   rateMLph: 6,  doseUgkgmin: null, titration: 'DKA protocol — target AG < 12', site: 'R-PIV 18G' },
  ],
  icu_severity: [
    { id: 'sev-01', bed: 'ICU-B1', patient: 'Rajesh Kumar, 58M',  dx: 'Septic Shock (Abdominal source)', los: 4, sofaScore: 11, apacheII: 24, gcs: 10, predictedMortPct: 42, trend: 'WORSENING' },
    { id: 'sev-02', bed: 'ICU-B2', patient: 'Sunita Sharma, 64F', dx: 'ARDS post-pneumonia',             los: 7, sofaScore: 9,  apacheII: 19, gcs: 14, predictedMortPct: 31, trend: 'STABLE' },
    { id: 'sev-03', bed: 'ICU-B3', patient: 'Meena Devi, 72F',    dx: 'Cardiogenic Shock (STEMI)',       los: 2, sofaScore: 13, apacheII: 28, gcs: 12, predictedMortPct: 58, trend: 'IMPROVING' },
    { id: 'sev-04', bed: 'ICU-B4', patient: 'Vikram Patel, 45M',  dx: 'Post-op CABG (3-vessel)',         los: 1, sofaScore: 6,  apacheII: 14, gcs: 15, predictedMortPct: 12, trend: 'IMPROVING' },
    { id: 'sev-05', bed: 'ICU-B5', patient: 'Arjun Singh, 45M',   dx: 'Severe Acute Pancreatitis',       los: 3, sofaScore: 8,  apacheII: 17, gcs: 14, predictedMortPct: 22, trend: 'STABLE' },
    { id: 'sev-06', bed: 'ICU-B6', patient: 'Lakshmi Iyer, 55F',  dx: 'DKA with AKI',                   los: 2, sofaScore: 5,  apacheII: 12, gcs: 15, predictedMortPct: 8,  trend: 'IMPROVING' },
  ],
  icu_round: [
    { id: 'rnd-01', bed: 'ICU-B1', patient: 'Rajesh Kumar',  roundedAt: new Date(Date.now() - 5 * 3600000).toISOString(), consultant: 'Dr. Krishnamurthy (Intensivist)', situation: 'Day 4 septic shock — source control adequate post-laparotomy. MAP improving on reduced noradrenaline. Lactate 2.1 ↓.', background: '58M, DM2. Admitted with perforated sigmoid diverticulitis. Laparotomy Day 1.', assessment: 'Still febrile 38.4°C. WBC 16. Chest clear. UO 0.6 mL/kg/h.', recommendation: 'Continue Pip-Tazo D4. Target MAP ≥ 65. Daily SBT when FiO₂ ≤ 50%. Reduce nor to 0.1 μg/kg/min.', plan: 'Repeat blood cultures. Surgical review 1400h. Nutrition: TPN D4.' },
    { id: 'rnd-02', bed: 'ICU-B2', patient: 'Sunita Sharma', roundedAt: new Date(Date.now() - 4.5 * 3600000).toISOString(), consultant: 'Dr. Menon (Pulmonologist)', situation: 'Day 7 ARDS — P/F ratio 180, FiO₂ 60%. Proning protocol completed ×3.', background: '64F, post-COVID ARDS. Transferred from step-down.', assessment: 'P/F improved from 140 yesterday. Plateau pressure 24 cmH₂O. Nutritional targets met via NGT.', recommendation: 'Consider prone again tonight if P/F < 150. Echo to assess RV function.', plan: 'Continue lung-protective ventilation. RV echo 1600h.' },
    { id: 'rnd-03', bed: 'ICU-B3', patient: 'Meena Devi',    roundedAt: new Date(Date.now() - 4 * 3600000).toISOString(), consultant: 'Dr. Krishnamurthy (Intensivist)', situation: 'Day 2 post-STEMI cardiogenic shock — IABP removed 0600h. BP 94/60 MAP 71.', background: '72F, STEMI (LAD), primary PCI Day 1. EF 25%.', assessment: 'Creatinine rising to 2.4 (from 1.8). Urine output improving. Norad + vasopressin continuing.', recommendation: 'Nephrology consult for AKI. Hold ACE inhibitor. Target euvolaemia. Repeat echo tomorrow.', plan: 'Cardiology review 1200h. Furosemide hold until renal review.' },
    { id: 'rnd-04', bed: 'ICU-B4', patient: 'Vikram Patel',  roundedAt: new Date(Date.now() - 3.5 * 3600000).toISOString(), consultant: 'Dr. Pillai (Cardiac Surgeon)', situation: 'Day 1 post-op CABG (3-vessel) — routine post-cardiac surgical monitoring.', background: '45M, CAD 3-vessel, elective CABG under CPB.', assessment: 'Haemodynamically stable on low-dose dopamine. Chest drains 60 mL/h. CK-MB trending down.', recommendation: 'Wean dopamine by afternoon if CI > 2.2. Extubation target 1600h.', plan: 'Cardiac physio once extubated. DVT prophylaxis initiated. ICU step-down planned Day 2.' },
    { id: 'rnd-05', bed: 'ICU-B5', patient: 'Arjun Singh',   roundedAt: new Date(Date.now() - 3 * 3600000).toISOString(), consultant: 'Dr. Menon (GI Surgeon)', situation: 'Day 3 severe acute pancreatitis — Balthazar E on CT. Lipase 3400.', background: '45M, gallstone pancreatitis. ERCP Day 1.', assessment: 'Pain controlled on fentanyl PCA. Tolerating enteral feed via NJT at 40 mL/h. WBC 18, temp 38.1.', recommendation: 'Increase NJT to 60 mL/h. Monitor for infected necrosis. CT abdomen planned Day 5.', plan: 'Antibiotics prophylaxis held per protocol. GI surgical review 1500h.' },
    { id: 'rnd-06', bed: 'ICU-B6', patient: 'Lakshmi Iyer',  roundedAt: new Date(Date.now() - 2.5 * 3600000).toISOString(), consultant: 'Dr. Pillai (Diabetologist)', situation: 'Day 2 DKA with AKI — anion gap closed (AG 10). Insulin infusion weaning.', background: '55F, T1DM. Presented with nausea/vomiting. Admission pH 6.98.', assessment: 'AG normalised. Creatinine 1.9 (↓ from 3.1). Urine output improving. Tolerating sips.', recommendation: 'Transition to SC insulin when tolerating oral. AKI likely pre-renal — continue IV fluids.', plan: 'Renal review for AKI workup. Endocrinology input for home insulin regimen.' },
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
