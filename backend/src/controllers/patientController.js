const Appointment = require('../models/Appointment');
const QueueToken = require('../models/QueueToken');
const Invoice = require('../models/Invoice');
const TelemedicineSession = require('../models/TelemedicineSession');
const ConsentDocument = require('../models/ConsentDocument');
const User = require('../models/User');

// @desc    Get complete patient digital health wallet overview
// @route   GET /api/patient/:patientId/wallet
exports.getPatientWallet = async (req, res) => {
  try {
    const { patientId } = req.params;
    const today = new Date();
    today.setHours(0,0,0,0);

    // 1. Fetch Patient Profile
    const profile = await User.findById(patientId).select('-password');
    if (!profile) return res.status(404).json({ success: false, error: 'Patient not found' });

    // 2. Fetch Active/Upcoming Appointments
    const appointments = await Appointment.find({ 
      patient: patientId, 
      date: { $gte: today } 
    }).populate('doctor', 'name').sort({ date: 1, timeSlot: 1 }).limit(5);

    // 3. Fetch Active Queue Tokens (Live wait time)
    const activeTokens = await QueueToken.find({ 
      patient: patientId, 
      createdAt: { $gte: today },
      status: { $in: ['WAITING', 'IN_PROGRESS'] }
    });

    // 4. Fetch Pending Invoices
    const pendingInvoices = await Invoice.find({
      patient: patientId,
      status: { $in: ['UNPAID', 'PARTIALLY_PAID'] }
    }).sort({ createdAt: -1 });

    // 5. Fetch Pending Consents
    const pendingConsents = await ConsentDocument.find({
      patient: patientId,
      status: 'REQUESTED'
    });

    // 6. Fetch Upcoming Telemedicine
    const telemedicine = await TelemedicineSession.find({
      patient: patientId,
      status: 'SCHEDULED'
    }).populate('doctor', 'name');

    res.json({
      success: true,
      data: {
        profile,
        appointments,
        activeTokens,
        pendingInvoices,
        pendingConsents,
        telemedicine
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
