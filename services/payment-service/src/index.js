const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Redis = require('ioredis');
const RazorpayProvider = require('./providers/RazorpayProvider');

const app = express();
app.use(express.json());

const providers = {
  razorpay: new RazorpayProvider()
};

// ─── Redis-backed idempotency ────────────────────────────────────────────────
// Primary store: Redis `SET key 1 NX EX 86400` — atomic first-writer-wins with
// a 24h TTL. FALLBACK: when Redis is unreachable the in-memory Sets below take
// over so the service still runs standalone (single-instance semantics only —
// entries are lost on restart and not shared across replicas).
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const IDEMPOTENCY_TTL_SECONDS = 86400;

let redisErrorLogged = false;
const redis = new Redis(REDIS_URL, {
  enableOfflineQueue: false,
  connectTimeout: 2000,
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => Math.min(times * 1000, 30000)
});
redis.on('error', (err) => {
  if (!redisErrorLogged) {
    console.warn(`[PaymentService] Redis unavailable (${err.code || err.message}) — using in-memory idempotency fallback.`);
    redisErrorLogged = true;
  }
});
redis.on('ready', () => {
  redisErrorLogged = false;
  console.log('[PaymentService] Redis connected — idempotency is durable.');
});

const redisReady = () => redis.status === 'ready';

// In-memory intent record store (unchanged — this is state tracking, not
// idempotency; a real deployment persists intents in the DB).
const intents = new Map();
// In-memory idempotency FALLBACK, used only while Redis is unreachable.
const memoryFallback = {
  processedEventIds: new Set(),
  paidIntents: new Set()
};

// Has this idempotency key been seen before? (read-only check)
async function idemSeen(key, fallbackSet) {
  if (redisReady()) {
    try {
      return (await redis.exists(key)) === 1;
    } catch (e) { /* fall through to memory */ }
  }
  return fallbackSet.has(key);
}

// Mark an idempotency key as processed. Returns true if we were first
// (SET NX succeeded), false if it already existed.
async function idemMark(key, fallbackSet) {
  if (redisReady()) {
    try {
      const result = await redis.set(key, '1', 'EX', IDEMPOTENCY_TTL_SECONDS, 'NX');
      // Mirror into memory too so a Redis outage mid-lifetime degrades gracefully.
      fallbackSet.add(key);
      return result === 'OK';
    } catch (e) { /* fall through to memory */ }
  }
  const isNew = !fallbackSet.has(key);
  fallbackSet.add(key);
  return isNew;
}

app.get('/health', (req, res) => res.json({ status: 'UP', service: 'payment-service' }));
app.get('/ready', (req, res) => res.json({ status: 'READY' }));

// 1. Create Payment Intent (Internal API called by Event Handler or BFF)
app.post('/api/payments/intent', async (req, res) => {
  try {
    const { amount, currency = 'INR', referenceId, provider = 'razorpay', tenantId } = req.body;
    
    // Multi-tenant config fetching (mocked)
    const tenantConfig = { 
      keyId: 'mock_key', 
      keySecret: 'mock_secret',
      webhookSecret: 'careconnect_wh_secret'
    };

    const paymentProvider = providers[provider];
    if (!paymentProvider) throw new Error(`Unsupported provider: ${provider}`);

    const result = await paymentProvider.createIntent({ amount, currency, referenceId, tenantConfig });
    
    const intentRecord = {
      id: uuidv4(),
      referenceId,
      providerIntentId: result.providerIntentId,
      amount,
      currency,
      status: 'REQUIRES_PAYMENT',
      tenantId,
      createdAt: new Date()
    };

    intents.set(intentRecord.providerIntentId, intentRecord);

    res.status(201).json({ success: true, data: intentRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Webhook Endpoint
app.post('/api/payments/webhook/:provider', async (req, res) => {
  const { provider } = req.params;
  const signature = req.headers['x-razorpay-signature'] || req.headers['stripe-signature'];
  const eventId = req.headers['x-razorpay-event-id'] || req.body.id;

  // Idempotency check — Redis-backed (24h TTL), in-memory fallback when
  // Redis is down. Keyed by the provider's webhook event id.
  const eventKey = `idem:webhook:${eventId}`;
  if (await idemSeen(eventKey, memoryFallback.processedEventIds)) {
    return res.status(200).json({ received: true, note: 'duplicate' });
  }

  const paymentProvider = providers[provider];

  try {
    // Mock tenant config
    const tenantConfig = { webhookSecret: 'careconnect_wh_secret' };

    const isValid = paymentProvider.verifyWebhookSignature(req.body, signature, tenantConfig.webhookSecret);
    if (!isValid) return res.status(400).json({ error: 'Invalid signature' });

    // Handle Event
    const eventType = req.body.event; // e.g., 'payment.captured'
    const providerIntentId = req.body.payload.payment.entity.order_id;

    // Already-paid check (any event type), mirroring the old DB-simulated check.
    const intentKey = `idem:paid:${providerIntentId}`;
    if (await idemSeen(intentKey, memoryFallback.paidIntents)) {
      await idemMark(eventKey, memoryFallback.processedEventIds);
      return res.status(200).json({ received: true, note: 'already_paid' });
    }

    const intent = intents.get(providerIntentId) || { referenceId: 'MOCK-REF', status: 'REQUIRES_PAYMENT' };

    if (eventType === 'payment.captured') {
      // Atomic first-writer-wins on the intent: SET NX EX 86400 — closes the
      // race two concurrent deliveries would otherwise slip through above.
      const firstWriter = await idemMark(intentKey, memoryFallback.paidIntents);
      if (!firstWriter) {
        await idemMark(eventKey, memoryFallback.processedEventIds);
        return res.status(200).json({ received: true, note: 'already_paid' });
      }

      intent.status = 'SUCCEEDED';
      intent.transactionId = req.body.payload.payment.entity.id;

      await idemMark(eventKey, memoryFallback.processedEventIds);

      // In a real system, we'd persist this to DB and publish 'PaymentSucceeded' to the Outbox
      console.log(`[PaymentService] Published Event: PaymentSucceeded for ${intent.referenceId} (Trace: ${req.headers['x-trace-id']})`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

const PORT = process.env.PORT || 5006;
if (require.main === module) {
  app.listen(PORT, () => console.log(`[Payment Service] Running on port ${PORT}`));
}

module.exports = app;
