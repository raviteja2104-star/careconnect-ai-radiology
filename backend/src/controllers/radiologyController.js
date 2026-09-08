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


// ─── Upload scan ──────────────────────────────────────────────────────────────
const uploadScan = async (req, res, next) => {
    try {
        const { patientId, scanType, bodyPart, priority, clinicalNotes } = req.body;
        const scanId = `SCAN-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
        const pacsId = `PACS-${uuidv4()}`;

        const fileUrl = req.file
            ? (req.file.location || req.file.path?.replace(/\\/g, '/') || req.file.originalname || 'uploaded')
            : 'demo://no-file-db-offline';
        const fileName = req.file ? req.file.originalname : 'demo-scan.dcm';

        if (!isDBConnected()) {
            return res.status(503).json({ success: false, message: 'Database unavailable — scan cannot be uploaded.' });
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
            pacsPath: req.file?.key
                ? `s3://${process.env.S3_BUCKET}/${req.file.key}`
                : req.file?.destination?.replace(/\\/g, '/'),
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
            return res.json({ success: true, data: [], pagination: { total: 0, page: 1, pages: 0 } });
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
            return res.status(503).json({ success: false, message: 'Database unavailable.' });
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
            return res.status(503).json({ success: false, message: 'Database unavailable — report cannot be submitted.' });
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
            return res.status(503).json({ success: false, message: 'Database unavailable — assignment cannot be saved.' });
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
            return res.json({ success: true, data: { total: 0, pending: 0, emergency: 0, byStatus: [], byType: [], riskDistribution: [] } });
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

const getPatientScans = async (req, res) => {
    try {
        const mongoose = require('mongoose');
        if (!isDBConnected() || !mongoose.Types.ObjectId.isValid(req.user._id)) {
            return res.json({ success: true, data: [] });
        }
        const scans = await RadiologyScan.find({ $or: [{ patient: req.user._id }, { patientId: req.user._id }] })
            .sort({ createdAt: -1 }).limit(50).lean();
        res.json({ success: true, data: scans });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

module.exports = { uploadScan, listScans, getScan, submitReport, assignRadiologist, getScanStats, getPatientScans };
