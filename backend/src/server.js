require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const { Server } = require('socket.io');

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { setupWebSocket } = require('./websocket/socketHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const radiologyRoutes = require('./routes/radiologyRoutes');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const walletRoutes = require('./routes/walletRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

// Setup WebSocket handlers
setupWebSocket(io);

// Make io accessible to routes
app.set('io', io);

// Connect to Database
connectDB();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
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
        services: {
            database: 'connected',
            websocket: 'active',
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

// AI proxy route (forwards to Python AI service)
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
║                                                  ║
╚══════════════════════════════════════════════════╝
  `);
});

module.exports = { app, server, io };
