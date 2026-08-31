const Appointment = require('../models/Appointment');
const QueueToken = require('../models/QueueToken');
const User = require('../models/User');

// @desc    Kiosk Check-in for existing appointment via Phone or UHID
// @route   POST /api/kiosk/checkin
exports.kioskCheckIn = async (req, res) => {
  try {
    const { identifier } = req.body; // Phone number or UHID or QR data
    const today = new Date();
    today.setHours(0,0,0,0);

    // Find the patient first
    const patient = await User.findOne({ 
      $or: [{ phone: identifier }, { uhid: identifier }, { email: identifier }] 
    });

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found. Please register at the desk.' });
    }

    // Find today's appointment for this patient
    const appointment = await Appointment.findOne({ 
      patient: patient._id, 
      date: { $gte: today },
      status: { $in: ['Booked', 'Confirmed'] }
    }).populate('doctor', 'name');

    if (!appointment) {
      return res.status(404).json({ success: false, error: 'No upcoming appointments found for today.' });
    }

    // Process Check-in
    appointment.status = 'Checked_In';
    await appointment.save();

    // Generate Queue Token
    const count = await QueueToken.countDocuments({ department: appointment.specialty, createdAt: { $gte: today } });
    const deptPrefix = appointment.specialty.substring(0, 3).toUpperCase();
    const tokenNumber = `${deptPrefix}-${String(count + 1).padStart(3, '0')}`;

    const token = await QueueToken.create({
      tokenNumber,
      patient: patient._id,
      patientName: patient.name,
      appointment: appointment._id,
      department: appointment.specialty,
      doctor: appointment.doctor._id,
      priorityReason: 'Normal',
      status: 'WAITING'
    });

    if (req.app.get('io')) {
      req.app.get('io').emit('QUEUE_UPDATED', { department: appointment.specialty });
      req.app.get('io').emit('SELF_CHECKIN_COMPLETED', { tokenNumber });
    }

    res.status(200).json({ success: true, data: { appointment, token } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Kiosk Walk-in Registration
// @route   POST /api/kiosk/register
exports.kioskRegister = async (req, res) => {
  try {
    const { patientName, phone, department, doctorId } = req.body;

    // Simulate basic registration + token generation
    const today = new Date();
    today.setHours(0,0,0,0);
    const count = await QueueToken.countDocuments({ department, createdAt: { $gte: today } });
    const deptPrefix = department.substring(0, 3).toUpperCase();
    const tokenNumber = `${deptPrefix}-${String(count + 1).padStart(3, '0')}`;

    const token = await QueueToken.create({
      tokenNumber,
      patientName,
      department,
      doctor: doctorId || null,
      priorityReason: 'Normal',
      status: 'WAITING'
    });

    if (req.app.get('io')) {
      req.app.get('io').emit('QUEUE_UPDATED', { department });
    }

    res.status(201).json({ success: true, data: token });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
