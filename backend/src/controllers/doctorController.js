const User = require('../models/User');
const Consultation = require('../models/Consultation');
const RadiologyScan = require('../models/RadiologyScan');

const isDBConnected = () => {
    const mongoose = require('mongoose');
    return mongoose.connection.readyState === 1;
};

const MOCK_STATS = {
    totalPatients: 24, pendingConsultations: 5, activeConsultations: 2, completedToday: 8, completedTotal: 147,
    weeklyConsultations: [8, 12, 6, 10, 8, 14, 8],
    demographics: { male: 58, female: 38, other: 4 },
};

const MOCK_PATIENTS = [
    { _id: 'demo-patient-1', firstName: 'Ravi', lastName: 'Teja', email: 'ravi@careconnect.com', dateOfBirth: '1995-06-15', gender: 'male', bloodGroup: 'O+', allergies: ['Penicillin'], phone: '+91-9876543001' },
    { _id: 'demo-patient-2', firstName: 'Priya', lastName: 'Sharma', email: 'priya@careconnect.com', dateOfBirth: '1990-03-22', gender: 'female', bloodGroup: 'A+', allergies: [], phone: '+91-9876543002' },
    { _id: 'demo-patient-3', firstName: 'Amit', lastName: 'Kumar', email: 'amit@example.com', dateOfBirth: '1982-11-08', gender: 'male', bloodGroup: 'B+', allergies: [], phone: '+91-9876543003' },
];

const MOCK_CONSULTATIONS = [
    { _id: 'cons-1', patientId: { _id: 'demo-patient-1', firstName: 'Ravi', lastName: 'Teja' }, type: 'chat', status: 'pending', symptoms: ['Headache', 'Fever'], createdAt: new Date(Date.now() - 3600000).toISOString() },
    { _id: 'cons-2', patientId: { _id: 'demo-patient-2', firstName: 'Priya', lastName: 'Sharma' }, type: 'video', status: 'pending', symptoms: ['Back Pain', 'Dizziness'], createdAt: new Date(Date.now() - 7200000).toISOString() },
    { _id: 'cons-3', patientId: { _id: 'demo-patient-3', firstName: 'Amit', lastName: 'Kumar' }, type: 'chat', status: 'active', symptoms: ['Chest Pain'], createdAt: new Date(Date.now() - 10800000).toISOString() },
];

// ─── Get Doctor Stats ─────────────────────────────────────────────────────────
const getDoctorStats = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            return res.json({ success: true, data: MOCK_STATS });
        }
        const doctorId = req.user._id;
        const [totalPatients, pending, active, completedToday, completedTotal] = await Promise.all([
            Consultation.distinct('patientId', { doctorId }).then(r => r.length),
            Consultation.countDocuments({ doctorId, status: 'pending' }),
            Consultation.countDocuments({ doctorId, status: 'active' }),
            Consultation.countDocuments({ doctorId, status: 'completed', updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
            Consultation.countDocuments({ doctorId, status: 'completed' }),
        ]);
        res.json({ success: true, data: { totalPatients, pendingConsultations: pending, activeConsultations: active, completedToday, completedTotal } });
    } catch (error) { next(error); }
};

// ─── Get Doctor's Patients ────────────────────────────────────────────────────
const getPatients = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            return res.json({ success: true, data: MOCK_PATIENTS });
        }
        const doctorId = req.user._id;
        const patientIds = await Consultation.distinct('patientId', { doctorId });
        const patients = await User.find({ _id: { $in: patientIds }, role: 'patient' }).select('firstName lastName email dateOfBirth gender bloodGroup allergies phone avatar');
        res.json({ success: true, data: patients });
    } catch (error) { next(error); }
};

// ─── Get Patient History ──────────────────────────────────────────────────────
const getPatientHistory = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        if (!isDBConnected()) {
            const patient = MOCK_PATIENTS.find(p => p._id === patientId);
            return res.json({ success: true, data: { patient: patient || MOCK_PATIENTS[0], consultations: MOCK_CONSULTATIONS.filter(c => c.patientId._id === patientId), scans: [], medications: [] } });
        }
        const [patient, consultations, scans] = await Promise.all([
            User.findById(patientId).select('firstName lastName email dateOfBirth gender bloodGroup allergies phone'),
            Consultation.find({ patientId, doctorId: req.user._id }).sort({ createdAt: -1 }).limit(20),
            RadiologyScan.find({ patientId }).sort({ createdAt: -1 }).limit(10),
        ]);
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
        res.json({ success: true, data: { patient, consultations, scans } });
    } catch (error) { next(error); }
};

// ─── Get Doctor's Consultations ───────────────────────────────────────────────
const getConsultations = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        if (!isDBConnected()) {
            let list = [...MOCK_CONSULTATIONS];
            if (status) list = list.filter(c => c.status === status);
            return res.json({ success: true, data: list, pagination: { total: list.length, page: 1, pages: 1 } });
        }
        const filter = { doctorId: req.user._id };
        if (status) filter.status = status;
        const consultations = await Consultation.find(filter).populate('patientId', 'firstName lastName avatar email dateOfBirth').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
        const total = await Consultation.countDocuments(filter);
        res.json({ success: true, data: consultations, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
    } catch (error) { next(error); }
};

// ─── Update Consultation ──────────────────────────────────────────────────────
const updateConsultation = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isDBConnected()) {
            const c = MOCK_CONSULTATIONS.find(c => c._id === id);
            if (c) Object.assign(c, req.body);
            return res.json({ success: true, message: 'Consultation updated.', data: c || { _id: id, ...req.body } });
        }
        const consultation = await Consultation.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!consultation) return res.status(404).json({ success: false, message: 'Consultation not found.' });
        res.json({ success: true, message: 'Consultation updated.', data: consultation });
    } catch (error) { next(error); }
};

// ─── Request Scan ─────────────────────────────────────────────────────────────
const requestScan = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            return res.status(201).json({ success: true, message: 'Scan request created (demo mode).', data: { _id: `req-${Date.now()}`, ...req.body, requestedBy: req.user._id, status: 'pending', createdAt: new Date().toISOString() } });
        }
        const { patientId, scanType, bodyPart, priority, clinicalNotes } = req.body;
        const { v4: uuidv4 } = require('uuid');
        const RadiologyScan = require('../models/RadiologyScan');
        const scan = await RadiologyScan.create({
            scanId: `SCAN-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`,
            pacsId: `PACS-${uuidv4()}`,
            patientId, requestedBy: req.user._id, scanType, bodyPart, priority, clinicalNotes, status: 'uploaded',
            dicomMetadata: { studyInstanceUID: `1.2.840.${Date.now()}`, modality: scanType || 'CR', studyDate: new Date() },
            fileUrl: 'pending-upload', fileName: 'awaiting-upload.dcm',
        });
        res.status(201).json({ success: true, message: 'Scan request created.', data: scan });
    } catch (error) { next(error); }
};

// ─── View Scan Report ─────────────────────────────────────────────────────────
const viewScanReport = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            return res.json({ success: true, data: { _id: req.params.id, scanId: 'SCAN-DEMO', aiReport: { findings: 'Normal study.', riskLevel: 'low' }, status: 'approved' } });
        }
        const scan = await RadiologyScan.findById(req.params.id).populate('patientId', 'firstName lastName email dateOfBirth gender').populate('assignedRadiologist', 'firstName lastName').populate('finalReport.reviewedBy', 'firstName lastName');
        if (!scan) return res.status(404).json({ success: false, message: 'Scan not found.' });
        res.json({ success: true, data: scan });
    } catch (error) { next(error); }
};

module.exports = { getDoctorStats, getPatients, getPatientHistory, getConsultations, updateConsultation, requestScan, viewScanReport };
