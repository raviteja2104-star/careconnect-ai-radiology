const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        console.log('Cleared existing users');

        const users = [
            // Patients
            {
                firstName: 'Ravi',
                lastName: 'Teja',
                email: 'ravi@careconnect.com',
                password: 'password123',
                phone: '+91-9876543001',
                role: 'patient',
                dateOfBirth: new Date('1995-06-15'),
                gender: 'male',
                bloodGroup: 'O+',
                allergies: ['Penicillin'],
                location: { coordinates: [78.4867, 17.3850], address: 'Hyderabad, Telangana', city: 'Hyderabad', state: 'Telangana' },
                emergencyContact: { name: 'Sita Teja', phone: '+91-9876543099', relationship: 'Mother' },
                isVerified: true,
            },
            {
                firstName: 'Priya',
                lastName: 'Sharma',
                email: 'priya@careconnect.com',
                password: 'password123',
                phone: '+91-9876543002',
                role: 'patient',
                dateOfBirth: new Date('1990-03-22'),
                gender: 'female',
                bloodGroup: 'A+',
                allergies: [],
                location: { coordinates: [77.5946, 12.9716], address: 'Bangalore, Karnataka', city: 'Bangalore', state: 'Karnataka' },
                isVerified: true,
            },
            // Doctors
            {
                firstName: 'Raj',
                lastName: 'Sharma',
                email: 'dr.raj@careconnect.com',
                password: 'password123',
                phone: '+91-9876543010',
                role: 'doctor',
                specialization: 'General Physician',
                licenseNumber: 'MCI-2015-12345',
                experience: 12,
                consultationFee: 300,
                hospital: 'CareConnect City Hospital',
                department: 'General Medicine',
                rating: 4.8,
                availability: {
                    isAvailable: true,
                    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                    timeSlots: [{ start: '09:00', end: '17:00' }],
                },
                isVerified: true,
            },
            {
                firstName: 'Anita',
                lastName: 'Desai',
                email: 'dr.anita@careconnect.com',
                password: 'password123',
                phone: '+91-9876543011',
                role: 'doctor',
                specialization: 'Orthopedic Surgeon',
                licenseNumber: 'MCI-2012-67890',
                experience: 15,
                consultationFee: 500,
                hospital: 'CareConnect City Hospital',
                department: 'Orthopedics',
                rating: 4.9,
                availability: {
                    isAvailable: true,
                    days: ['Monday', 'Wednesday', 'Friday'],
                    timeSlots: [{ start: '10:00', end: '16:00' }],
                },
                isVerified: true,
            },
            {
                firstName: 'Vikram',
                lastName: 'Patel',
                email: 'dr.vikram@careconnect.com',
                password: 'password123',
                phone: '+91-9876543012',
                role: 'doctor',
                specialization: 'Cardiologist',
                licenseNumber: 'MCI-2010-11111',
                experience: 18,
                consultationFee: 800,
                hospital: 'CareConnect City Hospital',
                department: 'Cardiology',
                rating: 4.7,
                isVerified: true,
            },
            // Radiologists
            {
                firstName: 'Meera',
                lastName: 'Reddy',
                email: 'dr.meera@careconnect.com',
                password: 'password123',
                phone: '+91-9876543020',
                role: 'radiologist',
                specialization: 'Diagnostic Radiology',
                licenseNumber: 'MCI-2014-22222',
                experience: 10,
                certifications: ['ABR Certified', 'FRCR'],
                subspecialty: 'Musculoskeletal Radiology',
                hospital: 'CareConnect City Hospital',
                isVerified: true,
            },
            {
                firstName: 'Arjun',
                lastName: 'Nair',
                email: 'dr.arjun@careconnect.com',
                password: 'password123',
                phone: '+91-9876543021',
                role: 'radiologist',
                specialization: 'Neuroradiology',
                licenseNumber: 'MCI-2016-33333',
                experience: 8,
                certifications: ['ABR Certified'],
                subspecialty: 'Neuroradiology',
                hospital: 'CareConnect City Hospital',
                isVerified: true,
            },
            // Admin
            {
                firstName: 'Admin',
                lastName: 'CareConnect',
                email: 'admin@careconnect.com',
                password: 'admin123',
                phone: '+91-9876543000',
                role: 'admin',
                isVerified: true,
            },
        ];

        await User.create(users);
        console.log(`✅ Seeded ${users.length} users`);
        console.log('\n📋 Login Credentials:');
        console.log('─────────────────────────────────────');
        users.forEach((u) => {
            console.log(`${u.role.padEnd(13)} | ${u.email.padEnd(28)} | ${u.password}`);
        });
        console.log('─────────────────────────────────────');

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};

seedData();
