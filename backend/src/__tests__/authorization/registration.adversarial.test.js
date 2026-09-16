'use strict';
/**
 * Adversarial registration tests — verify mass assignment and privilege
 * escalation vectors are blocked at the register endpoint.
 *
 * R-01: role=admin in body must NOT produce an admin user
 * R-02: role=super_admin in body must NOT produce a super_admin user
 * R-03: role=organization_admin in body must NOT elevate role
 * R-04: role=clinic_admin in body must NOT elevate role
 * R-05: permissions array in body must NOT be stored on user
 * R-06: isAdmin flag in body must NOT be stored on user
 * R-07: organizationId in body must NOT be taken from client request
 * R-08: verified:true in body must NOT set verified=true on new user
 * R-09: All privileged extra fields are silently ignored; registration succeeds
 *       and the created user role is exactly 'patient'
 */

// ── Mongoose / DB mock ────────────────────────────────────────────────────────

const savedUsers = [];

jest.mock('../../models/User', () => ({
    findOne: jest.fn().mockResolvedValue(null),      // no duplicate email
    create: jest.fn().mockImplementation(data => {
        const user = { _id: 'new-user-id', ...data };
        savedUsers.push(user);
        return Promise.resolve(user);
    }),
}));

jest.mock('../../middleware/auth', () => ({
    protect: jest.fn((_req, _res, next) => next()),
    generateToken: jest.fn().mockReturnValue('mock-token'),
    authorize: jest.fn(() => (req, res, next) => next()),
}));

jest.mock('../../services/PermissionService', () => ({
    ensureUserHasRole: jest.fn().mockResolvedValue(undefined),
    getEffectivePermissions: jest.fn().mockResolvedValue({ permissions: [], workspaces: [] }),
}));

jest.mock('../../config/database', () =>
    jest.fn().mockResolvedValue({ connection: { host: 'mock' } }),
);

jest.mock('mongoose', () => ({
    connection: { readyState: 1 },
    connect: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../services/RedisClient', () => ({
    getClient: jest.fn(),
    isReady: jest.fn().mockReturnValue(false),
}));

const express = require('express');
const request = require('supertest');

// Import AFTER mocks are set up
const authController = require('../../controllers/authController');

const app = express();
app.use(express.json());
app.post('/register', authController.register);

const User = require('../../models/User');

// ─────────────────────────────────────────────────────────────────────────────

describe('Registration privilege escalation — adversarial', () => {
    beforeEach(() => {
        savedUsers.length = 0;
        jest.clearAllMocks();
        User.findOne.mockResolvedValue(null);
        User.create.mockImplementation(data => {
            const user = { _id: 'new-user-id', ...data };
            savedUsers.push(user);
            return Promise.resolve(user);
        });
    });

    const basePayload = {
        firstName: 'Attack',
        lastName: 'Bot',
        email: 'attacker@evil.com',
        password: 'Pass1234!',
        phone: '9000000000',
    };

    test('R-01: role=admin in body is ignored; created role is patient', async () => {
        const res = await request(app)
            .post('/register')
            .send({ ...basePayload, role: 'admin' });

        expect(res.status).toBe(201);
        expect(savedUsers).toHaveLength(1);
        expect(savedUsers[0].role).toBe('patient');
        expect(savedUsers[0].role).not.toBe('admin');
    });

    test('R-02: role=super_admin in body is ignored; created role is patient', async () => {
        const res = await request(app)
            .post('/register')
            .send({ ...basePayload, email: 'a2@evil.com', role: 'super_admin' });

        expect(res.status).toBe(201);
        expect(savedUsers[0].role).toBe('patient');
        expect(savedUsers[0].role).not.toBe('super_admin');
    });

    test('R-03: role=organization_admin in body is ignored', async () => {
        const res = await request(app)
            .post('/register')
            .send({ ...basePayload, email: 'a3@evil.com', role: 'organization_admin' });

        expect(res.status).toBe(201);
        expect(savedUsers[0].role).toBe('patient');
    });

    test('R-04: role=clinic_admin in body is ignored', async () => {
        const res = await request(app)
            .post('/register')
            .send({ ...basePayload, email: 'a4@evil.com', role: 'clinic_admin' });

        expect(res.status).toBe(201);
        expect(savedUsers[0].role).toBe('patient');
    });

    test('R-05: permissions array in body is NOT stored on user', async () => {
        const res = await request(app)
            .post('/register')
            .send({ ...basePayload, email: 'a5@evil.com', permissions: ['ADMIN.MANAGE_PERMISSIONS'] });

        expect(res.status).toBe(201);
        expect(savedUsers[0].permissions).toBeUndefined();
        expect(savedUsers[0].role).toBe('patient');
    });

    test('R-06: isAdmin flag in body is NOT stored on user', async () => {
        const res = await request(app)
            .post('/register')
            .send({ ...basePayload, email: 'a6@evil.com', isAdmin: true });

        expect(res.status).toBe(201);
        expect(savedUsers[0].isAdmin).not.toBe(true);
    });

    test('R-07: organizationId supplied by client is NOT passed to User.create', async () => {
        const fakeOrgId = 'org-attacker-123';
        const res = await request(app)
            .post('/register')
            .send({ ...basePayload, email: 'a7@evil.com', organizationId: fakeOrgId });

        expect(res.status).toBe(201);
        expect(savedUsers[0].organizationId).toBeUndefined();
    });

    test('R-08: verified:true in body is NOT stored on user', async () => {
        const res = await request(app)
            .post('/register')
            .send({ ...basePayload, email: 'a8@evil.com', verified: true, isVerified: true });

        expect(res.status).toBe(201);
        // The controller should not pass verified or isVerified from the request body
        expect(savedUsers[0].isVerified).not.toBe(true);
    });

    test('R-09: User.create is called with exactly the safe fields (no extras)', async () => {
        await request(app)
            .post('/register')
            .send({
                ...basePayload,
                email: 'a9@evil.com',
                role: 'admin',
                permissions: ['ADMIN.MANAGE_PERMISSIONS'],
                isAdmin: true,
                organizationId: 'evil-org',
                verified: true,
            });

        const createArg = User.create.mock.calls[0][0];
        const allowedKeys = new Set(['firstName', 'lastName', 'email', 'password', 'phone', 'role']);
        const unexpectedKeys = Object.keys(createArg).filter(k => !allowedKeys.has(k));
        expect(unexpectedKeys).toEqual([]);
        expect(createArg.role).toBe('patient');
    });
});
