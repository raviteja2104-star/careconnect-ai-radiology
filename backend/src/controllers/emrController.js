const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const Encounter = require('../models/Encounter');
const ClinicalNote = require('../models/ClinicalNote');
const ClinicalOrder = require('../models/ClinicalOrder');
const User = require('../models/User');
const EventPublisher = require('../services/EventPublisher');
const PrescriptionSafety = require('../services/PrescriptionSafety');
const TxRunner = require('../services/TxRunner');

// Optional aggregation sources — loaded defensively so the 360 view degrades
// gracefully rather than failing if a module is absent.
function tryRequire(path) {
    try { return require(path); } catch { return null; }
}
const Appointment = tryRequire('../models/Appointment');
const Consultation = tryRequire('../models/Consultation');
const RadiologyScan = tryRequire('../models/RadiologyScan');
const LabBooking = tryRequire('../models/LabBooking');
const PharmacyOrder = tryRequire('../models/PharmacyOrder');
const Invoice = tryRequire('../models/Invoice');
const TelemedicineSession = tryRequire('../models/TelemedicineSession');
const ConsentDocument = tryRequire('../models/ConsentDocument');

const traceOf = (req) => req.headers['x-trace-id'] || uuidv4();

/* ─────────────────── Clinical catalog (typeahead) ────────────────── */

// GET /api/emr/catalog?kind=medication|complaint|diagnosis|lab_test&q=…
exports.searchCatalog = async (req, res) => {
    try {
        const { kind, q } = req.query;
        const allowed = ['medication', 'complaint', 'diagnosis', 'lab_test', 'duration', 'instruction'];
        if (!allowed.includes(kind)) {
            return res.status(400).json({ message: `kind must be one of ${allowed.join(', ')}` });
        }
        const ClinicalCatalog = require('../services/ClinicalCatalogService');
        const suggestions = await ClinicalCatalog.search(kind, q, 12);
        res.json({ suggestions });
    } catch (err) {
        res.status(500).json({ message: 'Catalog search failed', error: err.message });
    }
};

async function safeFind(model, query, limit = 50) {
    if (!model) return [];
    try {
        return await model.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    } catch {
        return [];
    }
}

/* ─────────────────────────── Patient 360 ─────────────────────────── */

// GET /api/emr/patients/:patientId/summary
exports.getPatient360 = async (req, res) => {
    try {
        const { patientId } = req.params;

        // Patients may only read their own record; clinicians/admins any.
        if (req.user.role === 'patient' && String(req.user._id) !== String(patientId)) {
            return res.status(403).json({ message: 'Access denied to another patient record.' });
        }

        const patient = await User.findById(patientId)
            .select('-password')
            .lean();
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        const q = { patientId };
        const [encounters, orders, appointments, consultations, scans, labs, pharmacy, invoices, teleSessions, consents] =
            await Promise.all([
                safeFind(Encounter, q),
                safeFind(ClinicalOrder, q),
                safeFind(Appointment, { $or: [{ patientId }, { patient: patientId }] }),
                safeFind(Consultation, q),
                safeFind(RadiologyScan, { $or: [{ patientId }, { patient: patientId }] }),
                safeFind(LabBooking, { $or: [{ patientId }, { patient: patientId }] }),
                safeFind(PharmacyOrder, { $or: [{ patientId }, { patient: patientId }] }),
                safeFind(Invoice, { $or: [{ patientId }, { patient: patientId }] }),
                safeFind(TelemedicineSession, { $or: [{ patientId }, { patient: patientId }] }),
                safeFind(ConsentDocument, { $or: [{ patientId }, { patient: patientId }] }),
            ]);

        const timeline = [
            ...encounters.map((e) => ({ kind: 'encounter', at: e.createdAt, title: `${e.type.toUpperCase()} encounter — ${e.specialty}`, status: e.status, ref: e._id })),
            ...orders.map((o) => ({ kind: `order:${o.category}`, at: o.createdAt, title: `${o.category} order ${o.orderCode}`, status: o.status, priority: o.priority, ref: o._id })),
            ...appointments.map((a) => ({ kind: 'appointment', at: a.createdAt, title: a.reason || 'Appointment', status: a.status, ref: a._id })),
            ...consultations.map((c) => ({ kind: 'consultation', at: c.createdAt, title: (c.symptoms || []).join(', ') || 'Consultation', status: c.status, ref: c._id })),
            ...scans.map((s) => ({ kind: 'radiology', at: s.createdAt, title: s.scanType || s.modality || 'Radiology study', status: s.status, ref: s._id })),
            ...labs.map((l) => ({ kind: 'lab', at: l.createdAt, title: l.testName || 'Lab test', status: l.status, ref: l._id })),
            ...pharmacy.map((p) => ({ kind: 'pharmacy', at: p.createdAt, title: 'Pharmacy order', status: p.status, ref: p._id })),
            ...invoices.map((i) => ({ kind: 'billing', at: i.createdAt, title: `Invoice ${i.invoiceNumber || ''}`.trim(), status: i.status, amount: i.totalAmount, ref: i._id })),
            ...teleSessions.map((t) => ({ kind: 'telemedicine', at: t.createdAt, title: 'Telemedicine session', status: t.status, ref: t._id })),
            ...consents.map((c) => ({ kind: 'consent', at: c.createdAt, title: c.title || 'Consent document', status: c.status, ref: c._id })),
        ]
            .filter((t) => t.at)
            .sort((a, b) => new Date(b.at) - new Date(a.at));

        const activeMedications = orders
            .filter((o) => o.category === 'medication' && ['ordered', 'acknowledged', 'in_progress'].includes(o.status))
            .flatMap((o) => (o.details && o.details.drugs) || []);

        res.json({
            patient,
            summary: {
                encounters: encounters.length,
                openOrders: orders.filter((o) => !['completed', 'cancelled'].includes(o.status)).length,
                labReports: labs.length,
                radiologyStudies: scans.length,
                invoices: invoices.length,
                activeMedications: activeMedications.length,
            },
            activeMedications,
            diagnoses: encounters.flatMap((e) => e.diagnoses || []),
            timeline: timeline.slice(0, 200),
        });
    } catch (err) {
        console.error('[EMR] getPatient360 failed:', err.message);
        res.status(500).json({ message: 'Failed to build patient 360', error: err.message });
    }
};

/* ──────────────── AI medication suggestions (CDS) ────────────────── */

// POST /api/emr/ai/medication-suggestions
// Decision support ONLY — never prescribes. Tries the Claude AI service
// first; falls back to the curated first-line reference when unavailable.
// Every suggestion is screened against the supplied patient context
// (allergies, current medications, renal/pregnancy) before returning.
exports.suggestMedications = async (req, res) => {
    try {
        const { diagnoses = [], symptoms = '', patient = {}, exclude = [] } = req.body || {};

        if (!Array.isArray(diagnoses) || diagnoses.filter((d) => String(d).trim()).length === 0) {
            return res.json({
                source: 'insufficient',
                suggestions: [],
                notice: 'Additional patient information may be required before generating a reliable medication suggestion. Add at least one diagnosis.',
            });
        }

        let source = 'reference';
        let suggestions = [];
        let notice = '';

        // 1) Claude AI service (honest 503 when no key / unreachable).
        try {
            const axios = require('axios');
            const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
            const { data } = await axios.post(
                `${aiUrl}/api/ai/medication-suggestions`,
                { diagnoses, symptoms, patient, exclude },
                { timeout: 60000 }
            );
            if (data && data.needsMoreInfo) {
                return res.json({
                    source: 'ai',
                    suggestions: [],
                    notice: 'Additional patient information may be required before generating a reliable medication suggestion.'
                        + (Array.isArray(data.missingInfo) && data.missingInfo.length ? ` Missing: ${data.missingInfo.join(', ')}.` : ''),
                });
            }
            if (data && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
                source = 'ai';
                suggestions = data.suggestions;
                notice = data.note || '';
            }
        } catch {
            // AI unavailable — fall through to the reference list.
        }

        // 2) Curated first-line reference fallback.
        if (suggestions.length === 0) {
            const TreatmentReference = require('../services/TreatmentReference');
            suggestions = TreatmentReference.suggestFor(diagnoses, exclude);
            source = 'reference';
            notice = suggestions.length
                ? 'Standard first-line reference options — verify against current guidelines and this patient\'s full context.'
                : 'No reference suggestions available for the entered diagnoses. AI suggestions require the AI service to be configured.';
        }

        // 3) Per-patient safety screening on every suggestion.
        const context = {
            currentMedications: patient.currentMedications || [],
            allergies: patient.allergies || [],
            renalImpairment: Boolean(patient.renalImpairment),
            pregnant: Boolean(patient.pregnant),
        };
        const screened = suggestions.map((s) => {
            const flags = PrescriptionSafety.screen(
                [{ name: s.generic || s.name, dose: s.dosage }],
                context
            );
            return { ...s, warnings: flags };
        });

        res.json({
            source,
            suggestions: screened,
            notice,
            disclaimer: 'Clinical decision support only. The doctor must review, modify, and explicitly approve every medication. AI assists the doctor — the doctor makes the decision.',
        });
    } catch (err) {
        res.status(500).json({ message: 'Medication suggestion failed', error: err.message });
    }
};

/* ─────────────────────────── Encounters ─────────────────────────── */

// POST /api/emr/encounters
exports.createEncounter = async (req, res) => {
    try {
        const traceId = traceOf(req);
        const { patientId, appointmentId, type, specialty, chiefComplaint } = req.body;
        if (!patientId) return res.status(400).json({ message: 'patientId is required' });

        const encounter = await Encounter.create({
            patientId,
            doctorId: req.user._id,
            appointmentId,
            type,
            specialty,
            chiefComplaint,
            traceId,
        });

        await EventPublisher.publish({
            eventType: 'EncounterCreated',
            aggregateId: encounter._id,
            traceId,
            payload: { encounterId: encounter._id, patientId, doctorId: req.user._id, type: encounter.type },
            recipient: { channel: 'INTERNAL' },
        });

        res.status(201).json(encounter);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create encounter', error: err.message });
    }
};

// GET /api/emr/encounters?patientId=…
exports.listEncounters = async (req, res) => {
    try {
        const filter = {};
        if (req.query.patientId) filter.patientId = req.query.patientId;
        if (req.user.role === 'patient') filter.patientId = req.user._id;
        if (req.query.status) filter.status = req.query.status;
        const encounters = await Encounter.find(filter)
            .sort({ createdAt: -1 })
            .limit(100)
            .populate('doctorId', 'name')
            .populate('patientId', 'name')
            .lean();
        res.json(encounters);
    } catch (err) {
        res.status(500).json({ message: 'Failed to list encounters', error: err.message });
    }
};

// GET /api/emr/encounters/:id  (encounter + notes + orders)
exports.getEncounter = async (req, res) => {
    try {
        const encounter = await Encounter.findById(req.params.id)
            .populate('doctorId', 'name')
            .populate('patientId', 'name')
            .lean();
        if (!encounter) return res.status(404).json({ message: 'Encounter not found' });
        if (req.user.role === 'patient' && String(encounter.patientId._id) !== String(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const [notes, orders] = await Promise.all([
            ClinicalNote.find({ encounterId: encounter._id }).sort({ version: -1 }).lean(),
            ClinicalOrder.find({ encounterId: encounter._id }).sort({ createdAt: -1 }).lean(),
        ]);
        res.json({ encounter, notes, orders });
    } catch (err) {
        res.status(500).json({ message: 'Failed to load encounter', error: err.message });
    }
};

// POST /api/emr/encounters/:id/vitals
exports.addVitals = async (req, res) => {
    try {
        const encounter = await Encounter.findById(req.params.id);
        if (!encounter) return res.status(404).json({ message: 'Encounter not found' });
        encounter.vitals.push({ ...req.body, recordedBy: req.user._id });
        await encounter.save();
        res.status(201).json(encounter.vitals[encounter.vitals.length - 1]);
    } catch (err) {
        res.status(500).json({ message: 'Failed to record vitals', error: err.message });
    }
};

// POST /api/emr/encounters/:id/diagnoses
exports.addDiagnosis = async (req, res) => {
    try {
        const encounter = await Encounter.findById(req.params.id);
        if (!encounter) return res.status(404).json({ message: 'Encounter not found' });
        encounter.diagnoses.push({ ...req.body, notedBy: req.user._id });
        await encounter.save();
        res.status(201).json(encounter.diagnoses[encounter.diagnoses.length - 1]);
    } catch (err) {
        res.status(500).json({ message: 'Failed to add diagnosis', error: err.message });
    }
};

/* ──────────────────────── Clinical notes ────────────────────────── */

// PUT /api/emr/encounters/:id/note   (create or update the current draft)
exports.saveNote = async (req, res) => {
    try {
        const traceId = traceOf(req);
        const encounter = await Encounter.findById(req.params.id);
        if (!encounter) return res.status(404).json({ message: 'Encounter not found' });

        let note = await ClinicalNote.findOne({ encounterId: encounter._id, status: 'draft' }).sort({ version: -1 });
        if (note) {
            note.sections = { ...note.sections, ...req.body.sections };
            if (req.body.format) note.format = req.body.format;
            if (req.body.templateKey) note.templateKey = req.body.templateKey;
            note.auditTrail.push({ action: 'updated', by: req.user._id });
            await note.save();
        } else {
            const latest = await ClinicalNote.findOne({ encounterId: encounter._id }).sort({ version: -1 }).select('version').lean();
            note = await ClinicalNote.create({
                encounterId: encounter._id,
                patientId: encounter.patientId,
                authorId: req.user._id,
                format: req.body.format || 'SOAP',
                templateKey: req.body.templateKey,
                sections: req.body.sections || {},
                version: latest ? latest.version + 1 : 1,
                auditTrail: [{ action: 'created', by: req.user._id }],
                traceId,
            });
        }
        if (encounter.status === 'open') {
            encounter.status = 'documented';
            await encounter.save();
        }
        res.json(note);
    } catch (err) {
        res.status(500).json({ message: 'Failed to save note', error: err.message });
    }
};

// POST /api/emr/notes/:noteId/sign
exports.signNote = async (req, res) => {
    try {
        const traceId = traceOf(req);
        const note = await ClinicalNote.findById(req.params.noteId);
        if (!note) return res.status(404).json({ message: 'Note not found' });
        if (note.status !== 'draft') return res.status(409).json({ message: 'Only draft notes can be signed.' });

        note.status = 'signed';
        note.signedAt = new Date();
        note.signedBy = req.user._id;
        note.signatureHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(note.sections))
            .digest('hex');
        note.auditTrail.push({ action: 'signed', by: req.user._id });
        await note.save();

        await Encounter.findByIdAndUpdate(note.encounterId, {
            status: 'signed',
            signedAt: note.signedAt,
            signedBy: req.user._id,
        });

        await EventPublisher.publish({
            eventType: 'ClinicalNoteSigned',
            aggregateId: note._id,
            traceId,
            payload: { noteId: note._id, encounterId: note.encounterId, patientId: note.patientId, signedBy: req.user._id, signatureHash: note.signatureHash },
            recipient: { channel: 'INTERNAL' },
        });

        res.json(note);
    } catch (err) {
        res.status(500).json({ message: 'Failed to sign note', error: err.message });
    }
};

// POST /api/emr/notes/:noteId/amend  → new draft version superseding the signed note
exports.amendNote = async (req, res) => {
    try {
        const signed = await ClinicalNote.findById(req.params.noteId);
        if (!signed) return res.status(404).json({ message: 'Note not found' });
        if (signed.status !== 'signed') return res.status(409).json({ message: 'Only signed notes can be amended.' });

        const amendment = await ClinicalNote.create({
            encounterId: signed.encounterId,
            patientId: signed.patientId,
            authorId: req.user._id,
            format: signed.format,
            templateKey: signed.templateKey,
            sections: { ...signed.toObject().sections, ...(req.body.sections || {}) },
            version: signed.version + 1,
            supersedes: signed._id,
            auditTrail: [{ action: 'amended', by: req.user._id, note: req.body.reason }],
        });

        signed.status = 'amended';
        signed.auditTrail.push({ action: 'superseded', by: req.user._id, note: `Superseded by v${amendment.version}` });
        signed.$locals.allowAmendTransition = true;
        await signed.save();

        res.status(201).json(amendment);
    } catch (err) {
        res.status(500).json({ message: 'Failed to amend note', error: err.message });
    }
};

/* ─────────────────────────── Orders ─────────────────────────────── */

const ORDER_EVENTS = {
    lab: 'LabOrdered',
    radiology: 'RadiologyOrdered',
    procedure: 'ProcedureOrdered',
    medication: 'MedicationOrdered',
    referral: 'ReferralCreated',
    followup: 'FollowUpScheduled',
};

// POST /api/emr/encounters/:id/orders
exports.createOrder = async (req, res) => {
    try {
        const traceId = traceOf(req);
        const encounter = await Encounter.findById(req.params.id);
        if (!encounter) return res.status(404).json({ message: 'Encounter not found' });

        const { category, priority, department, details = {}, safetyContext = {} } = req.body;
        if (!category) return res.status(400).json({ message: 'category is required' });

        // Advisory safety screening for medication orders — clinician decides.
        let safetyReview;
        if (category === 'medication') {
            const flags = PrescriptionSafety.screen(details.drugs || [], safetyContext);
            safetyReview = { flags, reviewedBy: req.user._id, reviewedAt: new Date(), overrideReason: req.body.overrideReason };
            const criticalUnacknowledged = flags.some((f) => f.severity === 'critical') && !req.body.acknowledgeCritical;
            if (criticalUnacknowledged) {
                return res.status(422).json({
                    message: 'Critical safety flags require explicit clinician acknowledgement (acknowledgeCritical: true).',
                    flags,
                });
            }
        }

        // Order write + outbox row commit atomically (transactional outbox).
        const order = await TxRunner.run(async (session) => {
            const doc = {
                encounterId: encounter._id,
                patientId: encounter.patientId,
                orderingDoctorId: req.user._id,
                category,
                priority,
                department,
                details,
                safetyReview,
                auditTrail: [{ action: 'ordered', by: req.user._id }],
                traceId,
            };
            const [created] = session
                ? await ClinicalOrder.create([doc], { session })
                : [await ClinicalOrder.create(doc)];

            await EventPublisher.publish({
                session,
                eventType: ORDER_EVENTS[category] || 'ClinicalOrderCreated',
                aggregateId: created._id,
                traceId,
                payload: {
                    orderId: created._id,
                    orderCode: created.orderCode,
                    encounterId: encounter._id,
                    patientId: encounter.patientId,
                    orderingDoctorId: req.user._id,
                    category,
                    priority: created.priority,
                    details,
                },
                recipient: { channel: 'INTERNAL' },
            });

            return created;
        });

        res.status(201).json(order);
    } catch (err) {
        res.status(500).json({ message: 'Failed to create order', error: err.message });
    }
};

// GET /api/emr/orders?patientId=…&category=…&status=…
exports.listOrders = async (req, res) => {
    try {
        const filter = {};
        if (req.query.patientId) filter.patientId = req.query.patientId;
        if (req.user.role === 'patient') filter.patientId = req.user._id;
        if (req.query.category) filter.category = req.query.category;
        if (req.query.status) filter.status = req.query.status;
        const orders = await ClinicalOrder.find(filter)
            .sort({ createdAt: -1 })
            .limit(200)
            .populate('orderingDoctorId', 'name')
            .lean();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Failed to list orders', error: err.message });
    }
};

// PATCH /api/emr/orders/:orderId/status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status, note } = req.body;
        const allowed = ['acknowledged', 'in_progress', 'completed', 'cancelled'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: `status must be one of ${allowed.join(', ')}` });
        }
        const order = await ClinicalOrder.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (['completed', 'cancelled'].includes(order.status)) {
            return res.status(409).json({ message: `Order already ${order.status}.` });
        }
        order.status = status;
        order.auditTrail.push({ action: status, by: req.user._id, note });
        await order.save();

        await EventPublisher.publish({
            eventType: 'ClinicalOrderStatusChanged',
            aggregateId: order._id,
            traceId: order.traceId || traceOf(req),
            payload: { orderId: order._id, orderCode: order.orderCode, category: order.category, status },
            recipient: { channel: 'INTERNAL' },
        });

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Failed to update order', error: err.message });
    }
};
