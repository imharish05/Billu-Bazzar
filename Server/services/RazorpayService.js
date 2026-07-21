'use strict';

const Razorpay = require('razorpay');
const crypto = require('crypto');
const PaymentGatewayInterface = require('./PaymentGatewayInterface');

class RazorpayService extends PaymentGatewayInterface {
  /**
   * Create an order in Razorpay.
   * @param {Object} orderData
   * @param {number} orderData.amount - Total amount in standard currency unit (INR)
   * @param {string} [orderData.currency='INR'] - Currency code
   * @param {string} orderData.receipt - Unique receipt reference ID
   * @returns {Promise<import('./PaymentGatewayInterface').PaymentResult>}
   */
  async createOrder({ amount, currency = 'INR', receipt }) {
    try {
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_mocksecret',
      });

      const options = {
        amount: Math.round(amount * 100), // amount in paisa
        currency,
        receipt,
      };

      const order = await instance.orders.create(options);

      return {
        success: true,
        gatewayRef: order.id,
        amount,
        currency,
        status: order.status.toUpperCase(),
        raw: order,
      };
    } catch (err) {
      console.error('[Razorpay createOrder] Error:', err.message);
      throw err;
    }
  }

  /**
   * Verify signature of Razorpay webhook events.
   * @param {any} payload - The raw request body
   * @param {string} signature - The x-razorpay-signature header
   * @returns {Promise<boolean>}
   */
  async verifySignature(payload, signature) {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_mocksecret';
      const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
      return expectedSignature === signature;
    } catch (err) {
      console.error('[Razorpay verifySignature] Error:', err.message);
      return false;
    }
  }

  /**
   * Fetch payment details from Razorpay.
   * @param {string} paymentId - Razorpay payment ID
   * @returns {Promise<import('./PaymentGatewayInterface').PaymentResult>}
   */
  async fetchPayment(paymentId) {
    try {
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_mocksecret',
      });
      const payment = await instance.payments.fetch(paymentId);
      return {
        success: payment.status === 'captured',
        gatewayRef: payment.order_id,
        amount: payment.amount / 100, // normalized to INR rupees
        currency: payment.currency,
        status: payment.status.toUpperCase(),
        raw: payment,
      };
    } catch (err) {
      console.error('[Razorpay fetchPayment] Error:', err.message);
      throw err;
    }
  }

  /**
   * Process refund in Razorpay.
   * @param {string} paymentId - Razorpay payment ID to refund
   * @param {number} amount - Amount in INR rupees to refund
   * @returns {Promise<import('./PaymentGatewayInterface').PaymentResult>}
   */
  async refund(paymentId, amount) {
    try {
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_mocksecret',
      });
      const options = {};
      if (amount) {
        options.amount = Math.round(amount * 100); // refund amount in paisa
      }
      const refundObj = await instance.payments.refund(paymentId, options);
      return {
        success: refundObj.status === 'processed',
        gatewayRef: refundObj.id,
        amount: refundObj.amount / 100,
        currency: refundObj.currency,
        status: refundObj.status.toUpperCase(),
        raw: refundObj,
      };
    } catch (err) {
      console.error('[Razorpay refund] Error:', err.message);
      throw err;
    }
  }
}

module.exports = new RazorpayService();
