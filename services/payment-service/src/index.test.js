const request = require('supertest');
const app = require('./index');
const crypto = require('crypto');

describe('Payment Service', () => {
  it('should create a payment intent', async () => {
    const res = await request(app)
      .post('/api/payments/intent')
      .send({
        amount: 500,
        currency: 'INR',
        referenceId: 'INV-2026-0001',
        provider: 'razorpay',
        tenantId: 't-default'
      });
      
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('REQUIRES_PAYMENT');
    expect(res.body.data.providerIntentId).toBeDefined();
  });

  it('should handle idempotent webhooks securely', async () => {
    // 1. Create intent to track
    const intentRes = await request(app)
      .post('/api/payments/intent')
      .send({ amount: 500, referenceId: 'INV-002', provider: 'razorpay' });
      
    const providerIntentId = intentRes.body.data.providerIntentId;

    // 2. Mock Webhook payload
    const payload = {
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'txn_123', order_id: providerIntentId } } }
    };
    const webhookSecret = 'careconnect_wh_secret';
    const signature = crypto.createHmac('sha256', webhookSecret).update(JSON.stringify(payload)).digest('hex');

    // 3. Send Webhook
    const res1 = await request(app)
      .post('/api/payments/webhook/razorpay')
      .set('x-razorpay-signature', signature)
      .set('x-razorpay-event-id', 'evt_111')
      .send(payload);

    expect(res1.status).toBe(200);

    // 4. Test Idempotency (Duplicate webhook)
    const res2 = await request(app)
      .post('/api/payments/webhook/razorpay')
      .set('x-razorpay-signature', signature)
      .set('x-razorpay-event-id', 'evt_111')
      .send(payload);

    expect(res2.status).toBe(200);
    expect(res2.body.note).toBe('duplicate');
  });
});
