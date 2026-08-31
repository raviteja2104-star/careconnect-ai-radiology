const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  generateToken,
  getDepartmentQueue,
  callToken
} = require('../controllers/queueController');

// Staff-only queue mutations (no dedicated 'reception' role exists; front-desk
// flows are gated to 'admin'/'doctor').
router.route('/token').post(protect, authorize('admin', 'doctor', 'reception'), generateToken);
router.route('/call/:id').post(protect, authorize('admin', 'doctor', 'reception'), callToken);

// PUBLIC: read-only department queue consumed by the unauthenticated waiting-room
// TV board (web-portal/src/app/display/page.tsx fetches GET /api/queue/OPD).
// Deliberately left without auth — do not add protect here.
router.route('/:department').get(getDepartmentQueue);

module.exports = router;
