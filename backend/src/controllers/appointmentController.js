const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const EventPublisher = require('../services/EventPublisher');
const SchedulingEngine = require('../services/SchedulingEngine');
const TxRunner = require('../services/TxRunner');
const { v4: uuidv4 } = require('uuid');

// @desc    Get specialties
// @route   GET /api/appointments/specialties
exports.getSpecialties = async (req, res) => {
  try {
    const specialties = [
      { id: 'Cardiology', name: 'Cardiology', icon: 'Heart', desc: 'Heart and cardiovascular system' },
      { id: 'Neurology', name: 'Neurology', icon: 'Brain', desc: 'Brain and nervous system' },
      { id: 'Orthopedics', name: 'Orthopedics', icon: 'Activity', desc: 'Bones, joints, ligaments' },
      { id: 'Pediatrics', name: 'Pediatrics', icon: 'Baby', desc: 'Child healthcare' },
      { id: 'Ophthalmology', name: 'Ophthalmology', icon: 'Eye', desc: 'Eye and vision care' },
      { id: 'General Medicine', name: 'General Medicine', icon: 'Stethoscope', desc: 'Primary healthcare' },
    ];
    res.json({ success: true, data: specialties });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get doctors by specialty
// @route   GET /api/appointments/doctors?specialty=Cardiology
exports.getDoctors = async (req, res) => {
  try {
    const { specialty } = req.query;
    let query = {};
    if (specialty) {
      query.specialty = specialty;
    }
    
    // In a real app, you would populate from User
    const profiles = await DoctorProfile.find(query).populate('user', 'name profilePicture');
    
    // If DB is empty, return some mocks for development
    if (profiles.length === 0) {
      return res.json({ success: true, data: [
        { _id: 'mock1', name: 'Dr. Sarah Johnson', specialty: specialty || 'Cardiology', rating: 4.9, exp: '15 Yrs', nextSlot: 'Today, 02:00 PM', image: 'https://i.pravatar.cc/150?u=doc1' },
        { _id: 'mock2', name: 'Dr. Michael Brown', specialty: specialty || 'General Medicine', rating: 4.7, exp: '10 Yrs', nextSlot: 'Tomorrow, 10:00 AM', image: 'https://i.pravatar.cc/150?u=doc2' },
      ]});
    }

    const formatted = profiles.map(p => ({
      _id: p.user._id,
      name: p.user.name,
      specialty: p.specialty,
      rating: p.rating,
      exp: `${p.experienceYears} Yrs`,
      nextSlot: 'Today, Available',
      image: p.user.profilePicture || 'https://i.pravatar.cc/150?u=doc1'
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get doctor availability
// @route   GET /api/appointments/doctors/:id/availability?date=2024-05-25
exports.getAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ success: false, error: 'Date is required' });
    }

    const availableSlots = await SchedulingEngine.getAvailableSlots(id, date);
    
    // Fallback to mock for testing UI if engine returns no slots because DB is empty
    if (availableSlots.length === 0) {
      const mockSlots = [
        '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
        '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
      ];
      return res.json({ success: true, data: mockSlots });
    }

    res.json({ success: true, data: availableSlots });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Book an appointment
// @route   POST /api/appointments
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, specialty, date, timeSlot, visitType, reason, insuranceApplied } = req.body;
    
    // Note: in a real app req.user._id would come from auth middleware
    const patientId = req.user ? req.user._id : new mongoose.Types.ObjectId(); 
    
    // For MVP, if doctorId is 'mock1', we generate a fake object ID to avoid cast errors
    const validDoctorId = mongoose.Types.ObjectId.isValid(doctorId) ? doctorId : new mongoose.Types.ObjectId();

    const patient = await User.findById(patientId);
    const doctor = await DoctorProfile.findOne({ user: validDoctorId }).populate('user');
    const traceId = req.headers['x-trace-id'] || uuidv4();

    // Appointment write + outbox row commit atomically (transactional outbox);
    // falls back to sequential writes on standalone MongoDB.
    const appointment = await TxRunner.run(async (session) => {
      const [appt] = session
        ? await Appointment.create([{
            patient: patientId,
            doctor: validDoctorId,
            specialty,
            date,
            timeSlot,
            visitType,
            reason,
            insuranceApplied,
            status: 'Booked'
          }], { session })
        : [await Appointment.create({
            patient: patientId,
            doctor: validDoctorId,
            specialty,
            date,
            timeSlot,
            visitType,
            reason,
            insuranceApplied,
            status: 'Booked'
          })];

      await EventPublisher.publish({
        session,
        eventType: 'AppointmentBooked',
        version: '1.0',
        aggregateId: appt._id,
        tenantId: 't-default',
        traceId: traceId,
        payload: {
          patientName: patient ? patient.name : 'Valued Patient',
          doctorName: doctor && doctor.user ? doctor.user.name : 'Your Doctor',
          appointmentDate: date,
          appointmentTime: timeSlot,
          hospitalName: 'CareConnect Main Center'
        },
        recipient: {
          id: patientId.toString(),
          phone: patient ? patient.phone : '+15550000000',
          email: patient ? patient.email : 'patient@example.com',
          preferences: { sms: true, email: true, whatsapp: false, push: false }
        }
      });

      return appt;
    });

    res.status(201).json({ success: true, data: appointment, traceId });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get user appointments
// @route   GET /api/appointments
exports.getAppointments = async (req, res) => {
  try {
    // Note: in a real app, query by req.user._id
    const appointments = await Appointment.find().populate('doctor', 'name profilePicture');
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
