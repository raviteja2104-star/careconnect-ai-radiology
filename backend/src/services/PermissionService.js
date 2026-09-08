const UserRole = require('../models/UserRole');
const UserPermissionOverride = require('../models/UserPermissionOverride');
const { LEGACY_ROLE_MAP } = require('../constants/permissions');

/**
 * Resolve the effective permission set for a user.
 *
 * Resolution order:
 *  1. Collect permissions from all active UserRole records → Role.permissions (union)
 *  2. Apply active UserPermissionOverride records:
 *     - granted: true  → add permission even if not in any role
 *     - granted: false → remove permission even if granted by a role
 *
 * Returns { permissions: string[], workspaces: string[] }
 */
async function getEffectivePermissions(userId) {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
        // Fallback for offline demo mode
        const demoPermissions = { 'demo-doctor-1': ['DOCTOR.VIEW_PATIENTS', 'DOCTOR.VIEW_MEDICAL_RECORDS', 'DOCTOR.EDIT_CLINICAL_NOTES', 'DOCTOR.SIGN_CLINICAL_NOTES', 'DOCTOR.CREATE_PRESCRIPTION', 'DOCTOR.ORDER_LAB', 'DOCTOR.CREATE_ENCOUNTER'], 'demo-patient-1': ['PATIENT.VIEW_MEDICAL_RECORDS', 'PATIENT.VIEW_LAB_RESULTS', 'PATIENT.VIEW_PROFILE'], 'demo-radiologist-1': ['RADIOLOGY.VIEW_WORKLIST', 'RADIOLOGY.VIEW_STUDIES', 'RADIOLOGY.CREATE_REPORT'], 'demo-admin-1': ['ADMIN.VIEW_USERS', 'ADMIN.VIEW_DASHBOARD', 'STAFF.VIEW_APPOINTMENTS'] };
        const basePerms = demoPermissions[userId] || [];
        return { permissions: basePerms, workspaces: Object.keys(demoPermissions).some(k => k === userId) ? ['PATIENT', 'DOCTOR', 'RADIOLOGY', 'ADMINISTRATION'] : [] };
    }

    const now = new Date();

    const userRoles = await UserRole.find({
        user: userId,
        isActive: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).populate('role').lean();

    const permSet = new Set();
    const workspaceSet = new Set();

    for (const ur of userRoles) {
        if (!ur.role || !ur.role.isActive) continue;
        (ur.role.permissions || []).forEach(p => permSet.add(p));
        (ur.role.workspaces || []).forEach(w => workspaceSet.add(w));
    }

    const overrides = await UserPermissionOverride.find({
        user: userId,
        isActive: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).lean();

    for (const o of overrides) {
        if (o.granted) {
            permSet.add(o.permission);
        } else {
            permSet.delete(o.permission);
        }
    }

    return {
        permissions: [...permSet],
        workspaces: [...workspaceSet],
    };
}

/**
 * Check whether a user has ALL of the supplied permissions.
 */
async function userHasPermissions(userId, requiredPermissions) {
    const { permissions } = await getEffectivePermissions(userId);
    const permSet = new Set(permissions);
    return requiredPermissions.every(p => permSet.has(p));
}

/**
 * Ensure a user has at least one UserRole assigned.
 * If none exist, auto-assign a role based on User.role (legacy string).
 * This is called on login so that existing users get RBAC roles automatically.
 */
async function ensureUserHasRole(user) {
    const existing = await UserRole.findOne({ user: user._id, isActive: true }).lean();
    if (existing) return;

    const roleName = LEGACY_ROLE_MAP[user.role] || 'PATIENT';
    const Role = require('../models/Role');
    const role = await Role.findOne({ name: roleName, isActive: true }).lean();
    if (!role) return;

    await UserRole.create({ user: user._id, role: role._id, grantedBy: user._id }).catch(() => { });
}

module.exports = { getEffectivePermissions, userHasPermissions, ensureUserHasRole };
