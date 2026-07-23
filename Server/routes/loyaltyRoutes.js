'use strict';
const express = require('express');
const router = express.Router();
const { getLedger } = require('../controllers/loyaltyController');
const { verifyAdmin } = require('../middleware/auth');

router.get('/ledger', verifyAdmin, getLedger);

module.exports = router;
