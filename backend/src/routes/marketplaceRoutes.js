const express = require('express');
const { listSpecialists, requestOpinion, myOpinions, completeOpinion } = require('../controllers/marketplaceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/specialists', listSpecialists);
router.get('/my-opinions', myOpinions);
router.post('/request', requestOpinion);
router.put('/opinions/:id/complete', authorize('radiologist'), completeOpinion);

module.exports = router;
