const mongoose = require('mongoose');

const medicineInventorySchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    genericName: { type: String },
    category: { type: String, default: 'General' },
    form: { type: String, enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops', 'inhaler', 'other'], default: 'tablet' },
    strength: { type: String },
    unit: { type: String, default: 'tablet' },
    manufacturer: { type: String },
    batchNumber: { type: String },
    expiryDate: { type: Date },
    stockQty: { type: Number, required: true, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 50 },
    purchasePrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    location: { type: String },
    tenantId: { type: String, default: 't-default', index: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

medicineInventorySchema.index({ name: 'text', genericName: 'text' });
medicineInventorySchema.virtual('isLowStock').get(function () {
    return this.stockQty <= this.reorderLevel;
});

module.exports = mongoose.model('MedicineInventory', medicineInventorySchema);
