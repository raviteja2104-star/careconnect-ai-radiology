const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';
const PAYMENT_URL = process.env.PAYMENT_URL || 'http://localhost:5006/api/payments';
const traceId = uuidv4();

const client = axios.create({
  headers: {
    'x-trace-id': traceId,
    'x-tenant-id': 't-default'
  }
});

let state = {
  patientId: null,
  appointmentId: null,
  sessionId: null,
  invoiceId: null,
  providerIntentId: null
};

async function logStep(step, promise) {
  process.stdout.write(`Executing: ${step.padEnd(40)} ... `);
  try {
    const start = Date.now();
    const result = await promise;
    console.log(`[✅ PASS] (${Date.now() - start}ms)`);
    return result.data;
  } catch (error) {
    console.log(`[❌ FAIL]`);
    console.error(error.response?.data || error.message);
    process.exit(1);
  }
}

async function runJourney() {
  console.log(`=================================================`);
  console.log(` Starting Telemedicine API Journey (Trace: ${traceId})`);
  console.log(`=================================================\n`);

  // 1. Patient Registration
  const patient = await logStep('1. Register Patient', client.post(`${BACKEND_URL}/patients`, {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '+919876543210',
    gender: 'F',
    dob: '1990-01-01'
  }));
  state.patientId = patient.data._id;

  // 2. Book Telemedicine Appointment
  const appointment = await logStep('2. Book Telemedicine Appointment', client.post(`${BACKEND_URL}/appointments`, {
    patientId: state.patientId,
    doctorId: 'DOC-101',
    type: 'TELEMEDICINE',
    datetime: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
  }));
  state.appointmentId = appointment.data._id;

  // 3. Trigger Saga & Meeting Creation (Simulated via Saga Orchestrator endpoint)
  const session = await logStep('3. Telemedicine Saga -> Session Created', client.post(`${BACKEND_URL}/telemedicine/sessions`, {
    appointmentId: state.appointmentId
  }));
  state.sessionId = session.data._id;

  // 4. Patient Check-In
  await logStep('4. Patient Waiting Room Check-In', client.put(`${BACKEND_URL}/telemedicine/sessions/${state.sessionId}/status`, {
    status: 'WAITING'
  }));

  // 5. Consultation Started (Doctor Joins)
  await logStep('5. Consultation Started', client.put(`${BACKEND_URL}/telemedicine/sessions/${state.sessionId}/status`, {
    status: 'IN_PROGRESS'
  }));

  // 6. Consultation Ended
  await logStep('6. Consultation Ended', client.put(`${BACKEND_URL}/telemedicine/sessions/${state.sessionId}/status`, {
    status: 'COMPLETED'
  }));

  // 7. Generate Invoice
  const invoice = await logStep('7. Generate Invoice', client.post(`${BACKEND_URL}/billing/invoices`, {
    patientId: state.patientId,
    type: 'CONSULTATION',
    items: [{ description: 'Telemedicine Consultation', quantity: 1, unitPrice: 500 }]
  }));
  state.invoiceId = invoice.data._id;

  // 8. Create Payment Intent
  const intent = await logStep('8. Create Payment Intent', client.post(`${PAYMENT_URL}/intent`, {
    amount: invoice.data.totalAmount,
    referenceId: invoice.data.invoiceNumber,
    provider: 'razorpay'
  }));
  state.providerIntentId = intent.data.providerIntentId;

  // 9. Payment Webhook (Simulation of Success)
  await logStep('9. Process Payment Webhook', client.post(`${PAYMENT_URL}/webhook/razorpay`, {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'txn_' + uuidv4(),
          order_id: state.providerIntentId
        }
      }
    }
  }, {
    headers: {
      // Mocking signature for test bypass (in real script, we calculate this)
      'x-razorpay-signature': 'TEST_SIG',
      'x-razorpay-event-id': uuidv4()
    }
  }));

  console.log(`\n=================================================`);
  console.log(` ✅ TELEMEDICINE JOURNEY COMPLETED SUCCESSFULLY`);
  console.log(`=================================================`);
  console.log(` Final State:`, state);
}

// In a real environment, this script runs against the live staging cluster
// runJourney();
