/**
 * vizagProviderSeed.js — CareConnect Nearby sample data.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * HONESTY NOTICE: every provider, doctor, phone number, and rating below is
 * FICTIONAL — structurally-realistic PLACEHOLDER data shaped like a Vizag
 * healthcare directory entry, NOT a real onboarded hospital/clinic/doctor.
 * No name, address, phone number, or lat/long here should ever be presented
 * to a user as belonging to a real Visakhapatnam provider. Each provider is
 * seeded with verificationStatus: 'UNVERIFIED' and source: 'seed_sample' for
 * exactly this reason — the UI/API layer must treat 'seed_sample' rows as
 * "sample data, not a real onboarded listing" and never claim otherwise.
 * Locality NAMES (MVP Colony, Dwaraka Nagar, ...) are real Vizag areas used
 * only as location labels; the coordinates attached to each are a plausible
 * approximate point near Vizag's actual center (17.6868° N, 83.2185° E) —
 * NOT surveyed/precise addresses. Real onboarding replaces this file's
 * providers entirely; it does not extend them.
 * ══════════════════════════════════════════════════════════════════════════
 */

// Approximate (not surveyed) locality centers used to place seed providers
// on the map in roughly the right part of the city.
const LOCALITY_COORDS = {
    'MVP Colony': [83.3246, 17.7284],
    'Dwaraka Nagar': [83.2996, 17.7211],
    'Madhurawada': [83.3805, 17.8025],
    'Gajuwaka': [83.2050, 17.6820],
    'Seethammadhara': [83.3120, 17.7365],
    'Akkayyapalem': [83.2950, 17.7350],
    'Asilmetta': [83.3130, 17.7180],
    'Maharani Peta': [83.3010, 17.7050],
    'Arilova': [83.3220, 17.7750],
    'Rushikonda': [83.3820, 17.7800],
    'NAD Junction': [83.2450, 17.7450],
    'Visalakshi Nagar': [83.2980, 17.7270],
    Other: [83.2185, 17.6868],
};

const DEFAULT_WEEKDAY_SCHEDULE = {
    days: [1, 2, 3, 4, 5, 6], // Mon-Sat
    startTime: '09:00',
    endTime: '17:00',
    slotMinutes: 20,
    breaks: [{ start: '13:00', end: '14:00' }],
    maxPerSlot: 1,
};

const providers = [
    {
        name: 'Vizag General Multi-Specialty Hospital',
        type: 'hospital',
        subtype: 'multi_specialty',
        description: 'Sample multi-specialty hospital listing for CareConnect Nearby (placeholder data).',
        locality: 'MVP Colony',
        address: 'Near MVP Colony Main Road, Visakhapatnam (sample address)',
        pincode: '530017',
        phone: '+91-891-5550101',
        email: 'contact@vizaggeneral.sample',
        emergencyAvailable: true,
        servicesOffered: ['Emergency Care', 'ICU', 'General Surgery', 'Cardiology', 'Orthopedics', 'Pediatrics'],
        specialties: ['General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics'],
        consultationFeeRange: { min: 300, max: 900 },
        insuranceAccepted: ['Star Health', 'HDFC Ergo', 'CGHS'],
        homeCollection: false,
        teleconsultation: true,
        workingHours: [{ day: -1, is24h: true }], // placeholder replaced below (emergency block is 24h)
        doctors: [
            { name: 'Dr. Kavitha Rao', specialty: 'General Medicine', specialties: ['General Medicine'], qualification: 'MBBS, MD', experienceYears: 12, languages: ['English', 'Telugu', 'Hindi'], consultationFee: 300, consultationTypes: ['in_person', 'video'] },
            { name: 'Dr. Srinivas Rao', specialty: 'Cardiology', specialties: ['Cardiology'], qualification: 'MBBS, DM Cardiology', experienceYears: 18, languages: ['English', 'Telugu'], consultationFee: 800, consultationTypes: ['in_person'] },
            { name: 'Dr. Lakshmi Prasanna', specialty: 'Orthopedics', specialties: ['Orthopedics'], qualification: 'MBBS, MS Ortho', experienceYears: 10, languages: ['English', 'Telugu'], consultationFee: 600, consultationTypes: ['in_person'] },
            { name: 'Dr. Anil Kumar Varma', specialty: 'Pediatrics', specialties: ['Pediatrics'], qualification: 'MBBS, MD Pediatrics', experienceYears: 9, languages: ['English', 'Telugu'], consultationFee: 400, consultationTypes: ['in_person', 'video'] },
        ],
        services: [
            { name: 'General Consultation', category: 'Consultation', price: 300, durationMinutes: 20, department: 'General Medicine', doctorIndex: 0 },
            { name: 'Cardiology Consultation', category: 'Consultation', price: 800, durationMinutes: 20, department: 'Cardiology', doctorIndex: 1 },
            { name: 'Orthopedic Follow-up', category: 'Follow-up', price: 250, durationMinutes: 15, department: 'Orthopedics', doctorIndex: 2 },
            { name: 'Digital X-Ray', category: 'Diagnostics-Imaging', price: 500, durationMinutes: 15, department: 'Radiology' },
        ],
        // doctorIndex null = provider-level schedule (e.g. shared X-Ray slot).
        scheduleDoctorIndexes: [0, 1, 2, 3],
    },
    {
        name: 'Dwaraka Nagar Family Clinic',
        type: 'clinic',
        subtype: 'family_clinic',
        description: 'Sample neighbourhood family clinic listing (placeholder data).',
        locality: 'Dwaraka Nagar',
        address: 'Dwaraka Nagar Main Road, Visakhapatnam (sample address)',
        pincode: '530016',
        phone: '+91-891-5550102',
        email: 'hello@dwarakaclinic.sample',
        emergencyAvailable: false,
        servicesOffered: ['General Consultation', 'Gynecology', 'Vaccination'],
        specialties: ['General Medicine', 'Gynecology'],
        consultationFeeRange: { min: 250, max: 400 },
        insuranceAccepted: [],
        homeCollection: false,
        teleconsultation: true,
        doctors: [
            { name: 'Dr. Ramesh Chandra', specialty: 'General Medicine', specialties: ['General Medicine'], qualification: 'MBBS', experienceYears: 8, languages: ['English', 'Telugu'], consultationFee: 250, consultationTypes: ['in_person', 'video'] },
            { name: 'Dr. Swathi Reddy', specialty: 'Gynecology', specialties: ['Gynecology'], qualification: 'MBBS, MS OBG', experienceYears: 11, languages: ['English', 'Telugu'], consultationFee: 400, consultationTypes: ['in_person'] },
        ],
        services: [
            { name: 'General Consultation', category: 'Consultation', price: 250, durationMinutes: 15, department: 'General Medicine', doctorIndex: 0 },
            { name: 'Gynecology Consultation', category: 'Consultation', price: 400, durationMinutes: 20, department: 'Gynecology', doctorIndex: 1 },
            { name: 'Routine Vaccination', category: 'Vaccination', price: 150, durationMinutes: 10, department: 'General Medicine' },
        ],
        scheduleDoctorIndexes: [0, 1],
    },
    {
        name: 'Madhurawada Diagnostic & Imaging Center',
        type: 'diagnostic',
        subtype: 'pathology_lab',
        description: 'Sample diagnostic and imaging center listing (placeholder data).',
        locality: 'Madhurawada',
        address: 'IT Hub Road, Madhurawada, Visakhapatnam (sample address)',
        pincode: '530048',
        phone: '+91-891-5550103',
        email: 'info@madhurawadadiag.sample',
        emergencyAvailable: false,
        servicesOffered: ['Blood Tests', 'Ultrasound', 'Lipid Profile', 'Full Body Checkup'],
        specialties: [],
        consultationFeeRange: { min: 0, max: 0 },
        insuranceAccepted: ['Star Health'],
        homeCollection: true,
        teleconsultation: false,
        doctors: [],
        services: [
            { name: 'Complete Blood Count (CBC)', category: 'Diagnostics-Lab', price: 300, durationMinutes: 10, department: 'Pathology', homeCollection: true },
            { name: 'Lipid Profile', category: 'Diagnostics-Lab', price: 600, durationMinutes: 10, department: 'Pathology', homeCollection: true },
            { name: 'Abdominal Ultrasound', category: 'Diagnostics-Imaging', price: 900, durationMinutes: 20, department: 'Radiology' },
        ],
        // Provider-level schedule only (no doctors) — walk-in / collection hours.
        scheduleDoctorIndexes: [null],
        scheduleOverrides: { slotMinutes: 15, maxPerSlot: 3 },
    },
    {
        name: 'Gajuwaka Community Hospital',
        type: 'hospital',
        subtype: 'government',
        description: 'Sample community hospital listing (placeholder data).',
        locality: 'Gajuwaka',
        address: 'Gajuwaka Main Road, Visakhapatnam (sample address)',
        pincode: '530026',
        phone: '+91-891-5550104',
        email: 'info@gajuwakahospital.sample',
        emergencyAvailable: true,
        servicesOffered: ['Emergency Care', 'General Surgery', 'ENT', 'Dermatology', 'Physiotherapy'],
        specialties: ['General Medicine', 'ENT', 'Orthopedics', 'Dermatology'],
        consultationFeeRange: { min: 150, max: 400 },
        insuranceAccepted: ['CGHS', 'Ayushman Bharat'],
        homeCollection: false,
        teleconsultation: false,
        doctors: [
            { name: 'Dr. Venkata Ramana', specialty: 'General Medicine', specialties: ['General Medicine'], qualification: 'MBBS', experienceYears: 15, languages: ['Telugu', 'English'], consultationFee: 150, consultationTypes: ['in_person'] },
            { name: 'Dr. Padma Priya', specialty: 'ENT', specialties: ['ENT'], qualification: 'MBBS, MS ENT', experienceYears: 9, languages: ['Telugu', 'English'], consultationFee: 350, consultationTypes: ['in_person'] },
            { name: 'Dr. Suresh Babu', specialty: 'Orthopedics', specialties: ['Orthopedics'], qualification: 'MBBS, MS Ortho', experienceYears: 13, languages: ['Telugu', 'English'], consultationFee: 400, consultationTypes: ['in_person'] },
            { name: 'Dr. Haritha Chowdary', specialty: 'Dermatology', specialties: ['Dermatology'], qualification: 'MBBS, MD Derm', experienceYears: 7, languages: ['Telugu', 'English'], consultationFee: 350, consultationTypes: ['in_person'] },
        ],
        services: [
            { name: 'General Consultation', category: 'Consultation', price: 150, durationMinutes: 15, department: 'General Medicine', doctorIndex: 0 },
            { name: 'ENT Consultation', category: 'Consultation', price: 350, durationMinutes: 20, department: 'ENT', doctorIndex: 1 },
            { name: 'CT Scan', category: 'Diagnostics-Imaging', price: 2500, durationMinutes: 30, department: 'Radiology' },
            { name: 'Physiotherapy Session', category: 'Physiotherapy', price: 400, durationMinutes: 30, department: 'Physiotherapy' },
        ],
        scheduleDoctorIndexes: [0, 1, 2, 3],
    },
    {
        name: 'Seethammadhara Wellness Clinic',
        type: 'clinic',
        subtype: 'multi_specialty',
        description: 'Sample multi-specialty outpatient clinic listing (placeholder data).',
        locality: 'Seethammadhara',
        address: 'Seethammadhara Main Road, Visakhapatnam (sample address)',
        pincode: '530013',
        phone: '+91-891-5550105',
        email: 'care@seethammadharawellness.sample',
        emergencyAvailable: false,
        servicesOffered: ['General Consultation', 'Pediatrics', 'Gynecology', 'Vaccination'],
        specialties: ['General Medicine', 'Pediatrics', 'Gynecology'],
        consultationFeeRange: { min: 300, max: 400 },
        insuranceAccepted: ['HDFC Ergo'],
        homeCollection: false,
        teleconsultation: true,
        doctors: [
            { name: 'Dr. Naveen Kumar Reddy', specialty: 'General Medicine', specialties: ['General Medicine'], qualification: 'MBBS, MD', experienceYears: 10, languages: ['English', 'Telugu'], consultationFee: 300, consultationTypes: ['in_person', 'video'] },
            { name: 'Dr. Divya Sree', specialty: 'Pediatrics', specialties: ['Pediatrics'], qualification: 'MBBS, MD Pediatrics', experienceYears: 6, languages: ['English', 'Telugu'], consultationFee: 350, consultationTypes: ['in_person', 'video'] },
            { name: 'Dr. Meenakshi Iyer', specialty: 'Gynecology', specialties: ['Gynecology'], qualification: 'MBBS, DGO', experienceYears: 14, languages: ['English', 'Telugu', 'Tamil'], consultationFee: 400, consultationTypes: ['in_person'] },
        ],
        services: [
            { name: 'General Consultation', category: 'Consultation', price: 300, durationMinutes: 15, department: 'General Medicine', doctorIndex: 0 },
            { name: 'Pediatric Consultation', category: 'Consultation', price: 350, durationMinutes: 20, department: 'Pediatrics', doctorIndex: 1 },
            { name: 'Child Vaccination', category: 'Vaccination', price: 200, durationMinutes: 10, department: 'Pediatrics' },
        ],
        scheduleDoctorIndexes: [0, 1, 2],
    },
    {
        name: 'Akkayyapalem City Pharmacy',
        type: 'pharmacy',
        subtype: 'retail_pharmacy',
        description: 'Sample retail pharmacy listing with home delivery (placeholder data).',
        locality: 'Akkayyapalem',
        address: 'Akkayyapalem Junction, Visakhapatnam (sample address)',
        pincode: '530016',
        phone: '+91-891-5550106',
        email: 'orders@akkayyapalempharmacy.sample',
        emergencyAvailable: false,
        servicesOffered: ['Medicine Delivery', 'OTC Drugs', 'Health Devices'],
        specialties: [],
        consultationFeeRange: { min: 0, max: 0 },
        insuranceAccepted: [],
        homeCollection: false,
        teleconsultation: false,
        appointmentEnabled: false,
        doctors: [],
        services: [
            { name: 'Medicine Home Delivery', category: 'Other', price: 0, durationMinutes: 0, department: 'Pharmacy', onlineBooking: false },
        ],
        scheduleDoctorIndexes: [],
    },
    {
        name: 'Asilmetta Dental & Eye Care',
        type: 'clinic',
        subtype: 'dental_eye',
        description: 'Sample dental and eye care clinic listing (placeholder data).',
        locality: 'Asilmetta',
        address: 'Asilmetta Junction, Visakhapatnam (sample address)',
        pincode: '530003',
        phone: '+91-891-5550107',
        email: 'smile@asilmettadentaleye.sample',
        emergencyAvailable: false,
        servicesOffered: ['Dental Checkup', 'Root Canal', 'Eye Checkup', 'Cataract Screening'],
        specialties: ['Dental', 'Ophthalmology'],
        consultationFeeRange: { min: 400, max: 500 },
        insuranceAccepted: [],
        homeCollection: false,
        teleconsultation: false,
        doctors: [
            { name: 'Dr. Praveen Kumar Setty', specialty: 'Dental', specialties: ['Dental'], qualification: 'BDS, MDS', experienceYears: 8, languages: ['English', 'Telugu'], consultationFee: 500, consultationTypes: ['in_person'] },
            { name: 'Dr. Aruna Vasireddy', specialty: 'Ophthalmology', specialties: ['Ophthalmology'], qualification: 'MBBS, MS Ophthalmology', experienceYears: 12, languages: ['English', 'Telugu'], consultationFee: 400, consultationTypes: ['in_person'] },
        ],
        services: [
            { name: 'Dental Consultation', category: 'Dental', price: 500, durationMinutes: 20, department: 'Dental', doctorIndex: 0 },
            { name: 'Eye Checkup', category: 'Eye', price: 400, durationMinutes: 15, department: 'Ophthalmology', doctorIndex: 1 },
        ],
        scheduleDoctorIndexes: [0, 1],
    },
    {
        name: 'NAD Junction Diagnostic Labs',
        type: 'diagnostic',
        subtype: 'pathology_lab',
        description: 'Sample pathology lab listing (placeholder data).',
        locality: 'NAD Junction',
        address: 'NAD Junction, Visakhapatnam (sample address)',
        pincode: '530009',
        phone: '+91-891-5550108',
        email: 'lab@nadjunctiondiag.sample',
        emergencyAvailable: false,
        servicesOffered: ['Full Body Checkup', 'Diabetes Panel', 'Thyroid Profile'],
        specialties: [],
        consultationFeeRange: { min: 0, max: 0 },
        insuranceAccepted: [],
        homeCollection: true,
        teleconsultation: false,
        doctors: [],
        services: [
            { name: 'Full Body Checkup Panel', category: 'Diagnostics-Lab', price: 1500, durationMinutes: 20, department: 'Pathology', homeCollection: true },
        ],
        scheduleDoctorIndexes: [null],
        scheduleOverrides: { slotMinutes: 15, maxPerSlot: 2 },
    },
];

// Fix the placeholder emergency-hospital workingHours entry (24h, every day)
// and give every other provider a plain Mon-Sat 9-6 label (display only —
// actual bookable availability comes from ProviderSchedule, not this field).
for (const p of providers) {
    if (Array.isArray(p.workingHours) && p.workingHours[0]?.day === -1) {
        p.workingHours = [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, is24h: true }));
    } else if (!p.workingHours) {
        p.workingHours = [1, 2, 3, 4, 5, 6].map((day) => ({ day, open: '09:00', close: '18:00', is24h: false }));
    }
    p.geo = { type: 'Point', coordinates: LOCALITY_COORDS[p.locality] || LOCALITY_COORDS.Other };
}

module.exports = {
    LOCALITY_COORDS,
    DEFAULT_WEEKDAY_SCHEDULE,
    providers,
};
