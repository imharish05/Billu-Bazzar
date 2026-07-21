'use strict';

const router = require('express').Router();
const {
  initiatePayment,
  handleRazorpayWebhook,
  handleTelrWebhook,
  getPaymentSummary
} = require('../controllers/paymentController');
const { optionalCustomer, verifyAdmin } = require('../middleware/auth');

// Client checkout endpoints
router.post('/initiate', optionalCustomer, initiatePayment);

// Webhook endpoints for each gateway provider
router.post('/webhook/razorpay', handleRazorpayWebhook);
router.post('/webhook/telr', handleTelrWebhook);

// Admin dashboard reporting endpoints
router.get('/admin/summary', verifyAdmin, getPaymentSummary);

module.exports = router;
