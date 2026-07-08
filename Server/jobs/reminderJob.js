'use strict';
const cron = require('node-cron');

/**
 * Reminder Jobs — scheduled tasks for Billu Bazaar
 * Runs on server startup. Replace console.log with real email/WhatsApp calls in production.
 */

// ── Daily: flag abandoned carts (older than 24h) ──────────────────────────────
cron.schedule('0 9 * * *', async () => {
  console.log('[Cron] Running abandoned cart check...');
  // TODO: query Cart.findAll where updatedAt < 24h, send reminder via TwilioService
});

// ── Weekly: loyalty points expiry check ───────────────────────────────────────
cron.schedule('0 10 * * 1', async () => {
  console.log('[Cron] Running loyalty expiry check...');
  // TODO: query LoyaltyLedger for expiring points, notify customers
});

// ── Daily: low stock alert to admin ──────────────────────────────────────────
cron.schedule('0 8 * * *', async () => {
  console.log('[Cron] Running low stock check...');
  // TODO: query WarehouseStock where quantity <= reorderLevel, notify admin
});

console.log('[Cron] Scheduled jobs registered');
