const express = require('express');
const router = express.Router();
const { getFaqs, getCategories } = require('../controllers/supportController');

// Public — no auth required (FAQ content is not PHI)
router.get('/faqs', getFaqs);
router.get('/categories', getCategories);

module.exports = router;
