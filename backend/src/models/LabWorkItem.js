const mongoose = require('mongoose');

/**
 * LabWorkItem — the LIS work item (one per lab ClinicalOrder).
 * Created by LabIntake when a 'LabOrdered' event arrives from the EMR.
 * Tracks sample collection, result entry with per-parameter flags,
 * two-level verification (technical + pathologist), critical-result
 * communication, release (locking) and post-release amendments.
 */

const STATUSES = [
    'ORDERED',
    'SAMPLE_COLLECTED',
    'PROCESSING',
    'RESULT_PENDING',
    'VERIFICATION_PENDING',
    'VERIFIED',
    'RELEASED',
    'REJECTED',
];

const SAMPLE_QUALITIES = [
    'accepted',
    'rejected',
    'hemolysed',
    'lipemic',
    'clotted',
    'insufficient',
    'wrong_container',
    'incorrect_sample',
    'other',
    null,
];

const PARAM_FLAGS = ['low', 'normal', 'high', 'critical', 'positive', 'negative', 'abnormal', null];

const auditEntrySchema = new mongoose.Schema(
    {
        action: { type: String, required: true },
        by: { type: mongoose.Schema.Types.Mixed }, // User id (ObjectId) or 'system'
        at: { type: Date, default: Date.now },
        note: String,
    },
    { _id: false }
);

const parameterSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        value: mongoose.Schema.Types.Mixed, // number or string ('Positive', …)
        unit: String,
        refRangeUsed: String, // snapshot, e.g. '70–100 mg/dL'
        flag: { type: String, enum: PARAM_FLAGS, default: null },
        comments: String,
    },
    { _id: false }
);

const testSchema = new mongoose.Schema(
    {
        code: String,
        name: { type: String, required: true },
        specimen: String,
        parameters: [parameterSchema],
        techComments: String,
        interpretation: String,
    },
    { _id: false }
);

const criticalEventSchema = new mongoose.Schema(
    {
        parameter: String,
        value: mongoose.Schema.Types.Mixed,
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
        notifiedWho: String,
        notificationMethod: String, // 'phone', 'in_person', 'app', …
        acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        acknowledgedAt: Date,
    },
    { _id: false }
);

const amendmentSchema = new mongoose.Schema(
    {
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, required: true },
        previousTests: mongoose.Schema.Types.Mixed, // full snapshot of tests[] before the amendment
    },
    { _id: false }
);

const labWorkItemSchema = new mongoose.Schema(
    {
        labNumber: { type: String, unique: true, index: true }, // LAB-YYYYMMDD-XXXX

        clinicalOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClinicalOrder', index: true },
        encounterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter', index: true },
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        orderingDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        tenantId: { type: String, default: 't-default', index: true },

        priority: { type: String, enum: ['routine', 'urgent', 'stat', 'emergency'], default: 'routine', index: true },
        status: { type: String, enum: STATUSES, default: 'ORDERED', index: true },

        assignedTechnicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

        sample: {
            collectedAt: Date,
            collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            barcode: String, // = labNumber
            quality: { type: String, enum: SAMPLE_QUALITIES, default: null },
            rejectedReason: String,
            recollectionRequired: { type: Boolean, default: false },
        },

        tests: [testSchema],

        criticalEvents: [criticalEventSchema],

        verification: {
            technicalBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            technicalAt: Date,
            pathologistBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            pathologistAt: Date,
        },

        releasedAt: Date,
        releasedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        locked: { type: Boolean, default: false },

        amendments: [amendmentSchema],

        auditTrail: [auditEntrySchema],
        traceId: String,
    },
    { timestamps: true }
);

labWorkItemSchema.index({ status: 1, priority: 1 });
labWorkItemSchema.index({ patientId: 1, createdAt: -1 });

labWorkItemSchema.pre('validate', function assignLabNumber(next) {
    if (!this.labNumber) {
        const d = new Date();
        const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        this.labNumber = `LAB-${ymd}-${rand}`;
    }
    if (this.sample && !this.sample.barcode) {
        this.sample.barcode = this.labNumber;
    }
    next();
});

const LabWorkItem = mongoose.model('LabWorkItem', labWorkItemSchema);

LabWorkItem.STATUSES = STATUSES;
LabWorkItem.SAMPLE_QUALITIES = SAMPLE_QUALITIES;
LabWorkItem.PARAM_FLAGS = PARAM_FLAGS;

module.exports = LabWorkItem;
