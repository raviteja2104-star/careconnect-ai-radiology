const mongoose = require('mongoose');

// Cache the connection across serverless function invocations
let cachedConnection = null;

const connectDB = async () => {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            bufferCommands: false,
        });
        cachedConnection = conn;
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.warn(`⚠️  MongoDB Connection Warning: ${error.message}`);
        console.warn('⚠️  Server will continue running. Some features require MongoDB.');
        console.warn('⚠️  Please start MongoDB or update MONGODB_URI in .env');
    }
};

module.exports = connectDB;

