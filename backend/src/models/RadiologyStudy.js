const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * RadiologyStudy — the teleradiology work item.
 * Created by TeleradiologyIntake when a 'RadiologyOrdered' event arrives from
 * the EMR (ClinicalOrder). Tracks the full read workflow, TAT milestones,
 * AI triage output, the report (with immutable signed versions) and
 * critical-finding communication.
 */

const SLA_MINUTES = { stat: 60, emergency: 30, urgent: 240, routine: 1440 };

const STATUSES = ['ORDERED', 'RECEIVED', 'UNREAD', 'IN_PROGRESS', 'DRAFT', 'REVIEW', 'SIGNED', 'DELIVERED'];

const auditEntrySchema = new mongoose.Schema(
    {
        action: { type: String, required: true },
        by: { type: mongoose.Schema.Types.Mixed }, // User id (ObjectId) or 'system'
        at: { type: Date, default: Date.now },
        note: String,
    },
    { _id: false }
);

const aiFindingSchema = new mongoose.Schema(
    {
        finding: String,
        confidence: Number, // 0..1
        urgency: { type: String, enum: ['routine', 'moderate', 'high', 'critical'] },
        reason: String,
    },
    { _id: false }
);

const reportSectionsSchema = new mongoose.Schema(
    {
        technique: { type: String, default: '' },
        comparison: { type: String, default: '' },
        findings: { type: String, default: '' },
        impression: { type: String, default: '' },
        recommendations: { type: String, default: '' },
    },
    { _id: false }
);

const reportVersionSchema = new mongoose.Schema(
    {
        sections: reportSectionsSchema,
        authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
        kind: { type: String, enum: ['draft', 'final', 'addendum'], required: true },
    },
    { _id: false }
);

const radiologyStudySchema = new mongoose.Schema(
    {
        accessionNumber: { type: String, unique: true, index: true }, // ACC-YYYYMMDD-XXXX
        studyInstanceUID: { type: String, index: true }, // '2.25.…' placeholder until DICOM ingest fills it

        clinicalOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClinicalOrder', index: true },
        encounterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter', index: true },
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        orderingDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        tenantId: { type: String, default: 't-default', index: true },
        hospitalId: { type: String, default: 'HOSP-01', index: true },

        modality: { type: String, enum: ['XR', 'CT', 'MRI', 'US', 'MG', 'PET', 'SPECT', 'FL'], required: true },
        bodyPart: String,
        contrast: { type: Boolean, default: false },
        clinicalIndication: String,
        priority: { type: String, enum: ['routine', 'urgent', 'stat', 'emergency'], default: 'routine', index: true },

        status: { type: String, enum: STATUSES, default: 'ORDERED', index: true },

        assignedRadiologistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
        assignmentReason: String,

        aiTriage: {
            processed: { type: Boolean, default: false },
            findings: [aiFindingSchema],
            flagged: { type: Boolean, default: false },
        },

        // Turn-around-time milestones — each set exactly once by TatEngine.recordMilestone.
        tat: {
            orderedAt: Date,
            receivedAt: Date,
            assignedAt: Date,
            openedAt: Date,
            reportStartedAt: Date,
            signedAt: Date,
            deliveredAt: Date,
        },
        slaMinutes: { type: Number }, // set on create from priority

        report: {
            sections: reportSectionsSchema,
            versions: [reportVersionSchema], // append-only; signed versions are never mutated
            signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            signedAt: Date,
            signatureHash: String, // sha256 of the signed sections
        },

        criticalFinding: {
            flagged: { type: Boolean, default: false },
            description: String,
            communicatedAt: Date,
            acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            acknowledgedAt: Date,
            escalationLevel: { type: Number, default: 0 },
        },

        auditTrail: [auditEntrySchema],
        traceId: String,
    },
    { timestamps: true }
);

radiologyStudySchema.index({ status: 1, priority: 1 });
radiologyStudySchema.index({ assignedRadiologistId: 1, status: 1 });
radiologyStudySchema.index({ hospitalId: 1, modality: 1, 'tat.signedAt': -1 });

radiologyStudySchema.pre('validate', function assignIdentifiers(next) {
    if (!this.accessionNumber) {
        const d = new Date();
        const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        this.accessionNumber = `ACC-${ymd}-${rand}`;
    }
    if (!this.studyInstanceUID) {
        // Placeholder UID under the 2.25 (UUID-derived) root until DICOM ingest supplies the real one.
        const digits = BigInt('0x' + crypto.randomBytes(12).toString('hex')).toString();
        this.studyInstanceUID = `2.25.${digits}`;
    }
    if (this.slaMinutes == null) {
        this.slaMinutes = SLA_MINUTES[this.priority] || SLA_MINUTES.routine;
    }
    next();
});

const RadiologyStudy = mongoose.model('RadiologyStudy', radiologyStudySchema);

RadiologyStudy.SLA_MINUTES = SLA_MINUTES;
RadiologyStudy.STATUSES = STATUSES;

module.exports = RadiologyStudy;
