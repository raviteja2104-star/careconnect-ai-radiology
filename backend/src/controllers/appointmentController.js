const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const EventPublisher = require('../services/EventPublisher');
const SchedulingEngine = require('../services/SchedulingEngine');
const TxRunner = require('../services/TxRunner');
const { v4: uuidv4 } = require('uuid');

const SPECIALTY_FALLBACK = [
  { id: 'Cardiology', name: 'Cardiology', icon: 'Heart', desc: 'Heart and cardiovascular system' },
  { id: 'Neurology', name: 'Neurology', icon: 'Brain', desc: 'Brain and nervous system' },
  { id: 'Orthopedics', name: 'Orthopedics', icon: 'Activity', desc: 'Bones, joints, ligaments' },
  { id: 'Pediatrics', name: 'Pediatrics', icon: 'Baby', desc: 'Child healthcare' },
  { id: 'Ophthalmology', name: 'Ophthalmology', icon: 'Eye', desc: 'Eye and vision care' },
  { id: 'General Medicine', name: 'General Medicine', icon: 'Stethoscope', desc: 'Primary healthcare' },
];

const SPECIALTY_META = {
  Cardiology: { icon: 'Heart', desc: 'Heart and cardiovascular system' },
  Neurology: { icon: 'Brain', desc: 'Brain and nervous system' },
  Orthopedics: { icon: 'Activity', desc: 'Bones, joints, ligaments' },
  Pediatrics: { icon: 'Baby', desc: 'Child healthcare' },
  Ophthalmology: { icon: 'Eye', desc: 'Eye and vision care' },
  'General Medicine': { icon: 'Stethoscope', desc: 'Primary healthcare' },
  Dermatology: { icon: 'Stethoscope', desc: 'Skin, hair and nails' },
  Gastroenterology: { icon: 'Activity', desc: 'Digestive system' },
  Oncology: { icon: 'Stethoscope', desc: 'Cancer care' },
  Psychiatry: { icon: 'Brain', desc: 'Mental health' },
  Radiology: { icon: 'Eye', desc: 'Medical imaging' },
  Urology: { icon: 'Stethoscope', desc: 'Urinary tract and male health' },
};

// @desc    Get specialties
// @route   GET /api/appointments/specialties
exports.getSpecialties = async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    if (!isConnected) {
      return res.json({ success: true, data: SPECIALTY_FALLBACK, source: 'fallback' });
    }

    const distinct = await DoctorProfile.distinct('specialty');

    if (!distinct || distinct.length === 0) {
      return res.json({ success: true, data: SPECIALTY_FALLBACK, source: 'fallback' });
    }

    const specialties = distinct
      .filter(Boolean)
      .map(s => ({
        id: s,
        name: s,
        icon: SPECIALTY_META[s]?.icon || 'Stethoscope',
        desc: SPECIALTY_META[s]?.desc || `${s} specialist`,
      }));

    res.json({ success: true, data: specialties, source: 'db' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get doctors with optional filters
// @route   GET /api/appointments/doctors?specialty=&hospital=&department=&status=
exports.getDoctors = async (req, res) => {
  try {
    const { specialty, hospital, department, status } = req.query;
    const profileQuery = {};
    if (specialty) profileQuery.specialty = specialty;
    if (hospital) profileQuery.hospital = hospital;
    if (department) profileQuery.department = department;

    const profiles = await DoctorProfile.find(profileQuery)
      .populate('user', 'firstName lastName profilePicture isActive specialization department hospital gender phone email')
      .lean();

    if (profiles.length > 0) {
      const formatted = profiles
        .filter(p => {
          if (status === 'active') return p.user?.isActive !== false;
          if (status === 'inactive') return p.user?.isActive === false;
          return true;
        })
        .map(p => ({
          _id: p.user?._id || p._id,
          profileId: p._id,
          name: p.user ? `${p.user.firstName} ${p.user.lastName}` : 'Unknown',
          specialty: p.specialty,
          department: p.department || p.user?.department || '',
          hospital: p.hospital || p.user?.hospital || 'CareConnect Main Hospital',
          rating: p.rating || 4.5,
          experienceYears: p.experienceYears || 0,
          exp: `${p.experienceYears || 0} Yrs`,
          consultationFee: p.consultationFee || 0,
          consultationType: p.consultationType || 'In-Person',
          room: p.room || '',
          isActive: p.user?.isActive !== false,
          image: p.user?.profilePicture || null,
          phone: p.user?.phone || '',
          email: p.user?.email || '',
          gender: p.user?.gender || '',
        }));
      return res.json({ success: true, data: formatted });
    }

    // Fallback: User collection
    const userQuery = { role: 'doctor' };
    if (status === 'active') userQuery.isActive = true;
    if (status === 'inactive') userQuery.isActive = false;
    if (specialty) userQuery.specialization = specialty;
    if (hospital) userQuery.hospital = hospital;
    if (department) userQuery.department = department;
    const doctors = await User.find(userQuery)
      .select('firstName lastName specialization department hospital consultationFee rating isActive phone email gender')
      .lean();
    const formatted = doctors.map(d => ({
      _id: d._id,
      profileId: null,
      name: `${d.firstName} ${d.lastName}`,
      specialty: d.specialization || 'General Medicine',
      department: d.department || '',
      hospital: d.hospital || 'CareConnect Main Hospital',
      rating: d.rating || 4.5,
      experienceYears: 0,
      exp: 'N/A',
      room: '',
      isActive: d.isActive !== false,
      image: null,
      phone: d.phone || '',
      email: d.email || '',
      gender: d.gender || '',
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

    // Look up the doctor's hospital so SchedulingEngine can find the correct schedule
    const profile = await DoctorProfile.findOne({ user: id }).select('hospital').lean();
    const hospital = profile?.hospital;

    const availableSlots = await SchedulingEngine.getAvailableSlots(id, date, hospital);
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
      .populate('doctor', 'firstName lastName email specialization profilePicture hospital department')
      .sort({ date: 1 })
      .lean();

    const formatted = appointments.map(a => ({
      ...a,
      doctor: a.doctor
        ? {
            ...a.doctor,
            name: `${a.doctor.firstName} ${a.doctor.lastName}`.trim(),
            specialty: a.specialty || a.doctor.specialization || '',
            image: a.doctor.profilePicture || null,
          }
        : null,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
