/**
 * Seed today's appointments for the demo doctor so the EMR consultation
 * queue is populated and the full clinical workflow is demonstrable.
 * Safe to re-run: skips creation if today's appointments already exist for the doctor.
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error('MONGODB_URI not set'); process.exit(1); }

const User = require('../models/User');
const Appointment = require('../models/Appointment');
const QueueToken = require('../models/QueueToken');

const todayStart = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const todayEnd   = () => { const d = new Date(); d.setHours(23,59,59,999); return d; };

const APPOINTMENTS = [
  { timeSlot: '09:00 AM', reason: 'Fever and sore throat', visitType: 'In-Person', checkin: true },
  { timeSlot: '09:30 AM', reason: 'Chest pain and shortness of breath', visitType: 'In-Person', checkin: true },
  { timeSlot: '10:00 AM', reason: 'Routine follow-up for hypertension', visitType: 'In-Person', checkin: true },
  { timeSlot: '10:30 AM', reason: 'Diabetes management review', visitType: 'In-Person', checkin: false },
  { timeSlot: '11:00 AM', reason: 'Back pain assessment', visitType: 'In-Person', checkin: false },
];

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Find demo doctor
  const doctor = await User.findOne({ email: 'demo.doctor@careconnect.care' }).lean();
  if (!doctor) { console.error('demo.doctor@careconnect.care not found'); process.exit(1); }
  console.log(`Doctor: ${doctor.firstName} ${doctor.lastName} (${doctor._id})`);

  // Check if today's appointments already exist for this doctor
  const existing = await Appointment.countDocuments({
    doctor: doctor._id,
    date: { $gte: todayStart(), $lte: todayEnd() },
  });
  if (existing >= APPOINTMENTS.length) {
    console.log(`Already have ${existing} appointments for today — skipping creation.`);
    await mongoose.disconnect();
    return;
  }

  // Get demo patients (pick first 5 patient users)
  const patients = await User.find({ role: 'patient' }).select('_id firstName lastName').limit(5).lean();
  if (patients.length === 0) { console.error('No patient users found'); process.exit(1); }
  console.log(`Found ${patients.length} patients`);

  const specialties = ['General Medicine', 'Cardiology', 'General Medicine', 'Internal Medicine', 'Orthopedics'];
  const today = new Date();
  today.setHours(9, 0, 0, 0); // Anchor date at 9am today

  const created = [];
  for (let i = 0; i < APPOINTMENTS.length; i++) {
    const apptData = APPOINTMENTS[i];
    const patient = patients[i % patients.length];

    const appt = await Appointment.create({
      patient: patient._id,
      doctor: doctor._id,
      specialty: specialties[i],
      date: new Date(today), // today's date
      timeSlot: apptData.timeSlot,
      visitType: apptData.visitType,
      reason: apptData.reason,
      status: 'Booked',
      paymentStatus: 'Pending',
    });

    if (apptData.checkin) {
      // Simulate reception check-in
      appt.status = 'Checked_In';
      appt.paymentStatus = 'Completed';
      await appt.save();

      const count = await QueueToken.countDocuments({
        department: appt.specialty,
        createdAt: { $gte: todayStart() },
      });
      const prefix = appt.specialty.substring(0, 3).toUpperCase();
      const tokenNumber = `${prefix}-${String(count + 1).padStart(3, '0')}`;

      await QueueToken.create({
        tokenNumber,
        patient: patient._id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        appointment: appt._id,
        department: appt.specialty,
        doctor: doctor._id,
        priorityReason: 'Normal',
        priority: 0,
        status: 'WAITING',
      });

      console.log(`  ✅ Checked-in: ${patient.firstName} ${patient.lastName} at ${apptData.timeSlot} — token ${tokenNumber}`);
    } else {
      console.log(`  📋 Booked:     ${patient.firstName} ${patient.lastName} at ${apptData.timeSlot}`);
    }
    created.push(appt);
  }

  console.log(`\nCreated ${created.length} appointments (${APPOINTMENTS.filter(a=>a.checkin).length} checked in, ${APPOINTMENTS.filter(a=>!a.checkin).length} booked)`);
  console.log('\nConsultation queue is now populated for demo.doctor@careconnect.care');
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
