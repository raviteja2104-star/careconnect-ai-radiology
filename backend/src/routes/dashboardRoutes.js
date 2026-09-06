const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const isDB = () => { const m = require('mongoose'); return m.connection.readyState === 1; };

// ── GET /overview — command center KPIs ───────────────────────────────────────
router.get('/overview', protect, async (req, res, next) => {
    try {
        if (!isDB()) {
            return res.json({
                success: true,
                data: {
                    activePatients: 142, criticalPatients: 12,
                    pendingScans: 24, statPriority: 3,
                    revenueToday: 48200, revenueChange: 12400,
                    sosAlerts: 2, sosDispatched: 1,
                    casesToday: 18, maxCases: 25,
                    avgTat: 75, aiAgreement: 92,
                }
            });
        }
        const RadiologyScan = require('../models/RadiologyScan');
        const User = require('../models/User');
        const Emergency = require('../models/Emergency');
        const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
        const [activePatients, pendingScans, sosAlerts, casesToday] = await Promise.all([
            User.countDocuments({ role: 'patient', isActive: true }),
            RadiologyScan.countDocuments({ status: { $in: ['pending', 'uploaded'] } }),
            Emergency.countDocuments({ status: { $ne: 'resolved' } }),
            RadiologyScan.countDocuments({ createdAt: { $gte: dayStart } }),
        ]);
        res.json({
            success: true,
            data: {
                activePatients, criticalPatients: Math.floor(activePatients * 0.08),
                pendingScans, statPriority: Math.floor(pendingScans * 0.12),
                revenueToday: 48200, revenueChange: 12400,
                sosAlerts, sosDispatched: Math.max(sosAlerts - 1, 0),
                casesToday, maxCases: 25,
                avgTat: 75, aiAgreement: 92,
            }
        });
    } catch (err) { next(err); }
});

// ── GET /activity — live activity feed from audit log ────────────────────────
// Audit log contains PHI-adjacent metadata; restrict to admin and clinical staff.
router.get('/activity', protect, authorize('admin', 'doctor', 'radiologist', 'nurse'), async (req, res, next) => {
    try {
        if (!isDB()) {
            return res.json({ success: true, data: [] });
        }
        const AuditLog = require('../models/AuditLog');
        const logs = await AuditLog.find({})
            .sort({ at: -1 })
            .limit(20)
            .lean();
        const data = logs.map(log => {
            const ageMs = Date.now() - new Date(log.at).getTime();
            const ageMins = Math.floor(ageMs / 60000);
            const time = ageMins < 1 ? 'just now'
                : ageMins < 60 ? `${ageMins} min ago`
                : ageMins < 1440 ? `${Math.floor(ageMins / 60)}h ago`
                : new Date(log.at).toLocaleDateString('en-IN');
            return {
                time,
                event: `${log.action} on ${log.resource}`,
                type: (log.resource || 'SYSTEM').toUpperCase(),
                icon: 'activity',
                color: log.result === 'failure' ? 'red' : 'teal',
                actorId: log.actorId,
            };
        });
        res.json({ success: true, data });
    } catch (err) { next(err); }
});

// ── GET /appointments — today's upcoming appointments ─────────────────────────
router.get('/appointments', protect, async (req, res, next) => {
    try {
        if (!isDB()) {
            return res.json({ success: true, data: [] });
        }
        const Appointment = require('../models/Appointment');
        const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(); dayEnd.setHours(23, 59, 59, 999);
        const filter = { scheduledAt: { $gte: dayStart, $lte: dayEnd }, status: { $ne: 'cancelled' } };
        if (req.user.role === 'doctor') filter.doctor = req.user._id;
        const appts = await Appointment.find(filter)
            .sort({ scheduledAt: 1 })
            .limit(10)
            .populate('patient', 'name')
            .lean();
        const data = appts.map(a => ({
            _id: a._id,
            name: a.patient?.name || a.patientName || 'Unknown',
            type: a.type || 'Consultation',
            time: a.scheduledAt
                ? new Date(a.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                : '—',
            avatar: (a.patient?.name || 'U').charAt(0).toUpperCase(),
            status: a.status,
        }));
        res.json({ success: true, data });
    } catch (err) { next(err); }
});

module.exports = router;
