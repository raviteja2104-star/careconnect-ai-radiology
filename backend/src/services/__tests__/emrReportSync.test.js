jest.mock('../../models/ClinicalOrder', () => ({ findById: jest.fn() }), { virtual: false });
jest.mock('../../models/Notification', () => ({ insertMany: jest.fn().mockResolvedValue([]) }));
jest.mock('../EventPublisher', () => ({ publish: jest.fn().mockResolvedValue({}) }));

const ClinicalOrder = require('../../models/ClinicalOrder');
const Notification = require('../../models/Notification');
const EventPublisher = require('../EventPublisher');
const EmrReportSync = require('../EmrReportSync');

const basePayload = {
    studyId: 'study-1',
    accessionNumber: 'ACC-20260811-TEST',
    clinicalOrderId: 'order-1',
    patientId: 'patient-1',
    signedBy: 'radiologist-1',
    impression: 'No acute intracranial abnormality.',
};

function makeOrder(status = 'in_progress') {
    return {
        status,
        orderingDoctorId: 'doctor-1',
        resultRef: undefined,
        auditTrail: [],
        save: jest.fn().mockResolvedValue(true),
    };
}

beforeEach(() => jest.clearAllMocks());

describe('EmrReportSync.handleReportSigned', () => {
    test('completes the order, notifies doctor and patient, publishes PatientNotified', async () => {
        const order = makeOrder('in_progress');
        ClinicalOrder.findById.mockResolvedValue(order);

        await EmrReportSync.handleReportSigned(basePayload, 'trace-1');

        expect(order.status).toBe('completed');
        expect(order.resultRef).toEqual({ model: 'RadiologyStudy', id: 'study-1' });
        expect(order.auditTrail).toHaveLength(1);
        expect(order.save).toHaveBeenCalled();

        expect(Notification.insertMany).toHaveBeenCalledTimes(1);
        const notes = Notification.insertMany.mock.calls[0][0];
        expect(notes).toHaveLength(2);
        expect(notes.map((n) => n.userId)).toEqual(['doctor-1', 'patient-1']);
        expect(notes[0].type).toBe('report_approved');
        expect(notes[1].type).toBe('report_reviewed');

        expect(EventPublisher.publish).toHaveBeenCalledWith(
            expect.objectContaining({ eventType: 'PatientNotified', traceId: 'trace-1' })
        );
    });

    test('is idempotent: already-completed order triggers no notifications or events', async () => {
        ClinicalOrder.findById.mockResolvedValue(makeOrder('completed'));

        await EmrReportSync.handleReportSigned(basePayload, 'trace-2');

        expect(Notification.insertMany).not.toHaveBeenCalled();
        expect(EventPublisher.publish).not.toHaveBeenCalled();
    });

    test('still notifies the patient when no clinical order is linked', async () => {
        await EmrReportSync.handleReportSigned({ ...basePayload, clinicalOrderId: undefined }, 'trace-3');

        expect(ClinicalOrder.findById).not.toHaveBeenCalled();
        const notes = Notification.insertMany.mock.calls[0][0];
        expect(notes).toHaveLength(1);
        expect(notes[0].userId).toBe('patient-1');
        expect(EventPublisher.publish).toHaveBeenCalled();
    });

    test('ignores events without a studyId', async () => {
        await EmrReportSync.handleReportSigned({}, 'trace-4');
        expect(Notification.insertMany).not.toHaveBeenCalled();
        expect(EventPublisher.publish).not.toHaveBeenCalled();
    });
});
