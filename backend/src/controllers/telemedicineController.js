const Appointment = require('../models/Appointment');
const TelemedicineSession = require('../models/TelemedicineSession');
const EventPublisher = require('../services/EventPublisher');
const { v4: uuidv4 } = require('uuid');

// How many minutes before/after the scheduled time the patient may join
const JOIN_WINDOW_BEFORE_MS = 15 * 60 * 1000;  // 15 min early
const JOIN_WINDOW_AFTER_MS  = 60 * 60 * 1000;  // 60 min grace

/**
 * Generate a joinable room URL.
 * Priority:
 *   1. Daily.co  — if DAILY_API_KEY is set, creates a real room via their REST API
 *   2. Custom    — if VIDEO_PROVIDER_URL is set, appends the roomId to that base URL
 *   3. Jitsi     — free fallback, no API key required (not HIPAA-compliant)
 */
async function generateRoomUrl(roomId) {
    if (process.env.DAILY_API_KEY) {
        try {
            const axios = require('axios');
            const resp = await axios.post(
                'https://api.daily.co/v1/rooms',
                {
                    name: roomId,
                    privacy: 'private',
                    properties: {
                        enable_chat: true,
                        enable_screenshare: true,
                        max_participants: 5,
                        exp: Math.floor(Date.now() / 1000) + 3600, // 1-hour expiry
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 8000,
                }
            );
            return resp.data.url;
        } catch (err) {
            console.warn('[Telemedicine] Daily.co room creation failed:', err.message);
            // Fall through to next option
        }
    }

    if (process.env.VIDEO_PROVIDER_URL) {
        const base = process.env.VIDEO_PROVIDER_URL.replace(/\/$/, '');
        return `${base}/${roomId}`;
    }

    // Free Jitsi Meet fallback — functional but not HIPAA-compliant
    const safe = roomId.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    return `https://meet.jit.si/careconnect-${safe}`;
}

// @desc    Patient joins the virtual waiting room for a booked telemedicine appointment
// @route   POST /api/telemedicine/join
// @access  Private (patient)
exports.joinWaitingRoom = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        if (!appointmentId) {
            return res.status(400).json({ success: false, error: 'appointmentId is required.' });
        }

        // ── 1. Load & validate appointment ────────────────────────────────────────
        const appointment = await Appointment
            .findById(appointmentId)
            .populate('doctor', 'firstName lastName email');

        if (!appointment) {
            return res.status(404).json({ success: false, error: 'Appointment not found.' });
        }

        // 2. Ownership — only the booked patient may join
        if (appointment.patient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, error: 'This appointment does not belong to you.' });
        }

        // 3. Type — must be a video call appointment
        if (appointment.visitType !== 'Video Call') {
            return res.status(400).json({
                success: false,
                error: `This appointment is '${appointment.visitType}', not a video call.`,
            });
        }

        // 4. Status — must not be completed or cancelled
        if (['Completed', 'Cancelled'].includes(appointment.status)) {
            return res.status(400).json({
                success: false,
                error: `Cannot join: appointment is already ${appointment.status.toLowerCase()}.`,
            });
        }

        // 5. Time window — parse scheduled datetime from date + timeSlot
        const apptDate = new Date(appointment.date);
        // timeSlot is stored as e.g. "02:30 PM"
        if (appointment.timeSlot) {
            const [time, meridiem] = appointment.timeSlot.split(' ');
            let [h, m] = time.split(':').map(Number);
            if (meridiem === 'PM' && h !== 12) h += 12;
            if (meridiem === 'AM' && h === 12) h = 0;
            apptDate.setUTCHours(h, m, 0, 0);
        }

        const now = Date.now();
        const earliest = apptDate.getTime() - JOIN_WINDOW_BEFORE_MS;
        const latest   = apptDate.getTime() + JOIN_WINDOW_AFTER_MS;

        if (now < earliest) {
            const minsUntil = Math.ceil((earliest - now) / 60000);
            return res.status(400).json({
                success: false,
                error: `You can join up to 15 minutes before your appointment. Please try again in ${minsUntil} minute${minsUntil !== 1 ? 's' : ''}.`,
                canJoinAt: new Date(earliest).toISOString(),
            });
        }
        if (now > latest) {
            return res.status(400).json({
                success: false,
                error: 'This appointment window has closed. Please reschedule.',
            });
        }

        // ── 6. Create or retrieve session ─────────────────────────────────────────
        let session = await TelemedicineSession.findOne({ appointment: appointmentId });

        if (!session) {
            const roomId = `appt-${appointmentId}-${uuidv4().slice(0, 8)}`;
            const roomUrl = await generateRoomUrl(roomId);

            const doctorId = appointment.doctor?._id || appointment.doctor;

            session = await TelemedicineSession.create({
                appointment: appointmentId,
                patient: req.user._id,
                doctor: doctorId,
                status: 'PATIENT_WAITING',
                roomId,
                roomUrl,
                videoProvider: process.env.DAILY_API_KEY
                    ? 'Daily'
                    : process.env.VIDEO_PROVIDER_URL
                        ? 'WebRTC'
                        : 'WebRTC',
            });

            // Update appointment status to Waiting
            appointment.status = 'Waiting';
            if (!appointment.meetingLink) appointment.meetingLink = roomUrl;
            await appointment.save();

            await EventPublisher.publish({
                eventType: 'TelemedicineSessionCreated',
                version: '1.0',
                aggregateId: session._id.toString(),
                tenantId: req.headers['x-tenant-id'] || 't-default',
                traceId: req.headers['x-trace-id'] || uuidv4(),
                payload: { roomId, roomUrl },
                recipient: {
                    id: req.user._id.toString(),
                    phone: req.user.phone || '',
                    email: req.user.email || '',
                    preferences: { sms: true, email: true, whatsapp: false, push: true },
                },
            });
        } else if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(session.status)) {
            return res.status(400).json({
                success: false,
                error: `Session is already ${session.status.toLowerCase()}.`,
            });
        } else {
            // Re-joining an existing open session
            session.status = 'PATIENT_WAITING';
            await session.save();
        }

        if (req.app.get('io')) {
            req.app.get('io').to(`doctor-${session.doctor}`).emit('PATIENT_JOINED_WAITING_ROOM', {
                sessionId: session._id,
                appointmentId,
                patientName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email,
            });
        }

        return res.json({
            success: true,
            data: {
                sessionId: session._id,
                status: session.status,
                roomId: session.roomId,
                roomUrl: session.roomUrl,
                videoProvider: session.videoProvider,
                appointment: {
                    _id: appointment._id,
                    date: appointment.date,
                    timeSlot: appointment.timeSlot,
                    doctor: appointment.doctor,
                },
            },
        });
    } catch (error) {
        console.error('[Telemedicine] joinWaitingRoom error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get telemedicine session for a given appointment (patient or doctor)
// @route   GET /api/telemedicine/session/:appointmentId
// @access  Private
exports.getSession = async (req, res) => {
    try {
        const session = await TelemedicineSession
            .findOne({ appointment: req.params.appointmentId })
            .lean();

        if (!session) {
            return res.status(404).json({ success: false, error: 'No session found for this appointment.' });
        }

        // Only the patient or the doctor on the session may view it
        const userId = req.user._id.toString();
        if (session.patient?.toString() !== userId && session.doctor?.toString() !== userId) {
            return res.status(403).json({ success: false, error: 'Not authorised to view this session.' });
        }

        return res.json({ success: true, data: session });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Doctor starts the consultation
// @route   POST /api/telemedicine/start
// @access  Private (doctor, admin)
exports.startConsultation = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const session = await TelemedicineSession.findById(sessionId);
        if (!session) return res.status(404).json({ success: false, error: 'Session not found.' });

        session.status = 'IN_PROGRESS';
        session.startedAt = new Date();
        await session.save();

        // Update appointment status
        await Appointment.findByIdAndUpdate(session.appointment, { status: 'In_Consultation' });

        if (req.app.get('io')) {
            req.app.get('io').to(`patient-${session.patient}`).emit('CONSULTATION_STARTED', {
                sessionId: session._id,
                roomUrl: session.roomUrl,
            });
        }

        await EventPublisher.publish({
            eventType: 'TelemedicineStarted',
            version: '1.0',
            aggregateId: session._id.toString(),
            tenantId: req.headers['x-tenant-id'] || 't-default',
            traceId: req.headers['x-trace-id'] || uuidv4(),
            payload: { roomId: session.roomId, roomUrl: session.roomUrl },
            recipient: {
                id: session.patient.toString(),
                phone: '',
                email: '',
                preferences: { sms: false, email: true, whatsapp: false, push: true },
            },
        });

        res.json({ success: true, data: session });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    End consultation
// @route   POST /api/telemedicine/end
// @access  Private (doctor, admin)
exports.endConsultation = async (req, res) => {
    try {
        const { sessionId, aiSummary } = req.body;
        const session = await TelemedicineSession.findById(sessionId);
        if (!session) return res.status(404).json({ success: false, error: 'Session not found.' });

        session.status = 'COMPLETED';
        session.endedAt = new Date();
        if (aiSummary) session.aiSummary = aiSummary;
        await session.save();

        await Appointment.findByIdAndUpdate(session.appointment, { status: 'Completed' });

        if (req.app.get('io')) {
            req.app.get('io').to(`patient-${session.patient}`).emit('CONSULTATION_COMPLETED', {
                sessionId: session._id,
            });
        }

        await EventPublisher.publish({
            eventType: 'TelemedicineEnded',
            version: '1.0',
            aggregateId: session._id.toString(),
            tenantId: req.headers['x-tenant-id'] || 't-default',
            traceId: req.headers['x-trace-id'] || uuidv4(),
            payload: { roomId: session.roomId, aiSummaryAvailable: !!aiSummary },
            recipient: {
                id: session.patient.toString(),
                phone: '',
                email: '',
                preferences: { sms: false, email: true, whatsapp: false, push: false },
            },
        });

        res.json({ success: true, data: session });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
