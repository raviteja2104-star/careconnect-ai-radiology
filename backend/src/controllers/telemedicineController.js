const TelemedicineSession = require('../models/TelemedicineSession');
const QueueToken = require('../models/QueueToken');
const EventPublisher = require('../services/EventPublisher');
const { v4: uuidv4 } = require('uuid');

// @desc    Patient joins the virtual waiting room
// @route   POST /api/telemedicine/join
exports.joinWaitingRoom = async (req, res) => {
  try {
    const { tokenId } = req.body;
    const token = await QueueToken.findById(tokenId).populate('appointment');
    if (!token) return res.status(404).json({ success: false, error: 'Token not found' });

    let session = await TelemedicineSession.findOne({ queueToken: tokenId });
    
    if (!session) {
      session = await TelemedicineSession.create({
        queueToken: tokenId,
        appointment: token.appointment._id,
        patient: token.patient,
        doctor: token.doctor,
        status: 'PATIENT_WAITING',
        roomId: `tele-${tokenId}` // Basic mock room ID
      });

      await EventPublisher.publish({
        eventType: 'TelemedicineSessionCreated',
        version: '1.0',
        aggregateId: session._id.toString(),
        tenantId: req.headers['x-tenant-id'] || 't-default',
        traceId: req.headers['x-trace-id'] || uuidv4(),
        payload: {
          roomId: session.roomId,
          patientName: token.patientName
        },
        recipient: {
          id: token.patientName,
          phone: '+15550001234',
          email: 'patient@example.com',
          preferences: { sms: true, email: true, whatsapp: true, push: false }
        }
      });
    } else {
      session.status = 'PATIENT_WAITING';
      await session.save();
    }

    if (req.app.get('io')) {
      req.app.get('io').emit('PATIENT_JOINED_WAITING_ROOM', { tokenId, department: token.department });
      req.app.get('io').emit('QUEUE_UPDATED', { department: token.department });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Doctor starts the consultation
// @route   POST /api/telemedicine/start
exports.startConsultation = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await TelemedicineSession.findById(sessionId).populate('queueToken');
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    session.status = 'IN_PROGRESS';
    session.startedAt = Date.now();
    await session.save();

    // Sync queue token
    session.queueToken.status = 'IN_PROGRESS';
    await session.queueToken.save();

    if (req.app.get('io')) {
      req.app.get('io').emit('CONSULTATION_STARTED', { sessionId, tokenId: session.queueToken._id });
      req.app.get('io').emit('QUEUE_UPDATED', { department: session.queueToken.department });
    }

    await EventPublisher.publish({
      eventType: 'TelemedicineStarted',
      version: '1.0',
      aggregateId: session._id.toString(),
      tenantId: req.headers['x-tenant-id'] || 't-default',
      traceId: req.headers['x-trace-id'] || uuidv4(),
      payload: {
        roomId: session.roomId
      },
      recipient: {
        id: 'patient-id-placeholder',
        phone: '+15550001234',
        email: 'patient@example.com',
        preferences: { sms: true, email: false, whatsapp: false, push: true }
      }
    });

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    End consultation
// @route   POST /api/telemedicine/end
exports.endConsultation = async (req, res) => {
  try {
    const { sessionId, aiSummary } = req.body;
    const session = await TelemedicineSession.findById(sessionId).populate('queueToken');
    
    session.status = 'COMPLETED';
    session.endedAt = Date.now();
    if (aiSummary) session.aiSummary = aiSummary;
    await session.save();

    session.queueToken.status = 'COMPLETED';
    await session.queueToken.save();

    if (req.app.get('io')) {
      req.app.get('io').emit('CONSULTATION_COMPLETED', { sessionId });
      req.app.get('io').emit('QUEUE_UPDATED', { department: session.queueToken.department });
    }

    await EventPublisher.publish({
      eventType: 'TelemedicineEnded',
      version: '1.0',
      aggregateId: session._id.toString(),
      tenantId: req.headers['x-tenant-id'] || 't-default',
      traceId: req.headers['x-trace-id'] || uuidv4(),
      payload: {
        roomId: session.roomId,
        aiSummaryAvailable: !!aiSummary
      },
      recipient: {
        id: 'patient-id-placeholder',
        email: 'patient@example.com',
        preferences: { sms: false, email: true, whatsapp: false, push: false }
      }
    });

    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
