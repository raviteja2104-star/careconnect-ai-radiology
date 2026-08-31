const mongoose = require('mongoose');

/**
 * Encounter — the clinical spine of the EMR.
 * Patient → Encounter → Assessment → Diagnosis → Orders → … → Longitudinal record.
 */
const diagnosisSchema = new mongoose.Schema(
    {
        code: String,            // ICD-10 where available
        term: { type: String, required: true },
        type: { type: String, enum: ['provisional', 'differential', 'confirmed', 'ruled_out'], default: 'provisional' },
        isPrimary: { type: Boolean, default: false },
        notedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        notedAt: { type: Date, default: Date.now },
    },
    { _id: true }
);

const vitalsSchema = new mongoose.Schema(
    {
        recordedAt: { type: Date, default: Date.now },
        recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        heightCm: Number,
        weightKg: Number,
        bmi: Number,
        systolicBp: Number,
        diastolicBp: Number,
        pulse: Number,
        respiratoryRate: Number,
        temperatureC: Number,
        spo2: Number,
        painScore: Number,
    },
    { _id: true }
);

const encounterSchema = new mongoose.Schema(
    {
        patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
        tenantId: { type: String, default: 't-default', index: true },
        type: {
            type: String,
            enum: ['opd', 'ipd', 'telemedicine', 'emergency', 'daycare'],
            default: 'opd',
        },
        specialty: { type: String, default: 'General Medicine' },
        status: {
            type: String,
            enum: ['open', 'documented', 'signed', 'closed', 'cancelled'],
            default: 'open',
            index: true,
        },
        chiefComplaint: String,
        vitals: [vitalsSchema],
        diagnoses: [diagnosisSchema],
        followUp: {
            requested: { type: Boolean, default: false },
            date: Date,
            instructions: String,
        },
        // Set when the encounter's active clinical note is signed.
        signedAt: Date,
        signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        traceId: String,
    },
    { timestamps: true }
);

encounterSchema.index({ patientId: 1, createdAt: -1 });
encounterSchema.index({ doctorId: 1, status: 1 });

module.exports = mongoose.model('Encounter', encounterSchema);
