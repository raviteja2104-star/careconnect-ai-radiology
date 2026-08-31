jest.mock('../../models/Emergency', () => ({
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    distinct: jest.fn(),
    findByIdAndUpdate: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../models/Notification', () => ({ insertMany: jest.fn().mockResolvedValue([]) }));
jest.mock('../../models/User', () => ({ find: jest.fn().mockResolvedValue([]) }));
jest.mock('../EventPublisher', () => ({ publish: jest.fn().mockResolvedValue({}) }));
jest.mock('../EventBus', () => ({
    EventBus: { on: jest.fn(), emit: jest.fn() },
    emitEvent: jest.fn(),
}));

const Emergency = require('../../models/Emergency');
const Notification = require('../../models/Notification');
const User = require('../../models/User');
const EventPublisher = require('../EventPublisher');
const { emitEvent } = require('../EventBus');
const EVENTS = require('../../config/events');
const orchestrator = require('../EmergencyOrchestrator');

function makeEmergency(overrides = {}) {
    return {
        _id: 'em-1',
        patientId: 'patient-1',
        priority: 'critical',
        status: 'triggered',
        description: 'chest pain',
        notes: '',
        save: jest.fn().mockResolvedValue(true),
        ...overrides,
    };
}

function triggerEvent(data) {
    return {
        eventName: EVENTS.EMERGENCY_TRIGGERED,
        data,
        meta: { traceId: 'trace-em-1', origin: 'AIDecisionEngine' },
    };
}

beforeEach(() => {
    jest.clearAllMocks();
    Emergency.findByIdAndUpdate.mockResolvedValue({});
    Notification.insertMany.mockResolvedValue([]);
    User.find.mockResolvedValue([]);
    EventPublisher.publish.mockResolvedValue({});
});

describe('EmergencyOrchestrator', () => {
    test('dispatch selects the first available ambulance, skipping busy units', async () => {
        const emergency = makeEmergency();
        Emergency.findById.mockResolvedValue(emergency);
        Emergency.distinct.mockResolvedValue(['AMB-101']); // AMB-101 is on another emergency
        User.find.mockResolvedValue([{ _id: 'user-emergency-1' }]);

        await orchestrator.handleEmergency(triggerEvent({
            patientId: 'patient-1',
            emergencyId: 'em-1',
            reason: 'AI_CRITICAL_SYMPTOMS',
            autoDispatch: true,
        }));

        // Busy unit skipped, next pool unit selected and persisted on the doc
        expect(emergency.assignedAmbulance.vehicleId).toBe('AMB-102');
        expect(emergency.assignedAmbulance.eta).toEqual(expect.any(Number));
        expect(emergency.status).toBe('dispatched');
        expect(emergency.save).toHaveBeenCalled();

        // AMBULANCE_DISPATCHED emitted with an honest, flagged estimate
        expect(emitEvent).toHaveBeenCalledWith(
            EVENTS.AMBULANCE_DISPATCHED,
            expect.objectContaining({
                emergencyId: 'em-1',
                patientId: 'patient-1',
                ambulanceId: 'AMB-102',
                etaIsEstimate: true,
            }),
            expect.objectContaining({ origin: 'EmergencyOrchestrator', traceId: 'trace-em-1' })
        );

        // Patient + emergency-role user notified
        expect(Notification.insertMany).toHaveBeenCalledTimes(1);
        const notes = Notification.insertMany.mock.calls[0][0];
        expect(notes.map((n) => n.userId)).toEqual(['patient-1', 'user-emergency-1']);
        expect(notes.every((n) => n.type === 'emergency_update')).toBe(true);

        // Hospital alerted with the default hospital (doc has none recorded)
        expect(emitEvent).toHaveBeenCalledWith(
            EVENTS.HOSPITAL_ALERTED,
            expect.objectContaining({
                emergencyId: 'em-1',
                hospital: expect.objectContaining({ name: 'CareConnect City Hospital' }),
            }),
            expect.anything()
        );

        // No failure event on the happy path
        expect(EventPublisher.publish).not.toHaveBeenCalled();
    });

    test('failure path: no ambulance available sets dispatch_failed and publishes EmergencySagaFailed', async () => {
        const emergency = makeEmergency();
        Emergency.findById.mockResolvedValue(emergency);
        // Every pool unit is busy on other active emergencies
        Emergency.distinct.mockResolvedValue(['AMB-101', 'AMB-102', 'AMB-103']);

        await orchestrator.handleEmergency(triggerEvent({
            patientId: 'patient-1',
            emergencyId: 'em-1',
            reason: 'AI_CRITICAL_SCAN_FINDING',
            autoDispatch: true,
        }));

        // Compensating status update
        expect(Emergency.findByIdAndUpdate).toHaveBeenCalledWith('em-1', {
            $set: expect.objectContaining({ status: 'dispatch_failed' }),
        });

        // Saga failure surfaced internally
        expect(EventPublisher.publish).toHaveBeenCalledWith(expect.objectContaining({
            eventType: 'EmergencySagaFailed',
            aggregateId: 'em-1',
            payload: expect.objectContaining({
                sagaStep: 'dispatchAmbulance',
                emergencyId: 'em-1',
                patientId: 'patient-1',
                compensated: true,
            }),
            recipient: { channel: 'INTERNAL' },
        }));

        // Hospital is never alerted when dispatch failed
        expect(emitEvent).not.toHaveBeenCalledWith(EVENTS.HOSPITAL_ALERTED, expect.anything(), expect.anything());
    });

    test('creates an Emergency doc when the trigger has no existing record', async () => {
        Emergency.findOne.mockResolvedValue(null);
        const created = makeEmergency({ _id: 'em-new' });
        Emergency.create.mockResolvedValue(created);
        Emergency.distinct.mockResolvedValue([]);

        await orchestrator.handleEmergency(triggerEvent({
            patientId: 'patient-2',
            reason: 'AI_CRITICAL_SYMPTOMS',
            autoDispatch: true,
        }));

        expect(Emergency.create).toHaveBeenCalledWith(expect.objectContaining({
            patientId: 'patient-2',
            status: 'triggered',
            priority: 'critical',
            location: expect.objectContaining({ coordinates: [0, 0] }),
        }));
        expect(created.status).toBe('dispatched');
        expect(created.assignedAmbulance.vehicleId).toBe('AMB-101');
    });

    test('lockResources failure publishes EmergencySagaFailed and stops the saga', async () => {
        Emergency.findById.mockRejectedValue(new Error('db down'));

        await orchestrator.handleEmergency(triggerEvent({
            patientId: 'patient-1',
            emergencyId: 'em-1',
            reason: 'AI_CRITICAL_SYMPTOMS',
            autoDispatch: true,
        }));

        expect(EventPublisher.publish).toHaveBeenCalledWith(expect.objectContaining({
            eventType: 'EmergencySagaFailed',
            payload: expect.objectContaining({
                sagaStep: 'lockResources',
                error: 'db down',
                compensated: false,
            }),
            recipient: { channel: 'INTERNAL' },
        }));
        expect(emitEvent).not.toHaveBeenCalled();
        expect(Notification.insertMany).not.toHaveBeenCalled();
    });

    test('AMBULANCE_POOL env override replaces the default pool', () => {
        jest.resetModules();
        process.env.AMBULANCE_POOL = JSON.stringify([
            { vehicleId: 'AMB-900', driverName: 'Env Driver', driverPhone: '+1-555-0000' },
        ]);
        try {
            const freshOrchestrator = require('../EmergencyOrchestrator');
            expect(freshOrchestrator.ambulancePool).toEqual([
                { vehicleId: 'AMB-900', driverName: 'Env Driver', driverPhone: '+1-555-0000' },
            ]);
        } finally {
            delete process.env.AMBULANCE_POOL;
            jest.resetModules();
        }
    });
});
