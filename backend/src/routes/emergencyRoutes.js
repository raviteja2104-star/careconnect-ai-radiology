const express = require('express');
const {
    triggerSOS,
    getEmergencyStatus,
    updateEmergencyStatus,
    getEmergencyHistory,
} = require('../controllers/emergencyController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/sos', authorize('patient'), triggerSOS);
router.get('/history', authorize('patient'), getEmergencyHistory);
router.get('/:id', getEmergencyStatus);
router.put('/:id/status', authorize('admin', 'doctor'), updateEmergencyStatus);

module.exports = router;
