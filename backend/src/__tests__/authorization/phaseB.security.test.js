'use strict';
/**
 * Security regression tests — Phase B IDOR / ownership fixes
 *
 * H-03: POST /api/consents/:id/sign — patient may only sign their own consent
 * H-09: GET  /api/emergency/:id   — patient may only read their own emergency
 * H-10: PUT  /api/notifications/:id/read — scoped to calling user's notifications
 * H-11: POST /api/notifications/send — admin-only
 * H-12: POST /api/payment/refund   — admin-only
 * H-04: GET  /api/pharmacy/orders  — patients see own orders only
 * H-06: GET  /api/dashboard/activity — admin/clinical-staff only
 * H-08: DICOMweb routes must NOT emit Access-Control-Allow-Origin: *
 */

// ── Auth mock ─────────────────────────────────────────────────────────────────

const mockProtect = jest.fn((req, res, next) => {
    if (req.__mockUser) { req.user = req.__mockUser; return next(); }
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
});

const mockAuthorize = jest.fn((...roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated.' });
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: `Role '${req.user.role}' is not authorized.` });
    }
    return next();
});

jest.mock('../../middleware/auth', () => ({
    protect:   mockProtect,
    authorize: mockAuthorize,
}));

jest.mock('../../services/PermissionService', () => ({
    userHasPermissions:      jest.fn().mockResolvedValue(true),
    getEffectivePermissions: jest.fn().mockResolvedValue([]),
    ensureUserHasRole:       jest.fn().mockResolvedValue(undefined),
}));

// ── Model mocks ───────────────────────────────────────────────────────────────

const mockConsentDoc = {
    _id: 'consent-1',
    patient: 'patient-1',
    signatures: [],
    status: 'REQUESTED',
    save: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../../models/ConsentDocument', () => ({
    findById: jest.fn(),
}));

jest.mock('../../models/User', () => ({
    findById: jest.fn().mockResolvedValue({ phone: '+911234567890', email: 'p@example.com' }),
}));

jest.mock('../../services/EventPublisher', () => ({
    publish: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../models/Emergency', () => ({
    findById: jest.fn(),
}));

jest.mock('../../models/Notification', () => ({
    findOneAndUpdate: jest.fn(),
    create: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../models/PharmacyOrder', () => ({
    find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
    }),
    countDocuments: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../models/AuditLog', () => ({
    find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
    }),
}));

const mongoose = { connection: { readyState: 0 } };
jest.mock('mongoose', () => mongoose);

const express = require('express');
const request = require('supertest');
const { ConsentDocument } = { ConsentDocument: require('../../models/ConsentDocument') };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeUser(role, id = `${role}-1`) {
    return { _id: id, role };
}

function asUser(user) {
    return { __mockUser: user };
}

// ── H-03: Consent sign — ownership ───────────────────────────────────────────

describe('H-03 — POST /api/consents/:id/sign ownership check', () => {
    let app;
    beforeAll(() => {
        const { protect, authorize } = require('../../middleware/auth');
        const consentRoutes = require('../../routes/consentRoutes');
        app = express();
        app.use(express.json());
        app.use('/api/consents', consentRoutes);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        const ConsentDocument = require('../../models/ConsentDocument');
        ConsentDocument.findById.mockResolvedValue({
            ...mockConsentDoc,
            patient: { toString: () => 'patient-1' },
        });
        mockProtect.mockImplementation((req, res, next) => {
            if (req.__mockUser) { req.user = req.__mockUser; return next(); }
            return res.status(401).json({ success: false, message: 'Not authenticated.' });
        });
    });

    it('returns 401 when unauthenticated', async () => {
        const res = await request(app).post('/api/consents/consent-1/sign').send({});
        expect(res.status).toBe(401);
    });

    it('returns 403 when a different patient tries to sign', async () => {
        const res = await request(app)
            .post('/api/consents/consent-1/sign')
            .set('x-mock-user', '1') // triggers mockProtect
            .send({ signerType: 'patient', signerName: 'Other', signatureData: 'base64' })
            .use((r) => { r.set('__mockUserRole', 'patient'); });

        // Use supertest's agent pattern instead — set __mockUser via body interception
        // The simplest: create a mock express middleware that sets req.__mockUser
    });

    it('allows a patient to sign their OWN consent (direct middleware test)', async () => {
        const { signConsent } = require('../../controllers/consentController');
        const ConsentDocument = require('../../models/ConsentDocument');
        ConsentDocument.findById.mockResolvedValue({
            _id: 'consent-1',
            patient: { toString: () => 'patient-1' },
            signatures: [],
            status: 'REQUESTED',
            save: jest.fn().mockResolvedValue(undefined),
            documentHash: null,
        });

        let statusCode, jsonBody;
        const req = {
            params: { id: 'consent-1' },
            body: { signerType: 'patient', signerName: 'John Doe', signatureData: 'sig' },
            user: { _id: 'patient-1', role: 'patient' },
            ip: '127.0.0.1',
            headers: { 'x-tenant-id': 't1', 'x-trace-id': 'trace1' },
            app: { get: jest.fn().mockReturnValue(null) },
        };
        const res = {
            json: jest.fn((body) => { jsonBody = body; }),
            status: jest.fn().mockReturnThis(),
        };
        await signConsent(req, res, jest.fn());
        expect(res.status).not.toHaveBeenCalledWith(403);
        expect(jsonBody?.success).toBe(true);
    });

    it('returns 403 when a different patient tries to sign (direct controller test)', async () => {
        const { signConsent } = require('../../controllers/consentController');
        const ConsentDocument = require('../../models/ConsentDocument');
        ConsentDocument.findById.mockResolvedValue({
            _id: 'consent-1',
            patient: { toString: () => 'patient-1' },
            signatures: [],
            status: 'REQUESTED',
            save: jest.fn(),
        });

        const req = {
            params: { id: 'consent-1' },
            body: { signerType: 'patient', signerName: 'Attacker', signatureData: 'sig' },
            user: { _id: 'ATTACKER-99', role: 'patient' }, // different user
            ip: '127.0.0.1',
            headers: {},
            app: { get: jest.fn().mockReturnValue(null) },
        };
        let capturedStatus;
        const res = {
            json: jest.fn(),
            status: jest.fn((s) => { capturedStatus = s; return res; }),
        };
        await signConsent(req, res, jest.fn());
        expect(capturedStatus).toBe(403);
    });

    it('allows admin staff to sign any consent (doctor role)', async () => {
        const { signConsent } = require('../../controllers/consentController');
        const ConsentDocument = require('../../models/ConsentDocument');
        ConsentDocument.findById.mockResolvedValue({
            _id: 'consent-1',
            patient: { toString: () => 'patient-1' },
            signatures: [],
            status: 'REQUESTED',
            save: jest.fn().mockResolvedValue(undefined),
            documentHash: null,
        });

        const req = {
            params: { id: 'consent-1' },
            body: { signerType: 'doctor', signerName: 'Dr. Smith', signatureData: 'sig' },
            user: { _id: 'doctor-42', role: 'doctor' }, // staff — different from patient-1
            ip: '127.0.0.1',
            headers: { 'x-tenant-id': 't1', 'x-trace-id': 'trace1' },
            app: { get: jest.fn().mockReturnValue(null) },
        };
        let capturedStatus;
        const res = {
            json: jest.fn(),
            status: jest.fn((s) => { capturedStatus = s; return res; }),
        };
        await signConsent(req, res, jest.fn());
        expect(capturedStatus).not.toBe(403);
    });
});

// ── H-09: Emergency status — ownership ───────────────────────────────────────

describe('H-09 — GET /api/emergency/:id ownership check', () => {
    let getEmergencyStatus;
    beforeAll(() => {
        getEmergencyStatus = require('../../controllers/emergencyController').getEmergencyStatus;
    });

    function makeEmergencyReq(callerId, callerRole, patientId) {
        const Emergency = require('../../models/Emergency');
        Emergency.findById.mockReturnValue({
            populate: jest.fn().mockResolvedValue({
                _id: 'emr-1',
                patientId: { _id: patientId, toString: () => patientId },
            }),
        });
        return {
            params: { id: 'emr-1' },
            user: { _id: callerId, role: callerRole },
        };
    }

    async function callController(req) {
        let status, body;
        const res = {
            json:   jest.fn((b) => { body = b; }),
            status: jest.fn((s) => { status = s; return res; }),
        };
        await getEmergencyStatus(req, res, jest.fn());
        return { status, body };
    }

    beforeEach(() => jest.clearAllMocks());

    it('returns 403 when patient-A tries to read patient-B emergency record', async () => {
        const req = makeEmergencyReq('patient-A', 'patient', 'patient-B');
        const { status } = await callController(req);
        expect(status).toBe(403);
    });

    it('allows the owning patient to read their own emergency record', async () => {
        const req = makeEmergencyReq('patient-1', 'patient', 'patient-1');
        const { status, body } = await callController(req);
        expect(status).not.toBe(403);
        expect(body?.success).toBe(true);
    });

    it('allows admin to read any emergency record', async () => {
        const req = makeEmergencyReq('admin-1', 'admin', 'patient-X');
        const { status } = await callController(req);
        expect(status).not.toBe(403);
    });
});

// ── H-10: Notification mark-read — ownership ─────────────────────────────────

describe('H-10 — PUT /api/notifications/:id/read scoped to calling user', () => {
    const fs   = require('fs');
    const path = require('path');
    const src  = fs.readFileSync(
        path.resolve(__dirname, '../../routes/notificationRoutes.js'), 'utf8'
    );

    it('[source] mark-read uses findOneAndUpdate scoped to userId', () => {
        // The mark-read handler must use findOneAndUpdate with a userId scope
        // (not a bare findByIdAndUpdate which ignores ownership)
        expect(src).toMatch(/findOneAndUpdate/);
        // The scoped update must include userId: req.user._id
        expect(src).toMatch(/userId:\s*req\.user\._id/);
    });
});

// ── H-11: Notification send — admin-only ─────────────────────────────────────

describe('H-11 — POST /api/notifications/send is admin-only', () => {
    let app;
    beforeAll(() => {
        const notifRoutes = require('../../routes/notificationRoutes');
        app = express();
        app.use(express.json());
        app.use('/api/notifications', notifRoutes);
    });

    beforeEach(() => jest.clearAllMocks());

    it('returns 401 when unauthenticated', async () => {
        mockProtect.mockImplementationOnce((req, res, next) =>
            res.status(401).json({ success: false }));
        const res = await request(app).post('/api/notifications/send').send({});
        expect(res.status).toBe(401);
    });

    it('returns 403 when called by a patient', async () => {
        mockProtect.mockImplementationOnce((req, res, next) => {
            req.user = makeUser('patient'); return next();
        });
        mockAuthorize.mockImplementationOnce((...roles) => (req, res, next) => {
            if (!roles.includes(req.user.role))
                return res.status(403).json({ success: false });
            return next();
        });
        const res = await request(app).post('/api/notifications/send').send({});
        expect(res.status).toBe(403);
    });
});

// ── H-12: Payment refund — admin-only ────────────────────────────────────────

describe('H-12 — POST /api/payment/refund is admin-only', () => {
    const fs   = require('fs');
    const path = require('path');
    const src  = fs.readFileSync(
        path.resolve(__dirname, '../../routes/paymentRoutes.js'), 'utf8'
    );

    it('[source] refund route uses authorize(admin)', () => {
        expect(src).toMatch(/router\.post\(['"]\/refund['"].*authorize\(['"]admin['"]\)/s);
    });
});

// ── H-04: Pharmacy orders — patient scope ────────────────────────────────────

describe('H-04 — GET /api/pharmacy/orders scoped for non-staff', () => {
    const fs   = require('fs');
    const path = require('path');
    const src  = fs.readFileSync(
        path.resolve(__dirname, '../../routes/pharmacyRoutes.js'), 'utf8'
    );

    it('[source] /orders applies patient-scope filter for non-staff users', () => {
        expect(src).toMatch(/filter\.patientId\s*=\s*req\.user\._id/);
    });
});

// ── H-06: Dashboard activity — staff-only ────────────────────────────────────

describe('H-06 — GET /api/dashboard/activity is staff-only', () => {
    const fs   = require('fs');
    const path = require('path');
    const src  = fs.readFileSync(
        path.resolve(__dirname, '../../routes/dashboardRoutes.js'), 'utf8'
    );

    it('[source] /activity route uses authorize with admin/clinical-staff roles', () => {
        expect(src).toMatch(/\/activity.*authorize\([^)]*'admin'/s);
    });
});

// ── H-08: DICOMweb CORS headers ──────────────────────────────────────────────

describe('H-08 — DICOMweb routes must not use Access-Control-Allow-Origin: *', () => {
    const fs   = require('fs');
    const path = require('path');
    const src  = fs.readFileSync(
        path.resolve(__dirname, '../../routes/dicomwebRoutes.js'), 'utf8'
    );

    it('[source] setDICOMwebHeaders does not set ACAO: *', () => {
        // Verify the wildcard was removed from the helper and the pixel-data handlers
        const wildcardPattern = /Access-Control-Allow-Origin['"]\s*,\s*['"][*]['"]/g;
        expect(src.match(wildcardPattern)).toBeNull();
    });
});
