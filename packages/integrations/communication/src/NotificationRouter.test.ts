import { NotificationRouter } from './NotificationRouter';
import { TemplateEngine } from './TemplateEngine';
import { DeliveryTracker } from './DeliveryTracker';
import { MockSmsProvider } from './providers/sms/mock';
import { NotificationIntent } from './types';

describe('NotificationRouter', () => {
  let router: NotificationRouter;
  let templateEngine: TemplateEngine;
  let tracker: DeliveryTracker;

  beforeEach(() => {
    templateEngine = new TemplateEngine();
    tracker = new DeliveryTracker();
    router = new NotificationRouter(templateEngine, tracker);
    
    // Register mock provider
    router.registerProvider(new MockSmsProvider());
  });

  it('should route and send an SMS notification using defaults when no preferences specified', async () => {
    const intent: NotificationIntent = {
      id: 'intent-001',
      type: 'AppointmentReminder',
      recipient: {
        id: 'patient-123',
        phone: '+15550001234'
      },
      payload: {
        patientName: 'John Doe',
        doctorName: 'Dr. Smith',
        appointmentDate: 'August 10, 2026',
        appointmentTime: '10:00 AM',
        hospitalName: 'HealthCore Main'
      }
    };

    const results = await router.dispatch(intent);
    
    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(true);
    expect(results[0].channel).toBe('sms');
    expect(results[0].status).toBe('delivered');

    // Verify Tracker
    const history = tracker.getHistory('intent-001');
    expect(history).toHaveLength(1);
    expect(history[0].status).toBe('delivered');
  });

  it('should track failure if destination is missing', async () => {
    const intent: NotificationIntent = {
      id: 'intent-002',
      type: 'AppointmentReminder',
      recipient: {
        id: 'patient-124',
        // phone is missing, but SMS is requested via preferences
        preferences: { sms: true, email: false, whatsapp: false, push: false }
      },
      payload: {}
    };

    const results = await router.dispatch(intent);
    
    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(false);
    expect(results[0].status).toBe('failed');
    expect(results[0].error).toBe('Missing destination for channel');
  });
});
