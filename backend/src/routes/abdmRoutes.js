/**
 * CareConnect — ABDM / ABHA Integration Layer
 * Ayushman Bharat Digital Mission — Health ID integration
 * Config: ABDM_CLIENT_ID, ABDM_CLIENT_SECRET, ABDM_BASE_URL in .env
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { permit, permitAny } = require('../middleware/permit');

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
router.post('/generate-otp', protect, permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'ADMIN.VIEW_USERS'), async (req, res, next) => {
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
router.post('/verify-otp', protect, permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'ADMIN.VIEW_USERS'), async (req, res, next) => {
    try {
        const { txnId, otp } = req.body;
        const User = require('../models/User');
        if (!isLive()) {
            const num = `91-${Math.random().toString().slice(2,6)}-${Math.random().toString().slice(2,6)}-${Math.random().toString().slice(2,6)}`;
            const addr = `${req.user.firstName.toLowerCase()}@abdm`;
            await User.findByIdAndUpdate(req.user._id, { abhaNumber: num, abhaAddress: addr, abhaId: addr });
            return res.json({
                success: true, demo: true,
                message: 'ABHA ID created (demo)',
                data: { abhaNumber: num, abhaAddress: addr, name: `${req.user.firstName} ${req.user.lastName}`, txnId },
            });
        }
        const token = await getABDMToken();
        const resp = await axios.post(`${ABDM_BASE}/v2/registration/aadhaar/verifyOtp`, { txnId, otp }, { headers: { Authorization: `Bearer ${token}` } });
        await User.findByIdAndUpdate(req.user._id, {
            abhaNumber: resp.data.healthIdNumber,
            abhaAddress: resp.data.healthId,
            abhaId: resp.data.healthId,
        });
        res.json({ success: true, data: resp.data });
    } catch (err) { next(err); }
});

// ── Fetch ABHA Profile ────────────────────────────────────────────────────────
router.get('/profile', protect, permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'ADMIN.VIEW_USERS', 'DOCTOR.VIEW_MEDICAL_RECORDS'), async (req, res, next) => {
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
// HIU consent request — initiated by a healthcare provider, not the patient
router.post('/consent/request', protect, permitAny('CLINICAL.MANAGE_TREATMENT_PLAN', 'ADMIN.VIEW_USERS'), async (req, res, next) => {
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

// ── Patient: list ABHA consent requests ───────────────────────────────────────
router.get('/consents', protect, permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'ADMIN.VIEW_USERS'), async (req, res, next) => {
    try {
        const ABHAConsentRequest = require('../models/ABHAConsentRequest');
        const patientAbha = req.user.abhaAddress || req.user.abhaId || '';
        const filter = patientAbha ? { patientAbha } : { patientId: req.user._id };
        const requests = await ABHAConsentRequest.find(filter).sort({ createdAt: -1 }).lean();
        if (!requests.length && !isLive()) {
            return res.json({
                success: true, demo: true,
                data: [{
                    _id: 'demo-cr-1',
                    consentRequestId: 'cr_demo_001',
                    requesterName: 'City Diagnostics Centre',
                    purpose: 'CAREMGT',
                    purposeText: 'Care Management',
                    hiTypes: ['DiagnosticReport', 'ImagingStudy'],
                    dateFrom: new Date(Date.now() - 90 * 86400000),
                    dateTo: new Date(),
                    status: 'REQUESTED',
                    createdAt: new Date(Date.now() - 2 * 3600000),
                }],
            });
        }
        res.json({ success: true, data: requests });
    } catch (err) { next(err); }
});

// ── Patient: approve an ABHA consent request ──────────────────────────────────
router.post('/consents/:id/approve', protect, permitAny('PATIENT.VIEW_MEDICAL_RECORDS'), async (req, res, next) => {
    try {
        const ABHAConsentRequest = require('../models/ABHAConsentRequest');
        const cr = await ABHAConsentRequest.findByIdAndUpdate(
            req.params.id,
            { status: 'GRANTED', grantedAt: new Date() },
            { new: true }
        );
        if (!cr) return res.status(404).json({ success: false, message: 'Consent request not found' });
        if (isLive()) {
            const token = await getABDMToken();
            await axios.post(`${ABDM_BASE}/v0.5/consent-requests/on-init`, {
                consentRequestId: cr.consentRequestId,
                status: 'GRANTED',
            }, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
        }
        res.json({ success: true, data: cr });
    } catch (err) { next(err); }
});

// ── Patient: deny an ABHA consent request ────────────────────────────────────
router.post('/consents/:id/deny', protect, permitAny('PATIENT.VIEW_MEDICAL_RECORDS'), async (req, res, next) => {
    try {
        const ABHAConsentRequest = require('../models/ABHAConsentRequest');
        const cr = await ABHAConsentRequest.findByIdAndUpdate(
            req.params.id,
            { status: 'DENIED', deniedAt: new Date() },
            { new: true }
        );
        if (!cr) return res.status(404).json({ success: false, message: 'Consent request not found' });
        res.json({ success: true, data: cr });
    } catch (err) { next(err); }
});

// ── Patient: revoke a granted ABHA consent ────────────────────────────────────
router.post('/consents/:id/revoke', protect, permitAny('PATIENT.VIEW_MEDICAL_RECORDS'), async (req, res, next) => {
    try {
        const ABHAConsentRequest = require('../models/ABHAConsentRequest');
        const cr = await ABHAConsentRequest.findOneAndUpdate(
            { _id: req.params.id, status: 'GRANTED' },
            { status: 'REVOKED', revokedAt: new Date() },
            { new: true }
        );
        if (!cr) return res.status(404).json({ success: false, message: 'Consent not found or not in GRANTED state' });
        res.json({ success: true, data: cr });
    } catch (err) { next(err); }
});

// ── HIP: Register care contexts for a patient ─────────────────────────────────
// Called after a clinical event (discharge, lab result) to link records in ABDM
router.post('/care-contexts/register', protect, permitAny('CLINICAL.MANAGE_TREATMENT_PLAN', 'ADMIN.VIEW_USERS', 'DOCTOR.VIEW_MEDICAL_RECORDS'), async (req, res, next) => {
    try {
        const { patientAbha, careContexts } = req.body;
        // careContexts = [{ referenceNumber, display, hiType }]
        if (!Array.isArray(careContexts) || careContexts.length === 0) {
            return res.status(400).json({ success: false, message: 'careContexts must be a non-empty array' });
        }
        if (!isLive()) {
            return res.json({
                success: true, demo: true,
                message: `${careContexts.length} care context(s) registered (demo)`,
                data: { patientAbha, registered: careContexts.length, careContexts },
            });
        }
        const crypto = require('crypto');
        const token = await getABDMToken();
        const gatewayBase = process.env.ABDM_GATEWAY_URL || 'https://dev.abdm.gov.in/gateway';
        const resp = await axios.post(`${gatewayBase}/v0.5/links/link/add-contexts`, {
            requestId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            link: {
                accessToken: req.headers['x-abha-token'],
                patient: {
                    referenceNumber: patientAbha,
                    careContexts: careContexts.map(c => ({
                        referenceNumber: c.referenceNumber,
                        display: c.display,
                    })),
                },
            },
        }, { headers: { Authorization: `Bearer ${token}`, 'X-CM-ID': 'sbx', 'Content-Type': 'application/json' } });
        res.json({ success: true, data: resp.data });
    } catch (err) { next(err); }
});

// ── Share health records via ABDM ─────────────────────────────────────────────
router.post('/share', protect, permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'ADMIN.VIEW_USERS', 'DOCTOR.VIEW_MEDICAL_RECORDS'), async (req, res, next) => {
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
