/**
 * CareConnect — Database Seeder
 * Seeds demo users, scans, and consultations into MongoDB Atlas
 * Run: node backend/src/scripts/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const RadiologyScan = require('../models/RadiologyScan');
const Consultation = require('../models/Consultation');

const DEMO_USERS = [
    {
        firstName: 'Ravi', lastName: 'Teja',
        email: 'ravi@careconnect.com', password: 'password123',
        phone: '+91-9876543001', role: 'patient',
        isActive: true, isVerified: true,
        dateOfBirth: new Date('1995-06-15'), gender: 'male',
        bloodGroup: 'O+', allergies: ['Penicillin'],
        location: { type: 'Point', coordinates: [78.4867, 17.3850], address: 'Hyderabad', city: 'Hyderabad', state: 'Telangana' },
        emergencyContact: { name: 'Sita Teja', phone: '+91-9876543099', relationship: 'Mother' },
        credits: 1500,
    },
    {
        firstName: 'Priya', lastName: 'Sharma',
        email: 'priya@careconnect.com', password: 'password123',
        phone: '+91-9876543002', role: 'patient',
        isActive: true, isVerified: true,
        dateOfBirth: new Date('1990-03-22'), gender: 'female',
        bloodGroup: 'A+', allergies: [],
        location: { type: 'Point', coordinates: [72.8777, 19.0760], address: 'Mumbai', city: 'Mumbai', state: 'Maharashtra' },
        credits: 800,
    },
    {
        firstName: 'Raj', lastName: 'Sharma',
        email: 'dr.raj@careconnect.com', password: 'password123',
        phone: '+91-9876543010', role: 'doctor',
        isActive: true, isVerified: true,
        specialization: 'General Physician', licenseNumber: 'MCI-2015-12345',
        experience: 12, consultationFee: 300,
        hospital: 'CareConnect City Hospital', department: 'General Medicine',
        rating: 4.8,
        availability: {
            isAvailable: true,
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            timeSlots: [{ start: '09:00', end: '13:00' }, { start: '15:00', end: '19:00' }],
        },
    },
    {
        firstName: 'Anita', lastName: 'Desai',
        email: 'dr.anita@careconnect.com', password: 'password123',
        phone: '+91-9876543011', role: 'doctor',
        isActive: true, isVerified: true,
        specialization: 'Orthopedic Surgeon', licenseNumber: 'MCI-2010-98765',
        experience: 15, consultationFee: 500,
        hospital: 'CareConnect City Hospital', department: 'Orthopedics',
        rating: 4.9,
        availability: { isAvailable: true, days: ['Monday', 'Wednesday', 'Friday'] },
    },
    {
        firstName: 'Vikram', lastName: 'Patel',
        email: 'dr.vikram@careconnect.com', password: 'password123',
        phone: '+91-9876543012', role: 'doctor',
        isActive: true, isVerified: true,
        specialization: 'Cardiologist', licenseNumber: 'MCI-2008-55432',
        experience: 18, consultationFee: 800,
        hospital: 'CareConnect City Hospital', department: 'Cardiology',
        rating: 4.7,
        availability: { isAvailable: true, days: ['Tuesday', 'Thursday', 'Saturday'] },
    },
    {
        firstName: 'Meera', lastName: 'Reddy',
        email: 'dr.meera@careconnect.com', password: 'password123',
        phone: '+91-9876543020', role: 'radiologist',
        isActive: true, isVerified: true,
        specialization: 'Diagnostic Radiology', licenseNumber: 'MCI-2016-33210',
        experience: 10, consultationFee: 600,
        certifications: ['ABR Certified', 'FRCR'],
        subspecialty: 'Musculoskeletal Radiology',
        isMarketplaceListed: true, marketplaceFee: 600,
        marketplaceRating: 4.8, marketplaceReviews: 42,
    },
    {
        firstName: 'Arjun', lastName: 'Nair',
        email: 'dr.arjun@careconnect.com', password: 'password123',
        phone: '+91-9876543021', role: 'radiologist',
        isActive: true, isVerified: true,
        specialization: 'Neuroradiology', licenseNumber: 'MCI-2018-77654',
        experience: 8, consultationFee: 700,
        certifications: ['ABR Certified', 'FRCR', 'EDIR'],
        subspecialty: 'Neuroradiology',
        isMarketplaceListed: true, marketplaceFee: 700,
        marketplaceRating: 4.9, marketplaceReviews: 28,
    },
    {
        firstName: 'Admin', lastName: 'CareConnect',
        email: 'admin@careconnect.com', password: 'admin123',
        phone: '+91-9876543000', role: 'admin',
        isActive: true, isVerified: true,
    },
];

async function seed() {
    console.log('🌱 CareConnect Database Seeder');
    console.log('================================');
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        // Clear existing data
        await User.deleteMany({});
        console.log('🗑️  Cleared existing users');

        // Create users (passwords hashed automatically via pre-save hook)
        const created = [];
        for (const userData of DEMO_USERS) {
            const user = new User(userData);
            await user.save();
            created.push(user);
            console.log(`   ✅ Created ${user.role}: ${user.email}`);
        }

        // Create demo scans
        const patient = created.find(u => u.role === 'patient');
        const radiologist = created.find(u => u.role === 'radiologist');
        const doctor = created.find(u => u.role === 'doctor');

        await RadiologyScan.deleteMany({});
        const scans = await RadiologyScan.insertMany([
            {
                scanId: `SCAN-${Date.now()}-001`,
                patientId: patient._id,
                requestedBy: doctor._id,
                scanType: 'CT', bodyPart: 'Head', priority: 'urgent',
                status: 'reviewed',
                assignedRadiologist: radiologist._id,
                fileUrl: '/uploads/dicom/demo-ct-head.dcm',
                fileName: 'demo-ct-head.dcm',
                clinicalNotes: 'CT Head - Rule out hemorrhage',
                dicomMetadata: {
                    studyInstanceUID: '1.2.840.113619.2.55.3.604688119.971.1717595236.375',
                    modality: 'CT', studyDate: new Date(),
                },
                aiReport: {
                    riskLevel: 'high', confidence: 0.94,
                    findings: 'Large hyperdense lesion in right frontal lobe (3.2x2.8 cm) with perilesional oedema. Midline shift 4mm to left.',
                    detectedIssues: [
                        { name: 'Subdural Hematoma', probability: 0.968, location: 'Right frontal lobe' },
                        { name: 'Perilesional Oedema', probability: 0.870, location: 'Bilateral' },
                        { name: 'Midline Shift', probability: 0.820, location: 'Central' },
                    ],
                    recommendations: ['Immediate neurosurgical consultation required', 'Repeat CT in 6 hours'],
                    processedAt: new Date(),
                },
                finalReport: {
                    findings: 'Large acute subdural haematoma along the right cerebral convexity measuring 3.2 x 2.8 cm.',
                    impression: 'Large acute right subdural haematoma with midline shift. URGENT NEUROSURGICAL REVIEW REQUIRED.',
                    riskLevel: 'critical', reviewedBy: radiologist._id, reviewedAt: new Date(),
                },
            },
            {
                scanId: `SCAN-${Date.now()}-002`,
                patientId: patient._id,
                requestedBy: doctor._id,
                scanType: 'XRAY', bodyPart: 'Chest', priority: 'normal',
                status: 'uploaded',
                fileUrl: '/uploads/dicom/demo-xray-chest.dcm',
                fileName: 'demo-xray-chest.dcm',
                clinicalNotes: 'Chest X-Ray - Annual checkup',
                aiReport: { riskLevel: 'low', confidence: 0, findings: '' },
            },
        ]);
        console.log(`✅ Created ${scans.length} demo scans`);

        // Create demo consultations
        await Consultation.deleteMany({});
        await Consultation.insertMany([
            {
                patientId: patient._id, doctorId: doctor._id,
                type: 'video', status: 'completed',
                scheduledAt: new Date(Date.now() - 86400000),
                symptoms: ['Headache', 'Dizziness', 'Nausea'],
                notes: 'Patient presented with acute headache and dizziness. CT scan ordered.',
                diagnosis: 'Acute subdural hematoma - requires urgent neurosurgical intervention',
                prescription: [{ medicine: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '3 days' }],
                fee: 300, paymentStatus: 'paid',
            },
            {
                patientId: patient._id, doctorId: doctor._id,
                type: 'chat', status: 'pending',
                scheduledAt: new Date(Date.now() + 86400000),
                symptoms: ['Follow-up consultation'],
                fee: 300, paymentStatus: 'pending',
            },
        ]);
        console.log('✅ Created demo consultations');

        console.log('\n🎉 Seeding complete!');
        console.log('\n📋 Login Credentials:');
        console.log('   Patient:     ravi@careconnect.com / password123');
        console.log('   Doctor:      dr.raj@careconnect.com / password123');
        console.log('   Radiologist: dr.meera@careconnect.com / password123');
        console.log('   Admin:       admin@careconnect.com / admin123');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    }
}

seed();
