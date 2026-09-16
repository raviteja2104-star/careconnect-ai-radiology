const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { permit, permitAny } = require('../middleware/permit');
const { generateToken, getDepartmentQueue, callToken, completeToken } = require('../controllers/queueController');
const audit = require('../middleware/audit');

// Generate a queue token — reception or doctor can do this
router.post(
    '/token',
    protect,
    permitAny('OPD.CHECKIN', 'STAFF.CHECKIN_PATIENTS', 'OPD.MANAGE_QUEUE'),
    audit('OPDQueue'),
    generateToken
);

// Call the next patient
router.post(
    '/call/:id',
    protect,
    permitAny('OPD.CALL_NEXT', 'OPD.MANAGE_QUEUE', 'DOCTOR.VIEW_PATIENTS'),
    audit('OPDQueue'),
    callToken
);

// Mark patient as complete / checked out
router.post(
    '/complete/:id',
    protect,
    permitAny('OPD.CHECKOUT', 'OPD.MANAGE_QUEUE', 'CLINICAL.SIGN_CONSULTATION'),
    audit('OPDQueue'),
    completeToken
);

// PUBLIC read-only: waiting-room TV display fetches GET /api/queue/:department
// without authentication. Deliberately left without protect().
router.get('/:department', getDepartmentQueue);

module.exports = router;
