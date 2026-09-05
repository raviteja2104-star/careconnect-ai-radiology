const mongoose = require('mongoose');

/**
 * CatalogEntry — clinical reference catalog powering EMR typeahead:
 * medications, presenting complaints, diagnoses (ICD-10), lab tests.
 * Seeded from src/data/clinicalCatalog.js; admins can extend via master data.
 */
const catalogEntrySchema = new mongoose.Schema(
    {
        kind: {
            type: String,
            enum: ['medication', 'complaint', 'diagnosis', 'lab_test', 'duration', 'instruction'],
            required: true,
            index: true,
        },
        label: { type: String, required: true },
        /** ICD-10 for diagnoses, short code for lab tests. */
        code: String,
        /** medication: { generic, brand, strength, form } */
        meta: mongoose.Schema.Types.Mixed,
        source: { type: String, default: 'seed' },
    },
    { timestamps: true }
);

catalogEntrySchema.index({ kind: 1, label: 1 });

module.exports = mongoose.model('CatalogEntry', catalogEntrySchema);
