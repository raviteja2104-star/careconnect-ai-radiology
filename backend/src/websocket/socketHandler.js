const jwt = require('jsonwebtoken');
const User = require('../models/User');

const connectedUsers = new Map(); // userId -> socketId

const setupWebSocket = (io) => {
    // Authentication middleware for Socket.IO
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return next(new Error('User not found'));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user._id.toString();
        connectedUsers.set(userId, socket.id);
        console.log(`🔌 User connected: ${socket.user.firstName} (${socket.user.role})`);

        // Join role-based rooms
        socket.join(`role:${socket.user.role}`);
        socket.join(`user:${userId}`);

        // Handle scan status updates
        socket.on('scan:subscribe', (scanId) => {
            socket.join(`scan:${scanId}`);
        });

        // Handle emergency tracking
        socket.on('emergency:subscribe', (emergencyId) => {
            socket.join(`emergency:${emergencyId}`);
        });

        // Handle consultation room
        socket.on('consultation:join', (consultationId) => {
            socket.join(`consultation:${consultationId}`);
            socket.to(`consultation:${consultationId}`).emit('consultation:user-joined', {
                userId,
                name: socket.user.fullName,
                role: socket.user.role,
            });
        });

        // Chat message in consultation
        socket.on('consultation:message', (data) => {
            io.to(`consultation:${data.consultationId}`).emit('consultation:message', {
                from: userId,
                name: socket.user.fullName,
                role: socket.user.role,
                message: data.message,
                timestamp: new Date(),
            });
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            connectedUsers.delete(userId);
            console.log(`🔌 User disconnected: ${socket.user.firstName}`);
        });
    });

    return io;
};

// Emit to specific user
const emitToUser = (io, userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
};

// Emit to role group
const emitToRole = (io, role, event, data) => {
    io.to(`role:${role}`).emit(event, data);
};

// Emit scan update
const emitScanUpdate = (io, scanId, data) => {
    io.to(`scan:${scanId}`).emit('scan:update', data);
};

// Emit emergency update
const emitEmergencyUpdate = (io, emergencyId, data) => {
    io.to(`emergency:${emergencyId}`).emit('emergency:update', data);
};

module.exports = {
    setupWebSocket,
    emitToUser,
    emitToRole,
    emitScanUpdate,
    emitEmergencyUpdate,
    connectedUsers,
};
