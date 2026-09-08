const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  hospitalName: { type: String, required: true },
  title: { type: String, required: true },
  severity: { type: String, enum: ['CRITICAL', 'MAJOR', 'MINOR'], default: 'MINOR' },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], default: 'OPEN' },
  assignedEngineer: { type: String, default: 'Unassigned' },
  slaExpiresInMins: { type: Number, default: 240 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
