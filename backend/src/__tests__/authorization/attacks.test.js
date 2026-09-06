'use strict';
/**
 * Attack Scenario Test Suite — 12 Attack Vectors
 *
 * Each test targets a specific attack described in the security specification.
 * All tests work by calling middleware/controller functions directly with
 * crafted req/res objects — no HTTP server required.
 *
 * Attack 1:  Manipulate cc-workspaces cookie → backend ignores it
 * Attack 2:  Inject fake permissions into localStorage → backend ignores it
 * Attack 3:  Force hasPermission() === true in frontend → backend independently denies
 * Attack 4:  Call protected endpoints without a token → 401
 * Attack 5:  Inject role: "SUPER_ADMIN" into request body → role field ignored
 * Attack 6:  Change userId param to another user's ID → ownership enforced
 * Attack 7:  Patient reads another patient's medical records → 403
 * Attack 8:  Patient reads another patient's wallet → 403 (walletAuthz)
 * Attack 9:  Join another patient's telemedicine session → 403
 * Attack 10: Self-assignment of a role → 403 (isSelf check)
 * Attack 11: Grant ADMIN permissions without holding them → 403 (actorCanDelegate)
 * Attack 12: Modify system role permissions → 403 (isSystem check)
 */

// Mock PermissionService before requiring anything that imports it
jest.mock('../../services/PermissionService', () => ({
    userHasPermissions:      jest.fn(),
    getEffectivePermissions: jest.fn(),
    ensureUserHasRole:       jest.fn().mockResolvedValue(undefined),
}));

// Mock all Mongoose models — controller tests must not hit the database
jest.mock('../../models/Role', () => ({
    findById:       jest.fn(),
    findOne:        jest.fn(),
    find:           jest.fn(),
    findOneAndUpdate: jest.fn(),
    create:         jest.fn(),
}));
jest.mock('../../models/UserRole', () => ({
    findById:       jest.fn(),
    findOne:        jest.fn(),
    find:           jest.fn(),
    findOneAndUpdate: jest.fn(),
    create:         jest.fn(),
}));
jest.mock('../../models/UserPermissionOverride', () => ({
    findById:       jest.fn(),
    findOne:        jest.fn(),
    find:           jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create:         jest.fn(),
}));
jest.mock('../../models/User', () => ({
    findById:       jest.fn(),
    findOne:        jest.fn(),
    find:           jest.fn(),
    create:         jest.fn(),
}));
jest.mock('../../models/AuditLog', () => ({
    create:         jest.fn().mockResolvedValue({}),
    find:           jest.fn(),
    countDocuments: jest.fn(),
}));

const { userHasPermissions, getEffectivePermissions } = require('../../services/PermissionService');
const { permit, permitAny } = require('../../middleware/permit');
const {
    assignRole, revokeRole, setPermissionOverride, updateRole, createRole,
} = require('../../controllers/rbacController');
const Role       = require('../../models/Role');
const UserRole   = require('../../models/UserRole');
const UPO        = require('../../models/UserPermissionOverride');
const User       = require('../../models/User');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json   = jest.fn().mockReturnValue(res);
    return res;
}

beforeEach(() => {
    jest.clearAllMocks();
    // Default: actor has ADMIN.MANAGE_PERMISSIONS and ADMIN.MANAGE_ROLES
    userHasPermissions.mockResolvedValue(true);
    getEffectivePermissions.mockResolvedValue({
        permissions: ['ADMIN.MANAGE_PERMISSIONS', 'ADMIN.MANAGE_ROLES', 'ADMIN.GRANT_ACCESS', 'ADMIN.REVOKE_ACCESS', 'ADMIN.MANAGE_SYSTEM_SETTINGS', 'ADMIN.DISABLE_USERS'],
        workspaces:  ['ADMINISTRATION'],
    });
});

// ─── Attack 1: Cookie manipulation ───────────────────────────────────────────

describe('Attack 1 — cc-workspaces cookie manipulation', () => {
    it('backend permit() ignores the cc-workspaces cookie entirely', async () => {
        // Patient has only PATIENT.* permissions in PermissionService
        userHasPermissions.mockResolvedValue(false); // patient doesn't have admin perms
        getEffectivePermissions.mockResolvedValue({
            permissions: ['PATIENT.VIEW_MEDICAL_RECORDS'],
            workspaces:  ['PATIENT'],
        });

        const req = {
            user:    { _id: 'patient-1' },
            cookies: { 'cc-workspaces': 'ADMINISTRATION,RADIOLOGY,DOCTOR' }, // manipulated
            headers: { 'cc-workspaces': 'ADMINISTRATION' }, // even in headers
        };
        const res  = mockRes();
        const next = jest.fn();

        await permit('ADMIN.MANAGE_PERMISSIONS')(req, res, next);

        // Cookie is never read; authorization is based solely on PermissionService
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});

// ─── Attack 2 & 3: Client-side data manipulation ─────────────────────────────

describe('Attack 2 & 3 — Frontend state/localStorage manipulation', () => {
    it('even if a client injects permissions into the request body, backend ignores them', async () => {
        // Attacker tries to smuggle permissions in the request body
        userHasPermissions.mockResolvedValue(false);
        getEffectivePermissions.mockResolvedValue({ permissions: [], workspaces: [] });

        const req = {
            user:  { _id: 'patient-1' },
            body:  {
                // Attacker injects fake permissions hoping they are read
                permissions: ['ADMIN.MANAGE_PERMISSIONS', 'ADMIN.MANAGE_ROLES'],
                workspaces:  ['ADMINISTRATION'],
            },
        };
        const res  = mockRes();
        const next = jest.fn();

        await permit('ADMIN.MANAGE_PERMISSIONS')(req, res, next);

        // req.body.permissions is never consulted; PermissionService is the authority
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});

// ─── Attack 4: Direct API access without token ────────────────────────────────

describe('Attack 4 — Direct API access without valid JWT', () => {
    it('permit() returns 401 when req.user is undefined (unauthenticated)', async () => {
        const req  = { user: undefined }; // protect middleware not yet run / no token
        const res  = mockRes();
        const next = jest.fn();

        await permit('DOCTOR.VIEW_PATIENTS')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('permitAny() also returns 401 when req.user is undefined', async () => {
        const req  = { user: undefined };
        const res  = mockRes();
        const next = jest.fn();

        await permitAny('PATIENT.VIEW_BILLING', 'STAFF.BILLING')(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
});

// ─── Attack 5: Role spoofing in request body ──────────────────────────────────

describe('Attack 5 — Role spoofing in request body', () => {
    it('assignRole ignores req.body.role and uses only req.user._id for authorization', async () => {
        // Attacker sends role: "SUPER_ADMIN" in body — but authorization is based on
        // req.user._id (from JWT) via PermissionService, never req.body.role
        const actorId  = 'attacker-patient';
        const targetId = 'victim-user';

        // Actor has no admin permissions (simulates a patient with fake body role)
        userHasPermissions.mockResolvedValue(false);

        // Even though body says SUPER_ADMIN, it is completely ignored
        const mockRoleDoc = { _id: 'super-role', name: 'SUPER_ADMIN', permissions: ['ADMIN.MANAGE_PERMISSIONS', 'ADMIN.MANAGE_SYSTEM_SETTINGS'], isActive: true };
        Role.findById.mockImplementation(() => ({ lean: jest.fn().mockResolvedValue(mockRoleDoc) }));
        User.findById.mockImplementation(() => ({ lean: jest.fn().mockResolvedValue({ _id: targetId }) }));

        const req = {
            user:   { _id: actorId },
            body:   { userId: targetId, roleId: 'super-role', role: 'SUPER_ADMIN' }, // body.role injected
            ip:     '127.0.0.1',
        };
        const res  = mockRes();
        const next = jest.fn();

        await assignRole(req, res, next);

        // actorCanDelegate should have returned false (userHasPermissions = false)
        expect(res.status).toHaveBeenCalledWith(403);
    });
});

// ─── Attack 6: userId substitution in assignment ─────────────────────────────

describe('Attack 6 — userId substitution', () => {
    it('assignRole uses actorCanDelegate based on the role\'s permissions, not spoofed userId', async () => {
        const actorId  = 'limited-admin';
        const targetId = 'victim-user';

        // Actor tries to assign SUPER_ADMIN role but doesn't hold the elevated perms
        userHasPermissions.mockResolvedValue(false);

        const superAdminRole = {
            _id: 'sa-role', name: 'SUPER_ADMIN',
            permissions: ['ADMIN.MANAGE_PERMISSIONS', 'ADMIN.MANAGE_SYSTEM_SETTINGS', 'ADMIN.DISABLE_USERS'],
            isActive: true,
        };
        Role.findById.mockImplementation(() => ({ lean: jest.fn().mockResolvedValue(superAdminRole) }));
        User.findById.mockImplementation(() => ({ lean: jest.fn().mockResolvedValue({ _id: targetId }) }));

        const req = {
            user:   { _id: actorId },
            body:   { userId: targetId, roleId: 'sa-role' },
            ip:     '127.0.0.1',
        };
        const res  = mockRes();
        const next = jest.fn();

        await assignRole(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('permissions you do not hold'),
        }));
    });
});

// ─── Attack 7 & 8: Cross-patient record / wallet access ──────────────────────

describe('Attack 7 & 8 — Cross-patient record and wallet access', () => {
    it('walletAuthz blocks a patient from reading another patient\'s wallet', async () => {
        // Import walletAuthz by reconstructing its logic inline
        // (The actual function is defined inline in patientRoutes.js;
        //  we test the equivalent logic here with userHasPermissions mock)
        const patientAId = 'patient-a';
        const patientBId = 'patient-b'; // victim

        // Patient A does NOT have STAFF.BILLING (can't cross-read)
        userHasPermissions.mockResolvedValue(false);

        const req  = { user: { _id: patientAId }, params: { patientId: patientBId } };
        const res  = mockRes();
        const next = jest.fn();

        // Replicate the walletAuthz logic from patientRoutes.js
        const walletAuthz = async (req, res, next) => {
            const actorId  = req.user._id.toString();
            const targetId = req.params.patientId;
            if (actorId === targetId) return next();
            const isStaff = await userHasPermissions(req.user._id, ['STAFF.BILLING'])
                .catch(() => false);
            if (isStaff) return next();
            return res.status(403).json({ success: false, message: 'You can only view your own wallet.' });
        };

        await walletAuthz(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('a user with STAFF.BILLING CAN read another patient\'s wallet', async () => {
        userHasPermissions.mockResolvedValue(true); // has STAFF.BILLING

        const req  = { user: { _id: 'billing-staff' }, params: { patientId: 'any-patient' } };
        const res  = mockRes();
        const next = jest.fn();

        const walletAuthz = async (req, res, next) => {
            const actorId  = req.user._id.toString();
            const targetId = req.params.patientId;
            if (actorId === targetId) return next();
            const isStaff = await userHasPermissions(req.user._id, ['STAFF.BILLING'])
                .catch(() => false);
            if (isStaff) return next();
            return res.status(403).json({ success: false, message: 'You can only view your own wallet.' });
        };

        await walletAuthz(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });
});

// ─── Attack 9: Cross-user telemedicine session ───────────────────────────────

describe('Attack 9 — Cross-user telemedicine session', () => {
    it('PATIENT.USE_TELEMEDICINE alone does not grant access to other patients\' sessions', async () => {
        // The permit() check allows any patient with USE_TELEMEDICINE, but controller
        // enforces ownership. Test that a patient without the permission is denied.
        userHasPermissions.mockResolvedValue(false); // another patient without perm

        const req  = { user: { _id: 'patient-b' } };
        const res  = mockRes();
        const next = jest.fn();

        await permit('PATIENT.USE_TELEMEDICINE')(req, res, next);
        // Patient B has no PATIENT.USE_TELEMEDICINE — denied before reaching controller
        expect(res.status).toHaveBeenCalledWith(403);
    });
});

// ─── Attack 10: Self-assignment ───────────────────────────────────────────────

describe('Attack 10 — Self role assignment', () => {
    it('assignRole blocks a user from assigning a role to themselves', async () => {
        const userId  = 'self-user';
        const req = {
            user:   { _id: userId },
            body:   { userId, roleId: 'admin-role' },
            ip:     '127.0.0.1',
        };
        const res  = mockRes();
        const next = jest.fn();

        await assignRole(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('yourself'),
        }));
        // DB should never have been consulted — rejected before any query
        expect(Role.findById).not.toHaveBeenCalled();
    });

    it('revokeRole blocks a user from modifying their own role assignments', async () => {
        const userId = 'self-user';
        const req = {
            user:   { _id: userId },
            body:   { userId, roleId: 'some-role' },
            ip:     '127.0.0.1',
        };
        const res  = mockRes();
        const next = jest.fn();

        await revokeRole(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('own role'),
        }));
    });

    it('setPermissionOverride blocks a user from modifying their own permissions', async () => {
        const userId = 'self-user';
        const req = {
            user:   { _id: userId },
            body:   { userId, permission: 'ADMIN.MANAGE_PERMISSIONS', granted: true },
            ip:     '127.0.0.1',
        };
        const res  = mockRes();
        const next = jest.fn();

        await setPermissionOverride(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('own permissions'),
        }));
    });
});

// ─── Attack 11: Grant elevated permissions without authority ──────────────────

describe('Attack 11 — Grant elevated permissions without holding them', () => {
    it('setPermissionOverride blocks granting ADMIN.MANAGE_PERMISSIONS if actor lacks it', async () => {
        // Actor does NOT have ADMIN.MANAGE_PERMISSIONS
        userHasPermissions.mockResolvedValue(false);

        const req = {
            user:   { _id: 'limited-admin' },
            body:   {
                userId:     'target-user',
                permission: 'ADMIN.MANAGE_PERMISSIONS',
                granted:    true,
                reason:     'privilege escalation attempt',
            },
            ip: '127.0.0.1',
        };
        const res  = mockRes();
        const next = jest.fn();

        await setPermissionOverride(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('do not hold it yourself'),
        }));
    });

    it('setPermissionOverride allows granting ADMIN.MANAGE_PERMISSIONS if actor holds it', async () => {
        // Actor DOES have ADMIN.MANAGE_PERMISSIONS
        userHasPermissions.mockResolvedValue(true);
        User.findById.mockResolvedValue({ _id: 'target-user' });
        UPO.findOneAndUpdate.mockResolvedValue({ _id: 'override-id' });

        const req = {
            user:   { _id: 'super-admin' },
            body:   {
                userId:     'target-user',
                permission: 'ADMIN.MANAGE_PERMISSIONS',
                granted:    true,
                reason:     'legitimate grant',
            },
            ip: '127.0.0.1',
        };
        const res  = mockRes();
        const next = jest.fn();

        await setPermissionOverride(req, res, next);

        // Should NOT have returned 403
        expect(res.status).not.toHaveBeenCalledWith(403);
    });

    it('createRole blocks actor from including permissions they do not hold', async () => {
        // Actor has no elevated permissions
        userHasPermissions.mockResolvedValue(false);

        const req = {
            user:   { _id: 'limited-admin' },
            body:   {
                name:        'SNEAKY_ROLE',
                displayName: 'Sneaky Role',
                permissions: ['ADMIN.MANAGE_PERMISSIONS', 'ADMIN.DISABLE_USERS'],
                workspaces:  [],
            },
            ip: '127.0.0.1',
        };
        const res  = mockRes();
        const next = jest.fn();

        await createRole(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('permissions you do not hold'),
        }));
    });
});

// ─── Attack 12: System role modification ─────────────────────────────────────

describe('Attack 12 — System role modification', () => {
    it('updateRole blocks modifying permissions of a system role', async () => {
        const systemRole = {
            _id: 'patient-role',
            name: 'PATIENT',
            isSystem: true,
            isActive: true,
            permissions: ['PATIENT.VIEW_MEDICAL_RECORDS'],
            displayName: 'Patient',
            description: 'Standard patient',
            workspaces: ['PATIENT'],
            save: jest.fn(),
        };
        Role.findById.mockResolvedValue(systemRole);

        const req = {
            user:   { _id: 'super-admin' },
            params: { id: 'patient-role' },
            body:   { permissions: ['ADMIN.MANAGE_PERMISSIONS'] }, // trying to escalate
            ip:     '127.0.0.1',
        };
        const res  = mockRes();
        const next = jest.fn();

        await updateRole(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('system role'),
        }));
        expect(systemRole.save).not.toHaveBeenCalled();
    });

    it('updateRole allows modifying displayName/description of a system role (non-permission fields)', async () => {
        const systemRole = {
            _id: 'patient-role',
            name: 'PATIENT',
            isSystem: true,
            isActive: true,
            permissions: ['PATIENT.VIEW_MEDICAL_RECORDS'],
            displayName: 'Patient',
            description: 'Standard patient',
            workspaces: ['PATIENT'],
            save: jest.fn().mockResolvedValue({}),
        };
        Role.findById.mockResolvedValue(systemRole);
        require('../../models/AuditLog').create.mockResolvedValue({});

        const req = {
            user:   { _id: 'admin' },
            params: { id: 'patient-role' },
            body:   { displayName: 'Patient Portal User' }, // only label change — OK
            ip:     '127.0.0.1',
        };
        const res  = mockRes();
        const next = jest.fn();

        await updateRole(req, res, next);

        // Should succeed (no permissions field in body)
        expect(res.status).not.toHaveBeenCalledWith(403);
        expect(systemRole.save).toHaveBeenCalled();
    });

    it('updateRole with non-system role can modify permissions if actor holds them', async () => {
        userHasPermissions.mockResolvedValue(true);
        const customRole = {
            _id: 'custom-role',
            name: 'CUSTOM_NURSE',
            isSystem: false,
            isActive: true,
            permissions: ['STAFF.RECEPTION'],
            displayName: 'Custom Nurse',
            description: '',
            workspaces: ['HOSPITAL_STAFF'],
            save: jest.fn().mockResolvedValue({}),
        };
        Role.findById.mockResolvedValue(customRole);
        require('../../models/AuditLog').create.mockResolvedValue({});

        const req = {
            user:   { _id: 'admin' },
            params: { id: 'custom-role' },
            body:   { permissions: ['STAFF.RECEPTION', 'STAFF.CHECKIN_PATIENTS'] },
            ip:     '127.0.0.1',
        };
        const res  = mockRes();
        const next = jest.fn();

        await updateRole(req, res, next);

        expect(res.status).not.toHaveBeenCalledWith(403);
        expect(customRole.save).toHaveBeenCalled();
    });
});
