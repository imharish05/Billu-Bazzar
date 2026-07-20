'use strict';
const crypto = require('crypto');
const { sequelize, Order, OrderItem, Product, ProductVariant, InventoryMovementLog } = require('../models');

// Helper to push order details to Shiprocket shipping API
const pushToShiprocket = async (orderId) => {
  try {
    const order = await Order.findByPk(orderId, { include: [{ model: OrderItem, as: 'items' }] });
    if (!order) return;
    
    console.log(`[Shiprocket] Asynchronously sending Order #${order.orderNumber} to Shiprocket API...`);
    // Placeholder for Shiprocket payload creation and API call
    // const response = await axios.post('https://api.shiprocket.in/v1/external/orders/create/adhoc', payload, { headers });
    await order.update({ shiprocketOrderId: `SR-${Math.floor(Math.random() * 10000000)}` });
    console.log(`[Shiprocket] Order #${order.orderNumber} successfully pushed to Shiprocket.`);
  } catch (err) {
    console.error(`[Shiprocket] Error pushing order ${orderId} to Shiprocket:`, err.message);
  }
};

// Helper to check and alert administrators of low stock events
const checkAndNotifyLowStock = async (items) => {
  try {
    for (const item of items) {
      let currentStock = 0;
      let name = item.productName || '';
      let sku = '';

      if (item.variantId) {
        const variant = await ProductVariant.findByPk(item.variantId);
        if (variant) {
          currentStock = variant.stock;
          sku = variant.sku;
        }
      } else {
        const product = await Product.findByPk(item.productId);
        if (product) {
          currentStock = product.stock;
          sku = product.sku;
        }
      }

      // Reorder warning threshold (e.g., stock <= 10)
      if (currentStock <= 10) {
        console.warn(`[InventoryAlert] LOW STOCK WARNING: SKU "${sku}" for product "${name}" has dropped to ${currentStock} units!`);
        // Notify admin via Email, SMS, or Slack webhook queue here
      }
    }
  } catch (err) {
    console.error('[InventoryAlert] Error verifying stock reorder alerts:', err.message);
  }
};

// Idempotent Refund function
const initiateIdempotentRefund = async (orderId, paymentId, amount) => {
  try {
    // 1. Double check if refund log already exists (idempotency check)
    const existingLog = await InventoryMovementLog.findOne({
      where: { orderId, type: 'REFUND_OOS' }
    });
    if (existingLog) {
      console.log(`[Refund] Refund already processed for Order ID ${orderId}`);
      return;
    }

    console.log(`[Refund] Initiating automatic refund of ₹${amount} for Payment ID: ${paymentId}...`);
    // Mock Razorpay Refund API call
    // await razorpay.payments.refund(paymentId, { amount: amount * 100 });

    // 2. Log refund to audit trail
    await InventoryMovementLog.create({
      productId: 0,
      orderId,
      quantity: 0,
      type: 'REFUND_OOS',
      reason: `Automated refund of ₹${amount} completed successfully.`
    });
    console.log(`[Refund] Idempotent refund logged for Order ID ${orderId}`);
  } catch (err) {
    console.error(`[Refund] Error during refund of payment ${paymentId}:`, err.message);
  }
};

// Initiate Razorpay transaction details for a client
const initiatePayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findOne({ where: { id: orderId, customerId: req.customer?.id || null } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.status !== 'PENDING_PAYMENT') {
      return res.status(400).json({ success: false, message: 'Order is not in PENDING_PAYMENT state' });
    }

    // Mock Razorpay Order Creation
    const razorpayOrderId = `rzp_order_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    await order.update({ razorpay_order_id: razorpayOrderId });

    res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey',
      amount: Math.round(order.totalAmount * 100),
      currency: 'INR',
      name: 'Billu Bazzar',
      description: `Payment for Order ${order.orderNumber}`,
      order_id: razorpayOrderId
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Webhook Receiver
const handleWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'] || '';
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_webhook_mocksecret';

  // 1. Signature Verification (Only verify if secret is set and signature provided)
  if (process.env.NODE_ENV === 'production' || signature) {
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');
    if (digest !== signature) {
      return res.status(400).json({ success: false, message: 'Webhook signature verification failed' });
    }
  }

  const { payload } = req.body;
  if (!payload || !payload.payment) {
    return res.json({ success: true, message: 'Non-payment webhook ignored' });
  }

  const paymentEntity = payload.payment.entity;
  const razorpayPaymentId = paymentEntity.id;
  const razorpayOrderId = paymentEntity.order_id;
  const paymentAmount = paymentEntity.amount / 100;

  const transaction = await sequelize.transaction();
  try {
    // 2. Configure InnoDB lock wait timeout for this transaction
    await sequelize.query('SET SESSION innodb_lock_wait_timeout = 5', { transaction });

    // 3. Find and lock the order row
    const order = await Order.findOne({
      where: { razorpay_order_id: razorpayOrderId },
      include: [{ model: OrderItem, as: 'items' }],
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Order associated with payment not found' });
    }

    // 4. Webhook Idempotency Check
    if (order.inventoryProcessed || order.status === 'PAID') {
      await transaction.rollback();
      return res.json({ success: true, message: 'Payment webhook already processed previously (no-op)' });
    }

    // Verify duplicate payment ID check at order level
    const duplicatePayment = await Order.findOne({ where: { razorpay_payment_id: razorpayPaymentId }, transaction });
    if (duplicatePayment) {
      await transaction.rollback();
      return res.json({ success: true, message: 'Duplicate transaction ignored' });
    }

    // 5. Gather and Sort items in consistent ascending order to prevent deadlocks
    const sortedItems = [...order.items].sort((a, b) => {
      if (a.productId !== b.productId) return a.productId - b.productId;
      return (a.variantId || 0) - (b.variantId || 0);
    });

    const lockedStock = {};
    let isInventoryValid = true;

    // 6. Lock and evaluate stock inside the transaction
    for (const item of sortedItems) {
      if (item.variantId) {
        const variant = await ProductVariant.findOne({
          where: { id: item.variantId },
          lock: transaction.LOCK.UPDATE,
          transaction
        });
        if (!variant || variant.stock < item.quantity) {
          isInventoryValid = false;
        }
        lockedStock[`v_${item.variantId}`] = variant;
      } else {
        const product = await Product.findOne({
          where: { id: item.productId },
          lock: transaction.LOCK.UPDATE,
          transaction
        });
        if (!product || product.stock < item.quantity) {
          isInventoryValid = false;
        }
        lockedStock[`p_${item.productId}`] = product;
      }
    }

    // 7. Process stock deduction or initiate refund
    if (isInventoryValid) {
      // Deduct inventory
      for (const item of sortedItems) {
        if (item.variantId) {
          await lockedStock[`v_${item.variantId}`].decrement('stock', { by: item.quantity, transaction });
        } else {
          await lockedStock[`p_${item.productId}`].decrement('stock', { by: item.quantity, transaction });
        }

        // Log movement
        await InventoryMovementLog.create({
          productId: item.productId,
          variantId: item.variantId,
          orderId: order.id,
          quantity: -item.quantity,
          type: 'ORDER_DEDUCTION',
          reason: `Razorpay payment confirmation: ${razorpayPaymentId}`
        }, { transaction });
      }

      // Update Order PAID status
      await order.update({
        status: 'PAID',
        paymentStatus: 'PAID',
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: signature || null,
        inventoryProcessed: true
      }, { transaction });

      await transaction.commit();

      // Post-commit async hooks
      pushToShiprocket(order.id).catch(console.error);
      checkAndNotifyLowStock(sortedItems).catch(console.error);

      return res.json({ success: true, status: 'PAID' });
    } else {
      // Inventory sold out before confirmation! Rollback & Refund
      await order.update({
        status: 'PAYMENT_RECEIVED_STOCK_FAILED',
        paymentStatus: 'PAID',
        razorpay_payment_id: razorpayPaymentId,
        inventoryProcessed: false
      }, { transaction });

      await transaction.commit();

      // Trigger automatic, idempotent refund asynchronously
      initiateIdempotentRefund(order.id, razorpayPaymentId, paymentAmount).catch(console.error);

      return res.json({
        success: false,
        status: 'PAYMENT_RECEIVED_STOCK_FAILED',
        message: 'One or more items sold out. Refund initiated.'
      });
    }
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { initiatePayment, handleWebhook };
