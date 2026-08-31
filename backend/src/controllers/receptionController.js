const Appointment = require('../models/Appointment');
const QueueToken = require('../models/QueueToken');
const User = require('../models/User'); // Patients and Doctors

// @desc    Get Reception Dashboard Stats
// @route   GET /api/reception/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointmentsToday = await Appointment.countDocuments({ date: { $gte: today } });
    const tokensToday = await QueueToken.countDocuments({ createdAt: { $gte: today } });
    const waitingTokens = await QueueToken.countDocuments({ status: 'WAITING', createdAt: { $gte: today } });
    const completedTokens = await QueueToken.countDocuments({ status: 'COMPLETED', createdAt: { $gte: today } });

    res.json({
      success: true,
      data: {
        appointmentsToday,
        walkInsToday: tokensToday - appointmentsToday > 0 ? tokensToday - appointmentsToday : Math.floor(tokensToday * 0.4), // approx if no precise walkin tracking
        checkedIn: tokensToday,
        waiting: waitingTokens,
        completed: completedTokens,
        revenueCollected: tokensToday * 500, // mock revenue for UI
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get appointments for today
// @route   GET /api/reception/appointments
exports.getAppointments = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // In real app, date filters exactly today
    const appointments = await Appointment.find({ date: { $gte: today } })
      .populate('doctor', 'name')
      .populate('patient', 'name email phone');
      
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Check-in an appointment (Generates Queue Token)
// @route   POST /api/reception/checkin
exports.checkinAppointment = async (req, res) => {
  try {
    const { appointmentId, paymentCollected } = req.body;
    
    const appointment = await Appointment.findById(appointmentId).populate('doctor', 'name').populate('patient', 'name');
    if (!appointment) return res.status(404).json({ success: false, error: 'Appointment not found' });
    if (appointment.status === 'Checked_In') return res.status(400).json({ success: false, error: 'Already checked in' });

    // Update appointment
    appointment.status = 'Checked_In';
    if (paymentCollected) appointment.paymentStatus = 'Completed';
    await appointment.save();

    // Generate Queue Token
    const today = new Date();
    today.setHours(0,0,0,0);
    const count = await QueueToken.countDocuments({ department: appointment.specialty, createdAt: { $gte: today } });
    const deptPrefix = appointment.specialty.substring(0, 3).toUpperCase();
    const tokenNumber = `${deptPrefix}-${String(count + 1).padStart(3, '0')}`;

    let priority = 0;
    if (appointment.visitType === 'Video Call') priority = 2; // Telemed slight priority

    const token = await QueueToken.create({
      tokenNumber,
      patient: appointment.patient._id,
      patientName: appointment.patient.name,
      appointment: appointment._id,
      department: appointment.specialty,
      doctor: appointment.doctor._id,
      priorityReason: 'Normal',
      priority,
      status: 'WAITING'
    });

    // Fire WebSockets
    if (req.app.get('io')) {
      req.app.get('io').emit('QUEUE_UPDATED', { department: appointment.specialty });
      req.app.get('io').emit('APPOINTMENT_CHECKED_IN', { appointmentId: appointment._id });
    }

    res.status(200).json({ success: true, data: { appointment, token } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Register walk-in patient and generate token
// @route   POST /api/reception/walkin
exports.registerWalkIn = async (req, res) => {
  try {
    const { patientName, phone, department, doctorId, priorityReason } = req.body;
    
    // In full app, create or find User account
    
    // Generate Token
    const today = new Date();
    today.setHours(0,0,0,0);
    const count = await QueueToken.countDocuments({ department, createdAt: { $gte: today } });
    const deptPrefix = department.substring(0, 3).toUpperCase();
    const tokenNumber = `${deptPrefix}-${String(count + 1).padStart(3, '0')}`;

    let priority = 0;
    if (priorityReason === 'Emergency') priority = 10;
    if (priorityReason === 'VIP') priority = 5;

    const token = await QueueToken.create({
      tokenNumber,
      patientName,
      department,
      doctor: doctorId,
      priorityReason: priorityReason || 'Normal',
      priority,
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
