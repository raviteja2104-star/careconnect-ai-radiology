const mongoose = require('mongoose');

let cachedConnection = null;
let pendingConnect = null;
let lastFailureAt = 0;
const FAILURE_COOLDOWN_MS = 15000;

// In-memory MongoDB server instance (dev fallback only)
let memServer = null;

const startMemoryServer = async () => {
    if (memServer) return memServer.getUri();
    try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memServer = await MongoMemoryServer.create({ instance: { port: 27018 } });
        const uri = memServer.getUri() + 'careconnect';
        console.log('🗄️  Using mongodb-memory-server (Atlas unreachable) — data resets on restart');
        return uri;
    } catch (e) {
        console.warn('⚠️  mongodb-memory-server failed to start:', e.message);
        return null;
    }
};

const connectDB = async () => {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }
    if (Date.now() - lastFailureAt < FAILURE_COOLDOWN_MS) {
        return null;
    }
    if (!pendingConnect) {
        pendingConnect = (async () => {
            const atlasUri = process.env.MONGODB_URI;
            // Try Atlas first; fall back to memory server only in non-production
            const uris = [atlasUri];
            if (process.env.NODE_ENV !== 'production') {
                const memUri = await startMemoryServer();
                if (memUri) uris.push(memUri);
            }

            for (const uri of uris) {
                if (!uri) continue;
                try {
                    const conn = await mongoose.connect(uri, {
                        serverSelectionTimeoutMS: 8000,
                        socketTimeoutMS: 45000,
                        maxPoolSize: 10,
                        bufferCommands: false,
                    });
                    cachedConnection = conn;
                    lastFailureAt = 0;
                    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
                    return conn;
                } catch (error) {
                    const label = uri === atlasUri ? 'Atlas' : 'memory-server';
                    console.warn(`⚠️  MongoDB (${label}) failed: ${error.message}`);
                }
            }
            lastFailureAt = Date.now();
            console.warn('⚠️  All MongoDB connection attempts failed. Running in demo mode.');
            return null;
        })().finally(() => { pendingConnect = null; });
    }
    return pendingConnect;
};

module.exports = connectDB;
