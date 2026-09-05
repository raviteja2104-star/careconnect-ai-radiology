/**
 * lisController — Laboratory Information System worklist API.
 *
 * Lifecycle: ORDERED → SAMPLE_COLLECTED → PROCESSING → VERIFICATION_PENDING
 *            → VERIFIED → RELEASED (locked) → [amend] → VERIFICATION_PENDING …
 *            (sample rejection → REJECTED + recollectionRequired)
 *
 * Publishes: 'LabSampleRejected', 'LabCriticalResult', 'LabReportReleased',
 *            'LabReportAmended'.
 */

'use strict';

const LabWorkItem = require('../models/LabWorkItem');
const LabReferenceRange = require('../models/LabReferenceRange');
const EventPublisher = require('../services/EventPublisher');
const { computeFlag, resolveRange, formatRange } = require('../services/LabValidation');

function tryRequire(path) {
    try { return require(path); } catch (err) { return null; }
}

const ClinicalOrder = tryRequire('../models/ClinicalOrder');
const Notification = tryRequire('../models/Notification');
const User = tryRequire('../models/User');

const catalog = tryRequire('../data/billableCatalog') || {};
const LAB_TESTS = Array.isArray(catalog.labTests) ? catalog.labTests : [];

const fold = (v) => String(v == null ? '' : v).trim().toLowerCase();
const TESTS_BY_CODE = new Map(LAB_TESTS.map((t) => [fold(t.code), t]));
const TESTS_BY_NAME = new Map(LAB_TESTS.map((t) => [fold(t.name), t]));

const traceOf = (req) => req.headers['x-trace-id'];
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function notFound(res) {
    return res.status(404).json({ success: false, message: 'Lab work item not found' });
}

async function loadItem(req, res) {
    const item = await LabWorkItem.findById(req.params.id);
    if (!item) {
        notFound(res);
        return null;
    }
    return item;
}

function ageInYears(dateOfBirth) {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return null;
    return Math.max(0, Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
}

async function patientContext(patientId) {
    if (!User || !patientId) return { age: null, sex: null };
    try {
        const patient = await User.findById(patientId).select('dateOfBirth gender').lean();
        return { age: ageInYears(patient?.dateOfBirth), sex: patient?.gender || null };
    } catch (err) {
        return { age: null, sex: null };
    }
}

/** Catalogue entry for a parameter (panel members carry their own labTests row). */
function catalogEntryForParam(paramName, testCode) {
    return TESTS_BY_NAME.get(fold(paramName)) || TESTS_BY_CODE.get(fold(testCode)) || null;
}

/**
 * Apply a results payload onto the work item's tests[] — resolving reference
 * ranges, computing flags, snapshotting refRangeUsed, and recording critical
 * events. Mutates `item`; caller decides whether to save.
 *
 * @returns {{errors: String[], criticals: Array}}
 */
async function applyResults(item, testsInput, ctx) {
    const errors = [];
    const criticals = [];

    for (const incoming of testsInput) {
        if (!incoming || typeof incoming !== 'object') continue;
        const target = item.tests.find(
            (t) => (incoming.code && fold(t.code) === fold(incoming.code)) ||
                   (incoming.name && fold(t.name) === fold(incoming.name))
        );
        if (!target) {
            errors.push(`Unknown test '${incoming.code || incoming.name}' for this work item`);
            continue;
        }
        if (incoming.techComments !== undefined) target.techComments = incoming.techComments;

        const params = Array.isArray(incoming.parameters) ? incoming.parameters : [];
        for (const p of params) {
            if (!p || !p.name) continue;
            const param = target.parameters.find((tp) => fold(tp.name) === fold(p.name));
            if (!param) {
                errors.push(`Unknown parameter '${p.name}' on test '${target.name}'`);
                continue;
            }

            param.value = p.value;
            if (p.comments !== undefined) param.comments = p.comments;

            const entry = catalogEntryForParam(param.name, target.code);
            const rangeCode = entry ? entry.code : target.code;
            const resultType = entry ? entry.resultType : 'numeric';

            let candidates = [];
            if (rangeCode) {
                candidates = await LabReferenceRange.find({
                    testCode: rangeCode,
                    active: true,
                    tenantId: item.tenantId || 't-default',
                }).lean();
                candidates = candidates.filter(
                    (r) => !r.parameter || fold(r.parameter) === fold(param.name) || fold(r.parameter) === fold(rangeCode)
                );
            }
            const range = resolveRange(candidates, { ...ctx, specimen: target.specimen });

            if (range) {
                const outcome = computeFlag({ value: p.value, resultType, range });
                if (outcome.error) {
                    errors.push(`${target.name} / ${param.name}: ${outcome.error}`);
                    continue;
                }
                param.flag = outcome.flag;
                param.refRangeUsed = formatRange(range);
                if (range.unit) param.unit = range.unit;
                else if (entry && entry.unit) param.unit = entry.unit;
            } else {
                // Fallback: snapshot the catalogue's indicative default; no auto-flag.
                param.flag = null;
                param.refRangeUsed = entry && entry.refRange ? entry.refRange.default || '' : '';
                if (entry && entry.unit && !param.unit) param.unit = entry.unit;
            }

            if (param.flag === 'critical') {
                const event = { parameter: param.name, value: p.value, at: new Date() };
                item.criticalEvents.push(event);
                criticals.push({ test: target.name, parameter: param.name, value: p.value, refRangeUsed: param.refRangeUsed });
            }
        }
    }

    return { errors, criticals };
}

async function publishCriticals(item, criticals, traceId) {
    if (!criticals.length) return;
    await EventPublisher.publish({
        eventType: 'LabCriticalResult',
        aggregateId: item._id,
        tenantId: item.tenantId,
        traceId: traceId || item.traceId,
        payload: {
            workItemId: item._id,
            labNumber: item.labNumber,
            patientId: item.patientId,
            orderingDoctorId: item.orderingDoctorId,
            criticals,
        },
        recipient: { channel: 'INTERNAL' },
    });
}

/* ─────────────────────────── Worklist reads ─────────────────────────── */

// GET /api/lis/worklist?status&priority&q
exports.getWorklist = async (req, res) => {
    try {
        const { status, priority, q } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (q) {
            const rx = new RegExp(escapeRegex(q), 'i');
            filter.$or = [{ labNumber: rx }, { 'tests.name': rx }];
        }

        const items = await LabWorkItem.find(filter)
            .populate('patientId', 'firstName lastName')
            .populate('orderingDoctorId', 'firstName lastName')
            .sort({ createdAt: 1 })
            .lean();

        const now = Date.now();
        const data = items.map((i) => ({
            ...i,
            ageMinutes: Math.max(0, Math.round((now - new Date(i.createdAt).getTime()) / 60000)),
        }));

        res.json({ success: true, count: data.length, data });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to load worklist', error: err.message });
    }
};

// GET /api/lis/worklist/:id
exports.getWorkItem = async (req, res) => {
    try {
        const item = await LabWorkItem.findById(req.params.id)
            .populate('patientId', 'firstName lastName dateOfBirth gender')
            .populate('orderingDoctorId', 'firstName lastName');
        if (!item) return notFound(res);
        res.json({ success: true, data: item });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to load work item', error: err.message });
    }
};

/* ─────────────────────────── Sample handling ─────────────────────────── */

// POST /api/lis/worklist/:id/collect
exports.collectSample = async (req, res) => {
    try {
        const item = await loadItem(req, res);
        if (!item) return;
        if (!['ORDERED', 'REJECTED'].includes(item.status)) {
            return res.status(409).json({ success: false, message: `Cannot collect sample while status is ${item.status}` });
        }

        item.sample.collectedAt = new Date();
        item.sample.collectedBy = req.user._id;
        item.sample.quality = null;
        item.sample.rejectedReason = undefined;
        item.sample.recollectionRequired = false;
        item.status = 'SAMPLE_COLLECTED';
        item.auditTrail.push({ action: 'SAMPLE_COLLECTED', by: req.user._id });
        await item.save();

        res.json({ success: true, data: item });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to collect sample', error: err.message });
    }
};

// PATCH /api/lis/worklist/:id/sample  { quality, rejectedReason? }
exports.gradeSample = async (req, res) => {
    try {
        const { quality, rejectedReason } = req.body;
        const allowed = LabWorkItem.SAMPLE_QUALITIES.filter((s) => s !== null);
        if (!quality || !allowed.includes(quality)) {
            return res.status(400).json({ success: false, message: `quality must be one of: ${allowed.join(', ')}` });
        }

        const item = await loadItem(req, res);
        if (!item) return;
        if (item.status !== 'SAMPLE_COLLECTED') {
            return res.status(409).json({ success: false, message: `Cannot grade sample while status is ${item.status}` });
        }

        item.sample.quality = quality;
        if (quality === 'accepted') {
            item.status = 'PROCESSING';
            item.auditTrail.push({ action: 'SAMPLE_ACCEPTED', by: req.user._id });
            await item.save();
            return res.json({ success: true, data: item });
        }

        item.sample.rejectedReason = rejectedReason || quality;
        item.sample.recollectionRequired = true;
        item.status = 'REJECTED';
        item.auditTrail.push({ action: 'SAMPLE_REJECTED', by: req.user._id, note: rejectedReason || quality });
        await item.save();

        await EventPublisher.publish({
            eventType: 'LabSampleRejected',
            aggregateId: item._id,
            tenantId: item.tenantId,
            traceId: traceOf(req) || item.traceId,
            payload: {
                workItemId: item._id,
                labNumber: item.labNumber,
                patientId: item.patientId,
                quality,
                rejectedReason: item.sample.rejectedReason,
                recollectionRequired: true,
            },
            recipient: { channel: 'INTERNAL' },
        });

        res.json({ success: true, data: item });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to grade sample', error: err.message });
    }
};

/* ─────────────────────────── Results entry ─────────────────────────── */

// PUT /api/lis/worklist/:id/results  { tests: [{ code, parameters: [{name,value,comments?}], techComments? }] }
exports.enterResults = async (req, res) => {
    try {
        const item = await loadItem(req, res);
        if (!item) return;
        if (item.locked) {
            return res.status(409).json({ success: false, message: 'Report is locked (released). Use /amend to modify it.' });
        }

        const { tests } = req.body;
        if (!Array.isArray(tests) || tests.length === 0) {
            return res.status(400).json({ success: false, message: 'tests array is required' });
        }

        const ctx = await patientContext(item.patientId);
        const { errors, criticals } = await applyResults(item, tests, ctx);
        if (errors.length) {
            return res.status(400).json({ success: false, message: 'Result validation failed', errors });
        }

        item.status = 'VERIFICATION_PENDING';
        item.verification = {};
        item.auditTrail.push({ action: 'RESULTS_ENTERED', by: req.user._id });
        await item.save();

        await publishCriticals(item, criticals, traceOf(req));

        res.json({ success: true, data: item, criticalCount: criticals.length });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to enter results', error: err.message });
    }
};

/* ─────────────────────────── Verification ─────────────────────────── */

// POST /api/lis/worklist/:id/verify  { level: 'technical'|'pathologist' }
exports.verify = async (req, res) => {
    try {
        const { level } = req.body;
        if (!['technical', 'pathologist'].includes(level)) {
            return res.status(400).json({ success: false, message: "level must be 'technical' or 'pathologist'" });
        }

        const item = await loadItem(req, res);
        if (!item) return;
        if (item.status !== 'VERIFICATION_PENDING') {
            return res.status(409).json({ success: false, message: `Cannot verify while status is ${item.status}` });
        }

        if (level === 'technical') {
            if (!['lab_tech', 'admin'].includes(req.user.role)) {
                return res.status(403).json({ success: false, message: 'Technical verification requires a lab technician' });
            }
            item.verification.technicalBy = req.user._id;
            item.verification.technicalAt = new Date();
            item.auditTrail.push({ action: 'VERIFIED_TECHNICAL', by: req.user._id });
        } else {
            if (!['doctor', 'admin'].includes(req.user.role)) {
                return res.status(403).json({ success: false, message: 'Pathologist verification requires a doctor' });
            }
            const unacked = (item.criticalEvents || []).some((e) => !e.acknowledgedAt);
            if (unacked) {
                return res.status(409).json({
                    success: false,
                    message: 'Unacknowledged critical results — acknowledge them (POST /critical/ack) before pathologist verification.',
                });
            }
            if (!item.verification.technicalAt) {
                return res.status(400).json({ success: false, message: 'Technical verification must be completed first' });
            }
            item.verification.pathologistBy = req.user._id;
            item.verification.pathologistAt = new Date();
            item.status = 'VERIFIED';
            item.auditTrail.push({ action: 'VERIFIED_PATHOLOGIST', by: req.user._id });
        }

        await item.save();
        res.json({ success: true, data: item });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to verify', error: err.message });
    }
};

// POST /api/lis/worklist/:id/critical/ack  { index, notifiedWho, notificationMethod }
exports.acknowledgeCritical = async (req, res) => {
    try {
        const { index, notifiedWho, notificationMethod } = req.body;
        const item = await loadItem(req, res);
        if (!item) return;

        const i = Number(index);
        if (!Number.isInteger(i) || i < 0 || i >= (item.criticalEvents || []).length) {
            return res.status(400).json({ success: false, message: 'index must reference an existing critical event' });
        }

        const event = item.criticalEvents[i];
        event.notifiedWho = notifiedWho;
        event.notificationMethod = notificationMethod;
        event.acknowledgedBy = req.user._id;
        event.acknowledgedAt = new Date();
        item.auditTrail.push({
            action: 'CRITICAL_ACKNOWLEDGED',
            by: req.user._id,
            note: `${event.parameter} = ${event.value} → ${notifiedWho || 'n/a'} via ${notificationMethod || 'n/a'}`,
        });
        await item.save();

        res.json({ success: true, data: item });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to acknowledge critical result', error: err.message });
    }
};

/* ─────────────────────────── Release & amendment ─────────────────────────── */

// POST /api/lis/worklist/:id/release
exports.release = async (req, res) => {
    try {
        const item = await loadItem(req, res);
        if (!item) return;
        if (item.status !== 'VERIFIED') {
            return res.status(409).json({ success: false, message: `Only VERIFIED reports can be released (current: ${item.status})` });
        }

        item.status = 'RELEASED';
        item.releasedAt = new Date();
        item.releasedBy = req.user._id;
        item.locked = true;
        item.auditTrail.push({ action: 'REPORT_RELEASED', by: req.user._id });
        await item.save();

        // Complete the originating ClinicalOrder (idempotent — skip if already closed).
        if (ClinicalOrder && item.clinicalOrderId) {
            try {
                const order = await ClinicalOrder.findById(item.clinicalOrderId);
                if (order && !['completed', 'cancelled'].includes(order.status)) {
                    order.status = 'completed';
                    order.resultRef = { model: 'LabWorkItem', id: item._id };
                    order.auditTrail.push({ action: 'completed', by: req.user._id, note: `Lab report released (${item.labNumber})` });
                    await order.save();
                }
            } catch (err) {
                console.error(`[lisController] Failed to complete ClinicalOrder ${item.clinicalOrderId}:`, err.message);
            }
        }

        // In-app notifications: ordering doctor + patient.
        if (Notification) {
            const notifications = [];
            if (item.orderingDoctorId) {
                notifications.push({
                    userId: item.orderingDoctorId,
                    type: 'report_reviewed',
                    title: `Lab report released — ${item.labNumber}`,
                    message: 'A verified laboratory report for your order has been released.',
                    data: { workItemId: item._id, labNumber: item.labNumber, patientId: item.patientId },
                });
            }
            if (item.patientId) {
                notifications.push({
                    userId: item.patientId,
                    type: 'general',
                    title: 'Your lab report is ready',
                    message: 'Your laboratory report has been verified and released. It is now available in your health records.',
                    data: { workItemId: item._id, labNumber: item.labNumber },
                });
            }
            if (notifications.length) {
                try {
                    await Notification.insertMany(notifications);
                } catch (err) {
                    console.error('[lisController] Failed to insert release notifications:', err.message);
                }
            }
        }

        await EventPublisher.publish({
            eventType: 'LabReportReleased',
            aggregateId: item._id,
            tenantId: item.tenantId,
            traceId: traceOf(req) || item.traceId,
            payload: {
                workItemId: item._id,
                labNumber: item.labNumber,
                clinicalOrderId: item.clinicalOrderId,
                patientId: item.patientId,
                orderingDoctorId: item.orderingDoctorId,
                releasedBy: req.user._id,
            },
            recipient: { channel: 'INTERNAL' },
        });

        res.json({ success: true, data: item });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to release report', error: err.message });
    }
};

// POST /api/lis/worklist/:id/amend  { reason, tests }
exports.amend = async (req, res) => {
    try {
        const { reason, tests } = req.body;
        if (!reason || !String(reason).trim()) {
            return res.status(400).json({ success: false, message: 'reason is required for an amendment' });
        }
        if (!Array.isArray(tests) || tests.length === 0) {
            return res.status(400).json({ success: false, message: 'tests array is required' });
        }

        const item = await loadItem(req, res);
        if (!item) return;
        if (!item.locked) {
            return res.status(409).json({ success: false, message: 'Only released (locked) reports can be amended' });
        }

        // Snapshot the pre-amendment report before touching anything.
        item.amendments.push({
            by: req.user._id,
            reason: String(reason).trim(),
            previousTests: item.toObject().tests,
        });

        const ctx = await patientContext(item.patientId);
        const { errors, criticals } = await applyResults(item, tests, ctx);
        if (errors.length) {
            return res.status(400).json({ success: false, message: 'Amendment validation failed', errors });
        }

        item.status = 'VERIFICATION_PENDING';
        item.locked = false;
        item.verification = {};
        item.auditTrail.push({ action: 'REPORT_AMENDED', by: req.user._id, note: String(reason).trim() });
        await item.save();

        await EventPublisher.publish({
            eventType: 'LabReportAmended',
            aggregateId: item._id,
            tenantId: item.tenantId,
            traceId: traceOf(req) || item.traceId,
            payload: {
                workItemId: item._id,
                labNumber: item.labNumber,
                clinicalOrderId: item.clinicalOrderId,
                patientId: item.patientId,
                orderingDoctorId: item.orderingDoctorId,
                reason: String(reason).trim(),
                amendedBy: req.user._id,
            },
            recipient: { channel: 'INTERNAL' },
        });

        await publishCriticals(item, criticals, traceOf(req));

        res.json({ success: true, data: item, criticalCount: criticals.length });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to amend report', error: err.message });
    }
};

/* ─────────────────────────── History ─────────────────────────── */

// GET /api/lis/history?patientId&parameter — released values for one analyte, oldest→newest
exports.history = async (req, res) => {
    try {
        const { patientId, parameter } = req.query;
        if (!patientId || !parameter) {
            return res.status(400).json({ success: false, message: 'patientId and parameter query params are required' });
        }

        const items = await LabWorkItem.find({ patientId, status: 'RELEASED' }).lean();
        const key = fold(parameter);
        const points = [];
        for (const item of items) {
            const at = item.releasedAt || item.updatedAt || item.createdAt;
            for (const t of item.tests || []) {
                for (const p of t.parameters || []) {
                    if (fold(p.name) === key) {
                        points.push({ at, value: p.value, unit: p.unit, flag: p.flag, refRangeUsed: p.refRangeUsed });
                    }
                }
            }
        }
        points.sort((a, b) => new Date(a.at) - new Date(b.at));

        res.json({ success: true, count: points.length, data: points });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to load history', error: err.message });
    }
};

/* ─────────────────────────── Reference ranges ─────────────────────────── */

// GET /api/lis/reference-ranges?testCode&parameter
exports.listReferenceRanges = async (req, res) => {
    try {
        const { testCode, parameter, active } = req.query;
        const filter = {};
        if (testCode) filter.testCode = testCode;
        if (parameter) filter.parameter = parameter;
        if (active !== undefined) filter.active = active !== 'false';
        const ranges = await LabReferenceRange.find(filter).sort({ testCode: 1, parameter: 1 });
        res.json({ success: true, count: ranges.length, data: ranges });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to load reference ranges', error: err.message });
    }
};

// POST /api/lis/reference-ranges
exports.createReferenceRange = async (req, res) => {
    try {
        const range = await LabReferenceRange.create(req.body);
        res.status(201).json({ success: true, data: range });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Failed to create reference range', error: err.message });
    }
};

// PUT /api/lis/reference-ranges/:id
exports.updateReferenceRange = async (req, res) => {
    try {
        const range = await LabReferenceRange.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!range) return res.status(404).json({ success: false, message: 'Reference range not found' });
        res.json({ success: true, data: range });
    } catch (err) {
        res.status(400).json({ success: false, message: 'Failed to update reference range', error: err.message });
    }
};
