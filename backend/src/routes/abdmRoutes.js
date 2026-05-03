/**
 * CareConnect — ABDM / ABHA Integration Layer
 * Ayushman Bharat Digital Mission — Health ID integration
 * Config: ABDM_CLIENT_ID, ABDM_CLIENT_SECRET, ABDM_BASE_URL in .env
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

const ABDM_BASE = process.env.ABDM_BASE_URL || 'https://healthidsbx.abdm.gov.in/api';
const isLive = () => !!process.env.ABDM_CLIENT_ID && !!process.env.ABDM_CLIENT_SECRET;

let axios;
try { axios = require('axios'); } catch (_) { axios = null; }

// ── Session token cache ───────────────────────────────────────────────────────
let abdmToken = null;
let tokenExpiry = 0;

const getABDMToken = async () => {
    if (abdmToken && Date.now() < tokenExpiry) return abdmToken;
    if (!isLive() || !axios) return null;
    try {
        const resp = await axios.post(`${ABDM_BASE}/v1/auth/cert`, {
            clientId: process.env.ABDM_CLIENT_ID,
            clientSecret: process.env.ABDM_CLIENT_SECRET,
        });
        abdmToken = resp.data.accessToken;
        tokenExpiry = Date.now() + 1700000; // ~28 min
        return abdmToken;
    } catch (e) { console.warn('ABDM token fetch failed:', e.message); return null; }
};

// ── Generate ABHA OTP ─────────────────────────────────────────────────────────
router.post('/generate-otp', protect, async (req, res, next) => {
    try {
        const { aadhaar, mobile, method = 'aadhaar' } = req.body;
        if (!isLive()) {
            return res.json({
                success: true, demo: true,
                message: 'OTP sent (demo mode)',
                data: { txnId: `txn_demo_${Date.now()}`, method, destination: method === 'aadhaar' ? aadhaar?.slice(-4) : mobile?.slice(-4) },
            });
        }
        const token = await getABDMToken();
        const endpoint = method === 'aadhaar' ? '/v2/registration/aadhaar/generateOtp' : '/v2/registration/mobile/generateOtp';
        const payload = method === 'aadhaar' ? { aadhaar } : { mobile };
        const resp = await axios.post(`${ABDM_BASE}${endpoint}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        res.json({ success: true, data: { txnId: resp.data.txnId, method } });
    } catch (err) { next(err); }
});

// ── Verify OTP & Create ABHA ──────────────────────────────────────────────────
router.post('/verify-otp', protect, async (req, res, next) => {
    try {
        const { txnId, otp } = req.body;
        if (!isLive()) {
            const abhaId = `91-${Math.random().toString().slice(2,6)}-${Math.random().toString().slice(2,6)}-${Math.random().toString().slice(2,6)}`;
            return res.json({
                success: true, demo: true,
                message: 'ABHA ID created (demo)',
                data: { abhaNumber: abhaId, abhaAddress: `${req.user.firstName.toLowerCase()}@abdm`, name: `${req.user.firstName} ${req.user.lastName}`, txnId },
            });
        }
        const token = await getABDMToken();
        const resp = await axios.post(`${ABDM_BASE}/v2/registration/aadhaar/verifyOtp`, { txnId, otp }, { headers: { Authorization: `Bearer ${token}` } });
        // Save ABHA to user profile
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user._id, { abhaNumber: resp.data.healthIdNumber, abhaAddress: resp.data.healthId });
        res.json({ success: true, data: resp.data });
    } catch (err) { next(err); }
});

// ── Fetch ABHA Profile ────────────────────────────────────────────────────────
router.get('/profile', protect, async (req, res, next) => {
    try {
        if (!isLive()) {
            return res.json({
                success: true, demo: true,
                data: {
                    abhaNumber: '91-1234-5678-9012',
                    abhaAddress: `${req.user.firstName.toLowerCase()}@abdm`,
                    name: `${req.user.firstName} ${req.user.lastName}`,
                    gender: req.user.gender || 'M',
                    dateOfBirth: req.user.dateOfBirth || '1995-06-15',
                    mobile: req.user.phone,
                    kycVerified: true,
                    profilePhoto: null,
                },
            });
        }
        const token = await getABDMToken();
        const resp = await axios.get(`${ABDM_BASE}/v1/account/profile`, { headers: { Authorization: `Bearer ${token}`, 'X-Token': req.headers['x-abha-token'] } });
        res.json({ success: true, data: resp.data });
    } catch (err) { next(err); }
});

// ── Consent Management — Request records ──────────────────────────────────────
router.post('/consent/request', protect, async (req, res, next) => {
    try {
        const { patientAbha, purpose, dateFrom, dateTo, hiTypes } = req.body;
        if (!isLive()) {
            return res.json({
                success: true, demo: true,
                data: {
                    consentRequestId: `cr_demo_${Date.now()}`,
                    status: 'REQUESTED',
                    patientAbha,
                    purpose: purpose || 'CAREMGT',
                    hiTypes: hiTypes || ['DiagnosticReport', 'ImagingStudy'],
                    dateRange: { from: dateFrom, to: dateTo },
                },
            });
        }
        // Real ABDM HIU consent flow
        const token = await getABDMToken();
        const resp = await axios.post(`${ABDM_BASE}/v0.5/consent-requests/init`, {
            purpose: { text: purpose || 'Care Management', code: 'CAREMGT' },
            patient: { id: patientAbha },
            hiTypes: hiTypes || ['DiagnosticReport'],
            permission: { dateRange: { from: dateFrom, to: dateTo }, dataEraseAt: new Date(Date.now() + 30 * 86400000).toISOString() },
        }, { headers: { Authorization: `Bearer ${token}` } });
        res.json({ success: true, data: resp.data });
    } catch (err) { next(err); }
});

// ── Share health records via ABDM ─────────────────────────────────────────────
router.post('/share', protect, async (req, res, next) => {
    try {
        const { scanId, recipientAbha } = req.body;
        if (!isLive()) {
            return res.json({
                success: true, demo: true,
                message: 'Health record shared via ABDM (demo)',
                data: { shareId: `share_demo_${Date.now()}`, scanId, recipientAbha, status: 'SHARED', sharedAt: new Date() },
            });
        }
        res.json({ success: true, message: 'Record shared via ABDM.' });
    } catch (err) { next(err); }
});

module.exports = router;
