const { userHasPermissions, getEffectivePermissions } = require('../services/PermissionService');

/**
 * permit(...requiredPermissions) — ALL permissions required (AND logic).
 *
 * Must be used AFTER `protect`. Denies requests where the user lacks
 * ANY of the listed permissions.
 *
 * Usage:
 *   router.get('/path', protect, permit('ADMIN.VIEW_USERS'), handler);
 */
const permit = (...requiredPermissions) => async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        const has = await userHasPermissions(req.user._id, requiredPermissions);
        if (!has) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Missing required permission(s): ${requiredPermissions.join(', ')}.`,
            });
        }

        next();
    } catch (err) {
        next(err);
    }
};

/**
 * permitAny(...candidatePermissions) — at least one permission required (OR logic).
 *
 * Useful for multi-audience routes (e.g. patient reading own record OR doctor
 * reading an assigned patient's record).
 *
 * Usage:
 *   router.get('/path', protect, permitAny('PATIENT.VIEW_MEDICAL_RECORDS', 'DOCTOR.VIEW_MEDICAL_RECORDS'), handler);
 */
const permitAny = (...candidatePermissions) => async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        const { permissions } = await getEffectivePermissions(req.user._id);
        const permSet = new Set(permissions);
        const ok = candidatePermissions.some(p => permSet.has(p));

        if (!ok) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Requires one of: ${candidatePermissions.join(', ')}.`,
            });
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports = { permit, permitAny };
