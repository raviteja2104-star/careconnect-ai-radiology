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
const { permit } = require('../middleware/permit');
const { uploadScan: uploadMiddleware } = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Upload scan — ordering roles only (permission + legacy role guard)
router.post(
    '/upload',
    permit('DOCTOR.ORDER_RADIOLOGY'),
    uploadMiddleware.single('scan'),
    uploadScan
);
router.post(
    '/upload-scan',
    permit('DOCTOR.ORDER_RADIOLOGY'),
    uploadMiddleware.single('scan'),
    uploadScan
);

// List scans — radiologists see full worklist; doctors see own ordered scans;
// admins see all.  Controller applies the scope; we guard the door.
router.get('/list', permit('RADIOLOGY.VIEW_WORKLIST'), listScans);

// Scan statistics — admin / radiologist / doctor only
router.get('/stats', permit('RADIOLOGY.VIEW_STATS'), getScanStats);

// Get a single scan — radiologist (reading) or admin or the ordering doctor.
// Controller verifies ownership; here we just require the view permission.
router.get('/:id', permit('RADIOLOGY.VIEW_STUDIES'), getScan);

// Submit report — radiologists only
router.post('/report', permit('RADIOLOGY.CREATE_REPORT'), submitReport);

// Assign radiologist — admin only (ASSIGN_RADIOLOGIST permission)
router.put('/:id/assign', permit('RADIOLOGY.ASSIGN_RADIOLOGIST'), assignRadiologist);

module.exports = router;
