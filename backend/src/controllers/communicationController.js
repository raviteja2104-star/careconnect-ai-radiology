const CommunicationMessage = require('../models/CommunicationMessage');

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

// @desc    Send a manual or automated message
// @route   POST /api/communication/send
exports.sendMessage = async (req, res) => {
  try {
    const { patientId, channel, content, relatedEvent, metadata } = req.body;
    
    const message = await CommunicationMessage.create({
      patient: patientId,
      channel,
      content,
      relatedEvent,
      metadata,
      status: 'SENT', // Mocking instant send
      sentAt: Date.now()
    });

    if (req.app.get('io')) {
      req.app.get('io').emit('MESSAGE_SENT', { message });
    }

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get recent messages log
// @route   GET /api/communication/history
exports.getHistory = async (req, res) => {
  try {
    const messages = await CommunicationMessage.find()
      .populate('patient', 'name phone email')
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
