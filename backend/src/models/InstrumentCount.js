const mongoose = require('mongoose');
const { Schema, Types: { ObjectId } } = mongoose;

const DEFAULT_ROWS = [
    { name: 'Lap Sponge (4×4)',    category: 'Swabs',       initial: 10 },
    { name: 'Gauze (2×2)',         category: 'Swabs',       initial: 20 },
    { name: 'Abdominal Pack',      category: 'Swabs',       initial: 4  },
    { name: '22G Needle',          category: 'Needles',     initial: 4  },
    { name: 'Vicryl 2-0 (Suture)', category: 'Needles',     initial: 3  },
    { name: 'Retractor',           category: 'Instruments', initial: 2  },
    { name: 'Metzenbaum Scissor',  category: 'Instruments', initial: 1  },
    { name: 'Haemostat Forceps',   category: 'Instruments', initial: 4  },
    { name: 'Blade #22',           category: 'Blades',      initial: 1  },
];

const rowSchema = new Schema({
    name:     { type: String, required: true },
    category: { type: String, required: true },
    initial:  { type: Number, required: true },
    count1:   { type: Number, default: null },
    final:    { type: Number, default: null },
}, { _id: true });

const instrumentCountSchema = new Schema({
    appointmentId:       { type: ObjectId, ref: 'Appointment', required: true, index: true },
    tenantId:            { type: ObjectId, ref: 'Organization', index: true },
    rows:                [rowSchema],
    scrubSignedBy:       { type: ObjectId, ref: 'User' },
    scrubSignedAt:       Date,
    circulatorSignedBy:  { type: ObjectId, ref: 'User' },
    circulatorSignedAt:  Date,
}, { timestamps: true });

instrumentCountSchema.index({ appointmentId: 1, tenantId: 1 }, { unique: true });

instrumentCountSchema.statics.defaultRows = () =>
    DEFAULT_ROWS.map(r => ({ ...r, count1: null, final: null }));

module.exports = mongoose.models.InstrumentCount ||
    mongoose.model('InstrumentCount', instrumentCountSchema);
