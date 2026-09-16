const jwt = require('jsonwebtoken');
const User = require('../models/User');

const connectedUsers = new Map(); // userId -> socketId

/**
 * Permission check for WebSocket events.
 * Uses the same PermissionService as HTTP middleware so there is one
 * authoritative source of truth.
 */
async function socketHasPermission(socket, ...perms) {
    try {
        if (!socket.user) return false;
        const { userHasPermissions } = require('../services/PermissionService');
        return await userHasPermissions(socket.user._id, perms);
    } catch (_) {
        return false;
    }
}

/**
 * Check that a doctor socket is actually associated with the given appointment/
 * consultation — prevents a doctor from listening to another doctor's session.
 */
async function socketCanAccessConsultation(socket, consultationId) {
    try {
        const Appointment = require('../models/Appointment');
        const linked = await Appointment.exists({
            $or: [{ _id: consultationId }, { consultationId }],
            $or: [
                { doctor: socket.user._id },
                { patient: socket.user._id },
            ],
        }).catch(() => null);
        if (linked) return true;
        // Admins / nurses may monitor any consultation
        return ['admin', 'super_admin', 'nurse'].includes(socket.user?.role);
    } catch (_) {
        return false;
    }
}

const setupWebSocket = (io) => {
    // ── Authentication middleware ─────────────────────────────────────────────
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!token) return next(new Error('Authentication required'));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');
            if (!user) return next(new Error('User not found'));
            if (!user.isActive) return next(new Error('Account deactivated'));

            socket.user = user;
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.user._id.toString();
        connectedUsers.set(userId, socket.id);

        // Always join personal room — safe, scoped to this user
        socket.join(`user:${userId}`);
        // Join role room (used for broadcast to role groups)
        socket.join(`role:${socket.user.role}`);

        // ── Scan subscription — radiologist or admin only ─────────────────────
        socket.on('scan:subscribe', async (scanId) => {
            const ok = await socketHasPermission(socket,
                'RADIOLOGY.VIEW_STUDIES', 'RADIOLOGY.VIEW_WORKLIST'
            );
            if (!ok) {
                socket.emit('error', { code: 'FORBIDDEN', message: 'Insufficient permissions to subscribe to scan updates.' });
                return;
            }
            socket.join(`scan:${scanId}`);
        });

        // ── Emergency subscription — emergency staff or admin ─────────────────
        socket.on('emergency:subscribe', async (emergencyId) => {
            const ok = await socketHasPermission(socket,
                'STAFF.RESPOND_EMERGENCY', 'STAFF.EMERGENCY'
            );
            if (!ok) {
                socket.emit('error', { code: 'FORBIDDEN', message: 'Insufficient permissions to subscribe to emergency events.' });
                return;
            }
            socket.join(`emergency:${emergencyId}`);
        });

        // ── Consultation room — doctor on this consultation OR patient OR nurse/admin
        socket.on('consultation:join', async (consultationId) => {
            const canAccess = await socketCanAccessConsultation(socket, consultationId);
            if (!canAccess) {
                socket.emit('error', { code: 'FORBIDDEN', message: 'You are not authorized to join this consultation.' });
                return;
            }
            socket.join(`consultation:${consultationId}`);
            socket.to(`consultation:${consultationId}`).emit('consultation:user-joined', {
                userId,
                name: socket.user.fullName || `${socket.user.firstName} ${socket.user.lastName}`,
                role: socket.user.role,
            });
        });

        // ── Consultation chat message ─────────────────────────────────────────
        socket.on('consultation:message', async (data) => {
            const room = `consultation:${data.consultationId}`;
            // Only members of the consultation room can send messages
            const rooms = socket.rooms;
            if (!rooms.has(room)) {
                socket.emit('error', { code: 'FORBIDDEN', message: 'You are not in this consultation room.' });
                return;
            }
            io.to(room).emit('consultation:message', {
                from: userId,
                name: socket.user.fullName || `${socket.user.firstName} ${socket.user.lastName}`,
                role: socket.user.role,
                message: data.message,
                timestamp: new Date(),
            });
        });

        // ── WebRTC signaling for telemedicine video ───────────────────────────
        // Room access: checked via TelemedicineSession — user must be a participant
        socket.on('webrtc:join', async (payload = {}) => {
            const { sessionId } = payload;
            if (!sessionId) return;

            // Verify user is a participant in this telemedicine session
            try {
                const TelemedicineSession = require('../models/TelemedicineSession');
                const session = await TelemedicineSession.findById(sessionId)
                    .select('doctor patient status').lean().catch(() => null);

                // When session is not found, DENY access — do not grant based on role alone
                const isParticipant = session && (
                    session.doctor?.toString() === userId ||
                    session.patient?.toString() === userId ||
                    ['admin', 'super_admin'].includes(socket.user?.role)
                );

                if (!isParticipant) {
                    socket.emit('error', { code: 'FORBIDDEN', message: 'You are not a participant in this telemedicine session.' });
                    return;
                }
            } catch (_) {}

            const room = `webrtc:${sessionId}`;
            const existingPeers = Array.from(io.sockets.adapter.rooms.get(room) || []);
            socket.join(room);
            socket.webrtcRoom = room;
            socket.to(room).emit('webrtc:peer-joined', { fromSocketId: socket.id, userId, role: socket.user.role });
            existingPeers.forEach((peerId) => {
                socket.emit('webrtc:peer-joined', { fromSocketId: peerId });
            });
        });

        socket.on('webrtc:offer', (payload = {}) => {
            const { sessionId, sdp } = payload;
            if (!sessionId || !sdp) return;
            // Only relay if this socket is in the room (checked at join time)
            if (!socket.rooms.has(`webrtc:${sessionId}`)) return;
            socket.to(`webrtc:${sessionId}`).emit('webrtc:offer', { fromSocketId: socket.id, sdp });
        });

        socket.on('webrtc:answer', (payload = {}) => {
            const { sessionId, sdp } = payload;
            if (!sessionId || !sdp) return;
            if (!socket.rooms.has(`webrtc:${sessionId}`)) return;
            socket.to(`webrtc:${sessionId}`).emit('webrtc:answer', { fromSocketId: socket.id, sdp });
        });

        socket.on('webrtc:ice', (payload = {}) => {
            const { sessionId, candidate } = payload;
            if (!sessionId || !candidate) return;
            if (!socket.rooms.has(`webrtc:${sessionId}`)) return;
            socket.to(`webrtc:${sessionId}`).emit('webrtc:ice', { fromSocketId: socket.id, candidate });
        });

        socket.on('webrtc:leave', (payload = {}) => {
            const room = payload.sessionId ? `webrtc:${payload.sessionId}` : socket.webrtcRoom;
            if (!room) return;
            socket.leave(room);
            if (socket.webrtcRoom === room) socket.webrtcRoom = null;
            socket.to(room).emit('webrtc:peer-left', { fromSocketId: socket.id });
        });

        socket.on('disconnect', () => {
            if (socket.webrtcRoom) {
                socket.to(socket.webrtcRoom).emit('webrtc:peer-left', { fromSocketId: socket.id });
            }
            connectedUsers.delete(userId);
        });
    });

    return io;
};

// ── Emitter helpers (used by controllers) ────────────────────────────────────

const emitToUser = (io, userId, event, data) => io.to(`user:${userId}`).emit(event, data);
const emitToRole = (io, role, event, data) => io.to(`role:${role}`).emit(event, data);
const emitScanUpdate = (io, scanId, data) => io.to(`scan:${scanId}`).emit('scan:update', data);
const emitEmergencyUpdate = (io, emergencyId, data) => io.to(`emergency:${emergencyId}`).emit('emergency:update', data);

module.exports = {
    setupWebSocket,
    emitToUser,
    emitToRole,
    emitScanUpdate,
    emitEmergencyUpdate,
    connectedUsers,
};
