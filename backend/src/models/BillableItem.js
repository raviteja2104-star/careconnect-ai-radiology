const mongoose = require('mongoose');

/**
 * BillableItem — universal master-data record for every billable entity:
 * lab tests, panels, imaging services, consumables, IVD kits, blood bank
 * services, generic services and medicines.
 *
 * Seeded from src/data/billableCatalog.js by BillableMasterService; admins
 * manage it via the /api/billable master-data endpoints. Type-specific fields
 * live in labExt / ivdExt sub-documents so a single collection can serve
 * billing, inventory and ordering screens.
 */

const ITEM_TYPES = [
    'lab_test',
    'panel',
    'imaging',
    'consumable',
    'ivd_kit',
    'blood_bank',
    'service',
    'medicine',
];

const refRangeSchema = new mongoose.Schema(
    {
        default: String,
        notes: String,
    },
    { _id: false }
);

const labExtSchema = new mongoose.Schema(
    {
        testCode: String,
        specimen: String,
        container: String,
        collectionInstructions: String,
        tatHours: Number,
        refRange: refRangeSchema,
        criticalValue: String,
        method: String,
        analyzer: String,
        resultType: String,
        /** NABL accreditation scope — free text, intentionally unvalidated. */
        nablScope: String,
        externalReferral: { type: Boolean, default: false },
        /** For panels: itemCodes of member lab tests. */
        memberCodes: [String],
    },
    { _id: false }
);

const ivdExtSchema = new mongoose.Schema(
    {
        lotNumber: String,
        expiryDate: Date,
        storageTemp: String,
        packSize: String,
        supplier: String,
        purchasePrice: Number,
        /** CDSCO device class — free String on purpose (classes get revised). */
        regulatoryClass: String,
        currentStock: Number,
        reorderLevel: Number,
    },
    { _id: false }
);

const historyEntrySchema = new mongoose.Schema(
    {
        at: { type: Date, default: Date.now },
        by: String,
        action: String,
        changes: mongoose.Schema.Types.Mixed,
    },
    { _id: false }
);

const billableItemSchema = new mongoose.Schema(
    {
        itemCode: { type: String, required: true, unique: true, trim: true },
        name: { type: String, required: true, trim: true },
        type: { type: String, enum: ITEM_TYPES, required: true },
        category: { type: String, trim: true },
        subcategory: { type: String, trim: true },
        department: String,
        unit: String,
        unitPrice: { type: Number, default: 0 },
        /** GST percentage (0, 5, 12, 18, 28 — but not enforced). */
        gst: { type: Number, default: 0 },
        hsnSac: String,
        barcode: String,
        manufacturer: String,
        brand: String,
        catalogueNumber: String,
        active: { type: Boolean, default: true },
        inventoryTracked: { type: Boolean, default: false },
        batchTracked: { type: Boolean, default: false },
        expiryTracked: { type: Boolean, default: false },
        location: String,
        notes: String,
        tenantId: { type: String, default: 't-default' },
        labExt: labExtSchema,
        ivdExt: ivdExtSchema,
        /** Version history: appended on every update / bulk change. */
        history: [historyEntrySchema],
        source: { type: String, default: 'seed' },
    },
    { timestamps: true }
);

billableItemSchema.index({ type: 1, category: 1 });
billableItemSchema.index({ type: 1, active: 1 });
// Name lookups use case-insensitive regex; a plain index still narrows scans.
billableItemSchema.index({ name: 1 });

module.exports = mongoose.model('BillableItem', billableItemSchema);
module.exports.ITEM_TYPES = ITEM_TYPES;
