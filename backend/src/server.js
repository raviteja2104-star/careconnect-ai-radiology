require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { rateLimit } = require('./middleware/rateLimit');
const telemetryMiddleware = require('./middleware/telemetry');
const Telemetry = require('./services/Telemetry');

// Route imports
const authRoutes = require('./routes/authRoutes');
// const { createProxyMiddleware } = require('http-proxy-middleware');
const radiologyRoutes = require('./routes/radiologyRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const walletRoutes = require('./routes/walletRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const teleradiologyRoutes = require('./routes/teleradiologyRoutes');
const teleradiologyWorklistRoutes = require('./routes/teleradiologyWorklistRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const abdmRoutes = require('./routes/abdmRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dicomwebRoutes = require('./routes/dicomwebRoutes');
const ohifRoutes = require('./routes/ohifRoutes');
const viewerRoutes = require('./routes/viewerRoutes');
const labRoutes = require('./routes/labRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const queueRoutes = require('./routes/queueRoutes');
const receptionRoutes = require('./routes/receptionRoutes');
const transferRoutes = require('./routes/transferRoutes');
const kioskRoutes = require('./routes/kioskRoutes');
const telemedicineRoutes = require('./routes/telemedicineRoutes');
const communicationRoutes = require('./routes/communicationRoutes');
const consentRoutes = require('./routes/consentRoutes');
const commandRoutes = require('./routes/commandRoutes');
const aiOperationsRoutes = require('./routes/aiOperationsRoutes');
const billingRoutes = require('./routes/billingRoutes');
const systemRoutes = require('./routes/systemRoutes');
const emrRoutes = require('./routes/emrRoutes');
const auditRoutes = require('./routes/auditRoutes');
const billableRoutes = require('./routes/billableRoutes');
const lisRoutes = require('./routes/lisRoutes');
const nearbyRoutes = require('./routes/nearbyRoutes');
const healthRecordRoutes = require('./routes/healthRecordRoutes');
const providerEnquiryRoutes = require('./routes/providerEnquiryRoutes');
const searchRoutes = require('./routes/searchRoutes');
const providerRegistrationRoutes = require('./routes/providerRegistrationRoutes');

// Initialize Event-Driven Architecture (Orchestrators)
require('./services/EventBus');
require('./services/AIDecisionEngine');
require('./services/EmergencyOrchestrator');
require('./services/TelemedicineSaga');
require('./services/TeleradiologyIntake').init();
require('./services/EmrReportSync').init();
require('./services/BillableMasterService').init();
require('./services/LabIntake').init();
require('./services/MasterDataSeedService').init();
require('./services/NearbySeedService').init();
require('./services/ClinicalCatalogService').init();
const OutboxWorker = require('./services/OutboxWorker');

const app = express();

// Start Notification Outbox Drainer
OutboxWorker.start(5000);

// Connect to Database
connectDB();

// Mount viewer routes BEFORE helmet to preserve custom CSP
app.use('/viewer', viewerRoutes);
app.use('/ohif', ohifRoutes);

// Middleware — skip helmet CSP for /ohif paths (already handled above).
app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/ohif') || req.originalUrl.startsWith('/viewer')) return next();
    helmet({ crossOriginResourcePolicy: false })(req, res, next);
});
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : ['http://localhost:3000', 'http://localhost:3001', 'https://www.careconnect.care', 'https://careconnect.care'],
    credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Telemetry — mounted after body parsers but BEFORE the rate limiter so that
// rate-limited responses (429) are still counted and measured; only the
// (negligible) body-parsing time is excluded from latency. Never throws.
app.use(telemetryMiddleware);

// Global rate limit — 300 req/min per IP via Redis; pass-through when Redis
// is unavailable. Mounted after body parsers, before all routes.
app.use(rateLimit({ windowMs: 60 * 1000, max: 300 }));

// Prometheus scrape endpoint. Deliberately PUBLIC (no auth): Prometheus does
// not send JWTs, and the payload contains only aggregate route/latency
// counters — no PHI or user data. In production keep it network-restricted
// (compose network / gateway allowlist) rather than token-gated.
app.get('/metrics', (req, res) => {
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(Telemetry.prometheusText());
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
    const mongoose = require('mongoose');
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
    res.json({
        success: true,
        message: 'CareConnect API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        services: {
            database: dbStatus,
            mongodb_uri_set: !!process.env.MONGODB_URI,
            jwt_secret_set: !!process.env.JWT_SECRET,
            ai: process.env.AI_SERVICE_URL ? 'connected' : 'not_configured',
        },
    });
});

// API Routes
if (process.env.USE_NEW_AUTH_SERVICE === 'true') {
    console.log('[Feature Flag] Routing /api/auth to new Auth Microservice');
    app.use('/api/auth', async (req, res, next) => {
        const { createProxyMiddleware } = await import('http-proxy-middleware');
        const proxy = createProxyMiddleware({
            target: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
            changeOrigin: true,
            pathRewrite: {}
        });
        return proxy(req, res, next);
    });
} else {
    console.log('[Feature Flag] Routing /api/auth to Legacy Monolith Auth');
    app.use('/api/auth', authRoutes);
}

app.use('/api/radiology', radiologyRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/marketplace', marketplaceRoutes);
// New worklist mounted FIRST on its own subpath so the legacy teleradiology routes keep working.
app.use('/api/teleradiology/worklist', teleradiologyWorklistRoutes);
app.use('/api/teleradiology', teleradiologyRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/abdm', abdmRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dicomweb', dicomwebRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/reception', receptionRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/kiosk', kioskRoutes);
app.use('/api/telemedicine', telemedicineRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/consents', consentRoutes);
app.use('/api/command', commandRoutes);
app.use('/api/operations', aiOperationsRoutes);
app.use('/api/billing', billingRoutes);

// SLO endpoint — registered BEFORE the /api/system router mount so it wins
// route matching. Admin-only: exposes operational posture, not for patients.
// Availability SLO: target 99.9% over a rolling 30-day window → error budget
// 43.2 min (30d × 24h × 60min × 0.1%). We only have data since process boot,
// so budget consumption is computed over the OBSERVED window only:
//   consumedMin = max(0, target − observedAvailability) × observedWindowMin
// and observedWindowMinutes is included so the UI can caveat the number.
{
    const authMw = require('./middleware/auth');
    app.get('/api/system/slo', authMw.protect, authMw.authorize('admin'), (req, res) => {
        const snapshot = Telemetry.snapshot();
        const SLO_TARGET = 0.999; // 99.9% availability
        const SLO_WINDOW_MINUTES = 30 * 24 * 60; // 43,200 min rolling window
        const ERROR_BUDGET_MINUTES = SLO_WINDOW_MINUTES * (1 - SLO_TARGET); // 43.2 min

        const observedWindowMinutes = Math.min(
            snapshot.process.uptimeSeconds / 60,
            SLO_WINDOW_MINUTES
        );
        // Availability observed since boot (5xx-based; 4xx are client errors).
        const observedAvailability = snapshot.totals.availability;
        const shortfall = Math.max(0, SLO_TARGET - observedAvailability);
        const consumedMinutes = shortfall * observedWindowMinutes;
        const remainingMinutes = Math.max(0, ERROR_BUDGET_MINUTES - consumedMinutes);

        res.json({
            ...snapshot,
            slo: {
                availabilityTarget: SLO_TARGET,
                windowDays: 30,
                errorBudgetMinutes: ERROR_BUDGET_MINUTES,
                observedWindowMinutes,
                observedAvailability,
                consumedBudgetMinutes: consumedMinutes,
                remainingBudgetMinutes: remainingMinutes,
                note: 'Budget computed from observed data only (since process start), not a full 30-day history.',
            },
        });
    });
}

app.use('/api/system', systemRoutes);
app.use('/api/emr', emrRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/masters/billables', billableRoutes);
app.use('/api/lis', lisRoutes);
app.use('/api/nearby', nearbyRoutes);
app.use('/api/health-records', healthRecordRoutes);
app.use('/api/provider-enquiry', providerEnquiryRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/provider', providerRegistrationRoutes);

const userSearchRoutes = require('./routes/userSearchRoutes');
app.use('/api/users', userSearchRoutes);

// AI proxy route
app.post('/api/ai/analyze-scan', async (req, res) => {
    try {
        const axios = require('axios');
        const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        const response = await axios.post(`${aiUrl}/api/ai/analyze-scan`, req.body, { timeout: 30000 });
        res.json(response.data);
    } catch (error) {
        res.status(503).json({
            success: false,
            message: 'AI service unavailable',
            error: error.message,
        });
    }
});

// Claude clinical AI proxy — authenticated pass-through to the Python AI
// service (soap-draft / discharge-summary / radiology-draft / explain /
// differentials / health). Claude calls can take a while → 60s timeout.
// 503s from the AI service ({available:false, reason:'no-api-key'}) pass
// through unchanged so the frontend can fall back to on-device drafting.
const { protect } = require('./middleware/auth');
const aiClinicalProxy = express.Router();
aiClinicalProxy.use(protect);
const forwardToAiService = (method) => async (req, res) => {
    const axios = require('axios');
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    try {
        const response = await axios({
            method,
            url: `${aiUrl}/api/ai${req.path}`,
            data: method === 'post' ? req.body : undefined,
            timeout: 60000,
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            // Pass AI-service errors (incl. 503 no-api-key, 502 refusal) through.
            return res.status(error.response.status).json(error.response.data);
        }
        res.status(503).json({
            available: false,
            reason: 'ai-service-unreachable',
            message: 'AI service unavailable',
        });
    }
};
aiClinicalProxy.get('/health', forwardToAiService('get'));
['soap-draft', 'discharge-summary', 'radiology-draft', 'explain', 'differentials', 'medication-suggestions']
    .forEach((route) => aiClinicalProxy.post(`/${route}`, forwardToAiService('post')));
app.use('/api/ai', aiClinicalProxy);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// Error handler
app.use(errorHandler);

// ─── HTTP server with WebSocket support ─────────────────────────────────────
// Runs in every environment except Vercel serverless (which imports `app`
// directly and cannot hold a listener). Gating on NODE_ENV here previously
// disabled ALL realtime in containerized production deploys.
if (!process.env.VERCEL) {
    const { Server } = require('socket.io');
    const server = http.createServer(app);
    const wsOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : ['http://localhost:3000', 'http://localhost:3001', 'https://www.careconnect.care', 'https://careconnect.care'];
    const io = new Server(server, { cors: { origin: wsOrigins, methods: ['GET', 'POST'], credentials: true } });
    const { setupWebSocket } = require('./websocket/socketHandler');
    setupWebSocket(io);
    app.set('io', io);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║   🏥 CareConnect Healthcare Platform API         ║
║                                                  ║
║   Server:    http://localhost:${PORT}               ║
║   WebSocket: ws://localhost:${PORT}                 ║
║   Mode:      ${process.env.NODE_ENV || 'development'}                     ║
║                                                  ║
║   API Routes:                                    ║
║   • /api/auth        - Authentication            ║
║   • /api/patient     - Patient Services          ║
║   • /api/doctor      - Doctor Dashboard          ║
║   • /api/radiology   - Teleradiology Module      ║
║   • /api/emergency   - Emergency SOS             ║
║   • /api/ai          - AI Engine Proxy           ║
║   • /api/wallet      - Wallet & Billing          ║
║   • /api/marketplace - Second Opinion Market     ║
║   • /api/pharmacy    - Pharmacy & Orders          ║
║   • /api/dashboard   - Dashboard Overview         ║
║                                                  ║
╚══════════════════════════════════════════════════╝
  `);
    });
}

// ─── Vercel serverless export ────────────────────────────────────────────────
module.exports = app;

