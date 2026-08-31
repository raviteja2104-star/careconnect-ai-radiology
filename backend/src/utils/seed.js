/**
 * CareConnect — Database Seed Script
 *
 * Seeds MongoDB with a realistic demo dataset for the EMR + teleradiology
 * workflows: role users, patients, appointments, encounters, clinical notes
 * (draft + signed), clinical orders, radiology studies (all statuses),
 * notifications, invoices and queue tokens.
 *
 * - Idempotent: clears seeded collections and recreates everything, so it can
 *   be re-run any number of times.
 * - Runs on BOTH a standalone mongod and a replica set: no transactions are
 *   used here. (The app's TxRunner detects replica-set support at runtime and
 *   activates multi-document transactions automatically.)
 *
 * Usage: npm run seed   (from backend/)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Encounter = require('../models/Encounter');
const ClinicalNote = require('../models/ClinicalNote');
const ClinicalOrder = require('../models/ClinicalOrder');
const RadiologyStudy = require('../models/RadiologyStudy');
const Notification = require('../models/Notification');
const Invoice = require('../models/Invoice');
const QueueToken = require('../models/QueueToken');

const PASSWORD = 'CareConnect@123';

const minutesAgo = (m) => new Date(Date.now() - m * 60 * 1000);
const hoursAgo = (h) => minutesAgo(h * 60);
const daysAgo = (d) => hoursAgo(d * 24);
const daysAhead = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

// ── Role users (one per role) ────────────────────────────────────────────────
const ROLE_USERS = [
    { firstName: 'Pranav', lastName: 'Kulkarni', role: 'patient', gender: 'male', dateOfBirth: new Date('1994-02-11'), bloodGroup: 'O+', allergies: ['Penicillin'] },
    { firstName: 'Raj', lastName: 'Sharma', role: 'doctor', gender: 'male', specialization: 'General Medicine', licenseNumber: 'MCI-2015-12345', experience: 12, consultationFee: 500, hospital: 'CareConnect City Hospital', department: 'General Medicine', rating: 4.8, availability: { isAvailable: true, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] } },
    { firstName: 'Meera', lastName: 'Reddy', role: 'radiologist', gender: 'female', specialization: 'Diagnostic Radiology', licenseNumber: 'MCI-2016-22334', experience: 10, certifications: ['ABR Certified', 'FRCR'], subspecialty: 'Neuroradiology', rating: 4.9 },
    { firstName: 'Admin', lastName: 'CareConnect', role: 'admin', gender: 'other' },
    { firstName: 'Suresh', lastName: 'Kamble', role: 'lab_tech', gender: 'male', department: 'Laboratory' },
    { firstName: 'Farah', lastName: 'Khan', role: 'pharmacist', gender: 'female', department: 'Pharmacy' },
    { firstName: 'Lakshmi', lastName: 'Menon', role: 'reception', gender: 'female', department: 'Front Desk' },
    { firstName: 'Vikrant', lastName: 'Rao', role: 'emergency', gender: 'male', department: 'Emergency' },
].map((u, i) => ({
    ...u,
    email: `${u.role}@careconnect.dev`,
    phone: `+91-9800000${String(i + 1).padStart(3, '0')}`,
    isActive: true,
    isVerified: true,
}));

// ── 20 patients with Indian names + demographics ────────────────────────────
const PATIENTS_RAW = [
    { firstName: 'Aarav', lastName: 'Patel', gender: 'male', dob: '1988-04-12', bloodGroup: 'B+', city: 'Ahmedabad', allergies: ['Penicillin'], chronic: ['Hypertension'] },
    { firstName: 'Ananya', lastName: 'Iyer', gender: 'female', dob: '1992-09-30', bloodGroup: 'O+', city: 'Chennai', allergies: [], chronic: [] },
    { firstName: 'Rohan', lastName: 'Deshmukh', gender: 'male', dob: '1979-01-25', bloodGroup: 'A+', city: 'Pune', allergies: ['Sulfa drugs'], chronic: ['Type 2 Diabetes'] },
    { firstName: 'Priya', lastName: 'Nair', gender: 'female', dob: '1996-07-08', bloodGroup: 'AB+', city: 'Kochi', allergies: ['Latex'], chronic: [] },
    { firstName: 'Arjun', lastName: 'Singh', gender: 'male', dob: '1965-11-19', bloodGroup: 'O-', city: 'Lucknow', allergies: [], chronic: ['COPD', 'Hypertension'] },
    { firstName: 'Kavya', lastName: 'Krishnan', gender: 'female', dob: '2001-03-14', bloodGroup: 'B-', city: 'Bengaluru', allergies: ['Peanuts'], chronic: ['Asthma'] },
    { firstName: 'Aditya', lastName: 'Verma', gender: 'male', dob: '1990-06-02', bloodGroup: 'A-', city: 'Delhi', allergies: [], chronic: [] },
    { firstName: 'Sneha', lastName: 'Kulkarni', gender: 'female', dob: '1985-12-22', bloodGroup: 'O+', city: 'Mumbai', allergies: ['Aspirin'], chronic: ['Hypothyroidism'] },
    { firstName: 'Karthik', lastName: 'Subramanian', gender: 'male', dob: '1972-08-16', bloodGroup: 'B+', city: 'Coimbatore', allergies: [], chronic: ['Type 2 Diabetes', 'CKD Stage 2'] },
    { firstName: 'Ishita', lastName: 'Banerjee', gender: 'female', dob: '1998-05-27', bloodGroup: 'A+', city: 'Kolkata', allergies: ['Shellfish'], chronic: [] },
    { firstName: 'Manish', lastName: 'Gupta', gender: 'male', dob: '1983-10-05', bloodGroup: 'AB-', city: 'Jaipur', allergies: [], chronic: ['Dyslipidemia'] },
    { firstName: 'Divya', lastName: 'Pillai', gender: 'female', dob: '1994-02-18', bloodGroup: 'O+', city: 'Thiruvananthapuram', allergies: ['Ibuprofen'], chronic: ['Migraine'] },
    { firstName: 'Siddharth', lastName: 'Joshi', gender: 'male', dob: '1958-07-31', bloodGroup: 'B+', city: 'Nagpur', allergies: ['Penicillin', 'Contrast dye'], chronic: ['Coronary Artery Disease'] },
    { firstName: 'Ritu', lastName: 'Chauhan', gender: 'female', dob: '1989-09-09', bloodGroup: 'A+', city: 'Chandigarh', allergies: [], chronic: [] },
    { firstName: 'Nikhil', lastName: 'Menon', gender: 'male', dob: '1997-01-13', bloodGroup: 'O-', city: 'Hyderabad', allergies: ['Dust mites'], chronic: ['Allergic Rhinitis'] },
    { firstName: 'Pooja', lastName: 'Agarwal', gender: 'female', dob: '1980-04-21', bloodGroup: 'B-', city: 'Indore', allergies: [], chronic: ['PCOS'] },
    { firstName: 'Varun', lastName: 'Mehta', gender: 'male', dob: '1993-08-03', bloodGroup: 'A+', city: 'Surat', allergies: ['Codeine'], chronic: [] },
    { firstName: 'Lakshmi', lastName: 'Raghavan', gender: 'female', dob: '1969-06-25', bloodGroup: 'O+', city: 'Madurai', allergies: [], chronic: ['Osteoarthritis', 'Hypertension'] },
    { firstName: 'Harsha', lastName: 'Vardhan', gender: 'male', dob: '1986-03-07', bloodGroup: 'AB+', city: 'Visakhapatnam', allergies: ['Sulfa drugs'], chronic: [] },
    { firstName: 'Meghna', lastName: 'Bhat', gender: 'female', dob: '2000-11-11', bloodGroup: 'B+', city: 'Mangaluru', allergies: ['Eggs'], chronic: ['Asthma'] },
];

const PATIENTS = PATIENTS_RAW.map((p, i) => ({
    firstName: p.firstName,
    lastName: p.lastName,
    email: `${p.firstName.toLowerCase()}.${p.lastName.toLowerCase()}@example.dev`,
    phone: `+91-9810000${String(i + 1).padStart(3, '0')}`,
    role: 'patient',
    gender: p.gender,
    dateOfBirth: new Date(p.dob),
    bloodGroup: p.bloodGroup,
    allergies: p.allergies,
    chronicDiseases: p.chronic,
    isActive: true,
    isVerified: true,
    location: { type: 'Point', coordinates: [77 + (i % 7) * 0.5, 13 + (i % 9) * 0.7], city: p.city, country: 'India' },
    emergencyContact: { name: 'Family Contact', phone: `+91-9820000${String(i + 1).padStart(3, '0')}`, relationship: i % 2 ? 'Spouse' : 'Parent' },
}));

const seed = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/careconnect';
    console.log(`\nCareConnect Seed Script\n${'─'.repeat(60)}`);
    console.log(`Connecting to: ${uri.replace(/\/\/[^@/]+@/, '//***@')}\n`);

    try {
        // Small pool + generous timeouts: a seed script needs no concurrency,
        // and this keeps it reliable on slow machines/CI.
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 60000,
            socketTimeoutMS: 120000,
            maxPoolSize: 2,
        });
        console.log('MongoDB connected\n');
    } catch (e) {
        console.error('MongoDB connection failed:', e.message);
        console.log('\nStart MongoDB (docker compose up -d mongodb mongo-init) or set MONGODB_URI in backend/.env.');
        process.exit(1);
    }

    // ── Clear seeded collections (makes the script idempotent) ──────────────
    console.log('Clearing existing data...');
    await Promise.all([
        User.deleteMany({}),
        Appointment.deleteMany({}),
        Encounter.deleteMany({}),
        // Bypass the signed-note immutability query hooks — this is a full reseed.
        ClinicalNote.collection.deleteMany({}),
        ClinicalOrder.deleteMany({}),
        RadiologyStudy.deleteMany({}),
        Notification.deleteMany({}),
        Invoice.deleteMany({}),
        QueueToken.deleteMany({}),
    ]);

    // ── Users ───────────────────────────────────────────────────────────────
    // All seeded users share one password, so hash it ONCE and insertMany with
    // the pre-computed hash. (User.create would trigger the pre-save bcrypt
    // hook 28 times in parallel — pure-JS bcryptjs at cost 12 starves the
    // event loop and times out the Mongo driver.) comparePassword() works the
    // same either way: it bcrypt-compares against the stored hash.
    console.log('Seeding users...');
    const passwordHash = await bcrypt.hash(PASSWORD, 12);
    const roleUsers = await User.insertMany(ROLE_USERS.map((u) => ({ ...u, password: passwordHash })));
    const byRole = Object.fromEntries(roleUsers.map((u) => [u.role, u]));
    const doctor = byRole.doctor;
    const radiologist = byRole.radiologist;

    const patients = await User.insertMany(PATIENTS.map((p) => ({ ...p, password: passwordHash })));
    const allPatients = [byRole.patient, ...patients]; // 21 patient-role users
    console.log(`   ${roleUsers.length} role users + ${patients.length} patients created`);

    // ── Appointments (15) ───────────────────────────────────────────────────
    console.log('Seeding appointments...');
    const APPT_STATUSES = ['Booked', 'Confirmed', 'Checked_In', 'Waiting', 'Vitals', 'Doctor_Ready', 'In_Consultation', 'Completed', 'Cancelled'];
    const appointments = await Appointment.create(
        Array.from({ length: 15 }, (_, i) => {
            const status = APPT_STATUSES[i % APPT_STATUSES.length];
            const past = ['Completed', 'Cancelled', 'In_Consultation', 'Checked_In', 'Waiting', 'Vitals', 'Doctor_Ready'].includes(status);
            return {
                patient: allPatients[i % allPatients.length]._id,
                doctor: doctor._id,
                specialty: ['General Medicine', 'Cardiology', 'Orthopedics'][i % 3],
                date: past ? daysAgo((i % 5) + 1) : daysAhead((i % 5) + 1),
                timeSlot: `${9 + (i % 8)}:00 - ${9 + (i % 8)}:30`,
                visitType: ['In-Person', 'Video Call', 'Home Visit'][i % 3],
                reason: ['Fever and body ache', 'Chest discomfort on exertion', 'Knee pain follow-up', 'Annual health check', 'Persistent cough'][i % 5],
                status,
                paymentStatus: status === 'Completed' ? 'Completed' : status === 'Cancelled' ? 'Refunded' : 'Pending',
                meetingLink: i % 3 === 1 ? `https://meet.careconnect.dev/room-${1000 + i}` : undefined,
            };
        })
    );
    console.log(`   ${appointments.length} appointments created`);

    // ── Encounters (8) with clinical notes (draft + signed) ─────────────────
    console.log('Seeding encounters and clinical notes...');
    const encounterSeeds = [
        { p: 0, complaint: 'Fever with chills for 3 days', dx: { code: 'A90', term: 'Dengue fever', type: 'provisional' }, signed: true },
        { p: 1, complaint: 'Chest pain on exertion', dx: { code: 'I20.9', term: 'Angina pectoris', type: 'differential' }, signed: true },
        { p: 2, complaint: 'Polyuria and fatigue', dx: { code: 'E11.9', term: 'Type 2 diabetes mellitus', type: 'confirmed' }, signed: true },
        { p: 3, complaint: 'Severe headache with photophobia', dx: { code: 'G43.9', term: 'Migraine', type: 'provisional' }, signed: true },
        { p: 4, complaint: 'Breathlessness on walking', dx: { code: 'J44.9', term: 'COPD exacerbation', type: 'provisional' }, signed: false },
        { p: 5, complaint: 'Wheezing after exposure to dust', dx: { code: 'J45.9', term: 'Asthma, unspecified', type: 'confirmed' }, signed: false },
        { p: 6, complaint: 'Right knee pain after fall', dx: { code: 'S83.9', term: 'Knee sprain', type: 'provisional' }, signed: false },
        { p: 7, complaint: 'Recurrent epigastric pain', dx: { code: 'K29.7', term: 'Gastritis', type: 'differential' }, signed: false },
    ];

    const encounters = [];
    const notes = [];
    for (let i = 0; i < encounterSeeds.length; i++) {
        const s = encounterSeeds[i];
        const patient = allPatients[s.p];
        const enc = await Encounter.create({
            patientId: patient._id,
            doctorId: doctor._id,
            appointmentId: appointments[i]._id,
            type: i === 4 ? 'emergency' : 'opd',
            specialty: 'General Medicine',
            status: s.signed ? 'signed' : 'open',
            chiefComplaint: s.complaint,
            vitals: [{
                recordedAt: daysAgo(i + 1),
                recordedBy: byRole.reception._id,
                heightCm: 160 + (i % 4) * 5,
                weightKg: 58 + i * 3,
                systolicBp: 112 + i * 4,
                diastolicBp: 72 + i * 2,
                pulse: 74 + i * 3,
                respiratoryRate: 14 + (i % 4),
                temperatureC: i === 0 ? 39.1 : 36.8,
                spo2: i === 4 ? 91 : 98,
                painScore: i === 6 ? 6 : 1,
            }],
            diagnoses: [{ ...s.dx, isPrimary: true, notedBy: doctor._id, notedAt: daysAgo(i + 1) }],
            signedAt: s.signed ? daysAgo(i + 1) : undefined,
            signedBy: s.signed ? doctor._id : undefined,
        });
        encounters.push(enc);

        const note = await ClinicalNote.create({
            encounterId: enc._id,
            patientId: patient._id,
            authorId: doctor._id,
            format: 'SOAP',
            sections: {
                chiefComplaint: s.complaint,
                subjective: `Patient reports: ${s.complaint.toLowerCase()}. No similar prior episodes.`,
                objective: 'Vitals recorded. Focused examination performed; findings documented.',
                assessment: `${s.dx.term} (${s.dx.type}).`,
                plan: s.signed ? 'Investigations ordered, medication started, review in 5 days.' : 'Awaiting investigation results before finalising plan.',
            },
            version: 1,
            status: s.signed ? 'signed' : 'draft',
            signedAt: s.signed ? daysAgo(i + 1) : undefined,
            signedBy: s.signed ? doctor._id : undefined,
            signatureHash: s.signed ? `seedhash-${i}` : undefined,
            auditTrail: [
                { action: 'created', by: doctor._id, at: daysAgo(i + 1) },
                ...(s.signed ? [{ action: 'signed', by: doctor._id, at: daysAgo(i + 1) }] : []),
            ],
        });
        notes.push(note);
    }
    console.log(`   ${encounters.length} encounters, ${notes.length} clinical notes (${notes.filter(n => n.status === 'signed').length} signed / ${notes.filter(n => n.status === 'draft').length} draft)`);

    // ── Clinical orders (12) across categories ──────────────────────────────
    console.log('Seeding clinical orders...');
    const mkOrder = (encIdx, extra) => ({
        encounterId: encounters[encIdx]._id,
        patientId: encounters[encIdx].patientId,
        orderingDoctorId: doctor._id,
        auditTrail: [{ action: 'created', by: doctor._id }],
        ...extra,
    });
    const orders = await ClinicalOrder.create([
        // lab (3)
        mkOrder(0, { category: 'lab', department: 'Laboratory', priority: 'urgent', status: 'completed', details: { tests: [{ code: 'CBC', name: 'Complete Blood Count' }, { code: 'NS1', name: 'Dengue NS1 Antigen' }] } }),
        mkOrder(2, { category: 'lab', department: 'Laboratory', priority: 'routine', status: 'in_progress', details: { tests: [{ code: 'HBA1C', name: 'Glycated Haemoglobin' }, { code: 'FBS', name: 'Fasting Blood Sugar' }] } }),
        mkOrder(7, { category: 'lab', department: 'Laboratory', priority: 'routine', status: 'ordered', details: { tests: [{ code: 'HPYL', name: 'H. pylori Antigen (Stool)' }] } }),
        // radiology (3)
        mkOrder(1, { category: 'radiology', department: 'Radiology', priority: 'stat', status: 'in_progress', details: { modality: 'CT', bodyPart: 'Chest', contrast: true, clinicalIndication: 'Chest pain, rule out aortic pathology' } }),
        mkOrder(4, { category: 'radiology', department: 'Radiology', priority: 'urgent', status: 'acknowledged', details: { modality: 'XR', bodyPart: 'Chest', contrast: false, clinicalIndication: 'COPD exacerbation, rule out consolidation' } }),
        mkOrder(6, { category: 'radiology', department: 'Radiology', priority: 'routine', status: 'ordered', details: { modality: 'MRI', bodyPart: 'Knee', contrast: false, clinicalIndication: 'Knee trauma, suspected ligament injury' } }),
        // medication (3) — two with safety-review flags
        mkOrder(0, {
            category: 'medication', department: 'Pharmacy', priority: 'routine', status: 'completed',
            details: { drugs: [{ name: 'Paracetamol 650mg', generic: 'paracetamol', dose: '650 mg', frequency: 'TID', route: 'oral', durationDays: 5 }] },
        }),
        mkOrder(2, {
            category: 'medication', department: 'Pharmacy', priority: 'routine', status: 'ordered',
            details: { drugs: [{ name: 'Metformin 500mg', generic: 'metformin', dose: '500 mg', frequency: 'BD', route: 'oral', durationDays: 30 }, { name: 'Glimepiride 1mg', generic: 'glimepiride', dose: '1 mg', frequency: 'OD', route: 'oral', durationDays: 30 }] },
            safetyReview: {
                flags: [
                    { kind: 'interaction', severity: 'warning', message: 'Metformin + glimepiride: increased hypoglycaemia risk — counsel patient on symptoms.' },
                    { kind: 'renal', severity: 'info', message: 'Patient has CKD Stage 2 — monitor eGFR; metformin dose review advised.' },
                ],
                reviewedBy: doctor._id,
                reviewedAt: daysAgo(1),
                overrideReason: 'Benefit outweighs risk; dose kept low and patient counselled.',
            },
        }),
        mkOrder(3, {
            category: 'medication', department: 'Pharmacy', priority: 'urgent', status: 'acknowledged',
            details: { drugs: [{ name: 'Ibuprofen 400mg', generic: 'ibuprofen', dose: '400 mg', frequency: 'TID', route: 'oral', durationDays: 3, prn: true }] },
            safetyReview: {
                flags: [{ kind: 'allergy', severity: 'critical', message: 'Patient allergy list contains Ibuprofen — confirm before dispensing.' }],
            },
        }),
        // procedure / referral / followup (3)
        mkOrder(6, { category: 'procedure', department: 'Orthopedics', priority: 'routine', status: 'ordered', details: { name: 'Knee aspiration', notes: 'If effusion persists on review' } }),
        mkOrder(1, { category: 'referral', department: 'Cardiology', priority: 'urgent', status: 'acknowledged', details: { toSpecialty: 'Cardiology', reason: 'Exertional angina, needs stress echo and cardiology workup' } }),
        mkOrder(2, { category: 'followup', priority: 'routine', status: 'ordered', details: { date: daysAhead(30), instructions: 'Review with HbA1c and FBS reports' } }),
    ]);
    console.log(`   ${orders.length} clinical orders created (${orders.filter(o => (o.safetyReview?.flags || []).length).length} with safety flags)`);

    // ── Radiology studies (10) across ALL statuses ──────────────────────────
    console.log('Seeding radiology studies...');
    const mkStudy = (pIdx, extra) => ({
        patientId: allPatients[pIdx]._id,
        orderingDoctorId: doctor._id,
        auditTrail: [{ action: 'created', by: 'system' }],
        ...extra,
    });
    const studies = await RadiologyStudy.create([
        // 1) STAT + AI-flagged, freshly ordered
        mkStudy(1, {
            clinicalOrderId: orders[3]._id, encounterId: encounters[1]._id,
            modality: 'CT', bodyPart: 'Chest', contrast: true, clinicalIndication: 'Rule out aortic dissection',
            priority: 'stat', status: 'ORDERED',
            aiTriage: { processed: true, flagged: true, findings: [{ finding: 'Possible mediastinal widening', confidence: 0.87, urgency: 'critical', reason: 'Pattern consistent with aortic pathology' }] },
            tat: { orderedAt: minutesAgo(20) },
        }),
        // 2) STAT + AI-flagged, received and awaiting read — SLA BREACHED (stat SLA = 60 min, ordered 5h ago)
        mkStudy(4, {
            clinicalOrderId: orders[4]._id, encounterId: encounters[4]._id,
            modality: 'CT', bodyPart: 'Head', contrast: false, clinicalIndication: 'Sudden collapse, rule out intracranial bleed',
            priority: 'stat', status: 'UNREAD',
            aiTriage: { processed: true, flagged: true, findings: [{ finding: 'Hyperdense region right frontal lobe', confidence: 0.93, urgency: 'critical', reason: 'Suspected acute haemorrhage' }] },
            tat: { orderedAt: hoursAgo(5), receivedAt: hoursAgo(4.5) },
        }),
        // 3) SIGNED with critical finding communicated AND acknowledged
        mkStudy(12, {
            modality: 'XR', bodyPart: 'Chest', clinicalIndication: 'Pre-op workup, known CAD',
            priority: 'urgent', status: 'SIGNED',
            assignedRadiologistId: radiologist._id,
            aiTriage: { processed: true, flagged: false, findings: [{ finding: 'Cardiomegaly', confidence: 0.78, urgency: 'moderate', reason: 'CTR > 0.5' }] },
            tat: { orderedAt: hoursAgo(30), receivedAt: hoursAgo(29), assignedAt: hoursAgo(28), openedAt: hoursAgo(27), reportStartedAt: hoursAgo(26.5), signedAt: hoursAgo(26) },
            report: {
                sections: { technique: 'PA erect chest radiograph.', comparison: 'None available.', findings: 'Cardiomegaly with upper-lobe venous diversion. New left lower zone opacity concerning for consolidation.', impression: 'Cardiomegaly; left lower zone consolidation — clinical correlation advised.', recommendations: 'Recommend clinical review and follow-up radiograph after treatment.' },
                versions: [{ sections: { technique: 'PA erect chest radiograph.', findings: 'Cardiomegaly with left lower zone opacity.', impression: 'Cardiomegaly; consolidation.', comparison: '', recommendations: '' }, authorId: radiologist._id, at: hoursAgo(26), kind: 'final' }],
                signedBy: radiologist._id, signedAt: hoursAgo(26), signatureHash: 'seedhash-rs-3',
            },
            criticalFinding: { flagged: true, description: 'New consolidation in a pre-operative cardiac patient', communicatedAt: hoursAgo(25.5), acknowledgedBy: doctor._id, acknowledgedAt: hoursAgo(25), escalationLevel: 1 },
        }),
        // 4) RECEIVED
        mkStudy(5, { modality: 'XR', bodyPart: 'Chest', clinicalIndication: 'Asthma exacerbation', priority: 'urgent', status: 'RECEIVED', tat: { orderedAt: hoursAgo(2), receivedAt: hoursAgo(1.5) } }),
        // 5) UNREAD routine
        mkStudy(8, { modality: 'US', bodyPart: 'Abdomen', clinicalIndication: 'CKD surveillance', priority: 'routine', status: 'UNREAD', tat: { orderedAt: hoursAgo(6), receivedAt: hoursAgo(5) } }),
        // 6) IN_PROGRESS
        mkStudy(6, {
            clinicalOrderId: orders[5]._id, encounterId: encounters[6]._id,
            modality: 'MRI', bodyPart: 'Knee', clinicalIndication: 'Suspected ACL injury', priority: 'routine', status: 'IN_PROGRESS',
            assignedRadiologistId: radiologist._id,
            tat: { orderedAt: hoursAgo(10), receivedAt: hoursAgo(9), assignedAt: hoursAgo(8), openedAt: hoursAgo(1) },
        }),
        // 7) DRAFT
        mkStudy(9, {
            modality: 'MG', bodyPart: 'Breast', clinicalIndication: 'Screening mammogram', priority: 'routine', status: 'DRAFT',
            assignedRadiologistId: radiologist._id,
            tat: { orderedAt: hoursAgo(20), receivedAt: hoursAgo(19), assignedAt: hoursAgo(18), openedAt: hoursAgo(3), reportStartedAt: hoursAgo(2.5) },
            report: { sections: { technique: 'Bilateral digital mammogram, CC and MLO views.', findings: 'Scattered fibroglandular densities. No suspicious mass.', impression: 'BI-RADS 1 (draft).', comparison: '', recommendations: '' }, versions: [{ sections: { technique: 'Bilateral digital mammogram.', findings: 'No suspicious mass.', impression: 'BI-RADS 1 (draft).', comparison: '', recommendations: '' }, authorId: radiologist._id, at: hoursAgo(2), kind: 'draft' }] },
        }),
        // 8) REVIEW
        mkStudy(10, {
            modality: 'CT', bodyPart: 'Abdomen', contrast: true, clinicalIndication: 'Abdominal pain, rule out appendicitis', priority: 'urgent', status: 'REVIEW',
            assignedRadiologistId: radiologist._id,
            tat: { orderedAt: hoursAgo(8), receivedAt: hoursAgo(7.5), assignedAt: hoursAgo(7), openedAt: hoursAgo(2), reportStartedAt: hoursAgo(1.5) },
        }),
        // 9) SIGNED, no critical finding
        mkStudy(14, {
            modality: 'XR', bodyPart: 'Sinuses', clinicalIndication: 'Chronic rhinosinusitis', priority: 'routine', status: 'SIGNED',
            assignedRadiologistId: radiologist._id,
            tat: { orderedAt: daysAgo(3), receivedAt: daysAgo(3), assignedAt: daysAgo(2.9), openedAt: daysAgo(2.5), reportStartedAt: daysAgo(2.4), signedAt: daysAgo(2.3) },
            report: { sections: { technique: 'Waters and Caldwell views.', findings: 'Mucosal thickening of bilateral maxillary sinuses.', impression: 'Chronic sinusitis changes.', comparison: '', recommendations: 'ENT correlation.' }, versions: [{ sections: { technique: 'Waters and Caldwell views.', findings: 'Mucosal thickening.', impression: 'Chronic sinusitis changes.', comparison: '', recommendations: '' }, authorId: radiologist._id, at: daysAgo(2.3), kind: 'final' }], signedBy: radiologist._id, signedAt: daysAgo(2.3), signatureHash: 'seedhash-rs-9' },
        }),
        // 10) DELIVERED
        mkStudy(17, {
            modality: 'US', bodyPart: 'Knee', clinicalIndication: 'Osteoarthritis, effusion assessment', priority: 'routine', status: 'DELIVERED',
            assignedRadiologistId: radiologist._id,
            tat: { orderedAt: daysAgo(5), receivedAt: daysAgo(5), assignedAt: daysAgo(4.8), openedAt: daysAgo(4.5), reportStartedAt: daysAgo(4.4), signedAt: daysAgo(4.3), deliveredAt: daysAgo(4.2) },
            report: { sections: { technique: 'High-frequency linear probe.', findings: 'Moderate suprapatellar effusion.', impression: 'Knee joint effusion.', comparison: '', recommendations: 'Consider aspiration if symptomatic.' }, versions: [{ sections: { technique: 'High-frequency linear probe.', findings: 'Moderate effusion.', impression: 'Knee joint effusion.', comparison: '', recommendations: '' }, authorId: radiologist._id, at: daysAgo(4.3), kind: 'final' }], signedBy: radiologist._id, signedAt: daysAgo(4.3), signatureHash: 'seedhash-rs-10' },
        }),
    ]);
    console.log(`   ${studies.length} radiology studies created (statuses: ${[...new Set(studies.map(s => s.status))].join(', ')})`);

    // ── Notifications ───────────────────────────────────────────────────────
    console.log('Seeding notifications...');
    const notifications = await Notification.create([
        { userId: doctor._id, type: 'ai_report_ready', title: 'STAT study AI-flagged', message: 'CT Head for Arjun Singh flagged critical by AI triage — awaiting read.', data: { studyId: studies[1]._id } },
        { userId: doctor._id, type: 'report_reviewed', title: 'Critical finding acknowledged', message: 'You acknowledged the critical finding on Siddharth Joshi\'s chest X-ray.', isRead: true, readAt: hoursAgo(24), data: { studyId: studies[2]._id } },
        { userId: radiologist._id, type: 'scan_uploaded', title: 'New STAT study assigned', message: 'CT Chest (stat) received — rule out aortic dissection.', data: { studyId: studies[0]._id } },
        { userId: radiologist._id, type: 'emergency_update', title: 'SLA breach', message: 'STAT CT Head has exceeded its 60-minute SLA.', data: { studyId: studies[1]._id } },
        { userId: allPatients[0]._id, type: 'report_approved', title: 'Lab report ready', message: 'Your CBC and Dengue NS1 results are available.', data: { orderId: orders[0]._id } },
        { userId: allPatients[2]._id, type: 'prescription_ready', title: 'Prescription ready', message: 'Your diabetes prescription is ready for pickup at the pharmacy.', data: { orderId: orders[7]._id } },
        { userId: allPatients[1]._id, type: 'consultation_scheduled', title: 'Appointment confirmed', message: 'Your appointment with Dr. Raj Sharma is confirmed.', data: { appointmentId: appointments[1]._id } },
        { userId: byRole.pharmacist._id, type: 'general', title: 'Safety flag pending', message: 'Medication order with critical allergy flag awaits pharmacist confirmation.', data: { orderId: orders[8]._id } },
    ]);
    console.log(`   ${notifications.length} notifications created`);

    // ── Invoices ────────────────────────────────────────────────────────────
    console.log('Seeding invoices...');
    const mkInvoice = (n, patientId, type, items, paid) => {
        const subTotal = items.reduce((s, it) => s + it.totalPrice, 0);
        const tax = Math.round(subTotal * 0.18);
        const totalAmount = subTotal + tax;
        return {
            patient: patientId,
            invoiceNumber: `INV-2026-${String(n).padStart(4, '0')}`,
            type,
            items,
            subTotal,
            tax,
            discount: 0,
            totalAmount,
            amountPaid: paid,
            amountDue: totalAmount - paid,
            status: paid >= totalAmount ? 'PAID' : paid > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
            issuedAt: daysAgo(n),
            dueDate: daysAhead(15 - n),
        };
    };
    const invoices = await Invoice.create([
        mkInvoice(1, allPatients[0]._id, 'OPD', [
            { description: 'OPD Consultation — Dr. Raj Sharma', quantity: 1, unitPrice: 500, totalPrice: 500, department: 'OPD' },
            { description: 'CBC + Dengue NS1 panel', quantity: 1, unitPrice: 900, totalPrice: 900, department: 'Laboratory' },
        ], 1652),
        mkInvoice(2, allPatients[2]._id, 'PHARMACY', [
            { description: 'Metformin 500mg x 60', quantity: 60, unitPrice: 2, totalPrice: 120, department: 'Pharmacy' },
            { description: 'Glimepiride 1mg x 30', quantity: 30, unitPrice: 3, totalPrice: 90, department: 'Pharmacy' },
        ], 0),
        mkInvoice(3, allPatients[12]._id, 'LABORATORY', [
            { description: 'Pre-operative panel', quantity: 1, unitPrice: 2500, totalPrice: 2500, department: 'Laboratory' },
            { description: 'Chest X-ray (PA)', quantity: 1, unitPrice: 600, totalPrice: 600, department: 'Radiology' },
        ], 1500),
        mkInvoice(4, allPatients[4]._id, 'EMERGENCY', [
            { description: 'Emergency triage and stabilisation', quantity: 1, unitPrice: 3000, totalPrice: 3000, department: 'Emergency' },
            { description: 'CT Head (plain)', quantity: 1, unitPrice: 3500, totalPrice: 3500, department: 'Radiology' },
        ], 7670),
    ]);
    console.log(`   ${invoices.length} invoices created`);

    // ── Queue tokens ────────────────────────────────────────────────────────
    console.log('Seeding queue tokens...');
    const queueTokens = await QueueToken.create([
        { tokenNumber: 'GM-001', patient: allPatients[3]._id, patientName: 'Priya Nair', appointment: appointments[3]._id, department: 'General Medicine', doctor: doctor._id, room: 'OPD-2', priority: 0, priorityReason: 'Normal', status: 'IN_PROGRESS', calledAt: minutesAgo(10), estimatedWaitMinutes: 0 },
        { tokenNumber: 'GM-002', patient: allPatients[5]._id, patientName: 'Kavya Krishnan', appointment: appointments[5]._id, department: 'General Medicine', doctor: doctor._id, room: 'OPD-2', priority: 0, priorityReason: 'Normal', status: 'WAITING', estimatedWaitMinutes: 15 },
        { tokenNumber: 'GM-003', patient: allPatients[17]._id, patientName: 'Lakshmi Raghavan', department: 'General Medicine', doctor: doctor._id, priority: 5, priorityReason: 'Senior Citizen', status: 'WAITING', estimatedWaitMinutes: 8 },
        { tokenNumber: 'EM-001', patient: allPatients[4]._id, patientName: 'Arjun Singh', department: 'Emergency', priority: 10, priorityReason: 'Emergency', status: 'COMPLETED', calledAt: hoursAgo(5), completedAt: hoursAgo(4), estimatedWaitMinutes: 0 },
        { tokenNumber: 'LB-001', patientName: 'Walk-in — Sample Collection', department: 'Laboratory', priority: 0, priorityReason: 'Normal', status: 'CALLED', calledAt: minutesAgo(2), estimatedWaitMinutes: 0 },
    ]);
    console.log(`   ${queueTokens.length} queue tokens created`);

    // ── Summary ─────────────────────────────────────────────────────────────
    console.log(`\n${'─'.repeat(60)}`);
    console.log('Seed complete!\n');
    console.log('Summary:');
    console.log(`   Users:            ${roleUsers.length + patients.length} (${roleUsers.length} role users, ${patients.length} patients)`);
    console.log(`   Appointments:     ${appointments.length}`);
    console.log(`   Encounters:       ${encounters.length}`);
    console.log(`   Clinical notes:   ${notes.length} (${notes.filter(n => n.status === 'signed').length} signed, ${notes.filter(n => n.status === 'draft').length} draft)`);
    console.log(`   Clinical orders:  ${orders.length}`);
    console.log(`   Radiology studies:${String(studies.length).padStart(3)} (all workflow statuses, 2 STAT AI-flagged, 1 SLA-breached, 1 signed w/ ack'd critical finding)`);
    console.log(`   Notifications:    ${notifications.length}`);
    console.log(`   Invoices:         ${invoices.length}`);
    console.log(`   Queue tokens:     ${queueTokens.length}`);
    console.log(`\nLogin credentials (password for ALL: ${PASSWORD})`);
    for (const u of roleUsers) {
        console.log(`   ${u.role.padEnd(12)} ${u.email}`);
    }
    console.log(`\n   All 20 demo patients also log in with ${PASSWORD} (e.g. aarav.patel@example.dev)\n`);

    await mongoose.disconnect();
    process.exit(0);
};

seed().catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
});
