'use strict';
/**
 * Security regression tests — server.js inline routes
 *
 * C-03: GET /api/health must NOT expose mongodb_uri_prefix, jwt_secret_set,
 *       environment, or database_error.
 *
 * C-04: POST /api/ai/analyze-scan must require authentication (protect).
 *
 * Strategy:
 *  - The route handler logic is tested via a minimal Express app (avoids
 *    the full server.js bootstrap which pulls in dozens of services).
 *  - In addition, source-level assertions verify that the banned fields can
 *    never be silently re-introduced in server.js without failing a test.
 */

jest.mock('../../middleware/auth', () => ({
    protect: jest.fn((req, res, next) => {
        if (req.__mockUser) { req.user = req.__mockUser; return next(); }
        return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }),
    authorize: jest.fn(() => (req, res, next) => next()),
}));

jest.mock('../../services/PermissionService', () => ({
    userHasPermissions:      jest.fn().mockResolvedValue(true),
    getEffectivePermissions: jest.fn().mockResolvedValue([]),
    ensureUserHasRole:       jest.fn().mockResolvedValue(undefined),
}));

const fs      = require('fs');
const path    = require('path');
const express = require('express');
const request = require('supertest');

const SERVER_SRC = path.resolve(__dirname, '../../server.js');
const serverSrc  = fs.readFileSync(SERVER_SRC, 'utf8');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildHealthApp() {
    const app = express();
    app.use(express.json());

    // Health route — mirrors the post-fix handler in server.js
    app.get('/api/health', async (_req, res) => {
        res.json({
            success: true,
            message: 'CareConnect API is running',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            services: {
                database: 'disconnected',
                ai: process.env.AI_SERVICE_URL ? 'connected' : 'not_configured',
            },
        });
    });
    return app;
}

function buildAiApp() {
    const { protect } = require('../../middleware/auth');
    const app = express();
    app.use(express.json());

    // analyze-scan route — mirrors the post-fix handler in server.js
    app.post('/api/ai/analyze-scan', protect, (_req, res) => {
        res.status(503).json({ success: false, message: 'AI service unavailable' });
    });
    return app;
}

// ── C-03: /api/health credential leak ────────────────────────────────────────

describe('C-03 — GET /api/health must not leak credentials', () => {
    let healthApp;
    beforeAll(() => { healthApp = buildHealthApp(); });

    it('responds 200 with database + ai service status', async () => {
        const res = await request(healthApp).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.services).toHaveProperty('database');
    });

    it('does NOT include mongodb_uri_prefix in the response', async () => {
        const res = await request(healthApp).get('/api/health');
        expect(JSON.stringify(res.body)).not.toMatch(/mongodb_uri_prefix/);
    });

    it('does NOT include jwt_secret_set in the response', async () => {
        const res = await request(healthApp).get('/api/health');
        expect(JSON.stringify(res.body)).not.toMatch(/jwt_secret_set/);
    });

    it('does NOT expose the environment (NODE_ENV) field', async () => {
        const res = await request(healthApp).get('/api/health');
        expect(res.body).not.toHaveProperty('environment');
    });

    it('does NOT expose database_error field', async () => {
        const res = await request(healthApp).get('/api/health');
        expect(res.body.services).not.toHaveProperty('database_error');
    });

    // Source-level guard: prevents silent re-introduction in server.js
    it('[source] server.js health response does not contain mongodb_uri_prefix', () => {
        // Count occurrences — the string may appear in comments, but the
        // key test is that it does not appear as a response field assignment.
        const assignmentPattern = /mongodb_uri_prefix\s*:/g;
        expect(serverSrc.match(assignmentPattern)).toBeNull();
    });

    it('[source] server.js health response does not contain jwt_secret_set', () => {
        const assignmentPattern = /jwt_secret_set\s*:/g;
        expect(serverSrc.match(assignmentPattern)).toBeNull();
    });
});

// ── C-04: /api/ai/analyze-scan must require auth ─────────────────────────────

describe('C-04 — POST /api/ai/analyze-scan must require authentication', () => {
    let aiApp;
    beforeAll(() => { aiApp = buildAiApp(); });

    it('returns 401 with no authentication', async () => {
        const res = await request(aiApp)
            .post('/api/ai/analyze-scan')
            .send({ imageId: 'scan-001' });
        expect(res.status).toBe(401);
    });

    it('returns 401 for a fabricated Bearer token (no verified user)', async () => {
        const res = await request(aiApp)
            .post('/api/ai/analyze-scan')
            .set('Authorization', 'Bearer garbage_token_xxxxxx')
            .send({ imageId: 'scan-001' });
        expect(res.status).toBe(401);
    });

    it('proceeds past auth when an authenticated user is present', async () => {
        const { protect } = require('../../middleware/auth');
        protect.mockImplementationOnce((req, res, next) => {
            req.user = { _id: 'radiologist-1', role: 'radiologist' };
            return next();
        });
        const res = await request(aiApp)
            .post('/api/ai/analyze-scan')
            .send({ imageId: 'scan-001' });
        // Handler returns 503 (AI service down in tests) — important: NOT 401
        expect(res.status).not.toBe(401);
    });

    // Source-level guard: protect must appear before the handler on the route
    it('[source] server.js analyze-scan route includes protect middleware', () => {
        // The route should be: app.post('/api/ai/analyze-scan', protect, ...)
        expect(serverSrc).toMatch(/app\.post\(['"]\/api\/ai\/analyze-scan['"],\s*protect/);
    });
});

// ── C-05: /uploads static serving must require auth ──────────────────────────

describe('C-05 — GET /uploads/* must require authentication', () => {
    let uploadsApp;
    beforeAll(() => {
        const { protect: mockP } = require('../../middleware/auth');
        const staticPath = require('path').join(__dirname, '..', '..', '..', 'uploads');
        uploadsApp = express();
        uploadsApp.use(express.json());
        // Mirror the post-fix registration in server.js
        uploadsApp.use('/uploads', mockP, express.static(staticPath));
    });

    it('returns 401 when requesting a file without authentication', async () => {
        const res = await request(uploadsApp).get('/uploads/general/avatar.jpg');
        expect(res.status).toBe(401);
    });

    it('returns 401 for a request with a fabricated Bearer token', async () => {
        const res = await request(uploadsApp)
            .get('/uploads/pacs/patient-1/CT/2024-01-01/scan.dcm')
            .set('Authorization', 'Bearer fake_token');
        expect(res.status).toBe(401);
    });

    // Source-level guard: express.static on /uploads must be guarded by protect
    it('[source] server.js /uploads route includes protect before express.static', () => {
        // Must match: app.use('/uploads', protect, express.static(
        expect(serverSrc).toMatch(/app\.use\(['"]\/uploads['"],\s*protect,\s*express\.static/);
    });
});
