const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { permit } = require('../middleware/permit');
const audit = require('../middleware/audit');
const billable = require('../controllers/billableController');

/**
 * Billable master-data routes — mounted by server.js at /api/masters/billables
 *
 * Reads are open to any authenticated user.
 * Writes require ADMIN.MANAGE_SYSTEM_SETTINGS (hospital and platform admins).
 */

router.use(protect);
router.use(audit('MasterData'));

// Reads (any authenticated)
router.get('/', billable.list);
router.get('/categories', billable.categories);
router.get('/export', billable.exportCsv);

// Writes — admin only
router.post('/', permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), billable.create);
router.post('/bulk', permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), billable.bulk);
router.post('/import', permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), billable.importCsv);
router.put('/:id', permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), billable.update);
router.delete('/:id', permit('ADMIN.MANAGE_SYSTEM_SETTINGS'), billable.remove);

module.exports = router;
