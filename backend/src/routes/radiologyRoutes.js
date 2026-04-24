const express = require('express');
const {
    uploadScan,
    listScans,
    getScan,
    submitReport,
    assignRadiologist,
    getScanStats,
} = require('../controllers/radiologyController');
const { protect, authorize } = require('../middleware/auth');
const { uploadScan: uploadMiddleware } = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Upload scan (patients, doctors, lab_tech)
router.post(
    '/upload',
    authorize('patient', 'doctor', 'lab_tech', 'admin'),
    uploadMiddleware.single('scan'),
    uploadScan
);

// Alias for POST /api/radiology/upload-scan
router.post(
    '/upload-scan',
    authorize('patient', 'doctor', 'lab_tech', 'admin'),
    uploadMiddleware.single('scan'),
    uploadScan
);

// List scans (filtered by role)
router.get('/list', listScans);

// Scan statistics
router.get('/stats', authorize('admin', 'radiologist', 'doctor'), getScanStats);

// Get single scan
router.get('/:id', getScan);

// Submit radiologist report
router.post('/report', authorize('radiologist', 'admin'), submitReport);

// Assign radiologist
router.put('/:id/assign', authorize('admin', 'doctor'), assignRadiologist);

module.exports = router;
