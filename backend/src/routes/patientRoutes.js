const express = require('express');
const {
    checkSymptoms,
    bookConsultation,
    getConsultations,
    getReports,
    getDoctors,
    getNotifications,
    markNotificationRead,
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/auth');
const { uploadScan: uploadMiddleware } = require('../middleware/upload');
const { uploadScan } = require('../controllers/radiologyController');

const router = express.Router();

router.use(protect);
router.use(authorize('patient'));

router.post('/check-symptoms', checkSymptoms);
router.post('/consultation', bookConsultation);
router.get('/consultations', getConsultations);
router.get('/reports', getReports);
router.get('/doctors', getDoctors);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

// Patient scan upload
router.post('/upload-scan', uploadMiddleware.single('scan'), uploadScan);

module.exports = router;
