const QueueToken = require('../models/QueueToken');
const PatientTransfer = require('../models/PatientTransfer');
const Appointment = require('../models/Appointment');
const TelemedicineSession = require('../models/TelemedicineSession');

// @desc    Get Live Operations Wall (Aggregated counts)
// @route   GET /api/command/live
exports.getLiveStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);

    const appointments = await Appointment.countDocuments({ date: { $gte: today } });
    const waitingTokens = await QueueToken.countDocuments({ status: 'WAITING', createdAt: { $gte: today } });
    const inProgressTokens = await QueueToken.countDocuments({ status: 'IN_PROGRESS', createdAt: { $gte: today } });
    const activeTransfers = await PatientTransfer.countDocuments({ status: { $in: ['REQUESTED', 'WAITING', 'IN_PROGRESS'] }, createdAt: { $gte: today } });
    const telemedicineActive = await TelemedicineSession.countDocuments({ status: { $in: ['PATIENT_WAITING', 'IN_PROGRESS'] }, createdAt: { $gte: today } });

    res.json({
      success: true,
      data: {
        appointments,
        waitingTokens,
        inProgressTokens,
        activeTransfers,
        telemedicineActive,
        totalInSystem: waitingTokens + inProgressTokens
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get active patient flow (Current transfers and queues)
// @route   GET /api/command/patient-flow
exports.getPatientFlow = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);

    // Group active queue tokens by department
    const queueDistribution = await QueueToken.aggregate([
      { $match: { createdAt: { $gte: today }, status: { $in: ['WAITING', 'IN_PROGRESS'] } } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    const activeTransfers = await PatientTransfer.find({ 
      status: { $in: ['REQUESTED', 'WAITING', 'IN_PROGRESS'] },
      createdAt: { $gte: today }
    }).populate('patient', 'name').limit(20);

    res.json({
      success: true,
      data: {
        heatmap: queueDistribution.map(d => ({ department: d._id, count: d.count })),
        transfers: activeTransfers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get real-time events stream
// @route   GET /api/command/events
exports.getEventsLog = async (req, res) => {
  // In a real system this would query an EventStore or Audit Log.
  // We'll mock the endpoint for initial load; WebSockets handle the live feed.
  res.json({ success: true, data: [] });
};
