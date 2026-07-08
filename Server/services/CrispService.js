'use strict';
/**
 * CrispService — local mock. Replace with real Crisp SDK before production.
 */
class CrispService {
  init() { console.log('[CrispMock] Chat widget initialised'); }
  identify(customer) { console.log('[CrispMock] Identify:', customer.email); }
  sendMessage(session, text) { console.log(`[CrispMock] Message to ${session}: ${text}`); return Promise.resolve({ success: true }); }
}

module.exports = new CrispService();
