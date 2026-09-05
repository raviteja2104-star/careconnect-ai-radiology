const mongoose = require('mongoose');

/**
 * LabReferenceRange — configurable, demographic-aware reference ranges for
 * lab result validation (LabValidation.resolveRange picks the most specific
 * active row for a patient's age/sex/specimen).
 *
 * One row per (testCode, parameter) variant. Numeric analytes use low/high
 * plus optional criticalLow/criticalHigh; qualitative analytes (posneg /
 * reactive / detected) use textExpected instead.
 */
const labReferenceRangeSchema = new mongoose.Schema(
    {
        testCode: { type: String, required: true, trim: true },
        parameter: { type: String, required: true, trim: true },
        unit: String,
        specimen: String,

        sexApplicability: { type: String, enum: ['any', 'male', 'female'], default: 'any' },
        ageMinYears: Number, // inclusive; null/undefined = open-ended
        ageMaxYears: Number, // inclusive; null/undefined = open-ended

        low: Number,
        high: Number,
        criticalLow: Number,
        criticalHigh: Number,

        textExpected: String, // e.g. 'Negative', 'Non-reactive' for qualitative results
        method: String,

        active: { type: Boolean, default: true },
        tenantId: { type: String, default: 't-default', index: true },
    },
    { timestamps: true }
);

labReferenceRangeSchema.index({ testCode: 1, parameter: 1 });

module.exports = mongoose.model('LabReferenceRange', labReferenceRangeSchema);
