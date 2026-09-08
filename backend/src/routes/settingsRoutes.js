const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSettings,
  updateSettings,
  getPrescriptionTemplate,
  savePrescriptionTemplate,
} = require('../controllers/settingsController');

router.use(protect);
router.get('/', getSettings);
router.patch('/', updateSettings);
router.get('/prescription', getPrescriptionTemplate);
router.post('/prescription', savePrescriptionTemplate);

module.exports = router;
