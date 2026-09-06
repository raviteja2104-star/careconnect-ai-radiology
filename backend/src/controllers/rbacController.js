const Role                  = require('../models/Role');
const UserRole              = require('../models/UserRole');
const UserPermissionOverride = require('../models/UserPermissionOverride');
const User                  = require('../models/User');
const AuditLog              = require('../models/AuditLog');
const { getEffectivePermissions, userHasPermissions } = require('../services/PermissionService');
const { PERMISSIONS, WORKSPACES } = require('../constants/permissions');

// Permissions that are considered "elevated" — cannot be granted by someone
// who does not themselves hold the permission.
const ELEVATED_PERMISSIONS = new Set([
    'ADMIN.MANAGE_PERMISSIONS',
    'ADMIN.MANAGE_ROLES',
    'ADMIN.GRANT_ACCESS',
    'ADMIN.REVOKE_ACCESS',
    'ADMIN.MANAGE_SYSTEM_SETTINGS',
    'ADMIN.DISABLE_USERS',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function actorCanDelegate(actorId, permissionsToGrant) {
    if (!Array.isArray(permissionsToGrant) || permissionsToGrant.length === 0) return true;
    const elevated = permissionsToGrant.filter(p => ELEVATED_PERMISSIONS.has(p));
    if (elevated.length === 0) return true;
    // Actor must hold every elevated permission they are trying to grant.
    return userHasPermissions(actorId, elevated);
}

function isSelf(actorId, targetUserId) {
    return actorId.toString() === targetUserId.toString();
}

// ─── Roles ────────────────────────────────────────────────────────────────────

const listRoles = async (req, res, next) => {
    try {
        const roles = await Role.find({ isActive: true }).sort({ name: 1 }).lean();
        res.json({ success: true, data: roles });
    } catch (err) { next(err); }
};

const getRole = async (req, res, next) => {
    try {
        const role = await Role.findById(req.params.id).lean();
        if (!role) return res.status(404).json({ success: false, message: 'Role not found.' });
        res.json({ success: true, data: role });
    } catch (err) { next(err); }
};

const createRole = async (req, res, next) => {
    try {
        const { name, displayName, description, workspaces, permissions } = req.body;
        const rolePerms = permissions || [];

        // Privilege escalation check: actor cannot create a role that grants
        // elevated permissions they do not themselves hold.
        const canDelegate = await actorCanDelegate(req.user._id, rolePerms);
        if (!canDelegate) {
            return res.status(403).json({
                success: false,
                message: 'You cannot create a role that grants permissions you do not hold.',
            });
        }

        const role = await Role.create({
            name: name.toUpperCase(),
            displayName,
            description,
            workspaces: workspaces || [],
            permissions: rolePerms,
            isSystem: false,
            createdBy: req.user._id,
        });

        await AuditLog.create({
            actorId: req.user._id, action: 'CREATE_ROLE', resource: 'ROLE',
            resourceId: role._id.toString(), details: { name: role.name }, result: 'success', ip: req.ip,
        });

        res.status(201).json({ success: true, data: role });
    } catch (err) { next(err); }
};

const updateRole = async (req, res, next) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) return res.status(404).json({ success: false, message: 'Role not found.' });
        if (role.isSystem) {
            // System roles cannot have their permissions edited (only displayName/description).
            if (req.body.permissions !== undefined) {
                return res.status(403).json({ success: false, message: 'Cannot modify permissions of a system role.' });
            }
        }

        const newPerms = req.body.permissions;
        if (newPerms !== undefined) {
            const canDelegate = await actorCanDelegate(req.user._id, newPerms);
            if (!canDelegate) {
                return res.status(403).json({
                    success: false,
                    message: 'You cannot assign permissions you do not hold.',
                });
            }
        }

        const { displayName, description, workspaces, permissions, isActive } = req.body;
        if (displayName !== undefined) role.displayName = displayName;
        if (description !== undefined) role.description = description;
        if (workspaces  !== undefined) role.workspaces  = workspaces;
        if (permissions !== undefined) role.permissions = permissions;
        if (isActive    !== undefined && !role.isSystem) role.isActive = isActive;

        await role.save();

        await AuditLog.create({
            actorId: req.user._id, action: 'UPDATE_ROLE', resource: 'ROLE',
            resourceId: role._id.toString(), details: { name: role.name, changes: req.body }, result: 'success', ip: req.ip,
        });

        res.json({ success: true, data: role });
    } catch (err) { next(err); }
};

// ─── User ↔ Role assignments ──────────────────────────────────────────────────

const getUserRoles = async (req, res, next) => {
    try {
        const assignments = await UserRole.find({ user: req.params.userId, isActive: true })
            .populate('role', 'name displayName workspaces permissions')
            .populate('grantedBy', 'firstName lastName email')
            .lean();
        res.json({ success: true, data: assignments });
    } catch (err) { next(err); }
};

const assignRole = async (req, res, next) => {
    try {
        const { userId, roleId, expiresAt } = req.body;

        // Prevent self-assignment
        if (isSelf(req.user._id, userId)) {
            return res.status(403).json({ success: false, message: 'You cannot assign roles to yourself.' });
        }

        const [user, role] = await Promise.all([
            User.findById(userId).lean(),
            Role.findById(roleId).lean(),
        ]);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        if (!role) return res.status(404).json({ success: false, message: 'Role not found.' });

        // Privilege escalation: cannot assign a role whose permissions exceed actor's own
        const canDelegate = await actorCanDelegate(req.user._id, role.permissions);
        if (!canDelegate) {
            return res.status(403).json({
                success: false,
                message: 'You cannot assign a role that grants permissions you do not hold.',
            });
        }

        const assignment = await UserRole.findOneAndUpdate(
            { user: userId, role: roleId },
            { $set: { isActive: true, grantedBy: req.user._id, grantedAt: new Date(), expiresAt: expiresAt || null } },
            { upsert: true, new: true }
        );

        await AuditLog.create({
            actorId: req.user._id, action: 'ASSIGN_ROLE', resource: 'USER_ROLE',
            resourceId: assignment._id.toString(), details: { userId, roleName: role.name }, result: 'success', ip: req.ip,
        });

        res.json({ success: true, data: assignment });
    } catch (err) { next(err); }
};

const revokeRole = async (req, res, next) => {
    try {
        const { userId, roleId } = req.body;

        // Prevent self-revocation (unusual but avoids footguns)
        if (isSelf(req.user._id, userId)) {
            return res.status(403).json({ success: false, message: 'You cannot modify your own role assignments.' });
        }

        await UserRole.findOneAndUpdate(
            { user: userId, role: roleId },
            { $set: { isActive: false } }
        );

        await AuditLog.create({
            actorId: req.user._id, action: 'REVOKE_ROLE', resource: 'USER_ROLE',
            resourceId: `${userId}:${roleId}`, details: { userId, roleId }, result: 'success', ip: req.ip,
        });

        res.json({ success: true, message: 'Role revoked.' });
    } catch (err) { next(err); }
};

// ─── Permission overrides ─────────────────────────────────────────────────────

const getUserOverrides = async (req, res, next) => {
    try {
        const overrides = await UserPermissionOverride.find({ user: req.params.userId, isActive: true })
            .populate('grantedBy', 'firstName lastName email')
            .lean();
        res.json({ success: true, data: overrides });
    } catch (err) { next(err); }
};

const setPermissionOverride = async (req, res, next) => {
    try {
        const { userId, permission, granted, reason, expiresAt } = req.body;

        if (!PERMISSIONS[permission]) {
            return res.status(400).json({ success: false, message: `Unknown permission: ${permission}` });
        }

        // Prevent modifying own overrides
        if (isSelf(req.user._id, userId)) {
            return res.status(403).json({ success: false, message: 'You cannot modify your own permissions.' });
        }

        // Privilege escalation: cannot grant an elevated permission you don't hold
        if (granted && ELEVATED_PERMISSIONS.has(permission)) {
            const actorHas = await userHasPermissions(req.user._id, [permission]);
            if (!actorHas) {
                return res.status(403).json({
                    success: false,
                    message: `You cannot grant '${permission}' because you do not hold it yourself.`,
                });
            }
        }

        const user = await User.findById(userId).lean();
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        const override = await UserPermissionOverride.findOneAndUpdate(
            { user: userId, permission },
            { $set: { granted, grantedBy: req.user._id, reason: reason || '', expiresAt: expiresAt || null, isActive: true } },
            { upsert: true, new: true }
        );

        await AuditLog.create({
            actorId: req.user._id,
            action:  granted ? 'GRANT_PERMISSION' : 'REVOKE_PERMISSION',
            resource: 'PERMISSION_OVERRIDE',
            resourceId: override._id.toString(),
            details: { userId, permission, granted },
            result:  'success',
            ip:      req.ip,
        });

        res.json({ success: true, data: override });
    } catch (err) { next(err); }
};

const deletePermissionOverride = async (req, res, next) => {
    try {
        await UserPermissionOverride.findByIdAndUpdate(req.params.overrideId, { $set: { isActive: false } });
        res.json({ success: true, message: 'Override removed.' });
    } catch (err) { next(err); }
};

// ─── Effective permissions / permission simulator ─────────────────────────────

const getEffective = async (req, res, next) => {
    try {
        const result = await getEffectivePermissions(req.params.userId);

        // For the permission simulator: annotate each permission with its source.
        const UserRoleModel = UserRole;
        const now = new Date();
        const [userRoles, overrides] = await Promise.all([
            UserRoleModel.find({ user: req.params.userId, isActive: true,
                $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] })
                .populate('role', 'name displayName permissions').lean(),
            UserPermissionOverride.find({ user: req.params.userId, isActive: true,
                $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }).lean(),
        ]);

        // Build annotated list
        const permMap = {};
        for (const ur of userRoles) {
            if (!ur.role || !ur.role.permissions) continue;
            for (const p of ur.role.permissions) {
                if (!permMap[p]) permMap[p] = { permission: p, status: 'ALLOW', sources: [] };
                permMap[p].sources.push({ type: 'ROLE', name: ur.role.displayName || ur.role.name });
            }
        }
        for (const o of overrides) {
            if (!permMap[o.permission]) permMap[o.permission] = { permission: o.permission, sources: [] };
            permMap[o.permission].status = o.granted ? 'ALLOW' : 'DENY';
            permMap[o.permission].sources.push({ type: o.granted ? 'GRANT_OVERRIDE' : 'DENY_OVERRIDE', reason: o.reason || '' });
        }

        res.json({ success: true, data: { ...result, annotated: Object.values(permMap) } });
    } catch (err) { next(err); }
};

// ─── Permission simulator endpoint ───────────────────────────────────────────

const simulateAccess = async (req, res, next) => {
    try {
        const { userId, permission } = req.body;
        if (!PERMISSIONS[permission]) {
            return res.status(400).json({ success: false, message: `Unknown permission: ${permission}` });
        }

        const { permissions } = await getEffectivePermissions(userId);
        const allowed = permissions.includes(permission);

        // Find the source
        const now = new Date();
        const [userRoles, overrides] = await Promise.all([
            UserRole.find({ user: userId, isActive: true,
                $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] })
                .populate('role', 'name displayName permissions').lean(),
            UserPermissionOverride.find({ user: userId, permission, isActive: true,
                $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }).lean(),
        ]);

        const explicitDeny   = overrides.find(o => !o.granted);
        const explicitGrant  = overrides.find(o =>  o.granted);
        const fromRole       = userRoles.find(ur => ur.role?.permissions?.includes(permission));

        let reason = 'No applicable permission — default deny';
        if (explicitDeny)  reason = `Explicitly denied by override (reason: ${explicitDeny.reason || 'none'})`;
        else if (explicitGrant) reason = 'Granted by direct permission override';
        else if (fromRole)  reason = `Granted through role: ${fromRole.role.displayName || fromRole.role.name}`;

        res.json({
            success: true,
            data: {
                userId, permission,
                result: allowed ? 'ALLOWED' : 'DENIED',
                reason,
            },
        });
    } catch (err) { next(err); }
};

// ─── Permission catalogue ─────────────────────────────────────────────────────

const getPermissionCatalogue = async (req, res, next) => {
    try {
        res.json({ success: true, data: { permissions: PERMISSIONS, workspaces: WORKSPACES } });
    } catch (err) { next(err); }
};

// ─── All users with their roles (admin view) ──────────────────────────────────

const listUsersWithRoles = async (req, res, next) => {
    try {
        const users = await User.find({}).select('_id firstName lastName email role isActive').lean();
        const userIds = users.map(u => u._id);

        const assignments = await UserRole.find({ user: { $in: userIds }, isActive: true })
            .populate('role', 'name displayName').lean();

        const rolesByUser = {};
        for (const a of assignments) {
            const uid = a.user.toString();
            if (!rolesByUser[uid]) rolesByUser[uid] = [];
            if (a.role) rolesByUser[uid].push({ _id: a.role._id, name: a.role.name, displayName: a.role.displayName });
        }

        const data = users.map(u => ({ ...u, rbacRoles: rolesByUser[u._id.toString()] || [] }));
        res.json({ success: true, data });
    } catch (err) { next(err); }
};

module.exports = {
    listRoles, getRole, createRole, updateRole,
    getUserRoles, assignRole, revokeRole,
    getUserOverrides, setPermissionOverride, deletePermissionOverride,
    getEffective, simulateAccess,
    getPermissionCatalogue,
    listUsersWithRoles,
};
