const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const audit = require('../middleware/audit');
const billable = require('../controllers/billableController');

/**
 * Billable master-data routes — mounted by server.js at /api/masters/billables
 * (the web portal's admin/billables/_lib/api.ts is written against that base).
 *
 * All routes require authentication and are audited as 'MasterData'.
 * Reads are open to any authenticated staff role; writes are admin-only.
 */

router.use(protect);
router.use(audit('MasterData'));

// Reads (fixed paths before '/:id')
router.get('/', billable.list);
router.get('/categories', billable.categories);
router.get('/export', billable.exportCsv);

// Writes — admin only
router.post('/', authorize('admin'), billable.create);
router.post('/bulk', authorize('admin'), billable.bulk);
router.post('/import', authorize('admin'), billable.importCsv);
router.put('/:id', authorize('admin'), billable.update);
router.delete('/:id', authorize('admin'), billable.remove);

module.exports = router;
