'use strict';
const { sequelize, Order, OrderItem, Product, ProductVariant, Customer, Coupon, Affiliate, Cart, CartItem, InventoryMovementLog, Warehouse, WarehouseStock } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Helper to push order details to Shiprocket shipping API
const pushToShiprocket = async (orderId) => {
  try {
    const order = await Order.findByPk(orderId, { include: [{ model: OrderItem, as: 'items' }] });
    if (!order) return;
    
    console.log(`[Shiprocket] Asynchronously sending Order #${order.orderNumber} to Shiprocket API...`);
    // Mock Shiprocket API call
    await order.update({ shiprocketOrderId: `SR-${Math.floor(Math.random() * 10000000)}` });
    console.log(`[Shiprocket] Order #${order.orderNumber} successfully pushed to Shiprocket.`);
  } catch (err) {
    console.error(`[Shiprocket] Error pushing order ${orderId} to Shiprocket:`, err.message);
  }
};

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, customerId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    const { count, rows } = await Order.findAndCountAll({
      where, limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']],
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
        { model: OrderItem, as: 'items' },
      ],
    });
    res.json({ success: true, orders: rows, total: count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { customerId: req.customer.id },
      order: [['createdAt', 'DESC']],
      include: [{ model: OrderItem, as: 'items' }],
    });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id },
      include: [
        { model: Customer, as: 'customer', attributes: ['id', 'name', 'email', 'phone'] },
        { model: OrderItem, as: 'items' },
        { model: Coupon, as: 'coupon' },
      ],
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const placeOrder = async (req, res) => {
  console.log('[placeOrder] --- Place Order Triggered ---');
  console.log('[placeOrder] Customer authenticated:', req.customer ? `Yes (ID: ${req.customer.id})` : 'No (Guest)');
  console.log('[placeOrder] Header x-session-id:', req.headers['x-session-id']);
  const transaction = await sequelize.transaction();
  try {
    // 1. Force session lock wait timeout to protect against locking bottlenecks
    await sequelize.query('SET SESSION innodb_lock_wait_timeout = 5', { transaction });

    const { shippingAddress, billingAddress, paymentMethod, couponCode, referralCode } = req.body;

    // 2. Fetch server-side cart based on customer or guest sessionId (NEVER trust req.body.items)
    let cartWhere = {};
    if (req.customer && req.customer.id) {
      cartWhere = { customerId: req.customer.id };
    } else {
      const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
      if (!sessionId) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Cart session is missing' });
      }
      cartWhere = { sessionId };
    }

    const cart = await Cart.findOne({
      where: cartWhere,
      include: [{
        model: CartItem,
        as: 'items',
        include: [{ model: Product, as: 'product' }]
      }],
      transaction
    });

    console.log('[placeOrder] Cart search criteria:', JSON.stringify(cartWhere));
    console.log('[placeOrder] Resolved Cart:', cart ? `ID ${cart.id}` : 'None');
    if (cart) {
      console.log('[placeOrder] Cart items length:', cart.items ? cart.items.length : 0);
      if (cart.items) {
        cart.items.forEach(item => {
          console.log(`  - CartItem ID: ${item.id}, Product ID: ${item.productId}, Qty: ${item.quantity}`);
        });
      }
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // 3. Consolidate and Sort Items by productId then variantId ascending to prevent deadlocks
    const itemsToLock = cart.items.map(item => ({
      productId: item.productId,
      variantId: item.variantId || null,
      quantity: item.quantity,
      price: parseFloat(item.priceAtAdd),
      name: item.product?.name || 'Product',
      image: item.product?.images?.[0] || ''
    }));

    itemsToLock.sort((a, b) => {
      if (a.productId !== b.productId) return a.productId - b.productId;
      return (a.variantId || 0) - (b.variantId || 0);
    });

    // 4. Lock products/variants inside transaction
    const outOfStockItems = [];
    const lockedStock = {};

    for (const item of itemsToLock) {
      let currentStock = 0;
      if (item.variantId) {
        const variant = await ProductVariant.findOne({
          where: { id: item.variantId },
          lock: transaction.LOCK.UPDATE,
          transaction
        });
        if (!variant) {
          await transaction.rollback();
          return res.status(404).json({ success: false, message: `Product variant ${item.variantId} not found` });
        }
        currentStock = variant.stock;
        lockedStock[`v_${item.variantId}`] = variant;
      } else {
        const product = await Product.findOne({
          where: { id: item.productId },
          lock: transaction.LOCK.UPDATE,
          transaction
        });
        if (!product) {
          await transaction.rollback();
          return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
        }
        currentStock = product.stock;
        lockedStock[`p_${item.productId}`] = product;
      }

      if (currentStock < item.quantity) {
        outOfStockItems.push({
          productId: item.productId,
          productName: item.name,
          availableStock: currentStock,
          requestedQty: item.quantity
        });
      }
    }

    // 5. If stock validation fails, rollback and return CHECKOUT_STOCK_CHANGED
    if (outOfStockItems.length > 0) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        code: 'CHECKOUT_STOCK_CHANGED',
        items: outOfStockItems
      });
    }

    // 6. Calculate amounts
    let subtotal = itemsToLock.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discountAmount = 0;
    let couponId = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({ where: { code: couponCode, isActive: true }, transaction });
      if (coupon && subtotal >= coupon.minOrderValue) {
        couponId = coupon.id;
        if (coupon.type === 'PERCENT') {
          discountAmount = Math.min(subtotal * coupon.value / 100, coupon.maxDiscount || Infinity);
        } else if (coupon.type === 'FLAT') {
          discountAmount = Math.min(coupon.value, subtotal);
        }
        await coupon.increment('usageCount', { transaction });
      }
    }

    // Affiliate referral lookup
    let affiliateId = null;
    let resolvedAffiliate = null;
    if (referralCode) {
      resolvedAffiliate = await Affiliate.findOne({
        where: { referralCode: referralCode.toUpperCase(), isActive: true },
        transaction
      });
      if (resolvedAffiliate) affiliateId = resolvedAffiliate.id;
    }

    const shippingAmount = subtotal > 1499 ? 0 : 99;
    const taxAmount = subtotal * 0.05;
    const totalAmount = subtotal - discountAmount + shippingAmount + taxAmount;

    const isCod = paymentMethod === 'COD';

    // Guard: Enforce currency uniformity and resolve correct currency code
    let orderCurrency = 'INR';
    const shippingCountry = (shippingAddress?.country || '').trim().toLowerCase();
    const isUae = ['uae', 'united arab emirates', 'dubai', 'abu dhabi', 'sharjah'].includes(shippingCountry);

    if (isUae) {
      orderCurrency = 'AED';
    } else if (req.customer) {
      const user = await Customer.findByPk(req.customer.id, { transaction });
      if (user && user.preferredCurrency === 'AED') {
        orderCurrency = 'AED';
      }
    }

    let cartCurrency = null;
    for (const item of cart.items) {
      const itemCurrency = item.product?.currency || 'INR';
      if (!cartCurrency) {
        cartCurrency = itemCurrency;
      } else if (cartCurrency !== itemCurrency) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Mixed currency items are not allowed in the same cart/order.' });
      }
    }

    // Cart items' currency takes final precedence to prevent mismatches
    if (cartCurrency) {
      orderCurrency = cartCurrency;
    }

    // 7. Create Order record
    const order = await Order.create({
      orderNumber: `BB${uuidv4().slice(0, 8).toUpperCase()}`,
      customerId: req.customer ? req.customer.id : null,
      sessionId: req.customer ? null : cart.sessionId,
      affiliateId,
      couponId,
      status: isCod ? 'CONFIRMED' : 'PENDING_PAYMENT',
      paymentStatus: 'UNPAID',
      paymentMethod,
      subtotal,
      discountAmount,
      shippingAmount,
      taxAmount,
      totalAmount,
      currency: orderCurrency,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      inventoryProcessed: isCod
    }, { transaction });

    // 8. Snap order items
    const orderItemsPayload = itemsToLock.map(item => ({
      orderId: order.id,
      productId: item.productId,
      variantId: item.variantId,
      productName: item.name,
      productImage: item.image,
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: item.price * item.quantity,
      selectedVariant: item.variantId ? { id: item.variantId } : {}
    }));

    for (const snapItem of orderItemsPayload) {
      await OrderItem.create(snapItem, { transaction });
    }

    // 9. Process stock deduction immediately if COD path
    if (isCod) {
      const fulfillmentWh = await Warehouse.findOne({ where: { isFulfillment: true, isActive: true }, transaction });
      const whId = fulfillmentWh ? fulfillmentWh.id : null;

      for (const item of itemsToLock) {
        if (item.variantId) {
          const varObj = lockedStock[`v_${item.variantId}`];
          await varObj.decrement('stock', { by: item.quantity, transaction });
        } else {
          const prodObj = lockedStock[`p_${item.productId}`];
          await prodObj.decrement('stock', { by: item.quantity, transaction });
        }

        if (whId) {
          const [whStock] = await WarehouseStock.findOrCreate({
            where: { warehouseId: whId, productId: item.productId, variantId: item.variantId || null },
            defaults: { quantity: 0, reservedQty: 0 },
            transaction
          });
          await whStock.decrement('quantity', { by: item.quantity, transaction });
        }

        // Log movement
        await InventoryMovementLog.create({
          productId: item.productId,
          variantId: item.variantId,
          warehouseId: whId,
          orderId: order.id,
          quantity: -item.quantity,
          type: 'ORDER_DEDUCTION',
          reason: `COD order placement: ${order.orderNumber}`
        }, { transaction });
      }
    }

    // Update affiliate stats after order is saved
    if (resolvedAffiliate) {
      const commission = parseFloat(resolvedAffiliate.commissionRate) || 0;
      const earned = parseFloat((totalAmount * commission / 100).toFixed(2));
      await resolvedAffiliate.increment({
        totalOrders: 1,
        totalEarnings: earned,
      }, { transaction });
    }

    // 10. Clear server-side cartitems
    await CartItem.destroy({ where: { cartId: cart.id }, transaction });

    await transaction.commit();

    // 11. Post-commit operations (Asynchronous)
    if (isCod) {
      pushToShiprocket(order.id).catch(console.error);
    }

    res.status(201).json({
      success: true,
      order: {
        ...order.toJSON(),
        items: orderItemsPayload
      }
    });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin status update: handles restocking when order is cancelled or refunded
const updateStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    await sequelize.query('SET SESSION innodb_lock_wait_timeout = 5', { transaction });
    const { status, paymentStatus } = req.body;

    const order = await Order.findOne({
      where: { id: req.params.id },
      include: [{ model: OrderItem, as: 'items' }],
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const previousStatus = order.status;
    const previousProcessed = order.inventoryProcessed;

    // Handle restocking if transition goes to CANCELLED or REFUNDED and stock was previously deducted
    const isRestockRequired = (status === 'CANCELLED' || status === 'REFUNDED') &&
      previousStatus !== 'CANCELLED' &&
      previousStatus !== 'REFUNDED' &&
      previousProcessed === true;

    if (isRestockRequired) {
      // Find fulfillment warehouse
      const fulfillmentWh = await Warehouse.findOne({ where: { isFulfillment: true, isActive: true }, transaction });
      const whId = fulfillmentWh ? fulfillmentWh.id : null;

      // Sort items to restock ascending to prevent deadlocks
      const sortedItems = [...order.items].sort((a, b) => {
        if (a.productId !== b.productId) return a.productId - b.productId;
        return (a.variantId || 0) - (b.variantId || 0);
      });

      for (const item of sortedItems) {
        if (item.variantId) {
          const variant = await ProductVariant.findOne({
            where: { id: item.variantId },
            lock: transaction.LOCK.UPDATE,
            transaction
          });
          if (variant) {
            await variant.increment('stock', { by: item.quantity, transaction });
          }
        } else {
          const product = await Product.findOne({
            where: { id: item.productId },
            lock: transaction.LOCK.UPDATE,
            transaction
          });
          if (product) {
            await product.increment('stock', { by: item.quantity, transaction });
          }
        }

        if (whId) {
          const [whStock] = await WarehouseStock.findOrCreate({
            where: { warehouseId: whId, productId: item.productId, variantId: item.variantId || null },
            defaults: { quantity: 0, reservedQty: 0 },
            transaction
          });
          await whStock.increment('quantity', { by: item.quantity, transaction });
        }

        // Log movement
        await InventoryMovementLog.create({
          productId: item.productId,
          variantId: item.variantId,
          warehouseId: whId,
          orderId: order.id,
          quantity: item.quantity,
          type: 'ORDER_CANCEL_RESTOCK',
          reason: `Order cancelled/refunded. Status: ${status}. Previous: ${previousStatus}`
        }, { transaction });
      }

      order.inventoryProcessed = false;
    }

    await order.update({
      status,
      paymentStatus: paymentStatus || order.paymentStatus,
      inventoryProcessed: order.inventoryProcessed
    }, { transaction });

    await transaction.commit();
    res.json({ success: true, order });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalOrders, todayOrders, monthOrders, totalCustomers, pendingOrders, deliveredOrders] = await Promise.all([
      Order.count(),
      Order.count({ where: { createdAt: { [Op.gte]: today } } }),
      Order.count({ where: { createdAt: { [Op.gte]: thisMonth } } }),
      Customer.count(),
      Order.count({ where: { status: 'PENDING' } }),
      Order.count({ where: { status: 'DELIVERED' } }),
    ]);

    const revenueData = await Order.findAll({
      where: { paymentStatus: 'PAID' },
      attributes: ['totalAmount'],
    });
    const totalRevenue = revenueData.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

    res.json({
      success: true,
      stats: { totalOrders, todayOrders, monthOrders, totalCustomers, pendingOrders, deliveredOrders, totalRevenue: Math.round(totalRevenue) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, getMyOrders, placeOrder, updateStatus, getDashboardStats };
