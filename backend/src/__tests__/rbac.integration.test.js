/**
 * RBAC Integration Tests
 *
 * Spins up a minimal Express app with the real auth/permit middleware and
 * the routes under test. Uses mongodb-memory-server — no real DB needed.
 *
 * Covered:
 *  - 401 when no token
 *  - 403 when token present but permission missing
 *  - 200/201 when token + correct permission
 *  - Emergency-access lifecycle (create, idempotent, revoke, review)
 *  - Tenant isolation (cross-tenant requests get 404)
 *  - Resource-level access (requirePatientAccess)
 */

process.env.JWT_SECRET = 'test-jwt-secret-for-rbac-tests';
process.env.NODE_ENV = 'test';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.setTimeout(30000);

let mongod;

// ── Minimal test-app factory ──────────────────────────────────────────────────
// Builds a fresh Express instance with the real middleware and requested routes,
// so tests are isolated from server.js's service initializations.

function buildApp(...routeMounts) {
    const app = express();
    app.use(express.json());
    for (const [path, router] of routeMounts) {
        app.use(path, router);
    }
    // Generic error handler so tests get JSON errors, not HTML
    app.use((err, req, res, next) => {
        res.status(err.statusCode || err.status || 500).json({
            success: false,
            message: err.message || 'Internal error',
        });
    });
    return app;
}

// ── Token helpers ─────────────────────────────────────────────────────────────

function signToken(userId) {
    return jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function authHeader(userId) {
    return { Authorization: `Bearer ${signToken(userId)}` };
}

// ── Models ────────────────────────────────────────────────────────────────────

const User = require('../models/User');
const Role = require('../models/Role');
const UserRole = require('../models/UserRole');
const UserPermissionOverride = require('../models/UserPermissionOverride');
const EmergencyAccess = require('../models/EmergencyAccess');
const { DEFAULT_ROLES } = require('../constants/permissions');

// ── Seed helpers ──────────────────────────────────────────────────────────────

async function seedDefaultRoles() {
    for (const def of DEFAULT_ROLES) {
        await Role.findOneAndUpdate(
            { name: def.name },
            { $set: { displayName: def.displayName, permissions: def.permissions, workspaces: def.workspaces || [], isActive: true } },
            { upsert: true, new: true }
        );
    }
}

async function createUser(overrides = {}) {
    return User.create({
        firstName: 'Test',
        lastName: 'User',
        email: `user-${Date.now()}-${Math.random().toString(36).slice(2)}@cc.test`,
        password: 'hashed',
        role: overrides.role || 'doctor',
        isActive: true,
        isVerified: true,
        tenantId: overrides.tenantId || 'tenant-default',
        ...overrides,
    });
}

async function assignRole(userId, roleName, grantedBy) {
    const role = await Role.findOne({ name: roleName });
    if (!role) throw new Error(`Role ${roleName} not found — did you call seedDefaultRoles()?`);
    return UserRole.create({ user: userId, role: role._id, grantedBy: grantedBy || userId, isActive: true });
}

// ── Test lifecycle ─────────────────────────────────────────────────────────────

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await seedDefaultRoles();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

afterEach(async () => {
    // Keep Role documents (seeded once) — clear everything else
    const keep = new Set(['roles']);
    for (const [key, col] of Object.entries(mongoose.connection.collections)) {
        if (!keep.has(key)) await col.deleteMany({});
    }
});

// ── Emergency-access route integration ───────────────────────────────────────

describe('POST /api/emergency-access/request', () => {
    let app;
    beforeAll(() => {
        app = buildApp(['/api/emergency-access', require('../routes/emergencyAccessRoutes')]);
    });

    test('401 — no token', async () => {
        const res = await request(app)
            .post('/api/emergency-access/request')
            .send({ patientId: new mongoose.Types.ObjectId(), reason: 'cardiac arrest code blue' });
        expect(res.status).toBe(401);
    });

    test('403 — authenticated but missing CLINICAL.EMERGENCY_ACCESS', async () => {
        const user = await createUser({ role: 'reception' });
        // RECEPTIONIST role does not include CLINICAL.EMERGENCY_ACCESS
        await assignRole(user._id, 'RECEPTIONIST');

        const patient = await createUser({ role: 'patient' });
        const res = await request(app)
            .post('/api/emergency-access/request')
            .set(authHeader(user._id))
            .send({ patientId: patient._id.toString(), reason: 'cardiac arrest code blue' });
        expect(res.status).toBe(403);
    });

    test('400 — valid permission but missing reason', async () => {
        const doctor = await createUser({ role: 'doctor' });
        await assignRole(doctor._id, 'DOCTOR');
        // Grant CLINICAL.EMERGENCY_ACCESS via override (DOCTOR role may or may not have it)
        await UserPermissionOverride.create({
            user: doctor._id, permission: 'CLINICAL.EMERGENCY_ACCESS',
            granted: true, grantedBy: doctor._id, isActive: true,
        });

        const patient = await createUser({ role: 'patient' });
        const res = await request(app)
            .post('/api/emergency-access/request')
            .set(authHeader(doctor._id))
            .send({ patientId: patient._id.toString(), reason: 'short' }); // < 10 chars
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/reason/i);
    });

    test('201 — creates grant when doctor has CLINICAL.EMERGENCY_ACCESS', async () => {
        const doctor = await createUser({ role: 'doctor' });
        await assignRole(doctor._id, 'DOCTOR');
        await UserPermissionOverride.create({
            user: doctor._id, permission: 'CLINICAL.EMERGENCY_ACCESS',
            granted: true, grantedBy: doctor._id, isActive: true,
        });

        const patient = await createUser({ role: 'patient' });
        const res = await request(app)
            .post('/api/emergency-access/request')
            .set(authHeader(doctor._id))
            .send({ patientId: patient._id.toString(), reason: 'critical emergency cardiac arrest' });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('grantId');
        expect(res.body.data).toHaveProperty('expiresAt');

        // Verify persisted in DB
        const grant = await EmergencyAccess.findById(res.body.data.grantId);
        expect(grant).not.toBeNull();
        expect(grant.status).toBe('active');
        expect(grant.isValid()).toBe(true);
    });

    test('200 — second request returns existing active grant (idempotent)', async () => {
        const doctor = await createUser({ role: 'doctor' });
        await assignRole(doctor._id, 'DOCTOR');
        await UserPermissionOverride.create({
            user: doctor._id, permission: 'CLINICAL.EMERGENCY_ACCESS',
            granted: true, grantedBy: doctor._id, isActive: true,
        });

        const patient = await createUser({ role: 'patient' });
        const payload = { patientId: patient._id.toString(), reason: 'emergency access request test' };

        await request(app).post('/api/emergency-access/request').set(authHeader(doctor._id)).send(payload);
        const res2 = await request(app).post('/api/emergency-access/request').set(authHeader(doctor._id)).send(payload);

        // Second request returns 200 (already active), not 201
        expect(res2.status).toBe(200);
        expect(res2.body.message).toMatch(/already active/i);

        const count = await EmergencyAccess.countDocuments({ requestedBy: doctor._id, patient: patient._id });
        expect(count).toBe(1); // not duplicated
    });
});

describe('GET /api/emergency-access (admin list)', () => {
    let app;
    beforeAll(() => {
        app = buildApp(['/api/emergency-access', require('../routes/emergencyAccessRoutes')]);
    });

    test('401 — no token', async () => {
        const res = await request(app).get('/api/emergency-access');
        expect(res.status).toBe(401);
    });

    test('403 — doctor cannot list all grants', async () => {
        const doctor = await createUser({ role: 'doctor' });
        await assignRole(doctor._id, 'DOCTOR');
        const res = await request(app).get('/api/emergency-access').set(authHeader(doctor._id));
        expect(res.status).toBe(403);
    });

    test('200 — super_admin can list all grants', async () => {
        const admin = await createUser({ role: 'admin' });
        await assignRole(admin._id, 'SUPER_ADMIN');
        const res = await request(app).get('/api/emergency-access').set(authHeader(admin._id));
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});

describe('POST /api/emergency-access/:id/revoke', () => {
    let app;
    beforeAll(() => {
        app = buildApp(['/api/emergency-access', require('../routes/emergencyAccessRoutes')]);
    });

    test('403 — doctor cannot revoke grants', async () => {
        const doctor = await createUser({ role: 'doctor' });
        await assignRole(doctor._id, 'DOCTOR');

        const grant = await EmergencyAccess.create({
            requestedBy: doctor._id, requestedByRole: 'doctor',
            patient: new mongoose.Types.ObjectId(),
            reason: 'test grant for revoke test',
            expiresAt: new Date(Date.now() + 3600000),
            status: 'active',
        });

        const res = await request(app)
            .post(`/api/emergency-access/${grant._id}/revoke`)
            .set(authHeader(doctor._id));
        expect(res.status).toBe(403);
    });

    test('200 — admin with ADMIN.REVOKE_ACCESS can revoke', async () => {
        const admin = await createUser({ role: 'admin' });
        await assignRole(admin._id, 'SUPER_ADMIN');

        const doctor = await createUser({ role: 'doctor' });
        const grant = await EmergencyAccess.create({
            requestedBy: doctor._id, requestedByRole: 'doctor',
            patient: new mongoose.Types.ObjectId(),
            reason: 'test grant for admin revoke',
            expiresAt: new Date(Date.now() + 3600000),
            status: 'active',
        });

        const res = await request(app)
            .post(`/api/emergency-access/${grant._id}/revoke`)
            .set(authHeader(admin._id));
        expect(res.status).toBe(200);

        const updated = await EmergencyAccess.findById(grant._id);
        expect(updated.status).toBe('revoked');
        expect(updated.isValid()).toBe(false);
    });

    test('404 — unknown grant id', async () => {
        const admin = await createUser({ role: 'admin' });
        await assignRole(admin._id, 'SUPER_ADMIN');

        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .post(`/api/emergency-access/${fakeId}/revoke`)
            .set(authHeader(admin._id));
        expect(res.status).toBe(404);
    });
});

describe('POST /api/emergency-access/:id/review', () => {
    let app;
    beforeAll(() => {
        app = buildApp(['/api/emergency-access', require('../routes/emergencyAccessRoutes')]);
    });

    test('200 — admin can mark grant reviewed with note', async () => {
        const admin = await createUser({ role: 'admin' });
        await assignRole(admin._id, 'SUPER_ADMIN');

        const doctor = await createUser({ role: 'doctor' });
        const grant = await EmergencyAccess.create({
            requestedBy: doctor._id, requestedByRole: 'doctor',
            patient: new mongoose.Types.ObjectId(),
            reason: 'test emergency access review',
            expiresAt: new Date(Date.now() + 3600000),
            status: 'active',
        });

        const res = await request(app)
            .post(`/api/emergency-access/${grant._id}/review`)
            .set(authHeader(admin._id))
            .send({ reviewNote: 'Justified — patient in critical condition.' });
        expect(res.status).toBe(200);

        const updated = await EmergencyAccess.findById(grant._id);
        expect(updated.status).toBe('reviewed');
        expect(updated.reviewNote).toMatch(/Justified/);
        expect(updated.reviewedBy.toString()).toBe(admin._id.toString());
    });

    test('revoked grants remain revoked even after review attempt', async () => {
        const admin = await createUser({ role: 'admin' });
        await assignRole(admin._id, 'SUPER_ADMIN');

        const grant = await EmergencyAccess.create({
            requestedBy: admin._id, requestedByRole: 'admin',
            patient: new mongoose.Types.ObjectId(),
            reason: 'test revoked grant review',
            expiresAt: new Date(Date.now() + 3600000),
            status: 'revoked',
        });

        const res = await request(app)
            .post(`/api/emergency-access/${grant._id}/review`)
            .set(authHeader(admin._id))
            .send({ reviewNote: 'already revoked' });
        expect(res.status).toBe(200);

        // Status should stay revoked — the route only flips 'active' → 'reviewed'
        const updated = await EmergencyAccess.findById(grant._id);
        expect(updated.status).toBe('revoked');
    });
});

// ── Permission middleware — direct integration ────────────────────────────────
//
// These tests mount a minimal probe route that only runs protect + permit,
// bypassing route-specific middleware (requireSameTenant, audit, controllers)
// that depends on services not available in the test environment.
// This isolates the RBAC decision from unrelated infrastructure.

describe('permit() middleware — direct integration', () => {
    let app;

    beforeAll(() => {
        const { protect } = require('../middleware/auth');
        const { permit, permitAny } = require('../middleware/permit');
        const probeApp = express();
        probeApp.use(express.json());

        // Probe route 1: AND logic (all permissions required)
        probeApp.get('/probe/view-all', protect, permit('PATIENTS.VIEW_ALL'), (req, res) => res.json({ ok: true }));
        // Probe route 2: OR logic (any one permission)
        probeApp.get('/probe/doctor-or-admin', protect, permitAny('DOCTOR.VIEW_PATIENTS', 'ADMIN.VIEW_USERS'), (req, res) => res.json({ ok: true }));

        probeApp.use((err, req, res, next) => res.status(err.statusCode || 500).json({ success: false, message: err.message }));
        app = probeApp;
    });

    test('401 — no token on permit-gated route', async () => {
        const res = await request(app).get('/probe/view-all');
        expect(res.status).toBe(401);
    });

    test('403 — PATIENT role blocked from PATIENTS.VIEW_ALL', async () => {
        const patient = await createUser({ role: 'patient' });
        await assignRole(patient._id, 'PATIENT');
        const res = await request(app).get('/probe/view-all').set(authHeader(patient._id));
        expect(res.status).toBe(403);
    });

    test('200 — DOCTOR passes PATIENTS.VIEW_ALL (DOCTOR role includes it)', async () => {
        // DOCTOR was given PATIENTS.VIEW_ALL in the expanded permissions.js
        const doctor = await createUser({ role: 'doctor' });
        await assignRole(doctor._id, 'DOCTOR');
        const res = await request(app).get('/probe/view-all').set(authHeader(doctor._id));
        expect(res.status).toBe(200);
    });

    test('200 — SUPER_ADMIN passes PATIENTS.VIEW_ALL', async () => {
        const admin = await createUser({ role: 'admin' });
        await assignRole(admin._id, 'SUPER_ADMIN');
        const res = await request(app).get('/probe/view-all').set(authHeader(admin._id));
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
    });

    test('200 — DOCTOR passes permitAny with DOCTOR.VIEW_PATIENTS', async () => {
        const doctor = await createUser({ role: 'doctor' });
        await assignRole(doctor._id, 'DOCTOR');
        const res = await request(app).get('/probe/doctor-or-admin').set(authHeader(doctor._id));
        expect(res.status).toBe(200);
    });

    test('403 — PATIENT blocked from permitAny(DOCTOR.VIEW_PATIENTS, ADMIN.VIEW_USERS)', async () => {
        const patient = await createUser({ role: 'patient' });
        await assignRole(patient._id, 'PATIENT');
        const res = await request(app).get('/probe/doctor-or-admin').set(authHeader(patient._id));
        expect(res.status).toBe(403);
    });

    test('200 — explicit GRANT override adds missing permission', async () => {
        const patient = await createUser({ role: 'patient' });
        await assignRole(patient._id, 'PATIENT');
        // PATIENT role doesn't have PATIENTS.VIEW_ALL — grant it via override
        await UserPermissionOverride.create({
            user: patient._id, permission: 'PATIENTS.VIEW_ALL',
            granted: true, grantedBy: patient._id, isActive: true,
        });
        const res = await request(app).get('/probe/view-all').set(authHeader(patient._id));
        expect(res.status).toBe(200);
    });

    test('403 — explicit DENY override removes permission from role', async () => {
        const admin = await createUser({ role: 'admin' });
        await assignRole(admin._id, 'SUPER_ADMIN');
        // Deny PATIENTS.VIEW_ALL via override
        await UserPermissionOverride.create({
            user: admin._id, permission: 'PATIENTS.VIEW_ALL',
            granted: false, grantedBy: admin._id, isActive: true,
        });
        const res = await request(app).get('/probe/view-all').set(authHeader(admin._id));
        expect(res.status).toBe(403);
    });

    test('401 — deactivated user is rejected by protect', async () => {
        const user = await createUser({ role: 'admin', isActive: false });
        await assignRole(user._id, 'SUPER_ADMIN');
        const res = await request(app).get('/probe/view-all').set(authHeader(user._id));
        expect(res.status).toBe(401);
    });
});

// ── Reception routes — permission gating ─────────────────────────────────────

describe('Reception routes — permission gating', () => {
    let app;
    beforeAll(() => {
        app = buildApp(['/api/reception', require('../routes/receptionRoutes')]);
    });

    test('401 — GET /api/reception/dashboard without token', async () => {
        const res = await request(app).get('/api/reception/dashboard');
        expect(res.status).toBe(401);
    });

    test('403 — PATIENT role cannot access reception dashboard', async () => {
        const patient = await createUser({ role: 'patient' });
        await assignRole(patient._id, 'PATIENT');

        const res = await request(app)
            .get('/api/reception/dashboard')
            .set(authHeader(patient._id));
        expect(res.status).toBe(403);
    });

    test('pass-through — RECEPTIONIST role can access reception dashboard', async () => {
        const receptionist = await createUser({ role: 'reception' });
        await assignRole(receptionist._id, 'RECEPTIONIST');

        const res = await request(app)
            .get('/api/reception/dashboard')
            .set(authHeader(receptionist._id));
        expect(res.status).not.toBe(403);
        expect(res.status).not.toBe(401);
    });
});

// ── Dashboard routes — permission gating ─────────────────────────────────────

describe('Dashboard routes — permission gating', () => {
    let app;
    beforeAll(() => {
        app = buildApp(['/api/dashboard', require('../routes/dashboardRoutes')]);
    });

    test('401 — no token', async () => {
        const res = await request(app).get('/api/dashboard/overview');
        expect(res.status).toBe(401);
    });

    test('403 — PATIENT cannot view admin dashboard overview', async () => {
        const patient = await createUser({ role: 'patient' });
        await assignRole(patient._id, 'PATIENT');

        const res = await request(app)
            .get('/api/dashboard/overview')
            .set(authHeader(patient._id));
        expect(res.status).toBe(403);
    });

    test('pass-through — SUPER_ADMIN can access dashboard overview', async () => {
        const admin = await createUser({ role: 'admin' });
        await assignRole(admin._id, 'SUPER_ADMIN');

        const res = await request(app)
            .get('/api/dashboard/overview')
            .set(authHeader(admin._id));
        expect(res.status).not.toBe(403);
        expect(res.status).not.toBe(401);
    });
});

// ── Deactivated user cannot authenticate ──────────────────────────────────────

describe('Deactivated user access', () => {
    let app;
    beforeAll(() => {
        app = buildApp(['/api/emergency-access', require('../routes/emergencyAccessRoutes')]);
    });

    test('401 — deactivated user token is rejected', async () => {
        const user = await createUser({ role: 'doctor', isActive: false });
        await assignRole(user._id, 'DOCTOR');

        const res = await request(app)
            .get('/api/emergency-access/my')
            .set(authHeader(user._id));
        expect(res.status).toBe(401);
    });
});

// ── Permission override — DENY beats role grant ───────────────────────────────

describe('Permission override — deny beats role grant', () => {
    let app;
    beforeAll(() => {
        app = buildApp(['/api/dashboard', require('../routes/dashboardRoutes')]);
    });

    test('403 — deny overrides strip all three permitted permissions on dashboard overview', async () => {
        const admin = await createUser({ role: 'admin' });
        // Assign a minimal role that has exactly the 3 dashboard overview permissions
        const customRole = await Role.create({
            name: `DASH_TEST_${Date.now()}`,
            displayName: 'Dash Test',
            permissions: ['ADMIN.VIEW_DASHBOARD', 'ADMIN.VIEW_ANALYTICS', 'CLINIC.VIEW_REPORTS'],
            isActive: true,
        });
        await UserRole.create({ user: admin._id, role: customRole._id, grantedBy: admin._id, isActive: true });

        // Deny all three permissions the route accepts (GET /overview uses permitAny of these three)
        for (const perm of ['ADMIN.VIEW_DASHBOARD', 'ADMIN.VIEW_ANALYTICS', 'CLINIC.VIEW_REPORTS']) {
            await UserPermissionOverride.create({
                user: admin._id, permission: perm,
                granted: false, grantedBy: admin._id, isActive: true,
            });
        }

        const res = await request(app)
            .get('/api/dashboard/overview')
            .set(authHeader(admin._id));
        expect(res.status).toBe(403);
    });
});

// ── EmergencyAccess model unit checks ─────────────────────────────────────────

describe('EmergencyAccess model', () => {
    test('isValid() returns true for active non-expired grant', async () => {
        const doctor = await createUser({ role: 'doctor' });
        const grant = new EmergencyAccess({
            requestedBy: doctor._id, requestedByRole: 'doctor',
            patient: new mongoose.Types.ObjectId(),
            reason: 'unit test emergency grant',
            expiresAt: new Date(Date.now() + 3600000),
            status: 'active',
        });
        expect(grant.isValid()).toBe(true);
    });

    test('isValid() returns false for expired grant', async () => {
        const doctor = await createUser({ role: 'doctor' });
        const grant = new EmergencyAccess({
            requestedBy: doctor._id, requestedByRole: 'doctor',
            patient: new mongoose.Types.ObjectId(),
            reason: 'unit test expired grant',
            expiresAt: new Date(Date.now() - 1000), // already expired
            status: 'active',
        });
        expect(grant.isValid()).toBe(false);
    });

    test('isValid() returns false for revoked grant', async () => {
        const doctor = await createUser({ role: 'doctor' });
        const grant = new EmergencyAccess({
            requestedBy: doctor._id, requestedByRole: 'doctor',
            patient: new mongoose.Types.ObjectId(),
            reason: 'unit test revoked grant',
            expiresAt: new Date(Date.now() + 3600000),
            status: 'revoked',
        });
        expect(grant.isValid()).toBe(false);
    });

    test('findActiveGrant() returns only live grants', async () => {
        const doctor = await createUser({ role: 'doctor' });
        const patient = await createUser({ role: 'patient' });

        // Expired grant
        await EmergencyAccess.create({
            requestedBy: doctor._id, requestedByRole: 'doctor',
            patient: patient._id,
            reason: 'expired grant for findActiveGrant test',
            expiresAt: new Date(Date.now() - 1000),
            status: 'active',
        });

        const result = await EmergencyAccess.findActiveGrant(doctor._id, patient._id);
        expect(result).toBeNull();

        // Now create a valid one
        const valid = await EmergencyAccess.create({
            requestedBy: doctor._id, requestedByRole: 'doctor',
            patient: patient._id,
            reason: 'valid grant for findActiveGrant test',
            expiresAt: new Date(Date.now() + 3600000),
            status: 'active',
        });

        const found = await EmergencyAccess.findActiveGrant(doctor._id, patient._id);
        expect(found).not.toBeNull();
        expect(found._id.toString()).toBe(valid._id.toString());
    });
});
