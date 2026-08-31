const mongoose = require('mongoose');

/**
 * ClinicalOrder — unified order entry for the EMR.
 * One shape for lab, radiology, procedure, medication, referral, follow-up.
 * Downstream modules (LIS queue, teleradiology worklist) consume the
 * corresponding events and keep their own operational state.
 */
const auditEntrySchema = new mongoose.Schema(
    {
        action: { type: String, required: true },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
        note: String,
    },
    { _id: false }
);

const clinicalOrderSchema = new mongoose.Schema(
    {
        orderCode: { type: String, unique: true, index: true }, // ORD-YYYYMMDD-XXXX
        encounterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Encounter', required: true, index: true },
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        orderingDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        tenantId: { type: String, default: 't-default', index: true },
        category: {
            type: String,
            enum: ['lab', 'radiology', 'procedure', 'medication', 'referral', 'followup'],
            required: true,
            index: true,
        },
        department: String,
        priority: { type: String, enum: ['routine', 'urgent', 'stat', 'emergency'], default: 'routine', index: true },
        status: {
            type: String,
            enum: ['ordered', 'acknowledged', 'in_progress', 'completed', 'cancelled'],
            default: 'ordered',
            index: true,
        },
        // Category-specific payload:
        //  lab: { tests: [{ code, name }] }
        //  radiology: { modality, bodyPart, contrast, clinicalIndication }
        //  medication: { drugs: [{ name, generic, dose, frequency, route, durationDays, instructions, prn, beforeFood }] }
        //  referral: { toSpecialty, toDoctor, reason }
        //  followup: { date, instructions }
        details: { type: mongoose.Schema.Types.Mixed, default: {} },
        safetyReview: {
            // AI-assist output surfaced to the clinician — advisory only.
            flags: [
                {
                    kind: {
                        type: String,
                        enum: ['interaction', 'duplicate', 'allergy', 'contraindication', 'dose_anomaly', 'renal', 'pregnancy'],
                    },
                    severity: { type: String, enum: ['info', 'warning', 'critical'] },
                    message: String,
                },
            ],
            reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            reviewedAt: Date,
            overrideReason: String,
        },
        resultRef: {
            // Filled by downstream module when done (LabBooking id, RadiologyStudy id, …)
            model: String,
            id: mongoose.Schema.Types.ObjectId,
        },
        auditTrail: [auditEntrySchema],
        traceId: String,
    },
    { timestamps: true }
);

clinicalOrderSchema.index({ patientId: 1, category: 1, createdAt: -1 });
clinicalOrderSchema.index({ status: 1, priority: 1 });

clinicalOrderSchema.pre('validate', function assignOrderCode(next) {
    if (!this.orderCode) {
        const d = new Date();
        const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
        this.orderCode = `ORD-${ymd}-${rand}`;
    }
    next();
});

module.exports = mongoose.model('ClinicalOrder', clinicalOrderSchema);
