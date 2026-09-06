const express = require('express');
const router = express.Router();
const { getPatientWallet } = require('../controllers/patientController');
const { protect } = require('../middleware/auth');
const { permitAny } = require('../middleware/permit');
const { userHasPermissions } = require('../services/PermissionService');
const audit = require('../middleware/audit');

router.use(protect);
router.use(audit('Patient'));

// Wallet: patient reads own wallet, billing staff reads any.
// Ownership is checked here because the controller accepts any patientId param.
async function walletAuthz(req, res, next) {
    const actorId   = req.user._id.toString();
    const targetId  = req.params.patientId;

    // Self-access is always OK (patient sees own wallet)
    if (actorId === targetId) return next();

    // Cross-patient access requires the staff billing permission
    const isStaff = await userHasPermissions(req.user._id, ['STAFF.BILLING']).catch(() => false);
    if (isStaff) return next();

    return res.status(403).json({
        success: false,
        message: 'You can only view your own wallet.',
    });
}

router.route('/:patientId/wallet').get(
    permitAny('PATIENT.VIEW_BILLING', 'STAFF.BILLING'),
    walletAuthz,
    getPatientWallet
);

module.exports = router;
