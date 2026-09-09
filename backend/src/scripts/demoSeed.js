/**
 * CareConnect — Demo Environment Seed
 *
 * Creates realistic demo accounts for every supported role plus interconnected
 * clinical data (appointments, encounters, prescriptions, lab orders,
 * pharmacy orders, billing invoices) so the platform can be demonstrated
 * end-to-end without touching real patient data.
 *
 * Usage:   node backend/src/scripts/demoSeed.js
 * Safe to run multiple times — fully idempotent via upsert.
 *
 * All demo records are tagged with email prefix "demo." or
 * a [DEMO] marker in their name/description so they can be found and
 * cleaned up by running: node backend/src/scripts/demoSeed.js --cleanup
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User         = require('../models/User');
const Role         = require('../models/Role');
const UserRole     = require('../models/UserRole');
const Appointment  = require('../models/Appointment');
const Encounter    = require('../models/Encounter');
const Invoice      = require('../models/Invoice');
const PharmacyOrder = require('../models/PharmacyOrder');
const QueueToken   = require('../models/QueueToken');
const DoctorProfile  = require('../models/DoctorProfile');
const DoctorSchedule = require('../models/DoctorSchedule');

let Prescription, LabOrder;
try { Prescription = require('../models/Prescription'); } catch (_) {}
try { LabOrder     = require('../models/LabOrder');     } catch (_) {}

const { DEFAULT_ROLES } = require('../constants/permissions');
const connectDB = require('../config/database');

/* ─── Config ─────────────────────────────────────────────────────────────── */

const DEMO_PASSWORD  = 'Demo@12345';
const DEMO_HOSPITAL  = 'Apollo CareConnect Super Specialty';
const DEMO_TAG       = '[DEMO]';

const days = (n) => new Date(Date.now() + n * 86400000);

/* ─── Demo users ─────────────────────────────────────────────────────────── */

const DEMO_USERS = [
    {
        firstName: 'Super', lastName: 'Admin',
        email: 'demo.superadmin@careconnect.care',
        phone: '+91-9000000001', role: 'admin',
        rbacRole: 'SUPER_ADMIN',
        isActive: true, isVerified: true,
        hospital: DEMO_HOSPITAL, department: 'Administration',
    },
    {
        firstName: 'Dr. Arjun', lastName: 'Kumar',
        email: 'demo.doctor@careconnect.care',
        phone: '+91-9000000002', role: 'doctor',
        rbacRole: 'DOCTOR',
        isActive: true, isVerified: true,
        specialization: 'General Physician',
        licenseNumber: 'MCI-DEMO-10001',
        experience: 10, consultationFee: 500,
        hospital: DEMO_HOSPITAL, department: 'General Medicine',
        rating: 4.8,
    },
    {
        firstName: 'Dr. Raj', lastName: 'Sharma',
        email: 'demo.doctor2@careconnect.care',
        phone: '+91-9000000011', role: 'doctor',
        rbacRole: 'DOCTOR',
        isActive: true, isVerified: true,
        specialization: 'General Medicine',
        licenseNumber: 'MCI-DEMO-10002',
        experience: 15, consultationFee: 600,
        hospital: DEMO_HOSPITAL, department: 'General Medicine',
        rating: 4.9,
    },
    {
        firstName: 'Priya', lastName: 'Nair',
        email: 'demo.nurse@careconnect.care',
        phone: '+91-9000000003', role: 'nurse',
        rbacRole: 'NURSE',
        isActive: true, isVerified: true,
        hospital: DEMO_HOSPITAL, department: 'General Medicine',
    },
    {
        firstName: 'Ravi', lastName: 'Reddy',
        email: 'demo.reception@careconnect.care',
        phone: '+91-9000000004', role: 'reception',
        rbacRole: 'RECEPTIONIST',
        isActive: true, isVerified: true,
        hospital: DEMO_HOSPITAL, department: 'Front Desk',
    },
    {
        firstName: 'Aanya', lastName: 'Patel',
        email: 'demo.patient@careconnect.care',
        phone: '+91-9000000005', role: 'patient',
        rbacRole: 'PATIENT',
        isActive: true, isVerified: true,
        dateOfBirth: new Date('1992-04-18'), gender: 'female',
        bloodGroup: 'B+',
        allergies: ['Sulfa drugs', 'Latex'],
        chronicDiseases: ['Type 2 Diabetes'],
        location: {
            type: 'Point', coordinates: [78.4867, 17.3850],
            address: 'Banjara Hills', city: 'Hyderabad', state: 'Telangana', country: 'India',
        },
        emergencyContact: { name: 'Rahul Patel', phone: '+91-9000000099', relationship: 'Spouse' },
        credits: 2000,
    },
    {
        firstName: 'Suresh', lastName: 'Pillai',
        email: 'demo.pharmacist@careconnect.care',
        phone: '+91-9000000006', role: 'pharmacist',
        rbacRole: 'PHARMACY_STAFF',
        isActive: true, isVerified: true,
        hospital: DEMO_HOSPITAL, department: 'Pharmacy',
    },
    {
        firstName: 'Deepa', lastName: 'Rao',
        email: 'demo.labtech@careconnect.care',
        phone: '+91-9000000007', role: 'lab_tech',
        rbacRole: 'LAB_TECHNICIAN',
        isActive: true, isVerified: true,
        hospital: DEMO_HOSPITAL, department: 'Laboratory',
    },
    {
        firstName: 'Dr. Meera', lastName: 'Singh',
        email: 'demo.radiologist@careconnect.care',
        phone: '+91-9000000008', role: 'radiologist',
        rbacRole: 'RADIOLOGIST',
        isActive: true, isVerified: true,
        specialization: 'Radiology',
        licenseNumber: 'MCI-DEMO-10008',
        experience: 8, consultationFee: 700,
        hospital: DEMO_HOSPITAL, department: 'Radiology',
        rating: 4.7,
    },
    {
        firstName: 'Vikram', lastName: 'Bhat',
        email: 'demo.emergency@careconnect.care',
        phone: '+91-9000000009', role: 'emergency',
        rbacRole: 'EMERGENCY_STAFF',
        isActive: true, isVerified: true,
        hospital: DEMO_HOSPITAL, department: 'Emergency',
    },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

async function upsertUser(data) {
    const { rbacRole, ...fields } = data;
    // Pass plain-text password — Mongoose pre-save hook hashes it on save/create
    fields.password = DEMO_PASSWORD;

    let user = await User.findOne({ email: fields.email });
    if (user) {
        Object.assign(user, fields);
        await user.save();
        console.log(`  ↻  Updated  ${fields.email}`);
    } else {
        user = await User.create(fields);
        console.log(`  ✓  Created  ${fields.email}`);
    }
    return user;
}

async function ensureRoles() {
    for (const def of DEFAULT_ROLES) {
        await Role.updateOne({ name: def.name }, { $set: def }, { upsert: true });
    }
    console.log(`  ✓  ${DEFAULT_ROLES.length} RBAC roles synced`);
}

async function assignRbacRole(userId, roleName) {
    const role = await Role.findOne({ name: roleName });
    if (!role) { console.log(`  ⚠  RBAC role not found: ${roleName}`); return; }
    await UserRole.updateOne(
        { user: userId, role: role._id },
        { $set: { user: userId, role: role._id, assignedBy: userId, isActive: true } },
        { upsert: true },
    );
}

/* ─── Cleanup ────────────────────────────────────────────────────────────── */

async function cleanup() {
    console.log('\n🧹  Cleaning up demo data...');
    const emails = DEMO_USERS.map((u) => u.email);
    const users  = await User.find({ email: { $in: emails } }).select('_id').lean();
    const ids    = users.map((u) => u._id);

    await Promise.all([
        User.deleteMany({ email: { $in: emails } }),
        UserRole.deleteMany({ user: { $in: ids } }),
        Appointment.deleteMany({ $or: [{ patient: { $in: ids } }, { doctor: { $in: ids } }] }),
        Encounter.deleteMany({ $or: [{ patientId: { $in: ids } }, { doctorId: { $in: ids } }] }),
        Invoice.deleteMany({ patient: { $in: ids } }),
        PharmacyOrder.deleteMany({ patientId: { $in: ids } }),
        QueueToken.deleteMany({ patientName: /^\[DEMO\]/ }),
        DoctorProfile.deleteMany({ user: { $in: ids } }),
        DoctorSchedule.deleteMany({ doctor: { $in: ids } }),
    ]);
    console.log('  ✓  Demo data removed');
}

/* ─── Main seed ─────────────────────────────────────────────────────────── */

async function seed() {
    console.log('\n🌱  CareConnect Demo Seed');
    console.log('━'.repeat(52));

    /* 1 — Connect */
    console.log('\n1️⃣  Connecting to MongoDB…');
    await connectDB();
    if (mongoose.connection.readyState !== 1) throw new Error('DB not connected');
    console.log('   ✓  Connected');

    /* 2 — Ensure RBAC roles exist */
    console.log('\n2️⃣  Syncing RBAC roles…');
    await ensureRoles();

    /* 3 — Create demo users */
    console.log('\n3️⃣  Creating demo users…');
    const createdUsers = {};
    for (const def of DEMO_USERS) {
        const user = await upsertUser(def);
        await assignRbacRole(user._id, def.rbacRole);
        createdUsers[def.email] = user;
    }

    /* convenience aliases */
    const patient    = createdUsers['demo.patient@careconnect.care'];
    const doctor     = createdUsers['demo.doctor@careconnect.care'];
    const doctor2    = createdUsers['demo.doctor2@careconnect.care'];
    const superAdmin = createdUsers['demo.superadmin@careconnect.care'];
    // super admin also gets SUPER_ADMIN overriding the default HOSPITAL_ADMIN
    await assignRbacRole(superAdmin._id, 'SUPER_ADMIN');

    /* 3b — DoctorProfile entries for demo doctors */
    console.log('\n3️⃣b  Seeding DoctorProfile entries…');
    const DEMO_DOCTOR_PROFILES = [
        {
            userId: doctor._id,
            specialty: 'General Physician',
            department: 'General Medicine',
            hospital: DEMO_HOSPITAL,
            qualification: 'MBBS, MD (General Medicine)',
            experienceYears: 10,
            consultationFee: 500,
            medicalRegNumber: 'MCI-DEMO-10001',
            consultationType: 'Both',
            room: 'Room 101',
        },
        {
            userId: doctor2._id,
            specialty: 'General Medicine',
            department: 'General Medicine',
            hospital: DEMO_HOSPITAL,
            qualification: 'MBBS, MD, DNB',
            experienceYears: 15,
            consultationFee: 600,
            medicalRegNumber: 'MCI-DEMO-10002',
            consultationType: 'In-Person',
            room: 'Room 102',
        },
    ];
    for (const dp of DEMO_DOCTOR_PROFILES) {
        await DoctorProfile.findOneAndUpdate(
            { user: dp.userId },
            { user: dp.userId, specialty: dp.specialty, department: dp.department,
              hospital: dp.hospital, qualification: dp.qualification,
              experienceYears: dp.experienceYears, consultationFee: dp.consultationFee,
              medicalRegNumber: dp.medicalRegNumber, consultationType: dp.consultationType,
              room: dp.room, rating: 4.8 },
            { upsert: true, new: true }
        );
        await DoctorSchedule.findOneAndUpdate(
            { doctor: dp.userId, hospital: dp.hospital },
            { doctor: dp.userId, hospital: dp.hospital,
              weeklySchedule: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] },
              leaves: [], exceptions: [] },
            { upsert: true, new: true }
        );
        const u = await User.findById(dp.userId).select('firstName lastName').lean();
        console.log(`  ✓  DoctorProfile for ${u?.firstName} ${u?.lastName}`);
    }

    /* 4 — Appointments */
    console.log('\n4️⃣  Creating demo appointments…');
    const apptDefs = [
        {
            patient: patient._id, doctor: doctor._id,
            specialty: 'General Medicine', visitType: 'In-Person',
            date: days(1), timeSlot: '10:00 AM - 10:30 AM',
            status: 'Booked', paymentStatus: 'Pending',
            reason: `${DEMO_TAG} Routine check-up`,
        },
        {
            patient: patient._id, doctor: doctor._id,
            specialty: 'General Medicine', visitType: 'In-Person',
            date: days(3), timeSlot: '11:00 AM - 11:30 AM',
            status: 'Confirmed', paymentStatus: 'Completed',
            reason: `${DEMO_TAG} Follow-up for diabetes`,
        },
        {
            patient: patient._id, doctor: doctor._id,
            specialty: 'General Medicine', visitType: 'In-Person',
            date: days(0), timeSlot: '09:00 AM - 09:30 AM',
            status: 'Checked_In', paymentStatus: 'Completed',
            reason: `${DEMO_TAG} Fever and throat pain`,
        },
        {
            patient: patient._id, doctor: doctor._id,
            specialty: 'General Medicine', visitType: 'Video Call',
            date: days(-3), timeSlot: '03:00 PM - 03:30 PM',
            status: 'Completed', paymentStatus: 'Completed',
            reason: `${DEMO_TAG} Telemedicine follow-up`,
        },
        {
            patient: patient._id, doctor: doctor._id,
            specialty: 'General Medicine', visitType: 'In-Person',
            date: days(-7), timeSlot: '02:00 PM - 02:30 PM',
            status: 'Cancelled', paymentStatus: 'Refunded',
            reason: `${DEMO_TAG} Cancelled by patient`,
        },
    ];

    const appointments = [];
    for (const def of apptDefs) {
        const existing = await Appointment.findOne({ patient: def.patient, doctor: def.doctor, date: def.date });
        const appt = existing
            ? await Appointment.findByIdAndUpdate(existing._id, def, { new: true })
            : await Appointment.create(def);
        appointments.push(appt);
        console.log(`  ✓  Appointment ${appt.status} on ${appt.date.toDateString()}`);
    }

    /* 5 — Queue token */
    console.log('\n5️⃣  Creating queue token…');
    await QueueToken.updateOne(
        { patientName: `${DEMO_TAG} Aanya Patel` },
        {
            $set: {
                tokenNumber:    'OPD-D01',
                patientName:    `${DEMO_TAG} Aanya Patel`,
                department:     'General Medicine',
                status:         'WAITING',
                priority:       0,
                priorityReason: 'Normal',
                patient:        patient._id,
            },
        },
        { upsert: true },
    );
    console.log('  ✓  Queue token OPD-D01 (WAITING)');

    /* 6 — Encounter */
    console.log('\n6️⃣  Creating clinical encounter…');
    let encounter = await Encounter.findOne({ patientId: patient._id, doctorId: doctor._id, type: 'opd' });
    const encounterData = {
        patientId:    patient._id,
        doctorId:     doctor._id,
        appointmentId: appointments[3]._id,
        type:         'opd',
        status:       'signed',
        chiefComplaint: `${DEMO_TAG} Fever, chills, and body ache for 3 days`,
        vitals: [{
            recordedAt:      days(-3),
            temperatureC:    38.4,
            pulse:           96,
            systolicBp:      118,
            diastolicBp:     78,
            spo2:            98,
            weightKg:        62,
            heightCm:        165,
            respiratoryRate: 18,
        }],
        diagnoses: [{
            code:      'J06.9',
            term:      'Acute upper respiratory infection, unspecified',
            type:      'confirmed',
            isPrimary: true,
            notedBy:   doctor._id,
            notedAt:   days(-3),
        }],
        soapNote: {
            subjective: `${DEMO_TAG} Patient presents with 3-day history of fever (max 38.4°C), sore throat, rhinorrhoea, and generalised myalgia. Known diabetic on Metformin. No known drug allergies to antibiotics.`,
            objective:  'Temp 38.4°C, HR 96/min, BP 118/78 mmHg, SpO₂ 98% on room air. Throat erythematous, no exudate. Chest clear.',
            assessment: 'Acute viral upper respiratory tract infection superimposed on Type 2 DM.',
            plan:       'Paracetamol 500mg TDS × 5 days. Adequate hydration. Monitor blood glucose. Review in 5 days or earlier if worsens.',
        },
    };
    if (encounter) {
        await Encounter.findByIdAndUpdate(encounter._id, encounterData);
        console.log(`  ↻  Updated encounter ${encounter._id}`);
    } else {
        encounter = await Encounter.create(encounterData);
        console.log(`  ✓  Created encounter ${encounter._id}`);
    }

    /* 7 — Prescription */
    console.log('\n7️⃣  Creating prescription…');
    if (Prescription) {
        try {
            await Prescription.updateOne(
                { patientId: patient._id, createdByUserId: doctor._id },
                {
                    $set: {
                        patientId:       patient._id,
                        source:          'doctor',
                        createdByUserId: doctor._id,
                        createdByRole:   'doctor',
                        encounterId:     encounter._id,
                        status:          'active',
                        medications: [
                            { name: 'Paracetamol 500mg', dosage: '500mg', frequency: 'TDS', duration: '5 days', instructions: 'After food' },
                            { name: 'ORS Sachet', dosage: '1 sachet', frequency: 'BD', duration: '5 days', instructions: 'Dissolve in 1L water' },
                            { name: 'Cetirizine 10mg', dosage: '10mg', frequency: 'OD HS', duration: '5 days', instructions: 'At bedtime' },
                        ],
                        notes: `${DEMO_TAG} Viral URTI — symptomatic management`,
                    },
                },
                { upsert: true },
            );
            console.log('  ✓  Prescription created (3 medications)');
        } catch (e) {
            console.log(`  ⚠  Prescription skipped: ${e.message}`);
        }
    } else {
        console.log('  ⚠  Prescription model not loaded — skipped');
    }

    /* 8 — Lab order */
    console.log('\n8️⃣  Creating lab order…');
    if (LabOrder) {
        try {
            await LabOrder.updateOne(
                { mrn: 'DEMO-MRN-001', patientName: `${DEMO_TAG} Aanya Patel` },
                {
                    $set: {
                        mrn:       'DEMO-MRN-001',
                        patientName: `${DEMO_TAG} Aanya Patel`,
                        panelName:  'Complete Blood Count + HbA1c',
                        orderedBy:  doctor._id.toString(),
                        patientId:  patient._id,
                        encounterId: encounter._id,
                        priority:   'Routine',
                        status:     'Reported',
                        results: [
                            { parameter: 'Haemoglobin', value: '12.8', unit: 'g/dL', refRange: '12–16', flag: 'Normal' },
                            { parameter: 'WBC', value: '9.2', unit: '×10³/μL', refRange: '4–11', flag: 'Normal' },
                            { parameter: 'HbA1c', value: '7.4', unit: '%', refRange: '<5.7', flag: 'High' },
                        ],
                        reportedAt: days(-2),
                    },
                },
                { upsert: true },
            );
            console.log('  ✓  Lab order created (CBC + HbA1c — Reported)');
        } catch (e) {
            console.log(`  ⚠  Lab order skipped: ${e.message}`);
        }
    } else {
        console.log('  ⚠  LabOrder model not loaded — skipped');
    }

    /* 9 — Pharmacy order */
    console.log('\n9️⃣  Creating pharmacy order…');
    await PharmacyOrder.updateOne(
        { orderId: 'RX-DEMO-001' },
        {
            $set: {
                orderId:      'RX-DEMO-001',
                patientId:    patient._id,
                patientName:  `${DEMO_TAG} Aanya Patel`,
                patientPhone: '+91-9000000005',
                doctorId:     doctor._id,
                medicines:    ['Paracetamol 500mg × 15', 'ORS Sachet × 10', 'Cetirizine 10mg × 5'],
                items:        3,
                amount:       320,
                status:       'pending',
            },
        },
        { upsert: true },
    );
    console.log('  ✓  Pharmacy order RX-DEMO-001 (pending)');

    /* 10 — Billing invoice */
    console.log('\n🔟  Creating billing invoice…');
    const invoiceCount = await Invoice.countDocuments({ invoiceNumber: /DEMO/ });
    const invNum = `INV-DEMO-${String(invoiceCount + 1).padStart(3, '0')}`;
    const existingInv = await Invoice.findOne({ patient: patient._id, type: 'OPD' });
    if (!existingInv) {
        await Invoice.create({
            patient:       patient._id,
            invoiceNumber: invNum,
            type:          'OPD',
            items: [
                { description: 'OPD Consultation', unitPrice: 500, quantity: 1, totalPrice: 500 },
                { description: 'Pharmacy — Paracetamol 500mg', unitPrice: 150, quantity: 1, totalPrice: 150 },
                { description: 'Pharmacy — ORS Sachet', unitPrice: 80, quantity: 1, totalPrice: 80 },
                { description: 'Pharmacy — Cetirizine 10mg', unitPrice: 90, quantity: 1, totalPrice: 90 },
                { description: 'Lab — CBC + HbA1c', unitPrice: 600, quantity: 1, totalPrice: 600 },
            ],
            subTotal:    1420,
            tax:         0,
            discount:    0,
            totalAmount: 1420,
            amountDue:   0,
            amountPaid:  1420,
            status:      'PAID',
        });
        console.log(`  ✓  Invoice ${invNum} — ₹1420 PAID`);
    } else {
        console.log(`  ↻  Invoice already exists: ${existingInv.invoiceNumber}`);
    }

    /* 11 — Second invoice (unpaid) */
    const existingUnpaid = await Invoice.findOne({ patient: patient._id, type: 'OPD', status: 'UNPAID' });
    if (!existingUnpaid) {
        const invNum2 = `INV-DEMO-${String(invoiceCount + 2).padStart(3, '0')}`;
        await Invoice.create({
            patient:       patient._id,
            invoiceNumber: invNum2,
            type:          'OPD',
            items: [
                { description: 'Consultation — Follow-up', unitPrice: 300, quantity: 1, totalPrice: 300 },
            ],
            subTotal:    300,
            tax:         0,
            discount:    0,
            totalAmount: 300,
            amountDue:   300,
            amountPaid:  0,
            status:      'UNPAID',
        });
        console.log(`  ✓  Invoice ${invNum2} — ₹300 UNPAID (pending payment)`);
    }

    /* Done */
    console.log('\n' + '━'.repeat(52));
    console.log('✅  Demo seed complete!\n');
    printCredentials();
}

function printCredentials() {
    console.log('┌─ DEMO CREDENTIALS ──────────────────────────────────────┐');
    console.log('│  Password for ALL accounts: Demo@12345                  │');
    console.log('├──────────────────────┬──────────────────────────────────┤');
    console.log('│ Role                 │ Email                            │');
    console.log('├──────────────────────┼──────────────────────────────────┤');
    for (const u of DEMO_USERS) {
        const role  = u.rbacRole.padEnd(20);
        const email = u.email.padEnd(32);
        console.log(`│ ${role} │ ${email} │`);
    }
    console.log('└──────────────────────┴──────────────────────────────────┘');
    console.log('\nPortals:');
    console.log('  Administration  → https://careconnect.care/login/admin');
    console.log('  Doctor / Staff  → https://careconnect.care/login/doctor');
    console.log('  Patient         → https://careconnect.care/login');
}

/* ─── Entry point ────────────────────────────────────────────────────────── */

(async () => {
    const isCleanup = process.argv.includes('--cleanup');
    try {
        if (isCleanup) {
            await connectDB();
            await cleanup();
        } else {
            await seed();
        }
    } catch (err) {
        console.error('\n❌  Seed failed:', err.message);
        console.error(err.stack);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
})();
