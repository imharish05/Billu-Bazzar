'use strict';
const router = require('express').Router();
const { initiatePayment, handleWebhook } = require('../controllers/paymentController');
const { optionalCustomer } = require('../middleware/auth');

router.post('/initiate', optionalCustomer, initiatePayment);
router.post('/webhook', handleWebhook);

module.exports = router;
