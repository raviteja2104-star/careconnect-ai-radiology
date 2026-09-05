/**
 * LabIntake — consumes 'LabOrdered' events from the EMR and turns them into
 * LabWorkItem work items for the LIS worklist.
 *
 * Per order (idempotent on orderId → clinicalOrderId):
 *   1. Scaffold tests[] from the billable catalogue by case-insensitive
 *      name/code match:
 *        - panel match  → memberCodes expand into the member labTests as
 *          the panel's parameters
 *        - plain test   → a single parameters entry for itself
 *        - unmatched    → free-text parameter (still resultable)
 *   2. Create the LabWorkItem (status ORDERED).
 *   3. Publish 'LabSampleAwaited' for phlebotomy/collection queues.
 *
 * Consumes:  'LabOrdered'
 * Publishes: 'LabSampleAwaited'
 */

'use strict';

const { EventBus } = require('./EventBus');
const EventPublisher = require('./EventPublisher');
const LabWorkItem = require('../models/LabWorkItem');

function tryRequire(path) {
    try { return require(path); } catch (err) { return null; }
}

const catalog = tryRequire('../data/billableCatalog') || {};
const LAB_TESTS = Array.isArray(catalog.labTests) ? catalog.labTests : [];
const PANELS = Array.isArray(catalog.panels) ? catalog.panels : [];

const fold = (v) => String(v == null ? '' : v).trim().toLowerCase();

const TESTS_BY_CODE = new Map(LAB_TESTS.map((t) => [fold(t.code), t]));
const TESTS_BY_NAME = new Map(LAB_TESTS.map((t) => [fold(t.name), t]));
const PANELS_BY_KEY = new Map();
for (const p of PANELS) {
    PANELS_BY_KEY.set(fold(p.code), p);
    PANELS_BY_KEY.set(fold(p.name), p);
}

/** Build one tests[] scaffold entry from an ordered test name. */
function buildTestScaffold(orderedName) {
    const key = fold(orderedName);

    const panel = PANELS_BY_KEY.get(key);
    if (panel) {
        const members = (panel.memberCodes || []).map((code) => TESTS_BY_CODE.get(fold(code)) || null);
        const parameters = members.map((m, i) =>
            m
                ? { name: m.name, unit: m.unit, flag: null }
                : { name: panel.memberCodes[i], flag: null } // unknown member code → free parameter
        );
        const firstMember = members.find(Boolean);
        return {
            code: panel.code,
            name: panel.name,
            specimen: firstMember ? firstMember.specimen : undefined,
            parameters,
        };
    }

    const test = TESTS_BY_NAME.get(key) || TESTS_BY_CODE.get(key);
    if (test) {
        return {
            code: test.code,
            name: test.name,
            specimen: test.specimen,
            parameters: [{ name: test.name, unit: test.unit, flag: null }],
        };
    }

    // Unmatched free-text order — keep it workable with a free parameter.
    const name = String(orderedName || '').trim() || 'Unspecified test';
    return { name, parameters: [{ name, flag: null }] };
}

class LabIntake {
    constructor() {
        this.initialized = false;
    }

    /** Register event subscriptions. Idempotent. */
    init() {
        if (this.initialized) return this;
        EventBus.on('LabOrdered', (envelope) => {
            this.handleLabOrdered(envelope).catch((err) => {
                console.error('[LabIntake] Failed to process LabOrdered:', err.message);
            });
        });
        this.initialized = true;
        console.log('[LabIntake] Subscribed to LabOrdered');
        return this;
    }

    async handleLabOrdered(envelope) {
        const { data = {}, meta = {} } = envelope || {};
        if (data.category && data.category !== 'lab') return null;
        if (!data.orderId || !data.patientId) return null;

        const traceId = meta.traceId;
        const tenantId = meta.tenantId || 't-default';

        // Idempotency: one LabWorkItem per originating ClinicalOrder.
        const existing = await LabWorkItem.findOne({ clinicalOrderId: data.orderId });
        if (existing) {
            console.log(`[LabIntake] LabOrdered replay for order ${data.orderId} — work item ${existing.labNumber} already exists`);
            return existing;
        }

        const orderedTests = Array.isArray(data.details?.tests) ? data.details.tests : [];
        const tests = orderedTests
            .map((t) => (typeof t === 'string' ? t : t?.name))
            .filter((n) => n != null && String(n).trim() !== '')
            .map(buildTestScaffold);

        const item = await LabWorkItem.create({
            clinicalOrderId: data.orderId,
            encounterId: data.encounterId,
            patientId: data.patientId,
            orderingDoctorId: data.orderingDoctorId,
            tenantId,
            priority: data.priority || 'routine',
            status: 'ORDERED',
            tests,
            traceId,
            auditTrail: [{ action: 'WORK_ITEM_CREATED', by: 'system', note: `From order ${data.orderCode || data.orderId}` }],
        });

        await EventPublisher.publish({
            eventType: 'LabSampleAwaited',
            aggregateId: item._id,
            tenantId,
            traceId,
            payload: {
                workItemId: item._id,
                labNumber: item.labNumber,
                clinicalOrderId: item.clinicalOrderId,
                encounterId: item.encounterId,
                patientId: item.patientId,
                priority: item.priority,
                tests: item.tests.map((t) => t.name),
            },
            recipient: { channel: 'INTERNAL' },
        });

        console.log(`[LabIntake] Work item ${item.labNumber} created for order ${data.orderCode || data.orderId} (${tests.length} test(s))`);
        return item;
    }
}

module.exports = new LabIntake();
