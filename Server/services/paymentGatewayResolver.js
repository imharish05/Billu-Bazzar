'use strict';

const RazorpayService = require('./RazorpayService');
const TelrService = require('./TelrService');

/**
 * Resolve payment gateway based on currency.
 * @param {string} currency - The currency code (e.g. 'INR', 'AED')
 * @returns {import('./PaymentGatewayInterface')}
 * @throws {Error} If currency is not supported
 */
const getGateway = (currency) => {
  const c = currency?.toUpperCase();
  if (c === 'INR') {
    return RazorpayService;
  }
  if (c === 'AED') {
    return TelrService;
  }
  throw new Error(`Unsupported transaction currency: ${currency || 'undefined'}. Only INR and AED are supported.`);
};

module.exports = { getGateway };
