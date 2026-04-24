const express = require('express');
const { getBalance, getTransactions, topUp } = require('../controllers/walletController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/balance', getBalance);
router.get('/transactions', getTransactions);
router.post('/topup', topUp);

module.exports = router;
