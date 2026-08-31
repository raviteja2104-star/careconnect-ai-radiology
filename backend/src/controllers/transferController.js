const PatientTransfer = require('../models/PatientTransfer');
const QueueToken = require('../models/QueueToken');

// @desc    Initiate a transfer to a new department
// @route   POST /api/transfers
exports.createTransfer = async (req, res) => {
  try {
    const { patientId, patientName, fromDepartment, toDepartment, requestedBy, priority, clinicalReason } = req.body;

    // 1. Create the Transfer Record
    const transfer = await PatientTransfer.create({
      patient: patientId,
      patientName,
      fromDepartment,
      toDepartment,
      requestedBy,
      priority,
      clinicalReason,
      status: 'WAITING'
    });

    // 2. Automatically generate a Queue Token for the receiving department
    const today = new Date();
    today.setHours(0,0,0,0);
    const count = await QueueToken.countDocuments({ department: toDepartment, createdAt: { $gte: today } });
    const deptPrefix = toDepartment.substring(0, 3).toUpperCase();
    const tokenNumber = `${deptPrefix}-${String(count + 1).padStart(3, '0')}`;

    let priorityScore = 0;
    if (priority === 'Emergency' || priority === 'STAT') priorityScore = 10;
    if (priority === 'Urgent') priorityScore = 5;

    const token = await QueueToken.create({
      tokenNumber,
      patient: patientId,
      patientName,
      department: toDepartment,
      priorityReason: priority,
      priority: priorityScore,
      status: 'WAITING'
    });

    // Link token to transfer
    transfer.queueToken = token._id;
    await transfer.save();

    // 3. Fire WebSockets
    if (req.app.get('io')) {
      // Notify receiving department of new token
      req.app.get('io').emit('QUEUE_UPDATED', { department: toDepartment });
      // Broadcast transfer event
      req.app.get('io').emit('TRANSFER_CREATED', { transfer, token });
    }

    res.status(201).json({ success: true, data: { transfer, token } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get patient journey map (all transfers and tokens)
// @route   GET /api/transfers/journey/:patientId
exports.getPatientJourney = async (req, res) => {
  try {
    const { patientId } = req.params;
    const today = new Date();
    today.setHours(0,0,0,0);

    const transfers = await PatientTransfer.find({ patient: patientId, createdAt: { $gte: today } })
      .populate('requestedBy', 'name')
      .populate('queueToken')
      .sort({ createdAt: 1 });

    const tokens = await QueueToken.find({ patient: patientId, createdAt: { $gte: today } })
      .sort({ createdAt: 1 });

    res.json({ success: true, data: { transfers, tokens } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
