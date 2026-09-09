const DoctorSchedule = require('../models/DoctorSchedule');
const DoctorProfile  = require('../models/DoctorProfile');
const SchedulingEngine = require('../services/SchedulingEngine');

// @desc    Get schedule for a doctor
// @route   GET /api/schedules/:doctorId
exports.getDoctorSchedule = async (req, res) => {
  try {
    const { doctorId } = req.params;
    let schedule = await DoctorSchedule.findOne({ doctor: doctorId }).sort({ effectiveFrom: -1 });

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
      schedule.weeklySchedule = weeklySchedule || schedule.weeklySchedule;
      schedule.leaves = leaves || schedule.leaves;
      schedule.exceptions = exceptions || schedule.exceptions;
      await schedule.save();
    } else {
      schedule = await DoctorSchedule.create({
        doctor,
        hospital: hospital || 'CareConnect Main Hospital',
        weeklySchedule,
        leaves: leaves || [],
        exceptions: exceptions || []
      });
    }

    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get available time slots for a doctor on a date
// @route   GET /api/schedules/:doctorId/slots?date=YYYY-MM-DD
exports.getDoctorSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, error: 'date query param required (YYYY-MM-DD)' });

    const profile = await DoctorProfile.findOne({ user: doctorId }).select('hospital').lean();
    const slots = await SchedulingEngine.getAvailableSlots(doctorId, date, profile?.hospital);
    res.json({ success: true, data: slots, date });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Block a time slot (add exception entry)
// @route   POST /api/schedules/:doctorId/slots/block
exports.blockSlot = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, time, reason } = req.body;
    if (!date || !time) return res.status(400).json({ success: false, error: 'date and time required' });

    let schedule = await DoctorSchedule.findOne({ doctor: doctorId }).sort({ effectiveFrom: -1 });
    if (!schedule) return res.status(404).json({ success: false, error: 'No schedule found for this doctor' });

    // Add to exceptions as a single-slot block on that date
    const existing = schedule.exceptions.find(e => e.date === date);
    if (existing) {
      existing.blockedSlots = existing.blockedSlots || [];
      existing.blockedSlots.push({ time, reason: reason || 'Blocked by admin' });
    } else {
      schedule.exceptions.push({
        date,
        isCancelled: false,
        reason: null,
        blockedSlots: [{ time, reason: reason || 'Blocked by admin' }]
      });
    }

    await schedule.save();
    res.json({ success: true, data: { date, time, reason } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get leaves for a doctor
// @route   GET /api/schedules/:doctorId/leaves
exports.getDoctorLeaves = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const schedule = await DoctorSchedule.findOne({ doctor: doctorId }).sort({ effectiveFrom: -1 });
    const leaves = schedule?.leaves || [];
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Add a leave entry for a doctor
// @route   POST /api/schedules/:doctorId/leaves
exports.addLeave = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate, reason, type } = req.body;
    if (!startDate || !endDate) return res.status(400).json({ success: false, error: 'startDate and endDate required' });

    const VALID_TYPES = ['Vacation', 'Sick', 'Conference', 'Emergency', 'Other'];
    const leaveType = VALID_TYPES.includes(type) ? type : 'Other';

    let schedule = await DoctorSchedule.findOne({ doctor: doctorId }).sort({ effectiveFrom: -1 });
    if (!schedule) {
      schedule = await DoctorSchedule.create({
        doctor: doctorId,
        hospital: 'CareConnect Main Hospital',
        weeklySchedule: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] },
        leaves: [],
        exceptions: []
      });
    }

    const leave = { startDate: new Date(startDate), endDate: new Date(endDate), reason: reason || '', type: leaveType };
    schedule.leaves.push(leave);
    await schedule.save();

    const added = schedule.leaves[schedule.leaves.length - 1];
    res.status(201).json({ success: true, data: added });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete a leave entry
// @route   DELETE /api/schedules/:doctorId/leaves/:leaveId
exports.deleteLeave = async (req, res) => {
  try {
    const { doctorId, leaveId } = req.params;
    const schedule = await DoctorSchedule.findOne({ doctor: doctorId }).sort({ effectiveFrom: -1 });
    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });

    const idx = schedule.leaves.findIndex(l => l._id.toString() === leaveId);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Leave not found' });

    schedule.leaves.splice(idx, 1);
    await schedule.save();
    res.json({ success: true, data: { deleted: leaveId } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
