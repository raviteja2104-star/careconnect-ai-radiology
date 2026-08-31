jest.mock('../../models/TelemedicineSession', () => ({
    create: jest.fn(),
    findByIdAndUpdate: jest.fn().mockResolvedValue({}),
}));
jest.mock('../EventPublisher', () => ({ publish: jest.fn() }));

const TelemedicineSession = require('../../models/TelemedicineSession');
const EventPublisher = require('../EventPublisher');
const saga = require('../TelemedicineSaga');

const bookedPayload = {
    eventName: 'AppointmentBooked',
    data: { patientName: 'John Doe' },
    meta: {
        aggregateId: 'appt-1',
        tenantId: 't-default',
        traceId: 'trace-1',
        recipient: { id: 'patient-1' },
    },
};

beforeEach(() => {
    jest.clearAllMocks();
    TelemedicineSession.findByIdAndUpdate.mockResolvedValue({});
});

describe('TelemedicineSaga compensation', () => {
    test('cancels the created session and publishes TelemedicineSagaFailed when publish fails after create', async () => {
        TelemedicineSession.create.mockResolvedValue({ _id: 'session-1', roomId: 'tele-room' });
        EventPublisher.publish
            .mockRejectedValueOnce(new Error('outbox unavailable')) // TelemedicineSessionCreated
            .mockResolvedValue({}); // TelemedicineSagaFailed

        await saga.handleAppointmentConfirmed(bookedPayload);

        // Compensation: created session marked CANCELLED
        expect(TelemedicineSession.findByIdAndUpdate).toHaveBeenCalledWith('session-1', { status: 'CANCELLED' });

        // Failure event published internally
        expect(EventPublisher.publish).toHaveBeenCalledTimes(2);
        expect(EventPublisher.publish).toHaveBeenLastCalledWith(expect.objectContaining({
            eventType: 'TelemedicineSagaFailed',
            aggregateId: 'appt-1',
            traceId: 'trace-1',
            payload: expect.objectContaining({
                sagaStep: 'publishSessionCreated',
                appointmentId: 'appt-1',
                sessionId: 'session-1',
                error: 'outbox unavailable',
                compensated: true,
            }),
            recipient: { channel: 'INTERNAL' },
        }));
    });

    test('publishes TelemedicineSagaFailed with compensated:false when session creation itself fails', async () => {
        TelemedicineSession.create.mockRejectedValue(new Error('validation failed'));
        EventPublisher.publish.mockResolvedValue({});

        await saga.handleAppointmentConfirmed(bookedPayload);

        expect(TelemedicineSession.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(EventPublisher.publish).toHaveBeenCalledTimes(1);
        expect(EventPublisher.publish).toHaveBeenCalledWith(expect.objectContaining({
            eventType: 'TelemedicineSagaFailed',
            payload: expect.objectContaining({
                sagaStep: 'createSession',
                appointmentId: 'appt-1',
                sessionId: null,
                error: 'validation failed',
                compensated: false,
            }),
            recipient: { channel: 'INTERNAL' },
        }));
    });

    test('never throws even when the failure event cannot be published', async () => {
        TelemedicineSession.create.mockResolvedValue({ _id: 'session-2' });
        EventPublisher.publish.mockRejectedValue(new Error('outbox down for good'));

        await expect(saga.handleAppointmentConfirmed(bookedPayload)).resolves.toBeUndefined();
        expect(TelemedicineSession.findByIdAndUpdate).toHaveBeenCalledWith('session-2', { status: 'CANCELLED' });
    });

    test('consultation end publishes ConsultationCompleted honestly, with no fabricated summary', async () => {
        EventPublisher.publish.mockResolvedValue({});

        await saga.handleConsultationEnded({
            eventName: 'TelemedicineEnded',
            data: { roomId: 'tele-room', aiSummaryAvailable: false },
            meta: { aggregateId: 'session-3', tenantId: 't-default', traceId: 'trace-2', recipient: { id: 'patient-1' } },
        });

        expect(EventPublisher.publish).toHaveBeenCalledTimes(1);
        expect(EventPublisher.publish).toHaveBeenCalledWith(expect.objectContaining({
            eventType: 'ConsultationCompleted',
            aggregateId: 'session-3',
            payload: { sessionId: 'session-3', aiSummaryAvailable: false },
        }));
        const eventTypes = EventPublisher.publish.mock.calls.map(([arg]) => arg.eventType);
        expect(eventTypes).not.toContain('TelemedicineSummaryGenerated');
    });
});
