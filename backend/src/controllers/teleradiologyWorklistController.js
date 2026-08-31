/**
 * Teleradiology Worklist Controller — the radiologist reading workflow.
 * Backs /api/teleradiology/worklist (the legacy /api/teleradiology routes are untouched).
 *
 * Workflow: UNREAD → IN_PROGRESS → DRAFT → REVIEW → SIGNED (→ DELIVERED).
 * Signed report sections are immutable — corrections go in as addendum versions.
 */
const crypto = require('crypto');
const RadiologyStudy = require('../models/RadiologyStudy');
const User = require('../models/User');
const EventPublisher = require('../services/EventPublisher');
const TatEngine = require('../services/TatEngine');

const PRIORITY_RANK = { emergency: 0, stat: 1, urgent: 2, routine: 3 };
const SECTION_KEYS = ['technique', 'comparison', 'findings', 'impression', 'recommendations'];
const OPEN_STATUSES = ['ORDERED', 'RECEIVED', 'UNREAD', 'IN_PROGRESS', 'DRAFT', 'REVIEW'];

// Guarded forward transitions for PATCH /:studyId/status.
// REVIEW → SIGNED is intentionally NOT allowed here: signing must go through
// POST /:studyId/sign so the signature hash and final version are recorded.
const ALLOWED_TRANSITIONS = {
    UNREAD: ['IN_PROGRESS'],
    IN_PROGRESS: ['DRAFT'],
    DRAFT: ['REVIEW'],
    REVIEW: [],
};

const sha256 = (obj) => crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');

const pickSections = (input = {}) => {
    const sections = {};
    for (const key of SECTION_KEYS) {
        if (typeof input[key] === 'string') sections[key] = input[key];
    }
    return sections;
};

const sectionsSnapshot = (report) => {
    const src = report && report.sections ? (report.sections.toObject ? report.sections.toObject() : report.sections) : {};
    const out = {};
    for (const key of SECTION_KEYS) out[key] = src[key] || '';
    return out;
};

const withComputedFields = (study, now = Date.now()) => {
    const orderedAt = study.tat && study.tat.orderedAt ? new Date(study.tat.orderedAt).getTime() : new Date(study.createdAt).getTime();
    const studyAgeMinutes = Math.round((now - orderedAt) / 60000);
    const isOpen = OPEN_STATUSES.includes(study.status);
    const slaRemainingMinutes = isOpen && study.slaMinutes != null ? Math.round(study.slaMinutes - studyAgeMinutes) : null;
    return {
        ...study,
        studyAgeMinutes,
        slaRemainingMinutes,
        slaBreached: isOpen && slaRemainingMinutes != null && slaRemainingMinutes < 0,
    };
};

const loadStudy = async (req, res) => {
    const study = await RadiologyStudy.findById(req.params.studyId);
    if (!study) {
        res.status(404).json({ success: false, message: 'Study not found' });
        return null;
    }
    return study;
};

/* ─────────────────────────── Worklist ─────────────────────────────── */

// GET /api/teleradiology/worklist/:studyId — single study with computed fields
exports.getStudy = async (req, res) => {
    try {
        const study = await RadiologyStudy.findById(req.params.studyId)
            .populate('patientId', 'name')
            .populate('assignedRadiologistId', 'name')
            .populate('orderingDoctorId', 'name')
            .lean();
        if (!study) return res.status(404).json({ success: false, message: 'Study not found' });
        res.json(withComputedFields(study));
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to load study', error: err.message });
    }
};

// GET /api/teleradiology/worklist
exports.getWorklist = async (req, res) => {
    try {
        const { status, modality, priority, aiFlagged, slaBreached, assignedToMe } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (modality) filter.modality = modality;
        if (priority) filter.priority = priority;
        if (aiFlagged === 'true') filter['aiTriage.flagged'] = true;
        if (assignedToMe === 'true') filter.assignedRadiologistId = req.user._id;

        const now = Date.now();
        let studies = (
            await RadiologyStudy.find(filter)
                .populate('patientId', 'firstName lastName dateOfBirth gender')
                .populate('assignedRadiologistId', 'firstName lastName')
                .sort({ createdAt: 1 })
                .limit(500)
                .lean()
        ).map((s) => withComputedFields(s, now));

        if (slaBreached === 'true') studies = studies.filter((s) => s.slaBreached);

        // STAT/emergency first, then oldest first.
        studies.sort((a, b) => {
            const rank = (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
            if (rank !== 0) return rank;
            return b.studyAgeMinutes - a.studyAgeMinutes; // oldest first within the same priority
        });

        res.json({ success: true, count: studies.length, data: studies });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to load worklist', error: err.message });
    }
};

/* ─────────────────────────── Claim / status ───────────────────────── */

// PATCH /api/teleradiology/worklist/:studyId/claim
exports.claimStudy = async (req, res) => {
    try {
        const study = await loadStudy(req, res);
        if (!study) return;
        if (!['UNREAD', 'RECEIVED'].includes(study.status)) {
            return res.status(409).json({ success: false, message: `Cannot claim a study in status ${study.status}` });
        }

        study.assignedRadiologistId = req.user._id;
        study.assignmentReason = 'Self-claimed from worklist';
        study.status = 'IN_PROGRESS';
        study.auditTrail.push({ action: 'STUDY_CLAIMED', by: req.user._id, note: 'Radiologist claimed study; status → IN_PROGRESS' });
        await study.save();

        await TatEngine.recordMilestone(study._id, 'assignedAt');
        await TatEngine.recordMilestone(study._id, 'openedAt');

        res.json({ success: true, data: study });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to claim study', error: err.message });
    }
};

// PATCH /api/teleradiology/worklist/:studyId/status
exports.updateStatus = async (req, res) => {
    try {
        const { status: target, note } = req.body;
        if (!target) return res.status(400).json({ success: false, message: 'status is required' });

        const study = await loadStudy(req, res);
        if (!study) return;

        if (target === 'SIGNED') {
            return res.status(409).json({ success: false, message: 'Reports must be signed via POST /:studyId/sign' });
        }
        const allowed = ALLOWED_TRANSITIONS[study.status] || [];
        if (!allowed.includes(target)) {
            return res.status(409).json({
                success: false,
                message: `Invalid transition ${study.status} → ${target}. Allowed: ${allowed.length ? allowed.join(', ') : 'none'}`,
            });
        }

        study.status = target;
        study.auditTrail.push({ action: `STATUS_${target}`, by: req.user._id, note });
        await study.save();

        if (target === 'IN_PROGRESS') await TatEngine.recordMilestone(study._id, 'openedAt');

        res.json({ success: true, data: study });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to update status', error: err.message });
    }
};

/* ─────────────────────────── Reporting ────────────────────────────── */

// PUT /api/teleradiology/worklist/:studyId/report — save draft sections
exports.saveReport = async (req, res) => {
    try {
        const study = await loadStudy(req, res);
        if (!study) return;
        if (['SIGNED', 'DELIVERED'].includes(study.status)) {
            return res.status(409).json({ success: false, message: 'Report already signed — use POST /:studyId/addendum for corrections' });
        }

        const incoming = pickSections(req.body.sections || req.body);
        if (!Object.keys(incoming).length) {
            return res.status(400).json({ success: false, message: `Provide at least one report section: ${SECTION_KEYS.join(', ')}` });
        }

        study.report = study.report || {};
        study.report.sections = { ...sectionsSnapshot(study.report), ...incoming };
        study.report.versions.push({ sections: sectionsSnapshot(study.report), authorId: req.user._id, at: new Date(), kind: 'draft' });
        study.status = 'DRAFT';
        study.auditTrail.push({ action: 'REPORT_DRAFT_SAVED', by: req.user._id, note: `Sections updated: ${Object.keys(incoming).join(', ')}` });
        await study.save();

        await TatEngine.recordMilestone(study._id, 'reportStartedAt');

        res.json({ success: true, data: study });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to save report', error: err.message });
    }
};

// POST /api/teleradiology/worklist/:studyId/sign
exports.signReport = async (req, res) => {
    try {
        const study = await loadStudy(req, res);
        if (!study) return;
        if (['SIGNED', 'DELIVERED'].includes(study.status)) {
            return res.status(409).json({ success: false, message: 'Report is already signed' });
        }
        if (!['IN_PROGRESS', 'DRAFT', 'REVIEW'].includes(study.status)) {
            return res.status(409).json({ success: false, message: `Cannot sign a study in status ${study.status} — open it first` });
        }

        // Allow final section edits in the same call, then freeze.
        const incoming = pickSections(req.body.sections || req.body);
        study.report = study.report || {};
        const finalSections = { ...sectionsSnapshot(study.report), ...incoming };
        if (!finalSections.impression || !finalSections.impression.trim()) {
            return res.status(400).json({ success: false, message: 'A non-empty impression is required to sign the report' });
        }

        const signedAt = new Date();
        study.report.sections = finalSections;
        study.report.versions.push({ sections: finalSections, authorId: req.user._id, at: signedAt, kind: 'final' });
        study.report.signedBy = req.user._id;
        study.report.signedAt = signedAt;
        study.report.signatureHash = sha256(finalSections);
        study.status = 'SIGNED';
        study.auditTrail.push({ action: 'REPORT_SIGNED', by: req.user._id, note: `signatureHash=${study.report.signatureHash.slice(0, 12)}…` });

        // Delivery is immediate for now (portal delivery); stamp both milestones.
        study.status = 'DELIVERED';
        study.auditTrail.push({ action: 'REPORT_DELIVERED', by: 'system', note: 'Auto-delivered to ordering doctor / patient portal' });

        const publishCritical = study.criticalFinding && study.criticalFinding.flagged && !study.criticalFinding.communicatedAt;
        if (publishCritical) study.criticalFinding.communicatedAt = signedAt;

        await study.save();
        await TatEngine.recordMilestone(study._id, 'signedAt', signedAt);
        await TatEngine.recordMilestone(study._id, 'deliveredAt');

        const baseEvent = {
            aggregateId: study._id,
            tenantId: study.tenantId,
            traceId: study.traceId,
            recipient: { channel: 'INTERNAL' },
        };
        await EventPublisher.publish({
            ...baseEvent,
            eventType: 'ReportSigned',
            payload: {
                studyId: study._id,
                accessionNumber: study.accessionNumber,
                clinicalOrderId: study.clinicalOrderId,
                patientId: study.patientId,
                signedBy: req.user._id,
                signatureHash: study.report.signatureHash,
                impression: finalSections.impression,
            },
        });
        await EventPublisher.publish({
            ...baseEvent,
            eventType: 'ReportDelivered',
            payload: {
                studyId: study._id,
                accessionNumber: study.accessionNumber,
                patientId: study.patientId,
                orderingDoctorId: study.orderingDoctorId,
            },
        });
        if (publishCritical) {
            await EventPublisher.publish({
                ...baseEvent,
                eventType: 'CriticalFindingDetected',
                payload: {
                    studyId: study._id,
                    accessionNumber: study.accessionNumber,
                    patientId: study.patientId,
                    orderingDoctorId: study.orderingDoctorId,
                    description: study.criticalFinding.description || finalSections.impression,
                    source: 'sign',
                },
            });
        }

        res.json({ success: true, data: study });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to sign report', error: err.message });
    }
};

// POST /api/teleradiology/worklist/:studyId/addendum
exports.addAddendum = async (req, res) => {
    try {
        const study = await loadStudy(req, res);
        if (!study) return;
        if (!['SIGNED', 'DELIVERED'].includes(study.status)) {
            return res.status(409).json({ success: false, message: 'Addenda are only allowed on signed studies' });
        }

        const incoming = pickSections(req.body.sections || req.body);
        const text = req.body.text || req.body.addendum;
        if (!Object.keys(incoming).length && !text) {
            return res.status(400).json({ success: false, message: 'Provide addendum text or sections' });
        }

        // NEVER mutate the signed report.sections — the addendum is a new version only.
        const addendumSections = Object.keys(incoming).length ? incoming : { findings: text, impression: text };
        study.report.versions.push({ sections: addendumSections, authorId: req.user._id, at: new Date(), kind: 'addendum' });
        study.auditTrail.push({ action: 'ADDENDUM_ADDED', by: req.user._id, note: text || `Sections: ${Object.keys(incoming).join(', ')}` });
        await study.save();

        res.json({ success: true, data: study });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to add addendum', error: err.message });
    }
};

/* ─────────────────────────── Critical findings ────────────────────── */

// POST /api/teleradiology/worklist/:studyId/critical
exports.flagCritical = async (req, res) => {
    try {
        const { description } = req.body;
        if (!description || !description.trim()) {
            return res.status(400).json({ success: false, message: 'description is required' });
        }

        const study = await loadStudy(req, res);
        if (!study) return;

        study.criticalFinding.flagged = true;
        study.criticalFinding.description = description;
        study.criticalFinding.communicatedAt = new Date();
        study.criticalFinding.escalationLevel = Math.max(1, study.criticalFinding.escalationLevel || 0);
        study.auditTrail.push({ action: 'CRITICAL_FINDING_FLAGGED', by: req.user._id, note: description });
        await study.save();

        await EventPublisher.publish({
            eventType: 'CriticalFindingDetected',
            aggregateId: study._id,
            tenantId: study.tenantId,
            traceId: study.traceId,
            payload: {
                studyId: study._id,
                accessionNumber: study.accessionNumber,
                patientId: study.patientId,
                orderingDoctorId: study.orderingDoctorId,
                description,
                flaggedBy: req.user._id,
                source: 'manual',
            },
            recipient: { channel: 'INTERNAL' },
        });

        res.json({ success: true, data: study });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to flag critical finding', error: err.message });
    }
};

// POST /api/teleradiology/worklist/:studyId/critical/ack
exports.acknowledgeCritical = async (req, res) => {
    try {
        const study = await loadStudy(req, res);
        if (!study) return;
        if (!study.criticalFinding || !study.criticalFinding.flagged) {
            return res.status(409).json({ success: false, message: 'No critical finding flagged on this study' });
        }

        study.criticalFinding.acknowledgedBy = req.user._id;
        study.criticalFinding.acknowledgedAt = new Date();
        study.auditTrail.push({ action: 'CRITICAL_FINDING_ACKNOWLEDGED', by: req.user._id, note: req.body.note });
        await study.save();

        res.json({ success: true, data: study });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to acknowledge critical finding', error: err.message });
    }
};

/* ─────────────────────────── Command center ───────────────────────── */

// GET /api/teleradiology/worklist/stats
exports.getStats = async (req, res) => {
    try {
        const { hospitalId, modality, sinceDays } = req.query;

        const [tatStats, byStatusRows, byPriorityRows, breaches, radiologists] = await Promise.all([
            TatEngine.computeStats({ hospitalId, modality, sinceDays: sinceDays ? parseInt(sinceDays, 10) : 30 }),
            RadiologyStudy.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
            RadiologyStudy.aggregate([
                { $match: { status: { $in: OPEN_STATUSES } } },
                { $group: { _id: '$priority', count: { $sum: 1 } } },
            ]),
            TatEngine.checkSlaBreaches({ hospitalId }),
            User.find({ role: 'radiologist', isActive: { $ne: false } }).select('firstName lastName subspecialty specialization').lean(),
        ]);

        const byStatus = {};
        for (const row of byStatusRows) byStatus[row._id] = row.count;
        const byPriority = {};
        for (const row of byPriorityRows) byPriority[row._id] = row.count;

        const workloadRows = await RadiologyStudy.aggregate([
            { $match: { assignedRadiologistId: { $ne: null }, status: { $in: ['UNREAD', 'IN_PROGRESS', 'DRAFT', 'REVIEW'] } } },
            { $group: { _id: '$assignedRadiologistId', count: { $sum: 1 } } },
        ]);
        const workloadById = {};
        for (const row of workloadRows) workloadById[String(row._id)] = row.count;

        res.json({
            success: true,
            data: {
                tat: tatStats,
                byStatus,
                byPriority,
                slaBreaches: { count: breaches.length, studies: breaches },
                radiologistPool: radiologists.map((r) => ({
                    _id: r._id,
                    name: [r.firstName, r.lastName].filter(Boolean).join(' '),
                    subspecialty: r.subspecialty || r.specialization || 'general',
                    activeStudies: workloadById[String(r._id)] || 0,
                    online: true, // presence integration pending — all radiologists shown as online
                })),
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to compute stats', error: err.message });
    }
};
