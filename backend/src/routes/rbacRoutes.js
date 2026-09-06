const express    = require('express');
const router     = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { permit } = require('../middleware/permit');
const {
    listRoles, getRole, createRole, updateRole,
    getUserRoles, assignRole, revokeRole,
    getUserOverrides, setPermissionOverride, deletePermissionOverride,
    getEffective,
    getPermissionCatalogue,
    listUsersWithRoles,
} = require('../controllers/rbacController');

// All RBAC management requires authentication + admin-level role
router.use(protect, authorize('admin', 'super_admin'));

// ── Permission catalogue ──────────────────────────────────────────────────────
router.get('/permissions', permit('ADMIN.MANAGE_PERMISSIONS'), getPermissionCatalogue);

// ── Roles CRUD ────────────────────────────────────────────────────────────────
router.get('/roles',         permit('ADMIN.MANAGE_ROLES'), listRoles);
router.get('/roles/:id',     permit('ADMIN.MANAGE_ROLES'), getRole);
router.post('/roles',        permit('ADMIN.MANAGE_ROLES'), createRole);
router.put('/roles/:id',     permit('ADMIN.MANAGE_ROLES'), updateRole);

// ── Users with roles (admin list view) ───────────────────────────────────────
router.get('/users',         permit('ADMIN.VIEW_USERS'), listUsersWithRoles);

// ── User ↔ Role assignments ───────────────────────────────────────────────────
router.get('/users/:userId/roles',   permit('ADMIN.VIEW_USERS'),         getUserRoles);
router.post('/users/assign-role',    permit('ADMIN.MANAGE_PERMISSIONS'),  assignRole);
router.post('/users/revoke-role',    permit('ADMIN.MANAGE_PERMISSIONS'),  revokeRole);

// ── Permission overrides ──────────────────────────────────────────────────────
router.get('/users/:userId/overrides',      permit('ADMIN.MANAGE_PERMISSIONS'), getUserOverrides);
router.post('/users/override',              permit('ADMIN.MANAGE_PERMISSIONS'), setPermissionOverride);
router.delete('/overrides/:overrideId',     permit('ADMIN.MANAGE_PERMISSIONS'), deletePermissionOverride);

// ── Effective permissions view ────────────────────────────────────────────────
router.get('/users/:userId/effective',  permit('ADMIN.VIEW_USERS'), getEffective);

module.exports = router;
