/**
 * Production smoke tests (pre-cutover) — run against the Green environment
 * before traffic switch. Uses Node's built-in test runner (node >= 20):
 *
 *   npm run test:release:smoke        (from repo root)
 *   TARGET_URL=https://green.example.com/api npm run test:release:smoke
 *
 * These verify the surface a load balancer and a first user would touch:
 * health probe truthfulness, auth gating on PHI, and public kiosk/display
 * endpoints reaching their handlers.
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const BASE = (process.env.TARGET_URL || 'http://localhost:5000/api').replace(/\/$/, '');

async function get(path) {
    const res = await fetch(`${BASE}${path}`, { headers: { 'x-tenant-id': 't-smoke-test' } });
    let body = null;
    try { body = await res.json(); } catch { /* non-JSON is fine for some probes */ }
    return { status: res.status, body };
}

test('health probe responds and reports real service state', async () => {
    const { status, body } = await get('/health');
    assert.equal(status, 200, 'API /health must be reachable');
    assert.equal(body.success, true);
    assert.ok(body.services, 'health payload exposes services block');
});

test('system health reflects database state honestly (no hardcoded literals)', async () => {
    const { status, body } = await get('/system/health');
    // 200 healthy or 503 degraded are both valid — a lying 200 with
    // database:'connected' while Mongo is down is the failure mode we test against.
    assert.ok([200, 503].includes(status), `unexpected status ${status}`);
    const db = body?.data?.services?.database;
    assert.ok(['connected', 'connecting', 'disconnected', 'disconnecting', 'unknown'].includes(db),
        `database state must be a probed value, got: ${db}`);
    if (status === 200) assert.equal(db, 'connected');
});

test('PHI endpoints are auth-gated (401 without token)', async () => {
    for (const path of ['/emr/orders', '/billing/invoices', '/teleradiology/worklist']) {
        const { status } = await get(path);
        assert.equal(status, 401, `${path} must reject unauthenticated requests`);
    }
});

test('public queue display read reaches its handler', async () => {
    const { status } = await get('/queue/OPD');
    // 200 with data when Mongo is up; 500 from the handler when Mongo is down.
    // Anything but 401/403/404 proves the route is public and wired.
    assert.ok(![401, 403, 404].includes(status), `queue display read returned ${status}`);
});

test('booking rejects unauthenticated writes', async () => {
    const res = await fetch(`${BASE}/appointments`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ doctorId: 'DOC-SMOKE', specialty: 'General', date: '2026-01-01', timeSlot: '10:00' }),
    });
    assert.ok([401, 400].includes(res.status), `unauthenticated booking must not 201, got ${res.status}`);
});
