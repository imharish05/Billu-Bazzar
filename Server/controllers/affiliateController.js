'use strict';
const { Affiliate, Order, Customer } = require('../models');

const getAll = async (req, res) => {
  try {
    const affiliates = await Affiliate.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, affiliates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const affiliate = await Affiliate.findByPk(req.params.id, {
      include: [{ model: Order, as: 'orders', include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'email'] }] }],
    });
    if (!affiliate) return res.status(404).json({ success: false, message: 'Affiliate not found' });
    res.json({ success: true, affiliate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const affiliate = await Affiliate.create(req.body);
    res.status(201).json({ success: true, affiliate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const affiliate = await Affiliate.findByPk(req.params.id);
    if (!affiliate) return res.status(404).json({ success: false, message: 'Affiliate not found' });
    await affiliate.update(req.body);
    res.json({ success: true, affiliate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const affiliate = await Affiliate.findByPk(req.params.id);
    if (!affiliate) return res.status(404).json({ success: false, message: 'Affiliate not found' });
    await affiliate.update({ isActive: false });
    res.json({ success: true, message: 'Affiliate deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { affiliateId: req.params.id },
      include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
    });
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    res.json({ success: true, orders, totalRevenue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove, getOrders };
