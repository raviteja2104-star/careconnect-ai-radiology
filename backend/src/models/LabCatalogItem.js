const mongoose = require('mongoose');

const LabCatalogItemSchema = new mongoose.Schema({
    type: { type: String, enum: ['test', 'package'], required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    tat: { type: String }, // Turnaround time (e.g., '12 hrs')
    testsCount: { type: Number }, // For packages
    tag: { type: String }, // e.g., 'Bestseller'
    category: { type: String }, // e.g., 'Diabetes', 'Fever'
    image: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('LabCatalogItem', LabCatalogItemSchema);
