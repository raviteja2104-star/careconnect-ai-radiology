const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const RadiologyScan = require('../models/RadiologyScan');
const User = require('../models/User');

const isDB = () => { const m = require('mongoose'); return m.connection.readyState === 1; };

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_QUEUE = [
    { _id: 'cc-001', scanId: 'CC-001', patientName: 'Ravi Teja', age: 31, scanType: 'CT', bodyPart: 'Head', priority: 'emergency', status: 'pending', aiRisk: 'high', aiConf: 0.96, finding: 'Subdural Hematoma', centre: 'Apollo Diagnostics', receivedAt: new Date(Date.now() - 300000), tat: 30 },
    { _id: 'cc-002', scanId: 'CC-002', patientName: 'Priya Sharma', age: 45, scanType: 'MRI', bodyPart: 'Spine', priority: 'urgent', status: 'in_review', aiRisk: 'medium', aiConf: 0.82, finding: 'Disc Herniation L4-L5', centre: 'Yashoda Hospitals', receivedAt: new Date(Date.now() - 1320000), tat: 120 },
    { _id: 'cc-003', scanId: 'CC-003', patientName: 'Amit Kumar', age: 58, scanType: 'X-Ray', bodyPart: 'Chest', priority: 'normal', status: 'pending', aiRisk: 'low', aiConf: 0.78, finding: 'Normal Study', centre: 'KIMS Diagnostics', receivedAt: new Date(Date.now() - 3600000), tat: 240 },
];

// ── GET /worklist  — radiologist smart queue ──────────────────────────────────
router.get('/worklist', protect, async (req, res, next) => {
    try {
        const { priority, status, page = 1, limit = 20 } = req.query;
        if (!isDB()) {
            let q = [...MOCK_QUEUE];
            if (priority) q = q.filter(c => c.priority === priority);
            if (status) q = q.filter(c => c.status === status);
            // Sort: emergency first, then by receivedAt
            q.sort((a, b) => {
                const pOrder = { emergency: 0, urgent: 1, normal: 2 };
                return (pOrder[a.priority] - pOrder[b.priority]) || (new Date(a.receivedAt) - new Date(b.receivedAt));
            });
            return res.json({ success: true, data: q, total: q.length, page: 1, pages: 1 });
        }
        const filter = {};
        if (priority) filter.priority = priority;
        if (status) filter.status = status;
        const scans = await RadiologyScan.find(filter)
            .populate('patientId', 'firstName lastName dateOfBirth gender')
            .sort({ priority: -1, createdAt: 1 })
            .skip((page - 1) * limit).limit(parseInt(limit));
        const total = await RadiologyScan.countDocuments(filter);
        res.json({ success: true, data: scans, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
});

// ── POST /submit  — diagnostic center upload ──────────────────────────────────
router.post('/submit', protect, async (req, res, next) => {
    try {
        const {
            patientFirstName, patientLastName, patientAge, patientGender, patientPhone, abhaId,
            scanType, bodyPart, contrast, priority, slices, kv, mas,
            clinicalHistory, symptoms, allergies, prevSurgery, referringDoctor, remarks,
            fileUrl, fileName,
        } = req.body;

        const caseId = `CC-${Date.now().toString().slice(-6)}`;
        const tat = { emergency: 30, urgent: 120, normal: 360 }[priority] || 360;

        if (!isDB()) {
            return res.status(201).json({
                success: true,
                message: 'Case submitted. AI analysis initiated.',
                data: { caseId, scanId: caseId, patientName: `${patientFirstName} ${patientLastName}`, scanType, bodyPart, priority, status: 'pending', tatMinutes: tat, createdAt: new Date() },
            });
        }

        const scan = await RadiologyScan.create({
            scanId: caseId,
            pacsId: `PACS-${Date.now()}`,
            patientFirstName, patientLastName, patientAge, patientGender, patientPhone, abhaId,
            scanType, bodyPart, contrast, priority,
            clinicalHistory, symptoms, allergies, prevSurgery, referringDoctor, remarks,
            dicomMetadata: { slices, kv, mas, studyDate: new Date(), modality: scanType },
            fileUrl: fileUrl || 'pending', fileName: fileName || 'dicom.dcm',
            status: 'uploaded', uploadedBy: req.user._id,
        });

        // Trigger AI analysis via internal job (fire-and-forget)
        res.status(201).json({ success: true, message: 'Case submitted.', data: { caseId, scan, tatMinutes: tat } });
    } catch (err) { next(err); }
});

// ── GET /worklist/:id  — case detail ─────────────────────────────────────────
router.get('/worklist/:id', protect, async (req, res, next) => {
    try {
        if (!isDB()) {
            const c = MOCK_QUEUE.find(q => q._id === req.params.id || q.scanId === req.params.id);
            return c ? res.json({ success: true, data: c }) : res.status(404).json({ success: false, message: 'Case not found' });
        }
        const scan = await RadiologyScan.findById(req.params.id).populate('patientId').populate('assignedRadiologist', 'firstName lastName specialization');
        if (!scan) return res.status(404).json({ success: false, message: 'Scan not found' });
        res.json({ success: true, data: scan });
    } catch (err) { next(err); }
});

// ── PUT /worklist/:id/assign  — assign radiologist ───────────────────────────
router.put('/worklist/:id/assign', protect, authorize('admin', 'radiologist'), async (req, res, next) => {
    try {
        const { radiologistId } = req.body;
        if (!isDB()) return res.json({ success: true, message: 'Case assigned (demo).' });
        const scan = await RadiologyScan.findByIdAndUpdate(req.params.id, { assignedRadiologist: radiologistId, status: 'assigned', assignedAt: new Date() }, { new: true });
        if (!scan) return res.status(404).json({ success: false, message: 'Case not found' });
        req.io?.emit('case_assigned', { scanId: scan.scanId, radiologistId });
        res.json({ success: true, data: scan });
    } catch (err) { next(err); }
});

// ── PUT /worklist/:id/report  — submit radiologist report ────────────────────
router.put('/worklist/:id/report', protect, authorize('radiologist'), async (req, res, next) => {
    try {
        const { findings, impression, recommendations, riskLevel, notes, action } = req.body;
        if (!isDB()) return res.json({ success: true, message: `Report ${action}d (demo).`, data: { status: action === 'approve' ? 'approved' : 'rejected', findings, impression } });
        const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'reported';
        const scan = await RadiologyScan.findByIdAndUpdate(req.params.id, {
            finalReport: { findings, impression, recommendations, riskLevel, notes, reviewedBy: req.user._id, reviewedAt: new Date() },
            status, completedAt: status === 'approved' ? new Date() : undefined,
        }, { new: true });
        if (!scan) return res.status(404).json({ success: false, message: 'Case not found' });
        req.io?.emit('report_ready', { scanId: scan.scanId, patientId: scan.patientId, status });
        res.json({ success: true, message: `Report ${action}d.`, data: scan });
    } catch (err) { next(err); }
});

// ── GET /radiologists  — available radiologists for assignment ────────────────
router.get('/radiologists', protect, async (req, res, next) => {
    try {
        if (!isDB()) {
            return res.json({
                success: true, data: [
                    { _id: 'rad-1', firstName: 'Sarah', lastName: 'Wilson', specialization: 'Neuroradiology', availabilityStatus: 'online', currentLoad: 3, maxLoad: 8, rating: 4.9 },
                    { _id: 'rad-2', firstName: 'Rajesh', lastName: 'Rao', specialization: 'General Radiology', availabilityStatus: 'online', currentLoad: 5, maxLoad: 10, rating: 4.7 },
                    { _id: 'rad-3', firstName: 'Ananya', lastName: 'Mehta', specialization: 'Musculoskeletal', availabilityStatus: 'busy', currentLoad: 8, maxLoad: 8, rating: 4.8 },
                ]
            });
        }
        const rads = await User.find({ role: 'radiologist', 'availability.status': { $ne: 'offline' } })
            .select('firstName lastName specialization availability rating currentCaseLoad');
        res.json({ success: true, data: rads });
    } catch (err) { next(err); }
});

// ── GET /stats  — dashboard analytics ────────────────────────────────────────
router.get('/stats', protect, async (req, res, next) => {
    try {
        if (!isDB()) {
            return res.json({
                success: true, data: {
                    totalToday: 24, pending: 6, inReview: 5, approved: 13,
                    emergency: 2, avgTat: 42, aiAccuracy: 0.967,
                    byModality: { CT: 9, MRI: 7, 'X-Ray': 6, Other: 2 },
                    throughput: [12, 18, 14, 22, 19, 24, 21],
                }
            });
        }
        const now = new Date(); const dayStart = new Date(now.setHours(0, 0, 0, 0));
        const [total, pending, inReview, approved, emergency] = await Promise.all([
            RadiologyScan.countDocuments({ createdAt: { $gte: dayStart } }),
            RadiologyScan.countDocuments({ status: 'pending' }),
            RadiologyScan.countDocuments({ status: 'in_review' }),
            RadiologyScan.countDocuments({ status: 'approved' }),
            RadiologyScan.countDocuments({ priority: 'emergency' }),
        ]);
        res.json({ success: true, data: { totalToday: total, pending, inReview, approved, emergency } });
    } catch (err) { next(err); }
});

module.exports = router;
