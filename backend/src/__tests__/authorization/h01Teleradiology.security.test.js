'use strict';
/**
 * Security regression tests — H-01
 *
 * H-01: POST /api/teleradiology/submit — any authenticated user could inject
 *       fabricated teleradiology cases into the radiology worklist.
 *
 * Fix: added authorize('doctor', 'admin', 'radiologist') between protect and
 *      the async handler in teleradiologyRoutes.js.
 */

const path = require('path');
const fs   = require('fs');

// ── Jest hoisting: mock-prefixed variables only ───────────────────────────────

const mockProtect = jest.fn();
const mockAuthorizeImpl = (...roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false });
    if (!roles.includes(req.user.role))
        return res.status(403).json({ success: false, message: 'Forbidden.' });
    return next();
};

jest.mock('../../middleware/auth', () => ({
    protect:   mockProtect,
    authorize: jest.fn((...roles) => mockAuthorizeImpl(...roles)),
}));

// Mongoose model — not needed in unit tests; stub it out.
jest.mock('../../models/RadiologyScan', () => ({
    create: jest.fn().mockResolvedValue({ scanId: 'CC-TEST', _id: 'scan-1' }),
    find:   jest.fn().mockResolvedValue([]),
}));
jest.mock('../../models/User', () => ({
    find: jest.fn().mockResolvedValue([]),
}));

const express = require('express');
const request = require('supertest');

function makeUser(role, id) {
    return { _id: id || `${role}-1`, role };
}

function defaultProtect(req, res, next) {
    if (req.__mockUser) { req.user = req.__mockUser; return next(); }
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
}

// Minimal submission payload (DB path won't be hit because mongoose is mocked).
const submitPayload = {
    patientFirstName: 'Test',
    patientLastName:  'Patient',
    patientAge: 30,
    patientGender: 'Male',
    scanType: 'CT',
    bodyPart: 'Head',
    priority: 'normal',
    fileUrl: 'https://example.com/dicom',
    fileName: 'test.dcm',
};

// ── Source-level assertion ────────────────────────────────────────────────────

describe('H-01 — teleradiologyRoutes POST /submit requires clinical role (source)', () => {
    const src = fs.readFileSync(
        path.resolve(__dirname, '../../routes/teleradiologyRoutes.js'), 'utf8'
    );

    it('[source] /submit route includes authorize with doctor, admin, radiologist', () => {
        // Must find authorize call with at least one of the allowed roles next to the protect middleware.
        expect(src).toMatch(/router\.post\(['"]\/submit['"].*authorize\([^)]*'doctor'/s);
    });

    it('[source] /submit route does not expose a bare protect-only path', () => {
        // The only router.post('/submit'...) line must contain authorize, not just protect.
        const submitLines = src
            .split('\n')
            .filter(l => l.includes("router.post('/submit'") || l.includes('router.post("/submit"'));
        expect(submitLines.length).toBeGreaterThan(0);
        submitLines.forEach(line => {
            expect(line).toMatch(/authorize/);
        });
    });
});

// ── Integration (live Express + mocked middleware) ────────────────────────────

describe('H-01 — POST /api/teleradiology/submit role gate (integration)', () => {
    let app;

    beforeAll(() => {
        mockProtect.mockImplementation(defaultProtect);
        const teleradiologyRoutes = require('../../routes/teleradiologyRoutes');
        app = express();
        app.use(express.json());
        app.use('/api/teleradiology', teleradiologyRoutes);
    });

    beforeEach(() => {
        mockProtect.mockImplementation(defaultProtect);
    });

    it('returns 401 when unauthenticated', async () => {
        const res = await request(app)
            .post('/api/teleradiology/submit')
            .send(submitPayload);
        expect(res.status).toBe(401);
    });

    it('returns 403 when authenticated as patient (unauthorized role)', async () => {
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = makeUser('patient', 'patient-1');
            return next();
        });
        const res = await request(app)
            .post('/api/teleradiology/submit')
            .send(submitPayload);
        expect(res.status).toBe(403);
    });

    it('returns 403 when authenticated as nurse (unauthorized role)', async () => {
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = makeUser('nurse', 'nurse-1');
            return next();
        });
        const res = await request(app)
            .post('/api/teleradiology/submit')
            .send(submitPayload);
        expect(res.status).toBe(403);
    });

    it('returns 201 when authenticated as doctor (allowed)', async () => {
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = makeUser('doctor', 'doc-1');
            return next();
        });
        const res = await request(app)
            .post('/api/teleradiology/submit')
            .send(submitPayload);
        expect(res.status).toBe(201);
    });

    it('returns 201 when authenticated as radiologist (allowed)', async () => {
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = makeUser('radiologist', 'rad-1');
            return next();
        });
        const res = await request(app)
            .post('/api/teleradiology/submit')
            .send(submitPayload);
        expect(res.status).toBe(201);
    });

    it('returns 201 when authenticated as admin (allowed)', async () => {
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = makeUser('admin', 'admin-1');
            return next();
        });
        const res = await request(app)
            .post('/api/teleradiology/submit')
            .send(submitPayload);
        expect(res.status).toBe(201);
    });
});
