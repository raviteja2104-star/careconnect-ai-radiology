const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';
const PAYMENT_URL = process.env.PAYMENT_URL || 'http://localhost:5006/api/payments';

describe('Telemedicine Golden Path (RC3 Sprint 2.1)', () => {
  let traceId;
  let state;
  let client;

  beforeAll(() => {
    traceId = uuidv4();
    client = axios.create({
      headers: {
        'x-trace-id': traceId,
        'x-tenant-id': 't-default'
      }
    });

    state = {
      patientId: null,
      appointmentId: null,
      sessionId: null,
      invoiceId: null,
      providerIntentId: null
    };
  });

  // ============================================
  // STEP 1: PATIENT REGISTRATION
  // ============================================
  it('should register a patient', async () => {
    const response = await client.post(`${BACKEND_URL}/patients`, {
      name: 'Jane Doe E2E',
      email: 'jane.e2e@example.com',
      phone: '+919876543210',
      gender: 'F',
      dob: '1990-01-01'
    });
    
    expect(response.status).toBe(201);
    expect(response.data._id).toBeDefined();
    state.patientId = response.data._id;
  });

  // ============================================
  // STEP 2: APPOINTMENT BOOKING
  // ============================================
  it('should book a telemedicine appointment', async () => {
    const response = await client.post(`${BACKEND_URL}/appointments`, {
      patientId: state.patientId,
      doctorId: 'DOC-101',
      type: 'TELEMEDICINE',
      datetime: new Date(Date.now() + 3600000).toISOString()
    });
    
    expect(response.status).toBe(201);
    state.appointmentId = response.data._id;
  });

  // ============================================
  // STEP 3: SAGA ORCHESTRATION & MEETINGS
  // ============================================
  it('should trigger telemedicine saga and create a session', async () => {
    const response = await client.post(`${BACKEND_URL}/telemedicine/sessions`, {
      appointmentId: state.appointmentId
    });
    
    expect(response.status).toBe(201);
    state.sessionId = response.data._id;
  });

  it('should transition session state to WAITING (Patient Check-in)', async () => {
    const response = await client.put(`${BACKEND_URL}/telemedicine/sessions/${state.sessionId}/status`, {
      status: 'WAITING'
    });
    expect(response.status).toBe(200);
  });

  it('should transition session state to IN_PROGRESS (Consultation Started)', async () => {
    const response = await client.put(`${BACKEND_URL}/telemedicine/sessions/${state.sessionId}/status`, {
      status: 'IN_PROGRESS'
    });
    expect(response.status).toBe(200);
  });

  it('should transition session state to COMPLETED (Consultation Ended)', async () => {
    const response = await client.put(`${BACKEND_URL}/telemedicine/sessions/${state.sessionId}/status`, {
      status: 'COMPLETED'
    });
    expect(response.status).toBe(200);
  });

  // ============================================
  // STEP 4: BILLING & PAYMENTS
  // ============================================
  it('should generate an invoice for the consultation', async () => {
    const response = await client.post(`${BACKEND_URL}/billing/invoices`, {
      patientId: state.patientId,
      type: 'CONSULTATION',
      items: [{ description: 'Telemedicine Consultation', quantity: 1, unitPrice: 500 }]
    });
    
    expect(response.status).toBe(201);
    state.invoiceId = response.data._id;
    state.totalAmount = response.data.totalAmount;
  });

  it('should create a payment intent', async () => {
    const response = await client.post(`${PAYMENT_URL}/intent`, {
      amount: state.totalAmount,
      referenceId: state.invoiceId, // Or invoiceNumber
      provider: 'razorpay'
    });
    
    expect(response.status).toBe(201);
    state.providerIntentId = response.data.providerIntentId;
  });

  it('should idempotently process payment webhook', async () => {
    const webhookPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'txn_' + uuidv4(),
            order_id: state.providerIntentId
          }
        }
      }
    };
    
    const headers = {
      'x-razorpay-signature': 'TEST_SIG', // mocked for test env
      'x-razorpay-event-id': uuidv4()
    };

    // First attempt
    const response1 = await client.post(`${PAYMENT_URL}/webhook/razorpay`, webhookPayload, { headers });
    expect(response1.status).toBe(200);

    // Duplicate webhook attempt
    const response2 = await client.post(`${PAYMENT_URL}/webhook/razorpay`, webhookPayload, { headers });
    expect(response2.status).toBe(200);
    expect(response2.data.note).toBe('duplicate'); // Architecture assertion
  });
});
