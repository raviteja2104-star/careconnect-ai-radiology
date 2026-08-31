const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  department: { type: String }, // e.g. 'OPD', 'Pharmacy', 'Laboratory'
  relatedEntity: { type: String } // e.g. Appointment ID or Lab Order ID
});

const invoiceSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  invoiceNumber: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['OPD', 'IPD', 'PHARMACY', 'LABORATORY', 'EMERGENCY', 'PACKAGE'],
    default: 'OPD'
  },
  items: [invoiceItemSchema],
  subTotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  amountDue: { type: Number, required: true },
  status: {
    type: String,
    enum: ['DRAFT', 'UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'REFUNDED'],
    default: 'UNPAID'
  },
  insuranceClaimId: { type: String },
  issuedAt: { type: Date, default: Date.now },
  dueDate: { type: Date }
}, { timestamps: true });

// Analytics indexing
invoiceSchema.index({ status: 1, issuedAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
