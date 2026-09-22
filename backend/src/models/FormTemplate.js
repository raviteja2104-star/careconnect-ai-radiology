const mongoose = require('mongoose');

const FieldSchema = new mongoose.Schema({
  id:       { type: String, required: true },
  type:     { type: String, required: true },
  label:    String,
  required: { type: Boolean, default: false },
}, { _id: false });

const FormTemplateSchema = new mongoose.Schema({
  name:        { type: String, required: true, default: 'Untitled Form' },
  description: String,
  status:      { type: String, enum: ['draft', 'published'], default: 'draft' },
  version:     { type: Number, default: 1 },
  fields:      [FieldSchema],
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('FormTemplate', FormTemplateSchema);
