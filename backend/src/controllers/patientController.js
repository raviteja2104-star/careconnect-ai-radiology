const Appointment = require('../models/Appointment');
const QueueToken = require('../models/QueueToken');
const Invoice = require('../models/Invoice');
const TelemedicineSession = require('../models/TelemedicineSession');
const ConsentDocument = require('../models/ConsentDocument');
const User = require('../models/User');

// Derive a display MRN from MongoDB ObjectId (last 8 hex chars, uppercased).
function makeMrn(id) {
    return `MRN-${String(id).slice(-8).toUpperCase()}`;
}

// ─── Patient Management CRUD ──────────────────────────────────────────────────

const isDBConnected = () => require('mongoose').connection.readyState === 1;

// @desc  List patients (clinical staff only)
// @route GET /api/patients
exports.listPatients = async (req, res) => {
    try {
        if (!isDBConnected()) {
            return res.json({ success: true, data: [{ _id: 'demo-patient-1', firstName: 'Ravi', lastName: 'Teja', role: 'patient', mrn: 'MRN-DEMO1' }], total: 1, page: 1, limit: 100 });
        }
        const { search = '', page = 1, limit = 100 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const filter = { role: 'patient' };
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            User.countDocuments(filter),
        ]);

        const patients = users.map(u => ({ ...u, mrn: makeMrn(u._id) }));
        res.json({ success: true, data: patients, total, page: Number(page), limit: Number(limit) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc  Create a new patient record
// @route POST /api/patients
exports.createPatient = async (req, res) => {
    try {
        if (!isDBConnected()) {
            return res.status(201).json({ success: true, data: { _id: 'demo-new-pt', firstName: req.body.firstName, lastName: req.body.lastName, role: 'patient', mrn: 'MRN-NEW-DEMO' } });
        }
        const { firstName, lastName, phone, email, dateOfBirth, gender, bloodGroup, allergies, diagnosis } = req.body;

        if (!firstName?.trim() || !lastName?.trim()) {
            return res.status(400).json({ success: false, message: 'First name and last name are required.' });
        }

        const patientData = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            role: 'patient',
            isActive: true,
            isVerified: false,
        };

        if (phone?.trim()) patientData.phone = phone.trim();
        if (email?.trim()) patientData.email = email.trim().toLowerCase();
        if (dateOfBirth) patientData.dateOfBirth = new Date(dateOfBirth);
        if (gender) patientData.gender = gender.toLowerCase();
        if (bloodGroup) patientData.bloodGroup = bloodGroup;
        if (allergies?.length) patientData.allergies = Array.isArray(allergies) ? allergies : [allergies];
        if (diagnosis?.trim()) {
            patientData.medicalHistory = [{ condition: diagnosis.trim(), diagnosedDate: new Date() }];
        }

        const patient = await User.create(patientData);
        const safe = patient.toObject();
        delete safe.password;
        safe.mrn = makeMrn(safe._id);

        res.status(201).json({ success: true, data: safe });
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0] || 'field';
            return res.status(400).json({ success: false, message: `This ${field} is already registered to another patient.` });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc  Get a single patient
// @route GET /api/patients/:id
exports.getPatient = async (req, res) => {
    try {
        const patient = await User.findOne({ _id: req.params.id, role: 'patient' }).select('-password').lean();
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
        res.json({ success: true, data: { ...patient, mrn: makeMrn(patient._id) } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc  Update patient demographics
// @route PUT /api/patients/:id
exports.updatePatient = async (req, res) => {
    try {
        const allowed = ['firstName', 'lastName', 'phone', 'email', 'dateOfBirth', 'gender', 'bloodGroup', 'allergies', 'chronicDiseases'];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }
        if (updates.gender) updates.gender = updates.gender.toLowerCase();
        if (updates.email) updates.email = updates.email.toLowerCase();

        const patient = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'patient' },
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password').lean();

        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
        res.json({ success: true, data: { ...patient, mrn: makeMrn(patient._id) } });
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0] || 'field';
            return res.status(400).json({ success: false, message: `This ${field} is already registered to another patient.` });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

// ─── Patient Wallet ───────────────────────────────────────────────────────────

// @desc    Get complete patient digital health wallet overview
// @route   GET /api/patient/:patientId/wallet
exports.getPatientWallet = async (req, res) => {
    try {
        const { patientId } = req.params;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Fetch Patient Profile
        const profile = await User.findById(patientId).select('-password');
        if (!profile) return res.status(404).json({ success: false, error: 'Patient not found' });

        // 2. Fetch Active/Upcoming Appointments
        const appointments = await Appointment.find({
            patient: patientId,
            date: { $gte: today }
        }).populate('doctor', 'name').sort({ date: 1, timeSlot: 1 }).limit(5);

        // 3. Fetch Active Queue Tokens (Live wait time)
        const activeTokens = await QueueToken.find({
            patient: patientId,
            createdAt: { $gte: today },
            status: { $in: ['WAITING', 'IN_PROGRESS'] }
        });

        // 4. Fetch Pending Invoices
        const pendingInvoices = await Invoice.find({
            patient: patientId,
            status: { $in: ['UNPAID', 'PARTIALLY_PAID'] }
        }).sort({ createdAt: -1 });

        // 5. Fetch Pending Consents
        const pendingConsents = await ConsentDocument.find({
            patient: patientId,
            status: 'REQUESTED'
        });

        // 6. Fetch Upcoming Telemedicine
        const telemedicine = await TelemedicineSession.find({
            patient: patientId,
            status: 'SCHEDULED'
        }).populate('doctor', 'name');

        res.json({
            success: true,
            data: {
                profile,
                appointments,
                activeTokens,
                pendingInvoices,
                pendingConsents,
                telemedicine
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
