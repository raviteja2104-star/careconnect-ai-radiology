const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.warn(`⚠️  MongoDB Connection Warning: ${error.message}`);
        console.warn('⚠️  Server will continue running. Some features require MongoDB.');
        console.warn('⚠️  Please start MongoDB or update MONGODB_URI in .env');
    }
};

module.exports = connectDB;
