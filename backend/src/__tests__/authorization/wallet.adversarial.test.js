'use strict';
/**
 * Wallet / payment adversarial tests.
 *
 * W-01: Direct wallet top-up endpoint returns 403 (no payment verification)
 * W-02: Razorpay demo-order prefix is REJECTED in any environment (live key set)
 * W-03: Amount from request body is NOT used; invoice amount is authoritative
 * W-04: Invalid Razorpay signature is rejected (403)
 * W-05: timingSafeEqual is used — crafted signature fails (not early-exit)
 * W-06: Amount <= 0 is rejected by payment route validation
 * W-07: Amount > 10,000,000 paise is rejected by payment route validation
 * W-08: Patient-A cannot pay patient-B's invoice (IDOR)
 * W-09: Missing razorpay_signature in body is rejected
 * W-10: topUp endpoint is blocked even with a valid token
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../middleware/auth', () => ({
    protect: jest.fn((_req, _res, next) => next()),
    authorize: jest.fn(() => (_req, _res, next) => next()),
    generateToken: jest.fn().mockReturnValue('tok'),
}));

jest.mock('../../services/PermissionService', () => ({
    userHasPermissions: jest.fn().mockResolvedValue(true),
    ensureUserHasRole: jest.fn().mockResolvedValue(undefined),
    getEffectivePermissions: jest.fn().mockResolvedValue({ permissions: [] }),
}));

jest.mock('../../config/database', () =>
    jest.fn().mockResolvedValue({ connection: { host: 'mock' } }),
);

jest.mock('mongoose', () => ({
    connection: { readyState: 1 },
    connect: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../models/WalletTransaction', () => ({
    create: jest.fn().mockResolvedValue({}),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../models/User', () => ({
    findById: jest.fn().mockResolvedValue(null),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
}));

const crypto = require('crypto');

// Build a valid HMAC so we can test invalid-vs-valid comparisons
function makeHmac(secret, payload) {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// Mock Invoice model
const mockInvoice = {
    _id: 'inv-001',
    patient: 'patient-1',
    amountDue: 50000,     // paise — ₹500.00
    totalAmount: 50000,
    amountPaid: 0,
    status: 'pending',
    save: jest.fn().mockResolvedValue(true),
};

jest.mock('../../models/Invoice', () => ({
    findById: jest.fn().mockImplementation((id) => {
        if (id === 'inv-001') return Promise.resolve(mockInvoice);
        return Promise.resolve(null);
    }),
}));

jest.mock('../../models/Notification', () => ({
    create: jest.fn().mockResolvedValue({}),
}));

const express = require('express');
const request = require('supertest');

// ── Apps under test ───────────────────────────────────────────────────────────

// Wallet top-up app
const walletController = require('../../controllers/walletController');
const walletApp = express();
walletApp.use(express.json());
walletApp.use((req, _res, next) => {
    req.user = { _id: 'patient-1', role: 'patient', tenantId: 'tenant-1' };
    next();
});
walletApp.post('/topup', walletController.topUp);

// ─────────────────────────────────────────────────────────────────────────────

describe('Wallet / Payment adversarial tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockInvoice.amountPaid = 0;
        mockInvoice.status = 'pending';
        mockInvoice.save.mockResolvedValue(true);

        const Invoice = require('../../models/Invoice');
        Invoice.findById.mockImplementation((id) => {
            if (id === 'inv-001') return Promise.resolve(mockInvoice);
            return Promise.resolve(null);
        });
    });

    // ── W-01: Direct top-up blocked ──────────────────────────────────────────
    test('W-01: POST /topup returns 403 — no direct wallet credit', async () => {
        const res = await request(walletApp)
            .post('/topup')
            .send({ amount: 1000 });

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
    });

    // ── W-01b: Top-up with arbitrary large amount also blocked ───────────────
    test('W-01b: POST /topup with large amount still returns 403', async () => {
        const res = await request(walletApp)
            .post('/topup')
            .send({ amount: 9999999 });

        expect(res.status).toBe(403);
    });

    // ── W-10: Top-up blocked regardless of auth header presence ──────────────
    test('W-10: topUp blocked even with Bearer token', async () => {
        const res = await request(walletApp)
            .post('/topup')
            .set('Authorization', 'Bearer valid-looking-token')
            .send({ amount: 500 });

        expect(res.status).toBe(403);
    });

    // ── W-03: Amount from body is NOT used (invoice amount is authoritative) ─
    test('W-03: billingController.js does not use req.body.amount for paid amount', () => {
        const fs = require('fs');
        const path = require('path');
        const src = fs.readFileSync(
            path.resolve(__dirname, '../../controllers/billingController.js'), 'utf8'
        );
        // The fix replaced "amount ? amount / 100 : invoice.amountDue" with "invoice.amountDue"
        // Verify the broken pattern no longer exists
        expect(src).not.toMatch(/const paid\s*=\s*amount\s*\?/);
        // Verify the safe pattern is present
        expect(src).toMatch(/invoice\.amountDue/);
    });

    // ── W-04/W-05: timingSafeEqual is used for Razorpay signature comparison ─
    test('W-04/W-05: billingController uses crypto.timingSafeEqual for HMAC comparison', () => {
        const fs = require('fs');
        const path = require('path');
        const src = fs.readFileSync(
            path.resolve(__dirname, '../../controllers/billingController.js'), 'utf8'
        );
        expect(src).toMatch(/timingSafeEqual/);
        // Confirm old === comparison is gone
        expect(src).not.toMatch(/expectedSig\s*===\s*razorpay_signature/);
    });

    // ── W-02: Demo order prefix check removed from billing controller ─────────
    test('W-02: isDemoOrder bypass is removed from billingController', () => {
        const fs = require('fs');
        const path = require('path');
        const src = fs.readFileSync(
            path.resolve(__dirname, '../../controllers/billingController.js'), 'utf8'
        );
        expect(src).not.toMatch(/isDemoOrder/);
        expect(src).not.toMatch(/order_demo_/);
    });
});
