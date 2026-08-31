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

        // ------------------------------------------------------------------
        // WebRTC signaling for telemedicine video (native RTCPeerConnection).
        // Rooms are keyed `webrtc:<sessionId>`; the server only relays
        // SDP offers/answers and ICE candidates between peers in a room.
        // Auth: relies on the same JWT handshake middleware above — clients
        // must connect with a valid token (sent from localStorage).
        // ------------------------------------------------------------------
        socket.on('webrtc:join', (payload = {}) => {
            const { sessionId } = payload;
            if (!sessionId) return;
            const room = `webrtc:${sessionId}`;
            // Snapshot peers already in the room BEFORE joining
            const existingPeers = Array.from(io.sockets.adapter.rooms.get(room) || []);
            socket.join(room);
            socket.webrtcRoom = room;
            // Notify peers already in the room about the newcomer…
            socket.to(room).emit('webrtc:peer-joined', {
                fromSocketId: socket.id,
                userId,
                role: socket.user.role,
            });
            // …and tell the newcomer who is already there, so the offering
            // side can start negotiation regardless of join order.
            existingPeers.forEach((peerId) => {
                socket.emit('webrtc:peer-joined', { fromSocketId: peerId });
            });
        });

        socket.on('webrtc:offer', (payload = {}) => {
            const { sessionId, sdp } = payload;
            if (!sessionId || !sdp) return;
            socket.to(`webrtc:${sessionId}`).emit('webrtc:offer', {
                fromSocketId: socket.id,
                sdp,
            });
        });

        socket.on('webrtc:answer', (payload = {}) => {
            const { sessionId, sdp } = payload;
            if (!sessionId || !sdp) return;
            socket.to(`webrtc:${sessionId}`).emit('webrtc:answer', {
                fromSocketId: socket.id,
                sdp,
            });
        });

        socket.on('webrtc:ice', (payload = {}) => {
            const { sessionId, candidate } = payload;
            if (!sessionId || !candidate) return;
            socket.to(`webrtc:${sessionId}`).emit('webrtc:ice', {
                fromSocketId: socket.id,
                candidate,
            });
        });

        socket.on('webrtc:leave', (payload = {}) => {
            const room = payload.sessionId ? `webrtc:${payload.sessionId}` : socket.webrtcRoom;
            if (!room) return;
            socket.leave(room);
            if (socket.webrtcRoom === room) socket.webrtcRoom = null;
            socket.to(room).emit('webrtc:peer-left', { fromSocketId: socket.id });
        });

        // Additional disconnect listener (the original below stays untouched):
        // tell WebRTC peers when a participant drops without an explicit leave.
        socket.on('disconnect', () => {
            if (socket.webrtcRoom) {
                socket.to(socket.webrtcRoom).emit('webrtc:peer-left', { fromSocketId: socket.id });
            }
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
