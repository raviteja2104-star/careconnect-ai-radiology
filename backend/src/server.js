require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const radiologyRoutes = require('./routes/radiologyRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const walletRoutes = require('./routes/walletRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const teleradiologyRoutes = require('./routes/teleradiologyRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const abdmRoutes = require('./routes/abdmRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const dicomwebRoutes = require('./routes/dicomwebRoutes');
const ohifRoutes = require('./routes/ohifRoutes');
const viewerRoutes = require('./routes/viewerRoutes');

const app = express();

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
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'CareConnect API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        services: {
            database: 'connected',
            ai: process.env.AI_SERVICE_URL || 'http://localhost:8000',
        },
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/radiology', radiologyRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/teleradiology', teleradiologyRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/abdm', abdmRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dicomweb', dicomwebRoutes);

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

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// Error handler
app.use(errorHandler);

// ─── Local dev: start HTTP server with WebSocket support ────────────────────
if (process.env.NODE_ENV !== 'production') {
    const { Server } = require('socket.io');
    const server = http.createServer(app);
    const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
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

