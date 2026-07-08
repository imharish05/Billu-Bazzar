'use strict';
/**
 * RazorpayService — local mock. Replace with real Razorpay SDK before production.
 * Simulates order creation and payment verification.
 */
const { v4: uuidv4 } = require('uuid');

class RazorpayService {
  createOrder({ amount, currency = 'INR', receipt }) {
    return Promise.resolve({
      id: `order_${uuidv4().replace(/-/g, '').slice(0, 14)}`,
      amount,
      currency,
      receipt,
      status: 'created',
    });
  }

  verifySignature({ orderId, paymentId, signature }) {
    // Mock: always returns true. Real: use crypto HMAC-SHA256 check.
    return Promise.resolve({ verified: true, orderId, paymentId });
  }

  fetchPayment(paymentId) {
    return Promise.resolve({
      id: paymentId,
      status: 'captured',
      amount: 99900,
      currency: 'INR',
      method: 'card',
    });
  }
}

module.exports = new RazorpayService();
