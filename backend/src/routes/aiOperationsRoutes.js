const express = require('express');
const router = express.Router();
const { 
  getPredictions,
  getRecommendations,
  runSimulation
} = require('../controllers/aiOperationsController');
const { protect, authorize } = require('../middleware/auth');

// AI operations dashboards require an authenticated session.
router.use(protect);

router.route('/predictions').get(getPredictions);
router.route('/recommendations').get(getRecommendations);
router.route('/simulate').post(authorize('doctor', 'admin'), runSimulation);

module.exports = router;
