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
