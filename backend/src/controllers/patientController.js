const Consultation = require('../models/Consultation');
const User = require('../models/User');
const RadiologyScan = require('../models/RadiologyScan');
const Notification = require('../models/Notification');
const axios = require('axios');
const { emitEvent } = require('../services/EventBus');
const EVENTS = require('../config/events');

const isDBConnected = () => {
    const mongoose = require('mongoose');
    return mongoose.connection.readyState === 1;
};

// ─── Mock data for demo mode ──────────────────────────────────────────────────
const MOCK_DOCTORS = [
    { _id: 'demo-doctor-1', firstName: 'Raj', lastName: 'Sharma', email: 'dr.raj@careconnect.com', specialization: 'General Physician', experience: 12, consultationFee: 300, hospital: 'CareConnect City Hospital', department: 'General Medicine', rating: 4.8, availability: { isAvailable: true }, avatar: '' },
    { _id: 'demo-doctor-2', firstName: 'Anita', lastName: 'Desai', email: 'dr.anita@careconnect.com', specialization: 'Orthopedic Surgeon', experience: 15, consultationFee: 500, hospital: 'CareConnect City Hospital', rating: 4.9, availability: { isAvailable: true }, avatar: '' },
    { _id: 'demo-doctor-3', firstName: 'Vikram', lastName: 'Patel', email: 'dr.vikram@careconnect.com', specialization: 'Cardiologist', experience: 18, consultationFee: 800, hospital: 'CareConnect City Hospital', rating: 4.7, availability: { isAvailable: false }, avatar: '' },
    { _id: 'demo-doctor-4', firstName: 'Sunita', lastName: 'Rao', email: 'dr.sunita@careconnect.com', specialization: 'Pediatrician', experience: 9, consultationFee: 250, hospital: 'CareConnect City Hospital', rating: 4.6, availability: { isAvailable: true }, avatar: '' },
];

const MOCK_CONSULTATIONS = [
    { _id: 'demo-cons-1', patientId: 'demo-patient-1', doctorId: { _id: 'demo-doctor-1', firstName: 'Raj', lastName: 'Sharma', specialization: 'General Physician', avatar: '', consultationFee: 300, hospital: 'CareConnect City Hospital', rating: 4.8 }, type: 'chat', status: 'completed', symptoms: ['Headache', 'Fever'], diagnosis: 'Viral fever', prescription: [{ medicine: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily', duration: '5 days' }], createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
    { _id: 'demo-cons-2', patientId: 'demo-patient-1', doctorId: { _id: 'demo-doctor-2', firstName: 'Anita', lastName: 'Desai', specialization: 'Orthopedic Surgeon', avatar: '', consultationFee: 500, hospital: 'CareConnect City Hospital', rating: 4.9 }, type: 'video', status: 'pending', symptoms: ['Back Pain'], createdAt: new Date(Date.now() - 86400000).toISOString() },
];

const MOCK_SCANS = [
    { _id: 'demo-scan-1', scanId: 'SCAN-2024-A1B2C3', patientId: 'demo-patient-1', scanType: 'XRAY', bodyPart: 'Chest', status: 'approved', priority: 'normal', fileUrl: '', aiReport: { findings: 'PA chest radiograph demonstrates clear lung fields bilaterally. No focal consolidation, pleural effusion, or pneumothorax identified. Cardiac silhouette is within normal limits.', riskLevel: 'low', confidence: 0.92, detectedIssues: [], recommendations: ['No immediate action required', 'Follow-up in 12 months recommended'], processedAt: new Date().toISOString() }, finalReport: { findings: 'Normal chest X-ray. No acute cardiopulmonary abnormality.', impression: 'Unremarkable chest radiograph.', riskLevel: 'low', reviewedAt: new Date().toISOString() }, requestedBy: { firstName: 'Raj', lastName: 'Sharma', specialization: 'General Physician' }, assignedRadiologist: { firstName: 'Meera', lastName: 'Reddy' }, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
    { _id: 'demo-scan-2', scanId: 'SCAN-2024-D4E5F6', patientId: 'demo-patient-1', scanType: 'MRI', bodyPart: 'Knee', status: 'ai_completed', priority: 'urgent', fileUrl: '', aiReport: { findings: 'MRI reveals a complex tear of the medial meniscus involving the posterior horn extending to the body. Grade 2 signal change in the ACL suggesting partial tear. Moderate joint effusion present.', riskLevel: 'medium', confidence: 0.88, detectedIssues: [{ name: 'Medial meniscus tear', probability: 0.92, description: 'Complex tear of posterior horn and body', location: 'Medial meniscus' }, { name: 'Partial ACL tear', probability: 0.68, description: 'Grade 2 signal abnormality', location: 'ACL' }], recommendations: ['Orthopedic consultation advised', 'Physiotherapy evaluation recommended'], processedAt: new Date().toISOString() }, requestedBy: { firstName: 'Anita', lastName: 'Desai', specialization: 'Orthopedic Surgeon' }, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { _id: 'demo-scan-3', scanId: 'SCAN-2024-G7H8I9', patientId: 'demo-patient-1', scanType: 'CT', bodyPart: 'Head', status: 'reviewed', priority: 'emergency', fileUrl: '', aiReport: { findings: 'CT head without contrast reveals a 3cm acute subdural hematoma along the right cerebral convexity with associated 4mm leftward midline shift.', riskLevel: 'critical', confidence: 0.96, detectedIssues: [{ name: 'Acute subdural hematoma', probability: 0.96, description: '3cm right convexity subdural hematoma', location: 'Right cerebral hemisphere' }, { name: 'Midline shift', probability: 0.94, description: '4mm leftward shift', location: 'Midline' }], recommendations: ['URGENT: Immediate neurosurgical consultation', 'Emergency surgical evaluation'], processedAt: new Date().toISOString() }, requestedBy: { firstName: 'Vikram', lastName: 'Patel', specialization: 'Cardiologist' }, createdAt: new Date(Date.now() - 86400000).toISOString() },
];

const MOCK_NOTIFICATIONS = [
    { _id: 'notif-1', type: 'report_approved', title: 'Scan Report Ready', message: 'Your XRAY chest scan report has been approved by the radiologist.', isRead: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { _id: 'notif-2', type: 'ai_report_ready', title: 'AI Analysis Complete', message: 'AI has finished analyzing your MRI knee scan. Risk: MEDIUM', isRead: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
    { _id: 'notif-3', type: 'consultation_scheduled', title: 'Consultation Booked', message: 'Your consultation with Dr. Raj Sharma has been confirmed.', isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
];

// ─── Symptom checker ─────────────────────────────────────────────────────────
const checkSymptoms = async (req, res, next) => {
    try {
        const { symptoms, duration, severity, additionalInfo } = req.body;

        if (!symptoms || symptoms.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide symptoms to analyze.' });
        }

        let aiAnalysis;
        try {
            const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
            const response = await axios.post(`${aiUrl}/api/ai/check-symptoms`, {
                symptoms, duration, severity, additionalInfo,
                patientId: req.user._id?.toString(),
                age: req.user.dateOfBirth ? Math.floor((Date.now() - new Date(req.user.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : null,
                gender: req.user.gender,
            }, { timeout: 15000 });
            aiAnalysis = response.data.data;
        } catch (aiError) {
            aiAnalysis = generateMockSymptomAnalysis(symptoms, severity);
        }

        // Map urgency to a numerical risk score for the Decision Engine
        let riskScore = 30; // low
        if (aiAnalysis.urgencyLevel === 'medium') riskScore = 65;
        if (aiAnalysis.urgencyLevel === 'high') riskScore = 95;

        // EMIT EVENT TO ORCHESTRATOR
        emitEvent(EVENTS.AI_SYMPTOM_EVALUATED, {
            patientId: req.user._id,
            symptoms,
            riskScore,
            aiAnalysis
        }, { origin: 'patientController' });

        res.json({ success: true, message: 'Symptom analysis completed.', data: aiAnalysis });
    } catch (error) {
        next(error);
    }
};

const generateMockSymptomAnalysis = (symptoms, severity) => {
    const maps = {
        'headache': [{ name: 'Tension Headache', probability: 0.65, description: 'Most common type, often stress-related' }, { name: 'Migraine', probability: 0.25, description: 'Neurological condition with throbbing pain' }],
        'fever': [{ name: 'Viral Infection', probability: 0.55, description: 'Common viral illness' }, { name: 'Bacterial Infection', probability: 0.30, description: 'May require antibiotics' }],
        'cough': [{ name: 'Upper Respiratory Infection', probability: 0.50, description: 'Common cold or flu' }, { name: 'Allergic Rhinitis', probability: 0.30, description: 'Allergic response' }],
        'chest pain': [{ name: 'Costochondritis', probability: 0.40, description: 'Inflammation of rib cartilage' }, { name: 'GERD', probability: 0.35, description: 'Gastric acid irritation' }, { name: 'Angina', probability: 0.15, description: 'Reduced coronary blood flow' }],
        'back pain': [{ name: 'Muscle Strain', probability: 0.45, description: 'Overuse or improper lifting' }, { name: 'Disc Herniation', probability: 0.20, description: 'Nerve root compression' }],
    };
    const sym = symptoms[0]?.toLowerCase() || '';
    const matched = Object.keys(maps).find(k => sym.includes(k));
    const conditions = matched ? maps[matched] : [{ name: 'General Discomfort', probability: 0.50, description: 'Clinical evaluation recommended' }];
    const urgency = severity === 'severe' ? 'high' : severity === 'moderate' ? 'medium' : 'low';
    return {
        possibleConditions: conditions,
        severity: severity || 'mild',
        urgencyLevel: urgency,
        shouldSeeDoctor: urgency !== 'low',
        recommendations: urgency === 'high' ? ['Seek medical attention within 24 hours', 'Monitor symptoms closely'] : ['Monitor for 48-72 hours', 'Stay hydrated and rest', 'Schedule a consultation if symptoms persist'],
        disclaimer: '⚠️ This AI analysis is for informational purposes only and does not replace professional medical advice.',
    };
};

// ─── Book consultation ────────────────────────────────────────────────────────
const bookConsultation = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            const { doctorId, type, symptoms } = req.body;
            const doc = MOCK_DOCTORS.find(d => d._id === doctorId) || MOCK_DOCTORS[0];
            const newCons = { _id: `demo-cons-${Date.now()}`, patientId: req.user._id, doctorId: doc, type: type || 'chat', status: 'pending', symptoms: symptoms || [], createdAt: new Date().toISOString() };
            MOCK_CONSULTATIONS.push(newCons);
            return res.status(201).json({ success: true, message: 'Consultation booked successfully (demo).', data: newCons });
        }
        const { doctorId, type, symptoms, scheduledAt, aiSymptomAnalysis } = req.body;
        const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
        if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found.' });
        const consultation = await Consultation.create({ patientId: req.user._id, doctorId, type: type || 'chat', symptoms: symptoms || [], aiSymptomAnalysis, scheduledAt: scheduledAt || new Date(), fee: doctor.consultationFee || 500 });
        res.status(201).json({ success: true, message: 'Consultation booked successfully.', data: consultation });
    } catch (error) {
        next(error);
    }
};

// ─── Get consultations ────────────────────────────────────────────────────────
const getConsultations = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            const list = MOCK_CONSULTATIONS.filter(c => c.patientId === req.user._id);
            return res.json({ success: true, data: list, pagination: { total: list.length, page: 1, pages: 1 } });
        }
        const { status, page = 1, limit = 20 } = req.query;
        const filter = { patientId: req.user._id };
        if (status) filter.status = status;
        const consultations = await Consultation.find(filter).populate('doctorId', 'firstName lastName specialization avatar consultationFee hospital rating').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
        const total = await Consultation.countDocuments(filter);
        res.json({ success: true, data: consultations, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
    } catch (error) {
        next(error);
    }
};

// ─── Get scan reports ─────────────────────────────────────────────────────────
const getReports = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            const scans = MOCK_SCANS.filter(s => s.patientId === req.user._id && ['approved', 'reviewed', 'ai_completed'].includes(s.status));
            return res.json({ success: true, data: scans });
        }
        const scans = await RadiologyScan.find({ patientId: req.user._id, status: { $in: ['approved', 'reviewed'] } }).populate('requestedBy', 'firstName lastName specialization').populate('assignedRadiologist', 'firstName lastName').sort({ createdAt: -1 });
        res.json({ success: true, data: scans });
    } catch (error) {
        next(error);
    }
};

// ─── Get doctors ──────────────────────────────────────────────────────────────
const getDoctors = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            const { specialization, search } = req.query;
            let list = [...MOCK_DOCTORS];
            if (specialization) list = list.filter(d => d.specialization?.toLowerCase().includes(specialization.toLowerCase()));
            if (search) list = list.filter(d => `${d.firstName} ${d.lastName} ${d.specialization}`.toLowerCase().includes(search.toLowerCase()));
            return res.json({ success: true, data: list, pagination: { total: list.length, page: 1, pages: 1 } });
        }
        const { specialization, search, page = 1, limit = 20 } = req.query;
        const filter = { role: 'doctor', isActive: true };
        if (specialization) filter.specialization = new RegExp(specialization, 'i');
        if (search) filter.$or = [{ firstName: new RegExp(search, 'i') }, { lastName: new RegExp(search, 'i') }, { specialization: new RegExp(search, 'i') }];
        const doctors = await User.find(filter).select('firstName lastName specialization experience consultationFee availability hospital rating avatar').sort({ rating: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
        const total = await User.countDocuments(filter);
        res.json({ success: true, data: doctors, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
    } catch (error) {
        next(error);
    }
};

// ─── Get notifications ────────────────────────────────────────────────────────
const getNotifications = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            return res.json({ success: true, data: { notifications: MOCK_NOTIFICATIONS, unreadCount: MOCK_NOTIFICATIONS.filter(n => !n.isRead).length } });
        }
        const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
        const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });
        res.json({ success: true, data: { notifications, unreadCount } });
    } catch (error) {
        next(error);
    }
};

// ─── Mark notification read ───────────────────────────────────────────────────
const markNotificationRead = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            const n = MOCK_NOTIFICATIONS.find(n => n._id === req.params.id);
            if (n) n.isRead = true;
            return res.json({ success: true, message: 'Notification marked as read.' });
        }
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() });
        res.json({ success: true, message: 'Notification marked as read.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { checkSymptoms, bookConsultation, getConsultations, getReports, getDoctors, getNotifications, markNotificationRead };
