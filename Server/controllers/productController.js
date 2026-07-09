'use strict';
const { Op } = require('sequelize');
const { Product, Category, Vendor } = require('../models');
const fs = require('fs');
const path = require('path');

// Helper to delete local file
const deleteLocalFile = (imagePath) => {
  if (imagePath && imagePath.startsWith('/uploads/')) {
    const localPath = path.join(__dirname, '..', imagePath.substring(1)); // strip leading slash
    try {
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        console.log(`[Upload] Deleted local product file: ${localPath}`);
      }
    } catch (err) {
      console.error(`[Upload] Error deleting local product file: ${err.message}`);
    }
  }
};

// Helper to process FormData body & files
const processProductData = (req) => {
  const data = { ...req.body };

  // Helper to safely parse JSON strings
  const parseJsonField = (field) => {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        return field;
      }
    }
    return field;
  };

  if (data.tags) data.tags = parseJsonField(data.tags);
  if (data.attributes) data.attributes = parseJsonField(data.attributes);
  if (data.dimensions) data.dimensions = parseJsonField(data.dimensions);
  if (data.spin_images) data.spin_images = parseJsonField(data.spin_images);

  // Cast values from FormData strings
  if (data.price !== undefined) data.price = data.price === '' ? null : parseFloat(data.price);
  if (data.comparePrice !== undefined) data.comparePrice = data.comparePrice === '' || data.comparePrice === 'null' ? null : parseFloat(data.comparePrice);
  if (data.stock !== undefined) data.stock = data.stock === '' ? 0 : parseInt(data.stock, 10);
  if (data.categoryId !== undefined) data.categoryId = data.categoryId === '' ? null : parseInt(data.categoryId, 10);
  if (data.vendorId !== undefined) data.vendorId = data.vendorId === '' || data.vendorId === 'null' ? null : parseInt(data.vendorId, 10);

  if (data.isFeatured !== undefined) data.isFeatured = data.isFeatured === 'true';
  if (data.isNewArrival !== undefined) data.isNewArrival = data.isNewArrival === 'true';
  if (data.isBestSeller !== undefined) data.isBestSeller = data.isBestSeller === 'true';
  if (data.isActive !== undefined) data.isActive = data.isActive === 'true';

  // Handle uploaded images
  let existingImages = [];
  if (data.existingImages) {
    existingImages = parseJsonField(data.existingImages);
    if (!Array.isArray(existingImages)) {
      existingImages = typeof existingImages === 'string' ? [existingImages] : [];
    }
  }

  const newImages = [];
  if (req.files && req.files.length > 0) {
    req.files.forEach(file => {
      const normalizedPath = file.path.replace(/\\/g, '/');
      const uploadsIndex = normalizedPath.indexOf('uploads');
      newImages.push('/' + normalizedPath.substring(uploadsIndex));
    });
  }

  data.images = [...existingImages, ...newImages];
  delete data.existingImages; // clean up key from db model

  return { data, existingImages };
};

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, minPrice, maxPrice, sort = 'createdAt', order = 'DESC', featured, newArrival, bestSeller } = req.query;
    const where = { isActive: true };
    if (category) {
      if (isNaN(category)) {
        const foundCat = await Category.findOne({ where: { slug: category, isActive: true } });
        where.categoryId = foundCat ? foundCat.id : -1;
      } else {
        where.categoryId = parseInt(category);
      }
    }
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
    const { data } = processProductData(req);
    const product = await Product.create(data);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const { data, existingImages } = processProductData(req);

    // Identify and delete removed files
    const oldImages = product.images || [];
    const removedImages = oldImages.filter(img => !existingImages.includes(img));
    removedImages.forEach(img => deleteLocalFile(img));

    await product.update(data);
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  const transaction = await Product.sequelize.transaction();
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id, { transaction });
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Delete associated entries including order history
    const { WarehouseStock, CartItem, Wishlist, Review, StockAlert, OrderItem } = require('../models');
    await WarehouseStock.destroy({ where: { productId: id }, transaction });
    await CartItem.destroy({ where: { productId: id }, transaction });
    await Wishlist.destroy({ where: { productId: id }, transaction });
    await Review.destroy({ where: { productId: id }, transaction });
    await StockAlert.destroy({ where: { productId: id }, transaction });
    await OrderItem.destroy({ where: { productId: id }, transaction });

    await product.destroy({ transaction });

    await transaction.commit();
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    await transaction.rollback();
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

const search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) return res.json({ success: true, products: [] });
    const products = await Product.findAll({
      where: {
        isActive: true,
        name: { [Op.like]: `%${q.trim()}%` },
      },
      limit: 8,
      attributes: ['id', 'name', 'slug', 'price', 'images', 'discountPercent'],
    });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove, getFeatured, search };
