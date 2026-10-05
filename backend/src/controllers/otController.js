const mongoose = require('mongoose');

const isDB = () => mongoose.connection.readyState === 1;

// ─── Schedule ─────────────────────────────────────────────────────────────────

exports.getSchedule = async (req, res) => {
    try {
        if (!isDB()) return res.json({ success: true, data: [] });

        const Appointment = require('../models/Appointment');
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

        const appts = await Appointment.find({
            date: { $gte: today, $lt: tomorrow },
            specialty: { $regex: /surg/i },
            tenantId: req.tenantId,
        })
        .populate('patient', 'firstName lastName gender dateOfBirth')
        .populate('doctor',  'firstName lastName')
        .sort({ timeSlot: 1 })
        .lean();

        const schedule = appts.map((a, idx) => {
            const pt = a.patient || {};
            const dr = a.doctor  || {};
            return {
                _id:              a._id.toString(),
                room:             `OR-${idx + 1}`,
                patient:          pt.firstName ? `${pt.firstName} ${pt.lastName}` : 'Unknown',
                procedure:        a.reason || a.specialty || 'Surgery',
                surgeon:          dr.firstName ? `Dr. ${dr.firstName} ${dr.lastName}` : 'Unassigned',
                anesthesiologist: 'Unassigned',
                time:             a.timeSlot || '—',
                end:              '—',
                status:           a.status ? a.status.replace('_', ' ') : 'Scheduled',
            };
        });

        res.json({ success: true, data: schedule });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// ─── Anesthesia ───────────────────────────────────────────────────────────────

exports.getAnesthesia = async (req, res) => {
    try {
        if (!isDB()) return res.status(503).json({ success: false, message: 'Database unavailable' });

        const AnesthesiaRecord = require('../models/AnesthesiaRecord');
        const { id } = req.params;

        let record = await AnesthesiaRecord.findOne({
            appointmentId: id,
            tenantId: req.tenantId,
        }).lean();

        if (!record) {
            record = await AnesthesiaRecord.create({
                appointmentId: id,
                tenantId: req.tenantId,
                asaClass: 'II',
                preOp: {},
                drugs: [],
            });
            record = record.toObject();
        }

        res.json({ success: true, data: record });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.patchAnesthesia = async (req, res) => {
    try {
        if (!isDB()) return res.status(503).json({ success: false, message: 'Database unavailable' });

        const AnesthesiaRecord = require('../models/AnesthesiaRecord');
        const { id } = req.params;
        const { asaClass, preOp } = req.body;

        const update = {};
        if (asaClass) update.asaClass = asaClass;
        if (preOp) update.$set = Object.fromEntries(
            Object.entries(preOp).map(([k, v]) => [`preOp.${k}`, v])
        );

        const record = await AnesthesiaRecord.findOneAndUpdate(
            { appointmentId: id, tenantId: req.tenantId },
            update,
            { new: true, upsert: true }
        ).lean();

        res.json({ success: true, data: record });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.addDrug = async (req, res) => {
    try {
        if (!isDB()) return res.status(503).json({ success: false, message: 'Database unavailable' });

        const AnesthesiaRecord = require('../models/AnesthesiaRecord');
        const { id } = req.params;
        const { agent, dose, route, category, time } = req.body;

        if (!agent) return res.status(400).json({ success: false, message: 'agent is required' });

        const now = new Date();
        const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const record = await AnesthesiaRecord.findOneAndUpdate(
            { appointmentId: id, tenantId: req.tenantId },
            {
                $push: {
                    drugs: {
                        agent, dose: dose || '', route: route || 'IV',
                        category: category || 'Induction',
                        time: time || hhmm,
                        addedBy: req.user._id,
                        addedAt: now,
                    },
                },
            },
            { new: true, upsert: true }
        ).lean();

        res.json({ success: true, data: record });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// ─── Intraoperative Events ────────────────────────────────────────────────────

exports.getEvents = async (req, res) => {
    try {
        if (!isDB()) return res.json({ success: true, data: [] });

        const IntraopEvent = require('../models/IntraopEvent');
        const events = await IntraopEvent.find({
            appointmentId: req.params.id,
            tenantId: req.tenantId,
        }).sort({ loggedAt: 1 }).lean();

        res.json({ success: true, data: events });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.logEvent = async (req, res) => {
    try {
        if (!isDB()) return res.status(503).json({ success: false, message: 'Database unavailable' });

        const IntraopEvent = require('../models/IntraopEvent');
        const { type, note, time } = req.body;

        if (!type || !note) return res.status(400).json({ success: false, message: 'type and note are required' });

        const now = new Date();
        const hhmm = time || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const event = await IntraopEvent.create({
            appointmentId: req.params.id,
            tenantId: req.tenantId,
            type, note, time: hhmm,
            loggedBy: req.user._id,
            loggedAt: now,
        });

        res.status(201).json({ success: true, data: event.toObject() });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// ─── Instrument Counts ────────────────────────────────────────────────────────

exports.getInstruments = async (req, res) => {
    try {
        if (!isDB()) return res.status(503).json({ success: false, message: 'Database unavailable' });

        const InstrumentCount = require('../models/InstrumentCount');
        let record = await InstrumentCount.findOne({
            appointmentId: req.params.id,
            tenantId: req.tenantId,
        }).lean();

        if (!record) {
            record = await InstrumentCount.create({
                appointmentId: req.params.id,
                tenantId: req.tenantId,
                rows: InstrumentCount.defaultRows(),
            });
            record = record.toObject();
        }

        res.json({ success: true, data: record });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.updateCount = async (req, res) => {
    try {
        if (!isDB()) return res.status(503).json({ success: false, message: 'Database unavailable' });

        const InstrumentCount = require('../models/InstrumentCount');
        const { rowId } = req.params;
        const { count1, final } = req.body;

        const update = {};
        if (count1 !== undefined) update['rows.$.count1'] = count1;
        if (final  !== undefined) update['rows.$.final']  = final;

        const record = await InstrumentCount.findOneAndUpdate(
            { appointmentId: req.params.id, tenantId: req.tenantId, 'rows._id': rowId },
            { $set: update },
            { new: true }
        ).lean();

        if (!record) return res.status(404).json({ success: false, message: 'Row not found' });
        res.json({ success: true, data: record });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.signOff = async (req, res) => {
    try {
        if (!isDB()) return res.status(503).json({ success: false, message: 'Database unavailable' });

        const InstrumentCount = require('../models/InstrumentCount');
        const { role } = req.body;
        if (!['scrub', 'circulator'].includes(role))
            return res.status(400).json({ success: false, message: 'role must be scrub or circulator' });

        const update = role === 'scrub'
            ? { scrubSignedBy: req.user._id, scrubSignedAt: new Date() }
            : { circulatorSignedBy: req.user._id, circulatorSignedAt: new Date() };

        const record = await InstrumentCount.findOneAndUpdate(
            { appointmentId: req.params.id, tenantId: req.tenantId },
            { $set: update },
            { new: true }
        ).lean();

        if (!record) return res.status(404).json({ success: false, message: 'Instrument sheet not found' });
        res.json({ success: true, data: record });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
