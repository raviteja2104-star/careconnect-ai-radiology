/**
 * StructuredRecordBuilder — turns a reviewed DocumentExtraction (fields[]
 * with humanStatus ACCEPTED/EDITED, i.e. a human has looked at each one) into
 * a structured Prescription / LabReport / DiagnosticReport. A field with
 * humanStatus PENDING or REJECTED is never carried into the structured
 * record — only what a human has actually confirmed becomes "confirmed
 * medical information," per the feature's core AI-safety rule.
 *
 * Only HANDWRITTEN_PRESCRIPTION/PRINTED_PRESCRIPTION, LAB_REPORT and
 * DIAGNOSTIC_REPORT documentTypes produce a structured record in this pass —
 * other document types (discharge summary, referral letter, certificate,
 * vaccination record, ...) stay as a reviewed HealthDocument with its
 * extraction attached, without a bespoke structured model of their own yet.
 * That's a deliberate scope line, not an oversight: extending
 * DOCUMENT_TYPE_TO_MODEL below is how a future pass adds one.
 */

const DOCUMENT_TYPE_TO_MODEL = {
    HANDWRITTEN_PRESCRIPTION: 'Prescription',
    PRINTED_PRESCRIPTION: 'Prescription',
    LAB_REPORT: 'LabReport',
    DIAGNOSTIC_REPORT: 'DiagnosticReport',
};

/** Effective value for a field: humanValue when EDITED, else the AI value when ACCEPTED, else undefined (PENDING/REJECTED contribute nothing). */
function effectiveValue(field) {
    if (field.humanStatus === 'EDITED') return field.humanValue;
    if (field.humanStatus === 'ACCEPTED') return field.value;
    return undefined;
}

/** Parses "medications[0].name" -> {arrayKey:'medications', index:0, prop:'name'}; "patientName" -> {scalarKey:'patientName'}. */
function parseFieldKey(key) {
    const m = /^([a-zA-Z0-9_]+)\[(\d+)\]\.(.+)$/.exec(key);
    if (m) return { arrayKey: m[1], index: Number(m[2]), prop: m[3] };
    return { scalarKey: key };
}

/** Groups reviewed fields into { scalars: {key: value}, arrays: {arrayKey: [{...}]} }. */
function groupFields(fields) {
    const scalars = {};
    const arrays = {};
    for (const f of fields) {
        const val = effectiveValue(f);
        if (val === undefined) continue;
        const parsed = parseFieldKey(f.key);
        if (parsed.scalarKey) {
            scalars[parsed.scalarKey] = val;
        } else {
            arrays[parsed.arrayKey] = arrays[parsed.arrayKey] || [];
            arrays[parsed.arrayKey][parsed.index] = arrays[parsed.arrayKey][parsed.index] || {};
            arrays[parsed.arrayKey][parsed.index][parsed.prop] = val;
            // Track confidence per array item from whichever sub-field carries it.
            arrays[parsed.arrayKey][parsed.index]._confidenceLevel =
                arrays[parsed.arrayKey][parsed.index]._confidenceLevel || f.confidenceLevel || null;
        }
    }
    for (const key of Object.keys(arrays)) arrays[key] = arrays[key].filter(Boolean);
    return { scalars, arrays };
}

function toDate(v) {
    if (!v) return undefined;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
}

function buildPrescription({ document, extraction, actingUser, fields }) {
    const Prescription = require('../models/Prescription');
    const { scalars, arrays } = groupFields(fields);
    const medications = (arrays.medications || []).map((m) => ({
        name: m.name,
        generic: m.generic,
        strength: m.strength,
        dosageForm: m.dosageForm,
        route: m.route,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions,
        aiRawText: [m.name, m.strength, m.dosage].filter(Boolean).join(' '),
        confidenceLevel: m._confidenceLevel || null,
        humanVerified: true, // reaching here required humanStatus ACCEPTED/EDITED on at least the name field
    }));

    return new Prescription({
        patientId: document.patientId,
        documentId: document._id,
        extractionId: extraction._id,
        source: document.documentType === 'HANDWRITTEN_PRESCRIPTION' || document.documentType === 'PRINTED_PRESCRIPTION' ? 'SCANNED' : 'UPLOADED',
        prescriptionDate: toDate(scalars.date),
        doctorName: scalars.doctorName,
        diagnosis: scalars.diagnosis ? [scalars.diagnosis] : [],
        medications,
        investigationsOrdered: scalars.investigationsOrdered ? [scalars.investigationsOrdered] : [],
        followUpDate: toDate(scalars.followUpDate),
        status: 'REVIEW_REQUIRED',
        createdByUserId: actingUser._id,
        createdByRole: actingUser.role,
    });
}

function buildLabReport({ document, extraction, actingUser, fields }) {
    const LabReport = require('../models/LabReport');
    const { scalars, arrays } = groupFields(fields);
    const results = (arrays.results || []).map((r) => ({
        testName: r.testName,
        result: r.result,
        unit: r.unit,
        referenceRange: r.referenceRange,
        flag: r.flag,
        comments: r.comments,
        confidenceLevel: r._confidenceLevel || null,
        humanVerified: true,
    }));

    return new LabReport({
        patientId: document.patientId,
        documentId: document._id,
        extractionId: extraction._id,
        source: 'SCANNED',
        labName: scalars.labName,
        patientNameOnReport: scalars.patientNameOnReport,
        patientIdOnReport: scalars.patientIdOnReport,
        sampleDate: toDate(scalars.sampleDate),
        reportDate: toDate(scalars.reportDate),
        reportNumber: scalars.reportNumber,
        specimen: scalars.specimen,
        orderingDoctor: scalars.orderingDoctor,
        results,
        status: 'REVIEW_REQUIRED',
        createdByUserId: actingUser._id,
        createdByRole: actingUser.role,
    });
}

function buildDiagnosticReport({ document, extraction, actingUser, fields }) {
    const DiagnosticReport = require('../models/DiagnosticReport');
    const { scalars } = groupFields(fields);

    return new DiagnosticReport({
        patientId: document.patientId,
        documentId: document._id,
        extractionId: extraction._id,
        source: 'SCANNED',
        modality: scalars.modality,
        studyDescription: scalars.studyDescription,
        studyDate: toDate(scalars.studyDate),
        providerName: scalars.providerName,
        clinicalHistory: scalars.clinicalHistory,
        findings: scalars.findings,
        impression: scalars.impression,
        radiologistName: scalars.radiologistName,
        status: 'REVIEW_REQUIRED',
        createdByUserId: actingUser._id,
        createdByRole: actingUser.role,
    });
}

const BUILDERS = { Prescription: buildPrescription, LabReport: buildLabReport, DiagnosticReport: buildDiagnosticReport };

/**
 * @returns {Promise<{model: string, record: import('mongoose').Document}|null>} null when this documentType has no structured-record builder
 */
async function buildFromExtraction({ document, extraction, actingUser }) {
    const modelName = DOCUMENT_TYPE_TO_MODEL[document.documentType];
    if (!modelName) return null;
    const reviewedFields = extraction.fields.filter((f) => f.humanStatus === 'ACCEPTED' || f.humanStatus === 'EDITED');
    const record = BUILDERS[modelName]({ document, extraction, actingUser, fields: reviewedFields });
    await record.save();
    return { model: modelName, record };
}

module.exports = { buildFromExtraction, DOCUMENT_TYPE_TO_MODEL, groupFields, effectiveValue };
