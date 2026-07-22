'use strict';
const { Customer, Wishlist, LoyaltyLedger, Order, SupportTicket, Product, ProductVariant } = require('../models');

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const { Op } = require('sequelize');
    const where = {};
    if (search) where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }];
    const { count, rows } = await Customer.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] },
      include: [{ model: Order, as: 'orders', attributes: ['id'] }]
    });
    res.json({ success: true, customers: rows, total: count });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getOne = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id, { attributes: { exclude: ['password'] }, include: [{ model: Order, as: 'orders', limit: 5, order: [['createdAt', 'DESC']] }] });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, customer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getWishlist = async (req, res) => {
  try {
    const items = await Wishlist.findAll({
      where: { customerId: req.customer.id },
      include: [
        { model: Product, as: 'product' },
        { model: ProductVariant, as: 'variant' }
      ]
    });
    res.json({ success: true, wishlist: items });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const toggleWishlist = async (req, res) => {
  try {
    const { productId, variantId, selectedVariant } = req.body;
    const whereClause = {
      customerId: req.customer.id,
      productId,
      variantId: variantId || null,
    };
    const existing = await Wishlist.findOne({ where: whereClause });
    if (existing) {
      await existing.destroy();
      return res.json({ success: true, action: 'removed' });
    }
    await Wishlist.create({
      customerId: req.customer.id,
      productId,
      variantId: variantId || null,
      selectedVariant: selectedVariant || {}
    });
    res.json({ success: true, action: 'added' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getLoyalty = async (req, res) => {
  try {
    const ledger = await LoyaltyLedger.findAll({ where: { customerId: req.customer.id }, order: [['createdAt', 'DESC']] });
    res.json({ success: true, ledger, balance: req.customer.loyaltyPoints });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const getTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.findAll({ where: { customerId: req.customer.id }, order: [['createdAt', 'DESC']] });
    res.json({ success: true, tickets });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

const createTicket = async (req, res) => {
  try {
    const { subject, description, orderId, category } = req.body;
    const ticket = await SupportTicket.create({ customerId: req.customer.id, subject, description, orderId, category });
    res.status(201).json({ success: true, ticket });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

module.exports = { getAll, getOne, getWishlist, toggleWishlist, getLoyalty, getTickets, createTicket };
