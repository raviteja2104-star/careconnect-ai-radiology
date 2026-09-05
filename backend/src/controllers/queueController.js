const QueueToken = require('../models/QueueToken');
const EventPublisher = require('../services/EventPublisher');
const { v4: uuidv4 } = require('uuid');

// @desc    Generate a new token (Check-in)
// @route   POST /api/queue/token
exports.generateToken = async (req, res) => {
  try {
    const { patientName, department, doctor, priorityReason } = req.body;
    
    // Generate token number (e.g. OPD-001)
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const count = await QueueToken.countDocuments({ 
      department, 
      createdAt: { $gte: today } 
    });
    
    const deptPrefix = department.substring(0, 3).toUpperCase();
    const tokenNumber = `${deptPrefix}-${String(count + 1).padStart(3, '0')}`;
    
    let priority = 0;
    if (priorityReason === 'Emergency') priority = 10;
    if (priorityReason === 'VIP') priority = 5;

    const token = await QueueToken.create({
      tokenNumber,
      patientName,
      department,
      doctor,
      priorityReason,
      priority,
      status: 'WAITING'
    });

    // Publish WebSocket event
    if (req.app.get('io')) {
      req.app.get('io').emit('QUEUE_UPDATED', { department, token });
    }

    res.status(201).json({ success: true, data: token });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get active queue for a department
// @route   GET /api/queue/:department
exports.getDepartmentQueue = async (req, res) => {
  try {
    const { department } = req.params;
    
    const tokens = await QueueToken.find({
      department,
      status: { $in: ['WAITING', 'CALLED', 'IN_PROGRESS'] }
    })
    .sort({ status: 1, priority: -1, createdAt: 1 })
    .populate('doctor', 'name');

    res.json({ success: true, data: tokens });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Complete a consultation (close the token)
// @route   POST /api/queue/complete/:id
exports.completeToken = async (req, res) => {
  try {
    const token = await QueueToken.findById(req.params.id);
    if (!token) return res.status(404).json({ success: false, error: 'Token not found' });

    token.status = 'COMPLETED';
    token.completedAt = Date.now();
    await token.save();

    if (req.app.get('io')) {
      req.app.get('io').emit('QUEUE_UPDATED', { department: token.department });
    }

    res.json({ success: true, data: token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Call a token
// @route   POST /api/queue/call/:id
exports.callToken = async (req, res) => {
  try {
    const token = await QueueToken.findById(req.params.id);
    if (!token) return res.status(404).json({ success: false, error: 'Token not found' });
    
    token.status = 'CALLED';
    token.calledAt = Date.now();
    token.room = req.body.room || 'OPD-1';
    await token.save();

    // Publish WebSocket event
    if (req.app.get('io')) {
      req.app.get('io').emit('TOKEN_CALLED', { department: token.department, token });
      req.app.get('io').emit('QUEUE_UPDATED', { department: token.department });
    }

    // Publish Notification Intent to Outbox
    await EventPublisher.publish({
      eventType: 'QueueCalled',
      version: '1.0',
      aggregateId: token._id.toString(),
      tenantId: req.headers['x-tenant-id'] || 't-default',
      traceId: req.headers['x-trace-id'] || uuidv4(),
      payload: {
        patientName: token.patientName,
        tokenNumber: token.tokenNumber,
        department: token.department,
        room: token.room
      },
      recipient: {
        id: token.patientName, // Needs patient mapping in real app
        phone: '+15550001234', // Mocked for scaffolding
        preferences: { sms: true, push: true, whatsapp: true, email: false }
      }
    });

    res.json({ success: true, data: token });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
