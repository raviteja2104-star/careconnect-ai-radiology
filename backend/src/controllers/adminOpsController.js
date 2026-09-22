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
