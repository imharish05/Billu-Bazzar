'use strict';
const { Order, OrderItem, Product, Customer, Coupon, Affiliate } = require('../models');
const { v4: uuidv4 } = require('uuid');

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
  try {
    const { items, shippingAddress, billingAddress, paymentMethod, couponCode, referralCode } = req.body;
    if (!items?.length) return res.status(400).json({ success: false, message: 'No items in order' });

    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
      const total = product.price * item.quantity;
      subtotal += total;
      orderItems.push({ productId: product.id, productName: product.name, productImage: product.images?.[0], quantity: item.quantity, unitPrice: product.price, totalPrice: total, selectedVariant: item.selectedVariant || {} });
    }

    let discountAmount = 0;
    let couponId = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ where: { code: couponCode, isActive: true } });
      if (coupon && subtotal >= coupon.minOrderValue) {
        couponId = coupon.id;
        if (coupon.type === 'PERCENT') discountAmount = Math.min(subtotal * coupon.value / 100, coupon.maxDiscount || Infinity);
        else if (coupon.type === 'FLAT') discountAmount = Math.min(coupon.value, subtotal);
        await coupon.increment('usageCount');
      }
    }

    // ── Affiliate referral lookup ──────────────────────────────────
    let affiliateId = null;
    let resolvedAffiliate = null;
    if (referralCode) {
      resolvedAffiliate = await Affiliate.findOne({
        where: { referralCode: referralCode.toUpperCase(), isActive: true },
      });
      if (resolvedAffiliate) affiliateId = resolvedAffiliate.id;
    }

    const shippingAmount = subtotal > 1499 ? 0 : 99;
    const taxAmount = subtotal * 0.05;
    const totalAmount = subtotal - discountAmount + shippingAmount + taxAmount;

    const order = await Order.create({
      orderNumber: `BB${uuidv4().slice(0, 8).toUpperCase()}`,
      customerId: req.customer.id,
      affiliateId,
      couponId, status: 'PENDING', paymentStatus: 'UNPAID', paymentMethod,
      subtotal, discountAmount, shippingAmount, taxAmount, totalAmount, shippingAddress,
      billingAddress: billingAddress || shippingAddress,
    });

    for (const item of orderItems) await OrderItem.create({ ...item, orderId: order.id });

    // ── Update affiliate stats after order is saved ────────────────
    if (resolvedAffiliate) {
      const commission = parseFloat(resolvedAffiliate.commissionRate) || 0;
      const earned = parseFloat((totalAmount * commission / 100).toFixed(2));
      await resolvedAffiliate.increment({
        totalOrders: 1,
        totalEarnings: earned,
      });
      console.log(`[Affiliate] ${resolvedAffiliate.name} earned ₹${earned} commission on order ${order.orderNumber}`);
    }

    res.status(201).json({ success: true, order: { ...order.toJSON(), items: orderItems } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    await order.update({ status: req.body.status, paymentStatus: req.body.paymentStatus });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const { Op } = require('sequelize');
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
