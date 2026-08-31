const { EventBus } = require('./EventBus');
require('./TelemedicineSaga'); // Initialize listener
const TelemedicineSession = require('../models/TelemedicineSession');
const EventPublisher = require('./EventPublisher');

jest.mock('../models/TelemedicineSession');
jest.mock('./EventPublisher');

describe('TelemedicineSaga Orchestrator', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('orchestrates session creation on AppointmentBooked', async () => {
    const mockSession = { _id: 'session-123', roomId: 'tele-mock-room' };
    TelemedicineSession.create.mockResolvedValue(mockSession);
    EventPublisher.publish.mockResolvedValue(true);

    const payload = {
      eventName: 'AppointmentBooked',
      data: { patientName: 'John Doe', doctorName: 'Dr. House' },
      meta: { aggregateId: 'appt-123', tenantId: 't-default', traceId: 'trace-123', recipient: { id: 'patient-1' } }
    };

    // Emit event
    EventBus.emit('AppointmentBooked', payload);

    // Wait for async handler
    await new Promise(r => setTimeout(r, 100));

    expect(TelemedicineSession.create).toHaveBeenCalledWith(expect.objectContaining({
      appointment: 'appt-123',
      status: 'SCHEDULED'
    }));

    expect(EventPublisher.publish).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'TelemedicineSessionCreated',
      aggregateId: 'session-123'
    }));
  });
});
