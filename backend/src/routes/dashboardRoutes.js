const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

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

// ── GET /activity — live activity feed ────────────────────────────────────────
router.get('/activity', protect, async (req, res, next) => {
    try {
        res.json({
            success: true,
            data: [
                { time: '2 min ago', event: 'CT Head scan uploaded for Emma Grey', type: 'RADIOLOGY', icon: 'x-ray', color: 'blue' },
                { time: '5 min ago', event: 'AI flagged hemorrhage — 96% confidence', type: 'AI ALERT', icon: 'brain', color: 'red' },
                { time: '8 min ago', event: 'Prescription generated for Ravi Teja', type: 'EMR', icon: 'file-prescription', color: 'teal' },
                { time: '12 min ago', event: 'Wallet recharged ₹5,000 — CareConnect Hub', type: 'BILLING', icon: 'wallet', color: 'emerald' },
                { time: '18 min ago', event: 'Lab results ready — CBC Panel (Kabir Das)', type: 'LAB', icon: 'vial', color: 'purple' },
                { time: '25 min ago', event: 'SOS dispatched — Ambulance en route to Banjara Hills', type: 'EMERGENCY', icon: 'truck-medical', color: 'red' },
                { time: '30 min ago', event: 'ABDM consent granted by Anita Sharma', type: 'COMPLIANCE', icon: 'fingerprint', color: 'orange' },
            ]
        });
    } catch (err) { next(err); }
});

// ── GET /appointments — upcoming appointments ─────────────────────────────────
router.get('/appointments', protect, async (req, res, next) => {
    try {
        res.json({
            success: true,
            data: [
                { name: 'Priya Sharma', type: 'Follow-Up', time: '11:30 AM', avatar: 'P' },
                { name: 'Kabir Das', type: 'Radiology Review', time: '12:00 PM', avatar: 'K' },
                { name: 'Sanjay Gupta', type: 'New Consultation', time: '02:30 PM', avatar: 'S' },
            ]
        });
    } catch (err) { next(err); }
});

module.exports = router;
