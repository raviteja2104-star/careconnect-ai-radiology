const mongoose = require('mongoose');
const CommunicationMessage = require('../models/CommunicationMessage');
const User = require('../models/User');

// @desc    Get Communication Dashboard Stats
// @route   GET /api/communication/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalSent = await CommunicationMessage.countDocuments({ createdAt: { $gte: today } });
    const delivered = await CommunicationMessage.countDocuments({ status: { $in: ['DELIVERED', 'READ'] }, createdAt: { $gte: today } });
    const failed = await CommunicationMessage.countDocuments({ status: 'FAILED', createdAt: { $gte: today } });

    res.json({
      success: true,
      data: {
        totalSent,
        delivered,
        failed,
        deliveryRate: totalSent > 0 ? ((delivered / totalSent) * 100).toFixed(1) : 0,
        channels: {
          whatsapp: await CommunicationMessage.countDocuments({ channel: 'WhatsApp', createdAt: { $gte: today } }),
          sms: await CommunicationMessage.countDocuments({ channel: 'SMS', createdAt: { $gte: today } }),
          email: await CommunicationMessage.countDocuments({ channel: 'Email', createdAt: { $gte: today } })
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Send a manual or in-app message
// @route   POST /api/communication/send
exports.sendMessage = async (req, res) => {
  try {
    const {
      patientId,
      channel,
      content,
      text,
      relatedEvent,
      metadata,
      threadId: bodyThreadId,
      recipientId,
    } = req.body;

    const messageContent = content || text || '';
    if (!messageContent) {
      return res.status(400).json({ success: false, error: 'content or text is required' });
    }

    const resolvedPatientId = patientId || recipientId;
    if (!resolvedPatientId) {
      return res.status(400).json({ success: false, error: 'patientId or recipientId is required' });
    }

    const resolvedChannel = channel || 'In-App';
    const senderId = req.user?._id?.toString();

    // Derive a stable threadId from sorted participant IDs when not supplied
    const resolvedThreadId =
      bodyThreadId ||
      (senderId && resolvedPatientId
        ? [senderId, resolvedPatientId.toString()].sort().join('_')
        : resolvedPatientId.toString());

    const message = await CommunicationMessage.create({
      patient: resolvedPatientId,
      sender: req.user?._id || undefined,
      channel: resolvedChannel,
      content: messageContent,
      relatedEvent,
      metadata,
      threadId: resolvedThreadId,
      status: 'SENT',
      sentAt: new Date(),
    });

    if (req.app.get('io')) {
      req.app.get('io').emit('MESSAGE_SENT', { message });
    }

    res.status(201).json({
      success: true,
      data: { ...message.toObject(), threadId: resolvedThreadId },
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get list of conversation threads (grouped by threadId)
// @route   GET /api/communication/threads
exports.getThreads = async (req, res) => {
  try {
    // Group messages by effective threadId (threadId field, or patient id as fallback for old records)
    const threads = await CommunicationMessage.aggregate([
      {
        $addFields: {
          effectiveThread: {
            $ifNull: ['$threadId', { $toString: '$patient' }],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$effectiveThread',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $in: ['$status', ['PENDING', 'SENT', 'DELIVERED']] }, 1, 0],
            },
          },
          patientId: { $first: '$patient' },
          senderId: { $first: '$sender' },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    // Populate participant names
    const allIds = [
      ...new Set([
        ...threads.map(t => t.patientId).filter(Boolean).map(String),
        ...threads.map(t => t.senderId).filter(Boolean).map(String),
      ]),
    ];
    const users = await User.find({ _id: { $in: allIds } })
      .select('firstName lastName role')
      .lean();
    const userMap = Object.fromEntries(
      users.map(u => [u._id.toString(), { name: `${u.firstName} ${u.lastName}`, role: u.role }])
    );

    const formatted = threads.map(t => {
      const patientInfo = userMap[t.patientId?.toString()] || { name: 'Patient', role: 'patient' };
      return {
        _id: t._id,
        name: patientInfo.name,
        role: patientInfo.role,
        lastMessage: {
          text: t.lastMessage.content,
          createdAt: t.lastMessage.createdAt,
        },
        unreadCount: t.unreadCount,
        updatedAt: t.lastMessage.createdAt,
        language: t.lastMessage.language || 'English',
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get messages for a specific thread
// @route   GET /api/communication/threads/:threadId/messages
exports.getThreadMessages = async (req, res) => {
  try {
    const { threadId } = req.params;

    // Support both explicit threadId and patient-ID-as-thread (legacy records)
    const isObjectId = /^[0-9a-f]{24}$/i.test(threadId);
    const query = isObjectId
      ? { $or: [{ threadId }, { patient: threadId, threadId: { $exists: false } }] }
      : { threadId };

    const messages = await CommunicationMessage.find(query)
      .populate('patient', 'firstName lastName role')
      .populate('sender', 'firstName lastName role')
      .sort({ createdAt: 1 })
      .lean();

    // Normalise shape for the frontend mapMessage helper
    const normalised = messages.map(m => {
      const senderDoc = m.sender || m.patient;
      return {
        ...m,
        text: m.content,
        sender: senderDoc
          ? {
              _id: senderDoc._id,
              name: `${senderDoc.firstName} ${senderDoc.lastName}`,
              role: senderDoc.role,
            }
          : null,
      };
    });

    res.json({ success: true, data: normalised });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get recent messages log (legacy / admin view)
// @route   GET /api/communication/history
exports.getHistory = async (req, res) => {
  try {
    const { threadId } = req.query;

    const filter = threadId ? { threadId } : {};
    const messages = await CommunicationMessage.find(filter)
      .populate('patient', 'firstName lastName email phone')
      .populate('sender', 'firstName lastName role')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
