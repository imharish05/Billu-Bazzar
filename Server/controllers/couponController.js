'use strict';
const { Coupon, Order } = require('../models');
const { Op } = require('sequelize');

const normalizeCode = (code = '') => String(code).trim().toUpperCase();

const calculateDiscount = (coupon, subtotal) => {
  const value = Number(coupon.value || 0);
  if (coupon.type === 'PERCENT') return Math.min((subtotal * value) / 100, Number(coupon.maxDiscount || Infinity));
  if (coupon.type === 'FLAT') return Math.min(value, subtotal);
  return 0;
};

const isUsable = (coupon, subtotal) => {
  const now = new Date();
  if (!coupon || !coupon.isActive) return 'Coupon is inactive';
  if (new Date(coupon.validFrom) > now) return 'Coupon is not active yet';
  if (new Date(coupon.validUntil) < now) return 'Coupon has expired';
  if (Number(coupon.usageCount) >= Number(coupon.usageLimit)) return 'Coupon usage limit reached';
  if (subtotal < Number(coupon.minOrderValue || 0)) return `Minimum order value is ₹${coupon.minOrderValue}`;
  return null;
};

const getAll = async (req, res) => {
  try {
    const coupons = await Coupon.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const body = { ...req.body, code: normalizeCode(req.body.code) };
    if (body.validTo && !body.validUntil) body.validUntil = body.validTo;
    if (!body.validFrom) body.validFrom = new Date();
    if (!body.validUntil) body.validUntil = new Date(Date.now() + 30 * 86400000);
    const coupon = await Coupon.create(body);
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    const body = { ...req.body };
    if (body.code) body.code = normalizeCode(body.code);
    if (body.validTo && !body.validUntil) body.validUntil = body.validTo;
    await coupon.update(body);
    res.json({ success: true, coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    await coupon.destroy();
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const validate = async (req, res) => {
  try {
    const subtotal = Number(req.body.subtotal || req.body.cartSubtotal || 0);
    const coupon = await Coupon.findOne({ where: { code: normalizeCode(req.body.code) } });
    const reason = isUsable(coupon, subtotal);
    if (reason) return res.status(400).json({ success: false, valid: false, message: reason });

    // Per-user redemption check
    const customerId = req.user?.id || req.body.customerId;
    if (customerId && coupon) {
      const existingUsage = await Order.count({
        where: { customerId, couponId: coupon.id, status: { [Op.ne]: 'CANCELLED' } }
      });
      if (existingUsage > 0) {
        return res.status(400).json({
          success: false,
          valid: false,
          message: `You have already redeemed coupon '${coupon.code}' on a previous order.`
        });
      }
    }

    const discountAmount = calculateDiscount(coupon, subtotal);
    res.json({ success: true, valid: true, coupon, discountAmount, freeShipping: coupon.type === 'FREE_SHIPPING' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, create, update, remove, validate };
