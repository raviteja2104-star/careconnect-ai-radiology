const CapacityRecommendation = require('../models/CapacityRecommendation');
const QueueToken = require('../models/QueueToken');

// @desc    Get live AI queue predictions and metrics
// @route   GET /api/operations/predictions
exports.getPredictions = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);

    // Mock real-time aggregation across the hospital queues
    const queueGroups = await QueueToken.aggregate([
      { $match: { createdAt: { $gte: today }, status: 'WAITING' } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    const predictions = queueGroups.map(q => {
      // Basic heuristic: 15 mins per patient average
      const estimatedWaitMins = q.count * 15;
      let severity = 'LOW';
      if (estimatedWaitMins > 45) severity = 'MEDIUM';
      if (estimatedWaitMins > 90) severity = 'HIGH';
      if (estimatedWaitMins > 120) severity = 'CRITICAL';

      return {
        department: q._id,
        currentQueue: q.count,
        predictedWaitTime: estimatedWaitMins,
        predictedNextHourVolume: Math.round(q.count * 1.5),
        severity,
        confidence: 85 + Math.floor(Math.random() * 10)
      };
    });

    res.json({ success: true, data: predictions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get active AI recommendations requiring approval
// @route   GET /api/operations/recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const recommendations = await CapacityRecommendation.find({ status: 'PENDING' }).sort({ createdAt: -1 });
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Run a queue simulation (What-If analysis)
// @route   POST /api/operations/simulate
exports.runSimulation = async (req, res) => {
  try {
    const { department, action, parameter } = req.body;
    
    // Simulate AI model response
    let waitTimeReduction = 0;
    if (action === 'ADD_DOCTOR') waitTimeReduction = 35;
    if (action === 'EXTEND_HOURS') waitTimeReduction = 20;

    res.json({
      success: true,
      data: {
        department,
        action,
        predictedWaitTimeReductionPercent: waitTimeReduction,
        confidence: 92,
        notes: `Simulated adding ${parameter}. Wait times will stabilize in approx 45 minutes.`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
