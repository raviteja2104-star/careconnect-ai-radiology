/**
 * HealthRecordService — computed timeline + structured summary for a
 * patient's health-record-capture data. Deliberately NOT a synced/duplicated
 * "HealthRecord" collection: querying the real source collections
 * (HealthDocument, Prescription, LabReport, DiagnosticReport, plus the
 * existing Encounter model) and merging in-memory means there is never a
 * second copy of clinical data that can drift from the source of truth.
 * Demographics/allergies/medications/chronic-disease fields already live on
 * User (see models/User.js) — reused here, not duplicated.
 */

function timelineEntry(type, doc, extra = {}) {
    return {
        date: extra.date || doc.updatedAt || doc.createdAt,
        recordType: type,
        recordId: String(doc._id),
        source: extra.source || doc.source || null,
        uploadedBy: extra.uploadedBy || null,
        uploadedByRole: extra.uploadedByRole || null,
        verificationStatus: extra.status || doc.status || null,
        summary: extra.summary || null,
    };
}

async function getTimeline(patientId, { limit = 200 } = {}) {
    const HealthDocument = require('../models/HealthDocument');
    const Prescription = require('../models/Prescription');
    const LabReport = require('../models/LabReport');
    const DiagnosticReport = require('../models/DiagnosticReport');
    let Encounter;
    try {
        Encounter = require('../models/Encounter');
    } catch {
        Encounter = null;
    }

    const [documents, prescriptions, labReports, diagnosticReports, encounters] = await Promise.all([
        HealthDocument.find({ patientId, active: { $ne: false } }).sort({ createdAt: -1 }).limit(limit).lean(),
        Prescription.find({ patientId, status: { $ne: 'AMENDED' } }).sort({ createdAt: -1 }).limit(limit).lean(),
        LabReport.find({ patientId, status: { $ne: 'AMENDED' } }).sort({ createdAt: -1 }).limit(limit).lean(),
        DiagnosticReport.find({ patientId, status: { $ne: 'AMENDED' } }).sort({ createdAt: -1 }).limit(limit).lean(),
        Encounter ? Encounter.find({ patientId }).sort({ createdAt: -1 }).limit(limit).lean() : Promise.resolve([]),
    ]);

    const entries = [
        ...documents.map((d) =>
            timelineEntry('HEALTH_DOCUMENT', d, {
                date: d.createdAt,
                uploadedByRole: d.capturedBy?.role,
                uploadedBy: d.capturedBy?.userId ? String(d.capturedBy.userId) : null,
                status: d.status,
                summary: `${d.documentType.replace(/_/g, ' ')} uploaded`,
            })
        ),
        ...prescriptions.map((p) =>
            timelineEntry('PRESCRIPTION', p, {
                date: p.prescriptionDate || p.createdAt,
                source: p.source,
                uploadedBy: String(p.createdByUserId),
                uploadedByRole: p.createdByRole,
                status: p.status,
                summary: p.source === 'DOCTOR_CREATED' ? 'Prescription created by doctor' : `Prescription captured (${p.source.toLowerCase()})`,
            })
        ),
        ...labReports.map((l) =>
            timelineEntry('LAB_REPORT', l, {
                date: l.reportDate || l.createdAt,
                source: l.source,
                uploadedBy: String(l.createdByUserId),
                uploadedByRole: l.createdByRole,
                status: l.status,
                summary: l.labName ? `Lab report — ${l.labName}` : 'Lab report captured',
            })
        ),
        ...diagnosticReports.map((r) =>
            timelineEntry('DIAGNOSTIC_REPORT', r, {
                date: r.studyDate || r.createdAt,
                source: r.source,
                uploadedBy: String(r.createdByUserId),
                uploadedByRole: r.createdByRole,
                status: r.status,
                summary: r.studyDescription || `${r.modality || 'Diagnostic'} report captured`,
            })
        ),
        ...encounters.map((e) =>
            timelineEntry('CONSULTATION', e, {
                date: e.createdAt,
                uploadedBy: e.doctorId ? String(e.doctorId) : null,
                uploadedByRole: 'doctor',
                status: e.status,
                summary: e.chiefComplaint ? `Consultation — ${e.chiefComplaint}` : 'Doctor consultation',
            })
        ),
    ];

    entries.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    return entries.slice(0, limit);
}

async function getStructuredSummary(patientId) {
    const User = require('../models/User');
    const HealthDocument = require('../models/HealthDocument');
    const Prescription = require('../models/Prescription');
    const LabReport = require('../models/LabReport');
    const DiagnosticReport = require('../models/DiagnosticReport');

    const [patient, docCount, reviewRequiredCount, prescriptions, labReports, diagnosticReports] = await Promise.all([
        User.findById(patientId)
            .select('firstName lastName dateOfBirth gender bloodGroup allergies chronicDiseases medications surgeries familyHistory')
            .lean(),
        HealthDocument.countDocuments({ patientId, active: { $ne: false } }),
        HealthDocument.countDocuments({ patientId, active: { $ne: false }, status: { $in: ['REVIEW_REQUIRED', 'CLINICIAN_REVIEW_REQUIRED'] } }),
        Prescription.find({ patientId, status: { $ne: 'AMENDED' } }).sort({ createdAt: -1 }).limit(50).lean(),
        LabReport.find({ patientId, status: { $ne: 'AMENDED' } }).sort({ createdAt: -1 }).limit(50).lean(),
        DiagnosticReport.find({ patientId, status: { $ne: 'AMENDED' } }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    if (!patient) return null;

    return {
        demographics: {
            name: `${patient.firstName} ${patient.lastName}`.trim(),
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            bloodGroup: patient.bloodGroup,
        },
        allergies: patient.allergies || [],
        chronicDiseases: patient.chronicDiseases || [],
        medications: patient.medications || [], // patient-reported, distinct from Prescription records below
        surgeries: patient.surgeries || [],
        familyHistory: patient.familyHistory || [],
        documentCounts: { total: docCount, reviewRequired: reviewRequiredCount },
        prescriptions,
        labReports,
        diagnosticReports,
    };
}

module.exports = { getTimeline, getStructuredSummary };
