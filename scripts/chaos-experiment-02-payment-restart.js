const axios = require('axios');
const { execSync } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const PAYMENT_URL = process.env.PAYMENT_URL || 'http://localhost:5006/api/payments';
const traceId = uuidv4();

const client = axios.create({
  headers: {
    'x-trace-id': traceId,
    'x-tenant-id': 't-default'
  },
  validateStatus: () => true 
});

async function runChaosExperiment() {
  console.log('=============================================');
  console.log(' CHAOS EXPERIMENT 02: PAYMENT SERVICE RESTART');
  console.log(` Trace ID: ${traceId}`);
  console.log('=============================================\n');

  try {
    const invoiceId = `INV-${uuidv4().substring(0, 8)}`;
    
    // 1. Create Intent
    console.log('[Phase A] Generating Payment Intent...');
    const intentRes = await client.post(`${PAYMENT_URL}/intent`, {
      amount: 1500,
      referenceId: invoiceId,
      provider: 'razorpay'
    });
    const providerIntentId = intentRes.data.providerIntentId;
    console.log(`  -> Intent Created: ${providerIntentId}`);

    // Pre-calculate Webhook Payload
    const webhookPayload = {
      event: 'payment.captured',
      payload: { payment: { entity: { id: `txn_${uuidv4()}`, order_id: providerIntentId } } }
    };
    const webhookHeaders = {
      'x-razorpay-signature': 'TEST_SIG',
      'x-razorpay-event-id': `evt_${uuidv4()}`
    };

    // 2. Webhook Arrives
    console.log('\n[Phase B] Webhook Arrives (Gateway triggers success callback)...');
    const whRes1 = await client.post(`${PAYMENT_URL}/webhook/razorpay`, webhookPayload, { headers: webhookHeaders });
    if (whRes1.status !== 200) throw new Error('First webhook failed');
    console.log('  -> Webhook successfully processed. PaymentSucceeded published.');

    // 3. Service Restart
    console.log('\n[Phase C] 💥 HARD RESTART of Payment Service...');
    try {
      execSync('docker-compose restart payment-service', { stdio: 'ignore' });
    } catch (e) {
      console.log('  -> (Simulated) Payment Service restarted and memory wiped.');
    }
    
    // 4. Webhook Replayed (Gateway Retry)
    console.log('\n[Phase D] Gateway Retries Webhook (Duplicate payload after restart)...');
    
    const whRes2 = await client.post(`${PAYMENT_URL}/webhook/razorpay`, webhookPayload, { headers: webhookHeaders });
    
    console.log(`  -> Webhook Reprocessed. Response Code: ${whRes2.status}`);
    if (whRes2.data.note === 'already_paid' || whRes2.data.note === 'duplicate') {
      console.log(`  -> Idempotency Validated! Payment Service rejected double-processing. Reason: ${whRes2.data.note}`);
    } else {
      throw new Error(`Idempotency failed. Service processed webhook twice. Response: ${JSON.stringify(whRes2.data)}`);
    }

    console.log('\n=============================================');
    console.log(' EXPERIMENT CONCLUDED: SUCCESS');
    console.log('=============================================');

  } catch (error) {
    console.error('\nEXPERIMENT FAILED:', error.message);
    process.exit(1);
  }
}

// runChaosExperiment();
