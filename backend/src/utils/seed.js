/**
 * CareConnect — Database Seed Script
 * Seeds MongoDB with production-ready demo data
 * Usage: node src/utils/seed.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const RadiologyScan = require('../models/RadiologyScan');
const Consultation = require('../models/Consultation');
const Emergency = require('../models/Emergency');
const WalletTransaction = require('../models/WalletTransaction');
const Notification = require('../models/Notification');

const USERS = [
    { firstName: 'Ravi', lastName: 'Teja', email: 'ravi@careconnect.com', password: 'password123', phone: '+91-9876543001', role: 'patient', gender: 'male', dateOfBirth: new Date('1995-06-15'), bloodGroup: 'O+', allergies: ['Penicillin'], isActive: true, isVerified: true, location: { coordinates: [78.4867, 17.3850], address: 'Hyderabad' }, emergencyContact: { name: 'Sita Teja', phone: '+91-9876543099', relationship: 'Mother' }, wallet: { balance: 500 } },
    { firstName: 'Priya', lastName: 'Sharma', email: 'priya@careconnect.com', password: 'password123', phone: '+91-9876543002', role: 'patient', gender: 'female', dateOfBirth: new Date('1990-03-22'), bloodGroup: 'A+', isActive: true, isVerified: true, wallet: { balance: 250 } },
    { firstName: 'Raj', lastName: 'Sharma', email: 'dr.raj@careconnect.com', password: 'password123', phone: '+91-9876543010', role: 'doctor', specialization: 'General Physician', licenseNumber: 'MCI-2015-12345', experience: 12, consultationFee: 300, hospital: 'CareConnect City Hospital', department: 'General Medicine', rating: 4.8, isActive: true, isVerified: true, availability: { isAvailable: true, days: ['Monday','Tuesday','Wednesday','Thursday','Friday'] } },
    { firstName: 'Anita', lastName: 'Desai', email: 'dr.anita@careconnect.com', password: 'password123', phone: '+91-9876543011', role: 'doctor', specialization: 'Orthopedic Surgeon', experience: 15, consultationFee: 500, hospital: 'CareConnect City Hospital', rating: 4.9, isActive: true, isVerified: true },
    { firstName: 'Vikram', lastName: 'Patel', email: 'dr.vikram@careconnect.com', password: 'password123', phone: '+91-9876543012', role: 'doctor', specialization: 'Cardiologist', experience: 18, consultationFee: 800, hospital: 'CareConnect City Hospital', rating: 4.7, isActive: true, isVerified: true },
    { firstName: 'Meera', lastName: 'Reddy', email: 'dr.meera@careconnect.com', password: 'password123', phone: '+91-9876543020', role: 'radiologist', specialization: 'Diagnostic Radiology', experience: 10, certifications: ['ABR Certified', 'FRCR'], rating: 4.9, isActive: true, isVerified: true },
    { firstName: 'Arjun', lastName: 'Nair', email: 'dr.arjun@careconnect.com', password: 'password123', phone: '+91-9876543021', role: 'radiologist', specialization: 'Neuroradiology', experience: 8, certifications: ['ABR Certified'], rating: 4.8, isActive: true, isVerified: true },
    { firstName: 'Admin', lastName: 'CareConnect', email: 'admin@careconnect.com', password: 'admin123', phone: '+91-9876543000', role: 'admin', isActive: true, isVerified: true },
];

const seed = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/careconnect';
    console.log(`\n🌱 CareConnect Seed Script\n${'─'.repeat(50)}`);
    console.log(`📡 Connecting to: ${uri}\n`);

    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
        console.log('✅ MongoDB connected\n');
    } catch (e) {
        console.error('❌ MongoDB connection failed:', e.message);
        console.log('\n💡 Set MONGODB_URI in backend/.env or start local MongoDB.');
        console.log('   Example: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/careconnect');
        process.exit(1);
    }

    // Clean existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
        User.deleteMany({}), RadiologyScan.deleteMany({}),
        Consultation.deleteMany({}), Emergency.deleteMany({}),
        WalletTransaction.deleteMany({}), Notification.deleteMany({}),
    ]);

    // Seed users
    console.log('👥 Seeding users...');
    const users = await User.create(USERS);
    const [ravi, priya, raj, anita, vikram, meera, arjun] = users;
    console.log(`   ✅ ${users.length} users created`);

    // Seed scans
    console.log('🩻 Seeding radiology scans...');
    const scans = await RadiologyScan.create([
        { scanId: 'CC-001', patientId: ravi._id, scanType: 'CT', bodyPart: 'Head', priority: 'emergency', status: 'approved', uploadedBy: ravi._id, assignedRadiologist: meera._id, aiReport: { findings: 'Large hyperdense lesion in right frontal lobe measuring 3.2×2.8 cm', confidence: 0.94, riskLevel: 'high', detectedIssues: [{ name: 'Subdural Hematoma', probability: 0.968, location: 'Right frontal' }], recommendations: ['Immediate neurosurgical consultation'] }, finalReport: { findings: 'Acute subdural haematoma', impression: 'ACUTE RIGHT SUBDURAL HAEMATOMA', reviewedBy: meera._id, reviewedAt: new Date() } },
        { scanId: 'CC-002', patientId: priya._id, scanType: 'MRI', bodyPart: 'Spine', priority: 'urgent', status: 'approved', uploadedBy: priya._id, assignedRadiologist: arjun._id, aiReport: { findings: 'Disc herniation at L4-L5 with neural compression', confidence: 0.82, riskLevel: 'medium', detectedIssues: [{ name: 'Disc Herniation', probability: 0.87, location: 'L4-L5' }], recommendations: ['MRI follow-up in 3 months'] }, finalReport: { findings: 'Confirmed disc herniation', impression: 'L4-L5 DISC HERNIATION WITH MILD NEURAL COMPRESSION', reviewedBy: arjun._id, reviewedAt: new Date() } },
        { scanId: 'CC-003', patientId: ravi._id, scanType: 'X-Ray', bodyPart: 'Chest', priority: 'normal', status: 'pending', uploadedBy: ravi._id, aiReport: { findings: 'No significant abnormality detected', confidence: 0.78, riskLevel: 'low', detectedIssues: [], recommendations: ['Routine follow-up'] } },
    ]);
    console.log(`   ✅ ${scans.length} scans created`);

    // Seed consultations
    console.log('📋 Seeding consultations...');
    const consults = await Consultation.create([
        { patient: ravi._id, doctor: raj._id, type: 'in-person', status: 'completed', scheduledAt: new Date(), complaint: 'Chest pain', notes: 'Referred for CT scan' },
        { patient: priya._id, doctor: anita._id, type: 'video', status: 'scheduled', scheduledAt: new Date(Date.now() + 86400000), complaint: 'Follow-up spine MRI' },
    ]);
    console.log(`   ✅ ${consults.length} consultations created`);

    // Seed wallet transactions
    console.log('💳 Seeding wallet transactions...');
    const txns = await WalletTransaction.create([
        { userId: ravi._id, type: 'credit', amount: 500, description: 'Initial top-up', status: 'completed' },
        { userId: ravi._id, type: 'debit', amount: 200, description: 'Second opinion request', status: 'completed' },
        { userId: priya._id, type: 'credit', amount: 250, description: 'Initial top-up', status: 'completed' },
    ]);
    console.log(`   ✅ ${txns.length} transactions created`);

    // Seed notifications
    console.log('🔔 Seeding notifications...');
    const notifs = await Notification.create([
        { userId: ravi._id, type: 'report_ready', title: 'Report Approved', message: 'Your CT Head report has been approved by Dr. Meera Reddy', read: false },
        { userId: ravi._id, type: 'appointment', title: 'Upcoming Appointment', message: 'Appointment with Dr. Raj Sharma tomorrow at 3:00 PM', read: false },
        { userId: meera._id, type: 'case_assigned', title: 'New Case Assigned', message: 'Emergency CT Head scan assigned to you', read: true },
    ]);
    console.log(`   ✅ ${notifs.length} notifications created`);

    console.log(`\n${'─'.repeat(50)}`);
    console.log('✅ Seed complete!\n');
    console.log('📊 Summary:');
    console.log(`   Users:          ${users.length}`);
    console.log(`   Scans:          ${scans.length}`);
    console.log(`   Consultations:  ${consults.length}`);
    console.log(`   Transactions:   ${txns.length}`);
    console.log(`   Notifications:  ${notifs.length}`);
    console.log(`\n🔐 Demo Logins:`);
    console.log(`   Patient:     ravi@careconnect.com / password123`);
    console.log(`   Doctor:      dr.raj@careconnect.com / password123`);
    console.log(`   Radiologist: dr.meera@careconnect.com / password123`);
    console.log(`   Admin:       admin@careconnect.com / admin123\n`);

    await mongoose.disconnect();
    process.exit(0);
};

seed().catch(e => { console.error('Seed failed:', e); process.exit(1); });
