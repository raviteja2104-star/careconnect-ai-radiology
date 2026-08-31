require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

const {
  NotificationRouter,
  TemplateEngine,
  DeliveryTracker,
  TwilioSmsProvider,
  GupshupWhatsAppProvider,
  SendGridEmailProvider,
  SimulationProvider
} = require('../../../packages/integrations/communication/dist');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'communication-service' },
  transports: [new winston.transports.Console()]
});

// Setup Domain
const templateEngine = new TemplateEngine();
const tracker = new DeliveryTracker(logger);
const router = new NotificationRouter(templateEngine, tracker, logger);

// Register Providers — env-driven. Each channel runs 'live' when credentials are
// present, 'simulation' otherwise (logs [SIMULATION] lines, never transmits).

// SMS: Twilio (TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM)
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  router.registerProvider(new TwilioSmsProvider(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
    process.env.TWILIO_FROM || process.env.TWILIO_FROM_NUMBER || '+15550000000'
  ));
  logger.info('SMS channel: LIVE (Twilio)');
} else {
  logger.warn('Twilio credentials missing (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN). SMS channel in SIMULATION mode.');
  router.registerProvider(new SimulationProvider('sms', logger));
}

// WhatsApp: Gupshup (GUPSHUP_API_KEY + GUPSHUP_SOURCE)
if (process.env.GUPSHUP_API_KEY && process.env.GUPSHUP_SOURCE) {
  router.registerProvider(new GupshupWhatsAppProvider(
    process.env.GUPSHUP_API_KEY,
    process.env.GUPSHUP_SOURCE,
    process.env.GUPSHUP_APP_NAME
  ));
  logger.info('WhatsApp channel: LIVE (Gupshup)');
} else {
  logger.warn('Gupshup credentials missing (GUPSHUP_API_KEY/GUPSHUP_SOURCE). WhatsApp channel in SIMULATION mode.');
  router.registerProvider(new SimulationProvider('whatsapp', logger));
}

// Email: SendGrid (SENDGRID_API_KEY) — otherwise console/simulation.
if (process.env.SENDGRID_API_KEY) {
  router.registerProvider(new SendGridEmailProvider(
    process.env.SENDGRID_API_KEY,
    process.env.SENDGRID_FROM_EMAIL || 'no-reply@careconnect.com'
  ));
  logger.info('Email channel: LIVE (SendGrid)');
} else {
  logger.warn('SendGrid credentials missing (SENDGRID_API_KEY). Email channel in SIMULATION mode (console).');
  router.registerProvider(new SimulationProvider('email', logger));
}

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

// Observability Middleware
app.use((req, res, next) => {
  req.traceId = req.headers['x-trace-id'] || uuidv4();
  res.setHeader('x-trace-id', req.traceId);
  logger.info('Incoming Request', { traceId: req.traceId, method: req.method, url: req.url });
  next();
});

// --- EVENT BUS INTEGRATION ---
// Business modules push events here instead of calling Twilio directly
app.post('/api/internal/events', async (req, res) => {
  try {
    const { eventType, payload, recipient } = req.body;

    if (!eventType || !recipient) {
      return res.status(400).json({ success: false, message: 'Missing eventType or recipient' });
    }

    const traceId = req.headers['x-trace-id'] || uuidv4();

    // Convert Event to NotificationIntent. Templates exist for:
    //   AppointmentBooked        -> booking confirmation (patient)
    //   CriticalFindingDetected  -> urgent alert (ordering doctor)
    //   PatientNotified          -> report-ready message (patient)
    //   AppointmentReminder      -> legacy reminder
    // Channels are picked from recipient.preferences (sms/whatsapp/email booleans).
    const intent = {
      id: `intent-${uuidv4()}`,
      type: eventType,
      recipient: recipient,
      payload: payload || {}
    };

    // Dispatch directly - the caller (OutboxWorker) handles persistence and retries if this fails
    const results = await router.dispatch(intent);

    res.status(200).json({
      success: true,
      message: 'Event processed successfully',
      intentId: intent.id,
      traceId,
      // Each result carries `simulated: true` when the message was NOT actually
      // transmitted (no provider credentials configured for that channel).
      results: results.map(r => ({
        channel: r.channel,
        provider: r.provider,
        success: r.success,
        status: r.status,
        messageId: r.messageId,
        simulated: r.simulated === true,
        error: r.error
      }))
    });
  } catch (error) {
    logger.error('Event processing error', { error: error.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// --- OPS STATUS ---
// Per-channel mode (live/simulation) + circuit breaker state (closed/open/half-open).
app.get('/api/internal/status', (req, res) => {
  const channels = router.getChannelStatus();
  res.json({
    success: true,
    service: 'communication-service',
    timestamp: new Date(),
    channels
  });
});

// --- API ROUTES ---
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'communication-service', timestamp: new Date() });
});

app.get('/ready', (req, res) => {
  res.json({ status: 'ready' });
});

app.get('/api/delivery-status/:intentId', (req, res) => {
  const history = tracker.getHistory(req.params.intentId);
  res.json({ success: true, history });
});

const PORT = process.env.PORT || 4002;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`[Communication Service] Running on port ${PORT}`);
  });
}

module.exports = app;
