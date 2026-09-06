const Role                  = require('../models/Role');
const UserRole              = require('../models/UserRole');
const UserPermissionOverride = require('../models/UserPermissionOverride');
const User                  = require('../models/User');
const AuditLog              = require('../models/AuditLog');
const { getEffectivePermissions } = require('../services/PermissionService');
const { PERMISSIONS, WORKSPACES } = require('../constants/permissions');

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
        const role = await Role.create({
            name: name.toUpperCase(),
            displayName,
            description,
            workspaces: workspaces || [],
            permissions: permissions || [],
            isSystem: false,
            createdBy: req.user._id,
        });

        await AuditLog.create({
            actorId:  req.user._id,
            action:   'CREATE_ROLE',
            resource: 'ROLE',
            resourceId: role._id.toString(),
            details:  { name: role.name },
            result:   'success',
            ip:       req.ip,
        });

        res.status(201).json({ success: true, data: role });
    } catch (err) { next(err); }
};

const updateRole = async (req, res, next) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) return res.status(404).json({ success: false, message: 'Role not found.' });

        const { displayName, description, workspaces, permissions, isActive } = req.body;

        if (displayName !== undefined) role.displayName = displayName;
        if (description !== undefined) role.description = description;
        if (workspaces  !== undefined) role.workspaces  = workspaces;
        if (permissions !== undefined) role.permissions = permissions;
        if (isActive    !== undefined && !role.isSystem) role.isActive = isActive;

        await role.save();

        await AuditLog.create({
            actorId:  req.user._id,
            action:   'UPDATE_ROLE',
            resource: 'ROLE',
            resourceId: role._id.toString(),
            details:  { name: role.name, changes: req.body },
            result:   'success',
            ip:       req.ip,
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

        const [user, role] = await Promise.all([
            User.findById(userId).lean(),
            Role.findById(roleId).lean(),
        ]);
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        if (!role) return res.status(404).json({ success: false, message: 'Role not found.' });

        const assignment = await UserRole.findOneAndUpdate(
            { user: userId, role: roleId },
            {
                $set: {
                    isActive:  true,
                    grantedBy: req.user._id,
                    grantedAt: new Date(),
                    expiresAt: expiresAt || null,
                },
            },
            { upsert: true, new: true }
        );

        await AuditLog.create({
            actorId:  req.user._id,
            action:   'ASSIGN_ROLE',
            resource: 'USER_ROLE',
            resourceId: assignment._id.toString(),
            details:  { userId, roleName: role.name },
            result:   'success',
            ip:       req.ip,
        });

        res.json({ success: true, data: assignment });
    } catch (err) { next(err); }
};

const revokeRole = async (req, res, next) => {
    try {
        const { userId, roleId } = req.body;
        await UserRole.findOneAndUpdate(
            { user: userId, role: roleId },
            { $set: { isActive: false } }
        );

        await AuditLog.create({
            actorId:  req.user._id,
            action:   'REVOKE_ROLE',
            resource: 'USER_ROLE',
            resourceId: `${userId}:${roleId}`,
            details:  { userId, roleId },
            result:   'success',
            ip:       req.ip,
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

        const user = await User.findById(userId).lean();
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

        const override = await UserPermissionOverride.findOneAndUpdate(
            { user: userId, permission },
            {
                $set: {
                    granted,
                    grantedBy: req.user._id,
                    reason:    reason || '',
                    expiresAt: expiresAt || null,
                    isActive:  true,
                },
            },
            { upsert: true, new: true }
        );

        await AuditLog.create({
            actorId:  req.user._id,
            action:   granted ? 'GRANT_PERMISSION' : 'REVOKE_PERMISSION',
            resource: 'PERMISSION_OVERRIDE',
            resourceId: override._id.toString(),
            details:  { userId, permission, granted },
            result:   'success',
            ip:       req.ip,
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

// ─── Effective permissions view ───────────────────────────────────────────────

const getEffective = async (req, res, next) => {
    try {
        const result = await getEffectivePermissions(req.params.userId);
        res.json({ success: true, data: result });
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
            .populate('role', 'name displayName')
            .lean();

        const rolesByUser = {};
        for (const a of assignments) {
            const uid = a.user.toString();
            if (!rolesByUser[uid]) rolesByUser[uid] = [];
            if (a.role) rolesByUser[uid].push({ _id: a.role._id, name: a.role.name, displayName: a.role.displayName });
        }

        const data = users.map(u => ({
            ...u,
            rbacRoles: rolesByUser[u._id.toString()] || [],
        }));

        res.json({ success: true, data });
    } catch (err) { next(err); }
};

module.exports = {
    listRoles, getRole, createRole, updateRole,
    getUserRoles, assignRole, revokeRole,
    getUserOverrides, setPermissionOverride, deletePermissionOverride,
    getEffective,
    getPermissionCatalogue,
    listUsersWithRoles,
};
