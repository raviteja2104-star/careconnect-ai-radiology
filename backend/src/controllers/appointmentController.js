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
    
    const profiles = await DoctorProfile.find(query).populate('user', 'firstName lastName profilePicture');

    if (profiles.length > 0) {
      const formatted = profiles.map(p => ({
        _id: p.user?._id || p._id,
        name: p.user ? `${p.user.firstName} ${p.user.lastName}` : p.name,
        specialty: p.specialty,
        rating: p.rating || 4.5,
        exp: `${p.experienceYears || 0} Yrs`,
        nextSlot: 'Today, Available',
        image: p.user?.profilePicture || null,
      }));
      return res.json({ success: true, data: formatted });
    }

    // Fall back to User collection (real doctors in the system)
    const userQuery = { role: 'doctor', isActive: true };
    if (specialty) userQuery.specialization = specialty;
    const doctors = await User.find(userQuery).select('firstName lastName specialization consultationFee rating').lean();
    const formatted = doctors.map(d => ({
      _id: d._id,
      name: `${d.firstName} ${d.lastName}`,
      specialty: d.specialization || 'General Medicine',
      rating: d.rating || 4.5,
      exp: d.experience ? `${d.experience} Yrs` : 'N/A',
      nextSlot: 'Today, Available',
      image: null,
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
    res.json({ success: true, data: availableSlots });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Book an appointment
// @route   POST /api/appointments
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, specialty, date, timeSlot, visitType, reason, insuranceApplied, patientId: bodyPatientId } = req.body;

    // Patients book for themselves; staff/admin may specify patientId in the body
    const patientId = bodyPatientId && req.user?.role !== 'patient'
        ? bodyPatientId
        : req.user?._id;

    if (!patientId) {
        return res.status(400).json({ success: false, message: 'Patient ID is required.' });
    }

    if (!doctorId || !mongoose.Types.ObjectId.isValid(doctorId)) {
        return res.status(400).json({ success: false, message: 'A valid doctor ID is required.' });
    }
    const validDoctorId = doctorId;

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
          patientName: patient ? [patient.firstName, patient.lastName].filter(Boolean).join(' ') : 'Valued Patient',
          doctorName: doctor?.user ? [doctor.user.firstName, doctor.user.lastName].filter(Boolean).join(' ') : 'Your Doctor',
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

// @desc    Cancel an appointment
// @route   PATCH /api/appointments/:id/cancel
exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID.' });
    }

    const appt = await Appointment.findById(id);
    if (!appt) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const isOwner = appt.patient.toString() === req.user._id.toString();
    const isStaff = ['admin', 'staff', 'receptionist', 'nurse'].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: 'You are not authorised to cancel this appointment.' });
    }

    const cancellableStatuses = ['Booked', 'Confirmed'];
    if (!cancellableStatuses.includes(appt.status)) {
      return res.status(409).json({ success: false, message: `Cannot cancel an appointment with status "${appt.status}".` });
    }

    const patient = await User.findById(appt.patient);
    const doctor = await DoctorProfile.findOne({ user: appt.doctor }).populate('user');
    const traceId = req.headers['x-trace-id'] || uuidv4();

    await TxRunner.run(async (session) => {
      appt.status = 'Cancelled';
      appt.cancelledAt = new Date();
      if (reason) appt.cancellationReason = reason;
      if (session) {
        await appt.save({ session });
      } else {
        await appt.save();
      }

      await EventPublisher.publish({
        session,
        eventType: 'AppointmentCancelled',
        version: '1.0',
        aggregateId: appt._id,
        tenantId: 't-default',
        traceId,
        payload: {
          patientName: patient ? [patient.firstName, patient.lastName].filter(Boolean).join(' ') : 'Valued Patient',
          doctorName: doctor?.user ? [doctor.user.firstName, doctor.user.lastName].filter(Boolean).join(' ') : 'Your Doctor',
          appointmentDate: appt.date,
          appointmentTime: appt.timeSlot,
          reason: reason || null,
        },
        recipient: {
          id: appt.patient.toString(),
          phone: patient?.phone || '+15550000000',
          email: patient?.email || 'patient@example.com',
          preferences: { sms: true, email: true, whatsapp: false, push: false },
        },
      });
    });

    res.json({ success: true, data: appt });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Reschedule an appointment to a new date + time slot
// @route   PATCH /api/appointments/:id/reschedule
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, timeSlot } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID.' });
    }
    if (!date || !timeSlot) {
      return res.status(400).json({ success: false, message: 'New date and timeSlot are required.' });
    }

    const appt = await Appointment.findById(id);
    if (!appt) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    const isOwner = appt.patient.toString() === req.user._id.toString();
    const isStaff = ['admin', 'staff', 'receptionist', 'nurse'].includes(req.user.role);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: 'You are not authorised to reschedule this appointment.' });
    }

    const reschedulableStatuses = ['Booked', 'Confirmed'];
    if (!reschedulableStatuses.includes(appt.status)) {
      return res.status(409).json({ success: false, message: `Cannot reschedule an appointment with status "${appt.status}".` });
    }

    const oldDate = appt.date;
    const oldSlot = appt.timeSlot;

    const patient = await User.findById(appt.patient);
    const doctor = await DoctorProfile.findOne({ user: appt.doctor }).populate('user');
    const traceId = req.headers['x-trace-id'] || uuidv4();

    await TxRunner.run(async (session) => {
      appt.date = new Date(date);
      appt.timeSlot = timeSlot;
      appt.status = 'Booked';
      if (session) {
        await appt.save({ session });
      } else {
        await appt.save();
      }

      await EventPublisher.publish({
        session,
        eventType: 'AppointmentRescheduled',
        version: '1.0',
        aggregateId: appt._id,
        tenantId: req.headers['x-tenant-id'] || 't-default',
        traceId,
        payload: {
          patientName: patient ? [patient.firstName, patient.lastName].filter(Boolean).join(' ') : 'Valued Patient',
          doctorName: doctor?.user ? [doctor.user.firstName, doctor.user.lastName].filter(Boolean).join(' ') : 'Your Doctor',
          oldDate,
          oldTimeSlot: oldSlot,
          newDate: appt.date,
          newTimeSlot: appt.timeSlot,
        },
        recipient: {
          id: appt.patient.toString(),
          phone: patient?.phone || '+15550000000',
          email: patient?.email || 'patient@example.com',
          preferences: { sms: true, email: true, whatsapp: false, push: false },
        },
      });
    });

    res.json({ success: true, data: appt });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get user appointments (patient-scoped, auth required)
// @route   GET /api/appointments?type=video&status=Booked
exports.getAppointments = async (req, res) => {
  try {
    const filter = { patient: req.user._id };
    if (req.query.type === 'video') filter.visitType = 'Video Call';
    if (req.query.status) filter.status = req.query.status;

    const appointments = await Appointment
      .find(filter)
      .populate('doctor', 'firstName lastName email specialization')
      .sort({ date: 1 })
      .lean();

    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
