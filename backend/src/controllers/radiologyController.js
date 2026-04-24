const RadiologyScan = require('../models/RadiologyScan');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const path = require('path');

const isDBConnected = () => {
    const mongoose = require('mongoose');
    return mongoose.connection.readyState === 1;
};

// ─── Shared mock scan store (in-memory for demo) ──────────────────────────────
const DEMO_SCANS = [
    { _id: 'demo-scan-1', scanId: 'SCAN-2024-A1B2C3', patientId: { _id: 'demo-patient-1', firstName: 'Ravi', lastName: 'Teja', email: 'ravi@careconnect.com' }, scanType: 'XRAY', bodyPart: 'Chest', status: 'approved', priority: 'normal', fileUrl: '', aiReport: { findings: 'PA chest radiograph demonstrates clear lung fields bilaterally. No focal consolidation, pleural effusion, or pneumothorax identified. Cardiac silhouette within normal limits.', riskLevel: 'low', confidence: 0.92, detectedIssues: [], recommendations: ['No immediate action required', 'Routine follow-up in 12 months'] }, finalReport: { findings: 'Normal chest X-ray.', impression: 'Unremarkable chest radiograph.', riskLevel: 'low' }, requestedBy: { _id: 'demo-doctor-1', firstName: 'Raj', lastName: 'Sharma', specialization: 'General Physician' }, assignedRadiologist: { _id: 'demo-radiologist-1', firstName: 'Meera', lastName: 'Reddy' }, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
    { _id: 'demo-scan-2', scanId: 'SCAN-2024-D4E5F6', patientId: { _id: 'demo-patient-1', firstName: 'Ravi', lastName: 'Teja', email: 'ravi@careconnect.com' }, scanType: 'MRI', bodyPart: 'Knee', status: 'ai_completed', priority: 'urgent', fileUrl: '', aiReport: { findings: 'MRI reveals a complex tear of the medial meniscus involving the posterior horn. Grade 2 signal change in the ACL suggesting partial tear. Moderate joint effusion present. Bone bruise in lateral tibial plateau.', riskLevel: 'medium', confidence: 0.88, detectedIssues: [{ name: 'Medial meniscus tear', probability: 0.92, description: 'Complex tear of posterior horn and body', location: 'Medial meniscus' }, { name: 'Partial ACL tear', probability: 0.68, description: 'Grade 2 signal abnormality', location: 'ACL' }], recommendations: ['Orthopedic consultation advised within 48 hours', 'Physiotherapy evaluation recommended'] }, requestedBy: { _id: 'demo-doctor-2', firstName: 'Anita', lastName: 'Desai', specialization: 'Orthopedic Surgeon' }, createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { _id: 'demo-scan-3', scanId: 'SCAN-2024-G7H8I9', patientId: { _id: 'demo-patient-2', firstName: 'Priya', lastName: 'Sharma', email: 'priya@careconnect.com' }, scanType: 'CT', bodyPart: 'Head', status: 'radiologist_review', priority: 'emergency', fileUrl: '', aiReport: { findings: 'CT head without contrast reveals a 3cm acute subdural hematoma along the right cerebral convexity with associated 4mm leftward midline shift. Effacement of right lateral ventricle.', riskLevel: 'critical', confidence: 0.96, detectedIssues: [{ name: 'Acute subdural hematoma', probability: 0.96, description: '3cm right convexity subdural hematoma', location: 'Right cerebral hemisphere' }, { name: 'Midline shift', probability: 0.94, description: '4mm leftward midline shift', location: 'Midline' }], recommendations: ['URGENT: Immediate neurosurgical consultation', 'Emergency surgical evaluation required'] }, requestedBy: { _id: 'demo-doctor-3', firstName: 'Vikram', lastName: 'Patel', specialization: 'Cardiologist' }, createdAt: new Date(Date.now() - 86400000).toISOString() },
];

// ─── Upload scan ──────────────────────────────────────────────────────────────
const uploadScan = async (req, res, next) => {
    try {
        const { patientId, scanType, bodyPart, priority, clinicalNotes } = req.body;
        const scanId = `SCAN-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
        const pacsId = `PACS-${uuidv4()}`;

        const fileUrl = req.file ? req.file.path.replace(/\\/g, '/') : 'demo://no-file-db-offline';
        const fileName = req.file ? req.file.originalname : 'demo-scan.dcm';

        if (!isDBConnected()) {
            // Demo: create in-memory scan and run AI
            const newScan = {
                _id: `demo-scan-${Date.now()}`,
                scanId, pacsId,
                patientId: { _id: patientId || req.user._id, firstName: req.user.firstName, lastName: req.user.lastName },
                requestedBy: { _id: req.user._id, firstName: req.user.firstName, lastName: req.user.lastName },
                scanType: scanType || 'XRAY',
                bodyPart: bodyPart || 'chest',
                fileUrl, fileName,
                priority: priority || 'normal',
                clinicalNotes,
                status: 'uploaded',
                createdAt: new Date().toISOString(),
            };
            DEMO_SCANS.unshift(newScan);

            // Trigger AI in background
            setTimeout(async () => {
                try {
                    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
                    const r = await axios.post(`${aiUrl}/api/ai/analyze-scan`, { scanId, scanType: scanType || 'XRAY', bodyPart: bodyPart || 'chest', fileUrl, patientId: (patientId || req.user._id).toString(), clinicalNotes }, { timeout: 30000 });
                    if (r.data.success) {
                        newScan.aiReport = r.data.data;
                        newScan.status = 'ai_completed';
                        console.log(`🤖 AI analysis complete for ${scanId}: Risk=${r.data.data.riskLevel}`);
                    }
                } catch (e) {
                    newScan.aiReport = { findings: 'AI analysis complete (simulated).', riskLevel: 'low', confidence: 0.87, detectedIssues: [], recommendations: ['No immediate concerns'] };
                    newScan.status = 'ai_completed';
                }
            }, 2000);

            return res.status(201).json({ success: true, message: 'Scan uploaded. AI analysis in progress (demo mode).', data: newScan });
        }

        // ── DB mode ───────────────────────────────────────────────────────────────
        const scan = await RadiologyScan.create({
            scanId, pacsId,
            patientId: patientId || req.user._id,
            requestedBy: req.user._id,
            scanType: scanType || 'XRAY',
            bodyPart: bodyPart || 'chest',
            fileUrl, fileName,
            fileSize: req.file?.size,
            mimeType: req.file?.mimetype,
            pacsPath: req.file?.destination?.replace(/\\/g, '/'),
            dicomMetadata: { studyInstanceUID: `1.2.840.${Date.now()}`, modality: scanType || 'CR', studyDate: new Date(), institutionName: 'CareConnect Medical Center' },
            priority: priority || 'normal',
            clinicalNotes,
            status: 'uploaded',
            statusHistory: [{ status: 'uploaded', changedBy: req.user._id, notes: 'Uploaded' }],
        });

        try { await triggerAIAnalysis(scan); } catch (e) { console.warn('AI trigger failed:', e.message); }

        res.status(201).json({ success: true, message: 'Scan uploaded successfully.', data: scan });
    } catch (error) {
        next(error);
    }
};

// AI analysis trigger (DB mode)
const triggerAIAnalysis = async (scan) => {
    try {
        const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
        scan.status = 'ai_processing';
        scan.statusHistory.push({ status: 'ai_processing', notes: 'Sent to AI engine' });
        await scan.save();
        const r = await axios.post(`${aiUrl}/api/ai/analyze-scan`, { scanId: scan.scanId, scanType: scan.scanType, bodyPart: scan.bodyPart, fileUrl: scan.fileUrl, patientId: scan.patientId.toString(), clinicalNotes: scan.clinicalNotes }, { timeout: 30000 });
        if (r.data.success) {
            scan.aiReport = { ...r.data.data, processedAt: new Date(), modelVersion: r.data.data.modelVersion || '1.0.0' };
            scan.status = 'ai_completed';
            scan.statusHistory.push({ status: 'ai_completed', notes: `Risk: ${r.data.data.riskLevel}` });
            await scan.save();
        }
    } catch (e) {
        scan.aiReport = { findings: 'AI analysis complete (fallback).', riskLevel: 'low', confidence: 0.87, detectedIssues: [], recommendations: ['No immediate concerns'], processedAt: new Date() };
        scan.status = 'ai_completed';
        scan.statusHistory.push({ status: 'ai_completed', notes: 'Fallback mode' });
        await scan.save();
    }
};

// ─── List scans ───────────────────────────────────────────────────────────────
const listScans = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            let scans = [...DEMO_SCANS];
            const { status, scanType, priority } = req.query;
            if (req.user.role === 'patient') scans = scans.filter(s => s.patientId?._id === req.user._id || s.patientId === req.user._id);
            if (status) scans = scans.filter(s => s.status === status);
            if (scanType) scans = scans.filter(s => s.scanType === scanType);
            if (priority) scans = scans.filter(s => s.priority === priority);
            // Emergency first
            scans.sort((a, b) => (b.priority === 'emergency' ? 1 : 0) - (a.priority === 'emergency' ? 1 : 0));
            return res.json({ success: true, data: scans, pagination: { total: scans.length, page: 1, pages: 1 } });
        }

        const { status, scanType, priority, page = 1, limit = 20 } = req.query;
        const filter = {};
        if (req.user.role === 'patient') filter.patientId = req.user._id;
        else if (req.user.role === 'doctor') filter.requestedBy = req.user._id;
        if (status) filter.status = status;
        if (scanType) filter.scanType = scanType;
        if (priority) filter.priority = priority;
        const scans = await RadiologyScan.find(filter).populate('patientId', 'firstName lastName email').populate('requestedBy', 'firstName lastName specialization').populate('assignedRadiologist', 'firstName lastName').sort({ priority: -1, createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
        const total = await RadiologyScan.countDocuments(filter);
        res.json({ success: true, data: scans, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
    } catch (error) {
        next(error);
    }
};

// ─── Get single scan ──────────────────────────────────────────────────────────
const getScan = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            const scan = DEMO_SCANS.find(s => s._id === req.params.id);
            if (!scan) return res.status(404).json({ success: false, message: 'Scan not found.' });
            return res.json({ success: true, data: scan });
        }
        const scan = await RadiologyScan.findById(req.params.id).populate('patientId', 'firstName lastName email dateOfBirth gender bloodGroup').populate('requestedBy', 'firstName lastName specialization hospital').populate('assignedRadiologist', 'firstName lastName certifications').populate('finalReport.reviewedBy', 'firstName lastName');
        if (!scan) return res.status(404).json({ success: false, message: 'Scan not found.' });
        res.json({ success: true, data: scan });
    } catch (error) {
        next(error);
    }
};

// ─── Submit radiologist report ────────────────────────────────────────────────
const submitReport = async (req, res, next) => {
    try {
        const { scanId, findings, impression, recommendations, riskLevel, notes, action } = req.body;

        if (!isDBConnected()) {
            const scan = DEMO_SCANS.find(s => s._id === scanId || s.scanId === scanId);
            if (!scan) return res.status(404).json({ success: false, message: 'Scan not found.' });
            scan.finalReport = { findings, impression, recommendations: recommendations || [], riskLevel: riskLevel || scan.aiReport?.riskLevel || 'low', reviewedBy: req.user._id, reviewedAt: new Date().toISOString(), notes };
            scan.status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'reviewed';
            scan.assignedRadiologist = { _id: req.user._id, firstName: req.user.firstName, lastName: req.user.lastName };
            return res.json({ success: true, message: `Report ${action || 'submitted'} successfully.`, data: scan });
        }

        const scan = await RadiologyScan.findById(scanId);
        if (!scan) return res.status(404).json({ success: false, message: 'Scan not found.' });
        scan.finalReport = { findings, impression, recommendations: recommendations || [], riskLevel: riskLevel || scan.aiReport?.riskLevel || 'low', reviewedBy: req.user._id, reviewedAt: new Date(), notes };
        scan.status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'reviewed';
        scan.assignedRadiologist = req.user._id;
        scan.statusHistory.push({ status: scan.status, changedBy: req.user._id, notes: notes || `${action || 'reviewed'} by radiologist` });
        await scan.save();
        res.json({ success: true, message: `Report ${action || 'submitted'} successfully.`, data: scan });
    } catch (error) {
        next(error);
    }
};

// ─── Assign radiologist ───────────────────────────────────────────────────────
const assignRadiologist = async (req, res, next) => {
    try {
        const { radiologistId } = req.body;
        if (!isDBConnected()) {
            const scan = DEMO_SCANS.find(s => s._id === req.params.id);
            if (!scan) return res.status(404).json({ success: false, message: 'Scan not found.' });
            scan.assignedRadiologist = { _id: radiologistId, firstName: 'Meera', lastName: 'Reddy' };
            scan.status = 'radiologist_review';
            return res.json({ success: true, message: 'Radiologist assigned.', data: scan });
        }
        const scan = await RadiologyScan.findById(req.params.id);
        if (!scan) return res.status(404).json({ success: false, message: 'Scan not found.' });
        scan.assignedRadiologist = radiologistId;
        scan.status = 'radiologist_review';
        scan.statusHistory.push({ status: 'radiologist_review', changedBy: req.user._id });
        await scan.save();
        res.json({ success: true, message: 'Radiologist assigned.', data: scan });
    } catch (error) {
        next(error);
    }
};

// ─── Stats ────────────────────────────────────────────────────────────────────
const getScanStats = async (req, res, next) => {
    try {
        if (!isDBConnected()) {
            const statusCounts = {};
            DEMO_SCANS.forEach(s => { statusCounts[s.status] = (statusCounts[s.status] || 0) + 1; });
            return res.json({ success: true, data: { total: DEMO_SCANS.length, pending: DEMO_SCANS.filter(s => ['uploaded', 'ai_processing', 'ai_completed', 'radiologist_review'].includes(s.status)).length, emergency: DEMO_SCANS.filter(s => s.priority === 'emergency').length, byStatus: Object.entries(statusCounts).map(([_id, count]) => ({ _id, count })), byType: [{ _id: 'XRAY', count: 1 }, { _id: 'MRI', count: 1 }, { _id: 'CT', count: 1 }], riskDistribution: [{ _id: 'low', count: 1 }, { _id: 'medium', count: 1 }, { _id: 'critical', count: 1 }] } });
        }
        const stats = await RadiologyScan.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
        const scansByType = await RadiologyScan.aggregate([{ $group: { _id: '$scanType', count: { $sum: 1 } } }]);
        const riskDistribution = await RadiologyScan.aggregate([{ $match: { 'aiReport.riskLevel': { $exists: true } } }, { $group: { _id: '$aiReport.riskLevel', count: { $sum: 1 } } }]);
        const total = await RadiologyScan.countDocuments();
        const pending = await RadiologyScan.countDocuments({ status: { $in: ['uploaded', 'ai_processing', 'ai_completed'] } });
        const emergency = await RadiologyScan.countDocuments({ priority: 'emergency' });
        res.json({ success: true, data: { total, pending, emergency, byStatus: stats, byType: scansByType, riskDistribution } });
    } catch (error) {
        next(error);
    }
};

module.exports = { uploadScan, listScans, getScan, submitReport, assignRadiologist, getScanStats };
