/**
 * Emergency (Break-Glass) Access Routes
 *
 * POST /api/emergency-access/request
 *   Clinician requests emergency access to a restricted patient record.
 *   Creates an EmergencyAccess grant (60-minute window by default).
 *   Sends an admin notification.
 *
 * GET  /api/emergency-access
 *   Admin: list all emergency access events. Supports ?status=active|expired|reviewed.
 *
 * GET  /api/emergency-access/my
 *   Clinician: list their own break-glass grants.
 *
 * POST /api/emergency-access/:id/revoke
 *   Admin: immediately revoke a grant.
 *
 * POST /api/emergency-access/:id/review
 *   Admin: mark a grant as reviewed with a note.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/auth');
const { permit, permitAny } = require('../middleware/permit');
const EmergencyAccess = require('../models/EmergencyAccess');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const audit = require('../middleware/audit');

const GRANT_DURATION_MINUTES = parseInt(process.env.EMERGENCY_ACCESS_DURATION_MINUTES || '60', 10);

// ── Request emergency access ──────────────────────────────────────────────────
router.post(
    '/request',
    protect,
    permit('CLINICAL.EMERGENCY_ACCESS'),
    audit('EmergencyAccess'),
    async (req, res, next) => {
        try {
            const { patientId, reason } = req.body;

            if (!patientId || !mongoose.Types.ObjectId.isValid(patientId)) {
                return res.status(400).json({ success: false, message: 'Valid patientId is required.' });
            }
            const patientExists = await User.exists({ _id: patientId });
            if (!patientExists) {
                return res.status(404).json({ success: false, message: 'Patient not found.' });
            }
            if (!reason || reason.trim().length < 10) {
                return res.status(400).json({ success: false, message: 'A reason of at least 10 characters is required for emergency access.' });
            }

            // Check for an existing active grant — no need to create a duplicate
            const existing = await EmergencyAccess.findActiveGrant(req.user._id, patientId);
            if (existing) {
                return res.json({
                    success: true,
                    message: 'Emergency access is already active.',
                    data: existing,
                });
            }

            const expiresAt = new Date(Date.now() + GRANT_DURATION_MINUTES * 60 * 1000);

            const grant = await EmergencyAccess.create({
                requestedBy:     req.user._id,
                requestedByRole: req.user.role,
                patient:         patientId,
                reason:          reason.trim(),
                expiresAt,
                tenantId:        req.user.tenantId?.toString(),
                ip:              req.ip,
                userAgent:       req.headers['user-agent'],
            });

            // Tamper-resistant audit entry
            await AuditLog.append({
                actorId:    req.user._id,
                actorRole:  req.user.role,
                action:     'EMERGENCY_ACCESS_GRANTED',
                resource:   'Patient',
                resourceId: patientId,
                details:    { reason: reason.trim(), expiresAt, grantId: grant._id },
                ip:         req.ip,
                tenantId:   req.user.tenantId?.toString() || 't-default',
            }).catch(() => {});

            // Notify admins via Socket.IO (best-effort)
            try {
                const io = req.app.get('io');
                if (io) {
                    io.to('role:admin').emit('emergency:access-granted', {
                        grantId:   grant._id,
                        clinician: req.user.firstName,
                        patientId,
                        reason:    reason.trim(),
                        expiresAt,
                    });
                }
            } catch (_) {}

            res.status(201).json({
                success: true,
                message: `Emergency access granted for ${GRANT_DURATION_MINUTES} minutes. This event is logged and will be reviewed by an administrator.`,
                data: { grantId: grant._id, expiresAt },
            });
        } catch (err) { next(err); }
    }
);

// ── List all grants (admin) ───────────────────────────────────────────────────
router.get(
    '/',
    protect,
    permit('ADMIN.VIEW_AUDIT_LOG'),
    async (req, res, next) => {
        try {
            const { status, page = 1, limit = 20 } = req.query;
            const filter = {};
            if (status) filter.status = status;
            // Scope to the requesting admin's tenant
            if (req.user.tenantId) filter.tenantId = req.user.tenantId;

            const skip = (Number(page) - 1) * Number(limit);
            const [grants, total] = await Promise.all([
                EmergencyAccess.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    .populate('requestedBy', 'firstName lastName role')
                    .populate('patient', 'firstName lastName')
                    .populate('reviewedBy', 'firstName lastName')
                    .lean(),
                EmergencyAccess.countDocuments(filter),
            ]);

            res.json({ success: true, data: grants, total, page: Number(page) });
        } catch (err) { next(err); }
    }
);

// ── My grants (clinician self-service) ────────────────────────────────────────
router.get(
    '/my',
    protect,
    permit('CLINICAL.EMERGENCY_ACCESS'),
    async (req, res, next) => {
        try {
            const grants = await EmergencyAccess.find({ requestedBy: req.user._id })
                .sort({ createdAt: -1 })
                .limit(50)
                .populate('patient', 'firstName lastName')
                .lean();
            res.json({ success: true, data: grants });
        } catch (err) { next(err); }
    }
);

// ── Revoke a grant (admin) ────────────────────────────────────────────────────
router.post(
    '/:id/revoke',
    protect,
    permit('ADMIN.REVOKE_ACCESS'),
    audit('EmergencyAccess'),
    async (req, res, next) => {
        try {
            const grant = await EmergencyAccess.findById(req.params.id);
            if (!grant) return res.status(404).json({ success: false, message: 'Grant not found.' });

            grant.status = 'revoked';
            await grant.save();

            await AuditLog.append({
                actorId:   req.user._id,
                actorRole: req.user.role,
                action:    'EMERGENCY_ACCESS_REVOKED',
                resource:  'EmergencyAccess',
                resourceId: grant._id.toString(),
                ip:        req.ip,
                tenantId:  req.user.tenantId?.toString() || 't-default',
            }).catch(() => {});

            res.json({ success: true, message: 'Emergency access grant revoked.' });
        } catch (err) { next(err); }
    }
);

// ── Review a grant (admin) ────────────────────────────────────────────────────
router.post(
    '/:id/review',
    protect,
    permit('ADMIN.VIEW_AUDIT_LOG'),
    async (req, res, next) => {
        try {
            const { reviewNote } = req.body;
            const grant = await EmergencyAccess.findById(req.params.id);
            if (!grant) return res.status(404).json({ success: false, message: 'Grant not found.' });

            grant.reviewedBy = req.user._id;
            grant.reviewedAt = new Date();
            grant.reviewNote = reviewNote || '';
            if (grant.status !== 'revoked') grant.status = 'reviewed';
            await grant.save();

            res.json({ success: true, message: 'Grant marked as reviewed.', data: grant });
        } catch (err) { next(err); }
    }
);

module.exports = router;
