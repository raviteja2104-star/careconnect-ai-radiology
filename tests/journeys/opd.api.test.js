const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';
const PAYMENT_URL = process.env.PAYMENT_URL || 'http://localhost:5006/api/payments';

describe('OPD Golden Path (RC3 Sprint 2.2)', () => {
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
      queueTokenId: null,
      invoiceId: null,
      providerIntentId: null
    };
  });

  // ============================================
  // STEP 1: REGISTRATION & APPOINTMENT
  // ============================================
  it('should register a new outpatient', async () => {
    const response = await client.post(`${BACKEND_URL}/patients`, {
      name: 'John Doe OPD',
      email: 'john.opd@example.com',
      phone: '+919876543211',
      gender: 'M',
      dob: '1985-05-15'
    });
    
    expect(response.status).toBe(201);
    state.patientId = response.data._id;
  });

  it('should book an OPD appointment', async () => {
    const response = await client.post(`${BACKEND_URL}/appointments`, {
      patientId: state.patientId,
      doctorId: 'DOC-102',
      type: 'OPD',
      datetime: new Date().toISOString() // Walk-in appointment
    });
    
    expect(response.status).toBe(201);
    state.appointmentId = response.data._id;
  });

  // ============================================
  // STEP 2: QUEUE & CHECK-IN
  // ============================================
  it('should generate a queue token upon arrival', async () => {
    const response = await client.post(`${BACKEND_URL}/queue`, {
      appointmentId: state.appointmentId,
      department: 'General Medicine'
    });
    
    expect(response.status).toBe(201);
    expect(response.data.tokenNumber).toBeDefined();
    state.queueTokenId = response.data._id;
  });

  // ============================================
  // STEP 3: CONSULTATION & CLINICAL DOCUMENTATION
  // ============================================
  it('should start the consultation', async () => {
    const response = await client.put(`${BACKEND_URL}/queue/${state.queueTokenId}`, {
      status: 'IN_CONSULTATION'
    });
    expect(response.status).toBe(200);
  });

  it('should save clinical documentation and prescriptions', async () => {
    const response = await client.post(`${BACKEND_URL}/encounters`, {
      appointmentId: state.appointmentId,
      patientId: state.patientId,
      doctorId: 'DOC-102',
      notes: 'Patient complains of mild fever.',
      prescriptions: [{ medication: 'Paracetamol 500mg', dosage: '1x3', days: 3 }]
    });
    expect(response.status).toBe(201);
  });

  it('should complete the consultation', async () => {
    const response = await client.put(`${BACKEND_URL}/queue/${state.queueTokenId}`, {
      status: 'COMPLETED'
    });
    expect(response.status).toBe(200);
  });

  // ============================================
  // STEP 4: BILLING & PAYMENTS
  // ============================================
  it('should generate an invoice for the OPD visit', async () => {
    const response = await client.post(`${BACKEND_URL}/billing/invoices`, {
      patientId: state.patientId,
      type: 'OPD_CONSULTATION',
      items: [
        { description: 'Consultation Fee', quantity: 1, unitPrice: 300 },
        { description: 'Registration Fee', quantity: 1, unitPrice: 100 }
      ]
    });
    
    expect(response.status).toBe(201);
    state.invoiceId = response.data._id;
    state.totalAmount = response.data.totalAmount;
    expect(state.totalAmount).toBe(400); // 300 + 100
  });

  it('should process payment successfully via gateway', async () => {
    // 1. Create intent
    const intentResp = await client.post(`${PAYMENT_URL}/intent`, {
      amount: state.totalAmount,
      referenceId: state.invoiceId,
      provider: 'razorpay'
    });
    state.providerIntentId = intentResp.data.providerIntentId;

    // 2. Simulate webhook
    const webhookResp = await client.post(`${PAYMENT_URL}/webhook/razorpay`, {
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'txn_' + uuidv4(), order_id: state.providerIntentId } } }
    }, {
      headers: { 'x-razorpay-signature': 'TEST_SIG', 'x-razorpay-event-id': uuidv4() }
    });
    
    expect(webhookResp.status).toBe(200);
  });

  // ============================================
  // ARCHITECTURE ASSERTIONS
  // ============================================
  it('Architecture Assertions: should verify invariants', async () => {
    // Fetch all outbox events for this trace (mocking DB query behavior)
    const outboxResponse = await client.get(`${BACKEND_URL}/_internal/outbox?traceId=${traceId}`);
    const events = outboxResponse.data.events;
    
    const paymentEvents = events.filter(e => e.eventType === 'PaymentSucceeded');
    expect(paymentEvents.length).toBe(1); // Exactly one PaymentSucceeded event

    const invoiceResponse = await client.get(`${BACKEND_URL}/billing/invoices/${state.invoiceId}`);
    expect(invoiceResponse.data.status).toBe('PAID'); // No orphaned invoice
  });
});
