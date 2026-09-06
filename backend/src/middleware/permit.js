const { userHasPermissions } = require('../services/PermissionService');

/**
 * permit(...requiredPermissions)
 *
 * Express middleware factory. Must be used AFTER `protect` (which sets req.user).
 * Denies requests where the authenticated user lacks ANY of the required permissions.
 *
 * Usage:
 *   router.get('/path', protect, permit('ADMIN.VIEW_USERS'), handler);
 *   router.post('/path', protect, permit('ADMIN.MANAGE_ROLES', 'ADMIN.MANAGE_PERMISSIONS'), handler);
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

module.exports = { permit };
