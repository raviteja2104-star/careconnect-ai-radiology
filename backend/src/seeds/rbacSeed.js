const Role     = require('../models/Role');
const UserRole  = require('../models/UserRole');
const User      = require('../models/User');
const { DEFAULT_ROLES, LEGACY_ROLE_MAP } = require('../constants/permissions');

let seeded = false;

async function init() {
    if (seeded) return;
    seeded = true;

    try {
        for (const def of DEFAULT_ROLES) {
            await Role.findOneAndUpdate(
                { name: def.name },
                {
                    $set: {
                        displayName: def.displayName,
                        description: def.description,
                        workspaces:  def.workspaces,
                        isSystem:    def.isSystem,
                        isActive:    true,
                    },
                    $addToSet: { permissions: { $each: def.permissions } },
                },
                { upsert: true, new: true }
            );
        }

        // Auto-assign roles to existing users who have no UserRole record yet
        const users = await User.find({}).select('_id role').lean();
        for (const u of users) {
            const existing = await UserRole.findOne({ user: u._id, isActive: true }).lean();
            if (existing) continue;

            const roleName = LEGACY_ROLE_MAP[u.role] || 'PATIENT';
            const role = await Role.findOne({ name: roleName }).lean();
            if (!role) continue;

            await UserRole.create({ user: u._id, role: role._id, grantedBy: u._id }).catch(() => {});
        }

        console.log('[RBAC] Seed complete.');
    } catch (err) {
        console.error('[RBAC] Seed error:', err.message);
    }
}

module.exports = { init };
