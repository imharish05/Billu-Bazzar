'use strict';
const { Op } = require('sequelize');
const { Product, Category, Vendor } = require('../models');

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, minPrice, maxPrice, sort = 'createdAt', order = 'DESC', featured, newArrival, bestSeller } = req.query;
    const where = { isActive: true };
    if (category) where.categoryId = category;
    if (minPrice || maxPrice) where.price = {};
    if (minPrice) where.price[Op.gte] = minPrice;
    if (maxPrice) where.price[Op.lte] = maxPrice;
    if (search) where.name = { [Op.like]: `%${search}%` };
    if (featured === 'true') where.isFeatured = true;
    if (newArrival === 'true') where.isNewArrival = true;
    if (bestSeller === 'true') where.isBestSeller = true;

    const { count, rows } = await Product.findAndCountAll({
      where, limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit),
      order: [[sort, order]],
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }],
    });

    res.json({ success: true, products: rows, total: count, page: parseInt(page), totalPages: Math.ceil(count / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { slug: req.params.slug, isActive: true },
      include: [{ model: Category, as: 'category' }, { model: Vendor, as: 'vendor', attributes: ['id', 'name', 'rating'] }],
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await product.update(req.body);
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await product.update({ isActive: false });
    res.json({ success: true, message: 'Product deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getFeatured = async (req, res) => {
  try {
    const products = await Product.findAll({ where: { isFeatured: true, isActive: true }, limit: 12, include: [{ model: Category, as: 'category', attributes: ['name', 'slug'] }] });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove, getFeatured };
