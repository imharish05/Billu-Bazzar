'use strict';

/**
 * @typedef {Object} PaymentResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {string} gatewayRef - Gateway-specific reference ID (e.g. order ID, payment ID, or refund ID)
 * @property {number} amount - Amount in standard currency units (e.g. decimal format)
 * @property {string} currency - Currency code (e.g. 'INR', 'AED')
 * @property {string} status - Normalized status (e.g. 'CREATED', 'PAID', 'FAILED', 'REFUNDED')
 * @property {string} [redirectUrl] - Gateway hosted checkout URL, if applicable
 * @property {any} raw - Raw payload returned from the gateway API/SDK
 */

/**
 * Interface contract for Payment Gateways.
 * All implementations must inherit from this class and implement its methods.
 */
class PaymentGatewayInterface {
  /**
   * Create a gateway order/session reference.
   * @param {Object} orderData
   * @param {number} orderData.amount - Total amount in standard currency unit
   * @param {string} orderData.currency - Currency code (e.g. 'INR', 'AED')
   * @param {string} orderData.receipt - Unique order/receipt reference ID
   * @returns {Promise<PaymentResult>}
   */
  async createOrder(orderData) {
    throw new Error('Method createOrder must be implemented');
  }

  /**
   * Verify the authenticity of a webhook/callback signature.
   * @param {any} payload - The raw or parsed request body
   * @param {string} signature - The signature hash from request headers/parameters
   * @returns {Promise<boolean>} - True if verified authentic, otherwise false
   */
  async verifySignature(payload, signature) {
    throw new Error('Method verifySignature must be implemented');
  }

  /**
   * Fetch payment status and details from the gateway.
   * @param {string} paymentId - Gateway reference ID (e.g. payment_id or order_ref)
   * @returns {Promise<PaymentResult>}
   */
  async fetchPayment(paymentId) {
    throw new Error('Method fetchPayment must be implemented');
  }

  /**
   * Refund a processed payment.
   * @param {string} paymentId - Gateway reference ID to refund
   * @param {number} amount - Amount to refund in standard currency unit
   * @returns {Promise<PaymentResult>}
   */
  async refund(paymentId, amount) {
    throw new Error('Method refund must be implemented');
  }
}

module.exports = PaymentGatewayInterface;
