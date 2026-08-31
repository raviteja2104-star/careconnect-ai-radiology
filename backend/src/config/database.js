const mongoose = require('mongoose');

// Cache the connection across serverless function invocations.
let cachedConnection = null;
// Single-flight: concurrent callers share one connect attempt instead of each
// spawning a 10s server-selection wait.
let pendingConnect = null;
// After a failure, fail fast for a cooldown window so request handlers fall
// through to their demo/degraded paths immediately instead of hanging.
let lastFailureAt = 0;
const FAILURE_COOLDOWN_MS = 15000;

const connectDB = async () => {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }
    if (Date.now() - lastFailureAt < FAILURE_COOLDOWN_MS) {
        return null;
    }
    if (!pendingConnect) {
        pendingConnect = mongoose
            .connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                maxPoolSize: 10,
                bufferCommands: false,
            })
            .then((conn) => {
                cachedConnection = conn;
                lastFailureAt = 0;
                console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
                return conn;
            })
            .catch((error) => {
                lastFailureAt = Date.now();
                console.warn(`⚠️  MongoDB Connection Warning: ${error.message}`);
                console.warn('⚠️  Server will continue running. Some features require MongoDB.');
                console.warn('⚠️  Please start MongoDB or update MONGODB_URI in .env');
                return null;
            })
            .finally(() => {
                pendingConnect = null;
            });
    }
    return pendingConnect;
};

module.exports = connectDB;
