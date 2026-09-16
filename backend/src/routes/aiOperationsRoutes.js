const express = require('express');
const router = express.Router();
const {
  getPredictions,
  getRecommendations,
  runSimulation
} = require('../controllers/aiOperationsController');
const { protect } = require('../middleware/auth');
const { permitAny } = require('../middleware/permit');

router.use(protect);

router.route('/predictions').get(getPredictions);
router.route('/recommendations').get(getRecommendations);
router.route('/simulate').post(permitAny('DOCTOR.VIEW_PATIENTS', 'ADMIN.VIEW_ANALYTICS'), runSimulation);

module.exports = router;
