const DoctorSchedule = require('../models/DoctorSchedule');

// @desc    Get schedule for a doctor
// @route   GET /api/schedules/:doctorId
exports.getDoctorSchedule = async (req, res) => {
  try {
    const { doctorId } = req.params;
    let schedule = await DoctorSchedule.findOne({ doctor: doctorId }).sort({ effectiveFrom: -1 });
    
    // If no schedule exists, return a blank template
    if (!schedule) {
      return res.json({
        success: true,
        data: {
          doctor: doctorId,
          hospital: 'CareConnect Main Hospital',
          weeklySchedule: {
            Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: []
          },
          leaves: [],
          exceptions: []
        }
      });
    }
    
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Create or update schedule
// @route   POST /api/schedules
exports.saveDoctorSchedule = async (req, res) => {
  try {
    const { doctor, hospital, weeklySchedule, leaves, exceptions } = req.body;

    let schedule = await DoctorSchedule.findOne({ doctor, hospital }).sort({ effectiveFrom: -1 });

    if (schedule) {
      // Update existing
      schedule.weeklySchedule = weeklySchedule || schedule.weeklySchedule;
      schedule.leaves = leaves || schedule.leaves;
      schedule.exceptions = exceptions || schedule.exceptions;
      await schedule.save();
    } else {
      // Create new
      schedule = await DoctorSchedule.create({
        doctor,
        hospital: hospital || 'CareConnect Main Hospital',
        weeklySchedule,
        leaves: leaves || [],
        exceptions: exceptions || []
      });
    }

    // In a real app, publish event SCHEDULE_UPDATED here
    // require('../services/EventBus').publish('SCHEDULE_UPDATED', { doctor, hospital });

    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
