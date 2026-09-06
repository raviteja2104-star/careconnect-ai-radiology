'use strict';
/**
 * Security regression tests — providerEnquiryRoutes.js
 *
 * C-01: PATCH /api/provider-enquiry/:id must require authentication
 * C-02: GET  /api/provider-enquiry/     must require real JWT verification
 *
 * Enforcement chain tested for each protected route:
 *   Unauthenticated                    → 401
 *   Authenticated, wrong permission    → 403
 *   Authenticated, correct permission  → allowed (next() called)
 *
 * Tests run in complete isolation: no HTTP server, no DB, no real JWTs.
 * The protect middleware and PermissionService are both mocked so we test
 * only that the route file correctly chains them — not the middleware internals
 * (those have their own suites in middleware.test.js and attacks.test.js).
 */

// ── Mock protect so we can simulate auth outcomes without real JWTs ──────────
jest.mock('../../middleware/auth', () => {
    const actual = jest.requireActual('../../middleware/auth');
    return {
        ...actual,
        // Override protect: call next() with a synthetic req.user when
        // MOCK_AUTH_USER is set; otherwise simulate 401.
        protect: jest.fn((req, res, next) => {
            if (req.__mockUser) {
                req.user = req.__mockUser;
                return next();
            }
            return res.status(401).json({ success: false, message: 'Not authenticated.' });
        }),
    };
});

jest.mock('../../services/PermissionService', () => ({
    userHasPermissions:      jest.fn(),
    getEffectivePermissions: jest.fn(),
    ensureUserHasRole:       jest.fn().mockResolvedValue(undefined),
}));

const { userHasPermissions } = require('../../services/PermissionService');
const { protect }             = require('../../middleware/auth');
const { permit }              = require('../../middleware/permit');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * mockRes returns a mock response object that also exposes a `done` Promise
 * that resolves when `res.json()` is called. This lets `runChain` resolve
 * even when a middleware terminates the request without calling `next()`.
 */
function mockRes() {
    let resolveDone;
    const done = new Promise(r => { resolveDone = r; });
    const res = { done };
    res.status = jest.fn().mockReturnValue(res);
    res.json   = jest.fn((...args) => { resolveDone(); return res; });
    res.send   = jest.fn((...args) => { resolveDone(); return res; });
    return res;
}

/**
 * Run a middleware chain. Resolves when either:
 *  - all middlewares have called next() → { reached: true }
 *  - a middleware called res.json()/res.send() without next() → { stopped: true }
 *  - a middleware called next(err) → { err }
 */
function runChain(middlewares, req, res) {
    return new Promise((resolve) => {
        // Resolve when response is sent (middleware terminated early)
        res.done.then(() => resolve({ stopped: true }));

        let i = 0;
        const next = (err) => {
            if (err) return resolve({ err });
            if (i < middlewares.length) {
                const mw = middlewares[i++];
                Promise.resolve(mw(req, res, next)).catch(e => resolve({ err: e }));
            } else {
                resolve({ reached: true });
            }
        };
        const first = middlewares[i++];
        Promise.resolve(first(req, res, next)).catch(e => resolve({ err: e }));
    });
}

// The route file uses `protect` and `permit` imported at the top.
// We need to extract just the middleware chain from each route without
// spinning up a full Express app. We do this by loading the router and
// inspecting its stack.

function extractMiddlewaresForMethod(router, method, path) {
    const stack = router.stack || [];
    for (const layer of stack) {
        if (!layer.route) continue;
        const r = layer.route;
        if (r.path !== path) continue;
        const methods = Object.keys(r.methods);
        if (!methods.includes(method.toLowerCase())) continue;
        return r.stack.map(l => l.handle);
    }
    return null;
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('C-01 + C-02: providerEnquiryRoutes security', () => {
    let router;

    beforeAll(() => {
        // Load router fresh (mocks are already in place)
        router = require('../../routes/providerEnquiryRoutes');
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── C-01: PATCH /:id ──────────────────────────────────────────────────────

    describe('C-01 — PATCH /api/provider-enquiry/:id', () => {
        function getChain() {
            // The route is registered as '/:id'; Express normalises it
            const chain = extractMiddlewaresForMethod(router, 'patch', '/:id');
            expect(chain).not.toBeNull(); // fail fast if route disappears
            return chain;
        }

        it('returns 401 when there is no authenticated user (unauthenticated)', async () => {
            const chain = getChain();
            const req = { params: { id: '507f1f77bcf86cd799439011' }, body: { status: 'approved' } };
            const res = mockRes();
            await runChain(chain, req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('returns 403 when authenticated user lacks ADMIN.MANAGE_PROVIDERS', async () => {
            userHasPermissions.mockResolvedValue(false);
            const chain = getChain();
            const req = {
                __mockUser: { _id: 'patient-user-1', role: 'patient' },
                params: { id: '507f1f77bcf86cd799439011' },
                body: { status: 'approved' },
            };
            const res = mockRes();
            await runChain(chain, req, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('proceeds past auth+permit when admin has ADMIN.MANAGE_PROVIDERS', async () => {
            userHasPermissions.mockResolvedValue(true);
            const chain = getChain();
            // Only run auth + permit (first two middlewares), not the handler
            // which would try DB operations.
            const authAndPermit = chain.slice(0, 2);
            const req = {
                __mockUser: { _id: 'admin-1', role: 'admin' },
                params: { id: '507f1f77bcf86cd799439011' },
                body: { status: 'approved' },
            };
            const res = mockRes();
            const result = await runChain(authAndPermit, req, res);
            expect(result.reached).toBe(true);
            expect(res.status).not.toHaveBeenCalled();
        });

        it('does not accept a fabricated Bearer token (no req.user set)', async () => {
            // This directly tests that the old fake-header check is gone:
            // supplying a syntactically valid header without a real JWT should → 401
            const chain = getChain();
            const req = {
                headers: { authorization: 'Bearer fake_garbage_token' },
                params: { id: '507f1f77bcf86cd799439011' },
                body: { status: 'approved' },
                // Deliberately NOT setting __mockUser so protect() → 401
            };
            const res = mockRes();
            await runChain(chain, req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    // ── C-02: GET / ──────────────────────────────────────────────────────────

    describe('C-02 — GET /api/provider-enquiry/', () => {
        function getChain() {
            const chain = extractMiddlewaresForMethod(router, 'get', '/');
            expect(chain).not.toBeNull();
            return chain;
        }

        it('returns 401 when there is no authenticated user (unauthenticated)', async () => {
            const chain = getChain();
            const req = { query: {} };
            const res = mockRes();
            await runChain(chain, req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('returns 401 for a request with a syntactically valid but unverified Bearer token', async () => {
            // The old implementation only checked header presence.
            // The new implementation uses protect(), which our mock only passes
            // when req.__mockUser is set — simulating real JWT verification.
            const chain = getChain();
            const req = {
                headers: { authorization: 'Bearer AAAAAAAAAAAAAAAAAAAAAA' },
                query: {},
                // No __mockUser → protect() will 401
            };
            const res = mockRes();
            await runChain(chain, req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('returns 403 when authenticated user lacks ADMIN.MANAGE_PROVIDERS', async () => {
            userHasPermissions.mockResolvedValue(false);
            const chain = getChain();
            const req = {
                __mockUser: { _id: 'doctor-1', role: 'doctor' },
                query: {},
            };
            const res = mockRes();
            await runChain(chain, req, res);
            expect(res.status).toHaveBeenCalledWith(403);
        });

        it('proceeds past auth+permit when admin has ADMIN.MANAGE_PROVIDERS', async () => {
            userHasPermissions.mockResolvedValue(true);
            const chain = getChain();
            const authAndPermit = chain.slice(0, 2);
            const req = {
                __mockUser: { _id: 'admin-1', role: 'admin' },
                query: {},
            };
            const res = mockRes();
            const result = await runChain(authAndPermit, req, res);
            expect(result.reached).toBe(true);
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    // ── POST / (marketing form) must remain PUBLIC ────────────────────────────

    describe('POST /api/provider-enquiry/ — must remain unauthenticated', () => {
        it('does NOT apply protect middleware to the public POST route', () => {
            const chain = extractMiddlewaresForMethod(router, 'post', '/');
            expect(chain).not.toBeNull();
            // The POST route should have exactly 1 middleware: the handler
            // (no protect, no permit). Guard: if someone accidentally adds auth
            // to the marketing form, this test catches it.
            expect(chain).toHaveLength(1);
            expect(protect).not.toHaveBeenCalled();
        });
    });
});
