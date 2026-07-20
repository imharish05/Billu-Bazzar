'use strict';
const cron = require('node-cron');
const { Order } = require('../models');
const { Op } = require('sequelize');

// Runs every minute to expire unpaid orders after 15 minutes of inactivity
cron.schedule('* * * * *', async () => {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Identify orders that are still pending payment and are past the 15-minute window
    const ordersToExpire = await Order.findAll({
      where: {
        status: 'PENDING_PAYMENT',
        createdAt: {
          [Op.lt]: fifteenMinutesAgo
        },
        inventoryProcessed: false
      }
    });

    for (const order of ordersToExpire) {
      // Conditional atomic update to prevent double transition or race conditions with late payments
      const [affectedRows] = await Order.update(
        { status: 'EXPIRED' },
        {
          where: {
            id: order.id,
            status: 'PENDING_PAYMENT'
          }
        }
      );

      if (affectedRows > 0) {
        console.log(`[OrderExpiryJob] Successfully expired unpaid Order #${order.orderNumber} (ID: ${order.id})`);
      }
    }
  } catch (err) {
    console.error('[OrderExpiryJob] Error running order expiry job:', err.message);
  }
});

console.log('[Cron] Order Expiration job scheduled');
