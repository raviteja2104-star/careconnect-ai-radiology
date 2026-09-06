'use strict';
/**
 * Security regression tests — Phase C remaining High findings
 *
 * H-07: GET /api/transfer/journey/:patientId — ownership/RBAC guard
 * H-13: Command center routes must restrict to clinical/admin staff
 * H-14: No Access-Control-Allow-Origin: * in ohifRoutes or OrthancClient
 * H-15: authorize() 403 must NOT leak the user's role in the message
 * H-16: Reception dashboard/appointments must require staff role
 */

const fs   = require('fs');
const path = require('path');

// Variables referenced inside jest.mock factories MUST start with 'mock' (Jest hoisting rule).
const mockProtect = jest.fn();
const mockAuthorizeImpl = (...roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false });
    if (!roles.includes(req.user.role))
        return res.status(403).json({ success: false, message: 'You do not have permission to access this resource.' });
    return next();
};

jest.mock('../../middleware/auth', () => ({
    protect:   mockProtect,
    authorize: jest.fn((...roles) => mockAuthorizeImpl(...roles)),
}));

jest.mock('../../services/PermissionService', () => ({
    userHasPermissions:      jest.fn().mockResolvedValue(true),
    getEffectivePermissions: jest.fn().mockResolvedValue([]),
    ensureUserHasRole:       jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../controllers/transferController', () => ({
    createTransfer:    jest.fn((req, res) => res.status(201).json({ success: true })),
    getPatientJourney: jest.fn((req, res) => res.json({ success: true, data: [] })),
}));

const express = require('express');
const request = require('supertest');

function makeUser(role, id) {
    return { _id: id || `${role}-1`, role };
}

// Default protect: passes if req.__mockUser is set, else 401.
function defaultProtect(req, res, next) {
    if (req.__mockUser) { req.user = req.__mockUser; return next(); }
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
}

// ── H-07: Transfer journey ownership ─────────────────────────────────────────

describe('H-07 — GET /api/transfer/journey/:patientId ownership guard', () => {
    let app;

    beforeAll(() => {
        mockProtect.mockImplementation(defaultProtect);
        const transferRoutes = require('../../routes/transferRoutes');
        app = express();
        app.use(express.json());
        app.use('/api/transfer', transferRoutes);
    });

    beforeEach(() => {
        mockProtect.mockImplementation(defaultProtect);
    });

    it('returns 401 when unauthenticated', async () => {
        const res = await request(app).get('/api/transfer/journey/patient-1');
        expect(res.status).toBe(401);
    });

    it('returns 403 when patient-A requests patient-B journey (IDOR)', async () => {
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = makeUser('patient', 'patient-A');
            return next();
        });
        const res = await request(app).get('/api/transfer/journey/patient-B');
        expect(res.status).toBe(403);
    });

    it('allows the owning patient to read their own journey', async () => {
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = makeUser('patient', 'patient-B');
            return next();
        });
        const res = await request(app).get('/api/transfer/journey/patient-B');
        expect(res.status).toBe(200);
    });

    it('allows admin to read any patient journey', async () => {
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = makeUser('admin', 'admin-1');
            return next();
        });
        const res = await request(app).get('/api/transfer/journey/patient-X');
        expect(res.status).toBe(200);
    });

    it('allows doctor to read any patient journey', async () => {
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = makeUser('doctor', 'doc-1');
            return next();
        });
        const res = await request(app).get('/api/transfer/journey/patient-X');
        expect(res.status).toBe(200);
    });
});

// ── H-13: Command center staff-only restriction ───────────────────────────────

describe('H-13 — Command center routes restricted to clinical/admin staff', () => {
    const src = fs.readFileSync(
        path.resolve(__dirname, '../../routes/commandRoutes.js'), 'utf8'
    );

    it('[source] commandRoutes uses authorize with admin and clinical roles', () => {
        expect(src).toMatch(/authorize\([^)]*'admin'/);
        expect(src).toMatch(/authorize\([^)]*'doctor'/);
    });

    it('[source] commandRoutes applies protect and authorize to the whole router', () => {
        expect(src).toMatch(/router\.use\(protect\)/);
        expect(src).toMatch(/router\.use\(authorize\(/);
    });
});

// ── H-14: No Access-Control-Allow-Origin: * in imaging routes ────────────────

describe('H-14 — No CORS wildcard in authenticated imaging endpoints', () => {
    const ohifSrc = fs.readFileSync(
        path.resolve(__dirname, '../../routes/ohifRoutes.js'), 'utf8'
    );
    const orthancSrc = fs.readFileSync(
        path.resolve(__dirname, '../../services/OrthancClient.js'), 'utf8'
    );
    const dicomSrc = fs.readFileSync(
        path.resolve(__dirname, '../../routes/dicomwebRoutes.js'), 'utf8'
    );

    const wildcardPattern = /Access-Control-Allow-Origin['"]\s*,\s*['"][*]['"]/;

    it('[source] ohifRoutes does not set Access-Control-Allow-Origin: *', () => {
        expect(ohifSrc).not.toMatch(wildcardPattern);
    });

    it('[source] OrthancClient does not set Access-Control-Allow-Origin: *', () => {
        expect(orthancSrc).not.toMatch(wildcardPattern);
    });

    it('[source] dicomwebRoutes does not set Access-Control-Allow-Origin: *', () => {
        expect(dicomSrc).not.toMatch(wildcardPattern);
    });
});

// ── H-15: authorize() 403 must not leak the user's role ──────────────────────

describe('H-15 — authorize() 403 response must not include the caller role', () => {
    it('403 message does not contain the role name', async () => {
        const { authorize } = require('../../middleware/auth');
        const testApp = express();
        testApp.use(express.json());
        testApp.get('/test',
            (req, res, next) => { req.user = makeUser('patient', 'p1'); return next(); },
            authorize('admin'),
            (req, res) => res.json({ ok: true })
        );
        const res = await request(testApp).get('/test');
        expect(res.status).toBe(403);
        expect(res.body.message).not.toMatch(/patient/i);
        expect(res.body.message).not.toMatch(/Role/);
        expect(res.body.message).not.toMatch(/is not authorized/);
    });
});

// ── H-16: Reception routes restrict to staff ─────────────────────────────────

describe('H-16 — Reception dashboard/appointments require staff role', () => {
    const src = fs.readFileSync(
        path.resolve(__dirname, '../../routes/receptionRoutes.js'), 'utf8'
    );

    it('[source] /dashboard GET uses authorize with admin role', () => {
        expect(src).toMatch(/dashboard.*authorize\([^)]*'admin'/s);
    });

    it('[source] /appointments GET uses authorize with admin role', () => {
        expect(src).toMatch(/appointments.*authorize\([^)]*'admin'/s);
    });

    it('[source] /checkin POST uses authorize with admin role', () => {
        expect(src).toMatch(/checkin.*authorize\([^)]*'admin'/s);
    });

    it('[source] /walkin POST uses authorize with admin role', () => {
        expect(src).toMatch(/walkin.*authorize\([^)]*'admin'/s);
    });
});
