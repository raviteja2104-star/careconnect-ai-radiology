const express = require('express');
const { listSpecialists, requestOpinion, myOpinions, completeOpinion } = require('../controllers/marketplaceController');
const { protect } = require('../middleware/auth');
const { permit } = require('../middleware/permit');

const router = express.Router();
router.use(protect);

router.get('/specialists', listSpecialists);
router.get('/my-opinions', myOpinions);
router.post('/request', requestOpinion);
router.put('/opinions/:id/complete', permit('RADIOLOGY.FINALIZE_REPORT'), completeOpinion);

module.exports = router;
