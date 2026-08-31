const request = require('supertest');
const app = require('./index');

describe('Communication Service Integration Tests', () => {

  describe('Service Health', () => {
    it('GET /health returns 200 OK', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('communication-service');
    });

    it('GET /ready returns 200 OK', async () => {
      const res = await request(app).get('/ready');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ready');
    });
  });

  describe('Notification Outbox Flow', () => {
    let intentId = '';

    it('POST /api/internal/events correctly enqueues a notification intent', async () => {
      const payload = {
        eventType: 'AppointmentBooked', // which Maps to 'AppointmentReminder' via standardisation logic later
        recipient: {
          id: 'patient-404',
          phone: '+15559998888',
          email: 'test@patient.com',
          preferences: { sms: true, email: false, whatsapp: false, push: false }
        },
        payload: {
          patientName: 'Jane Smith',
          doctorName: 'Dr. House',
          appointmentDate: 'Sep 01, 2026',
          appointmentTime: '14:30 PM',
          hospitalName: 'HealthCore General'
        }
      };

      const res = await request(app).post('/api/internal/events').send(payload);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Event processed successfully');
      expect(res.body.intentId).toBeDefined();

      // Without provider credentials in the test env, the send is honestly simulated:
      // marked simulated:true and carrying NO fake provider message ID.
      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].channel).toBe('sms');
      expect(res.body.results[0].success).toBe(true);
      expect(res.body.results[0].simulated).toBe(true);
      expect(res.body.results[0].messageId).toBeUndefined();

      intentId = res.body.intentId;
    });

    it('GET /api/delivery-status/:intentId records the simulated delivery', async () => {
      const res = await request(app).get(`/api/delivery-status/${intentId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      const history = res.body.history;
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].status).toBe('sent');
      expect(history[0].simulated).toBe(true);
      expect(history[0].messageId).toBeUndefined();
    });
  });

  describe('Ops Status', () => {
    it('GET /api/internal/status reports per-channel mode and breaker state', async () => {
      const res = await request(app).get('/api/internal/status');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const byChannel = Object.fromEntries(res.body.channels.map(c => [c.channel, c]));
      // No creds in the test env: every channel simulated, breakers not applicable.
      for (const channel of ['sms', 'whatsapp', 'email']) {
        expect(byChannel[channel]).toBeDefined();
        expect(byChannel[channel].mode).toBe('simulation');
        expect(byChannel[channel].breakerState).toBe('n/a');
      }
    });
  });

  describe('Traceability', () => {
    it('Includes x-trace-id for internal correlation', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-trace-id']).toBeDefined();
    });
  });
});
