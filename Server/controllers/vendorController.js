'use strict';
const { Vendor, Product } = require('../models');

const handleDBError = (err, res, type = 'item') => {
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ success: false, message: `A ${type} with this email already exists.` });
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ success: false, message: 'Foreign key constraint fails.' });
  }
  if (err.name === 'SequelizeValidationError') {
    const msg = err.errors.map(e => e.message).join(', ');
    return res.status(400).json({ success: false, message: msg });
  }
  return res.status(500).json({ success: false, message: err.message });
};

const getAll = async (req, res) => {
  try {
    const { all } = req.query;
    const where = {};
    if (!all) where.isActive = true;

    const vendors = await Vendor.findAll({
      where,
      order: [['createdAt', 'DESC']],
      include: [{ model: Product, as: 'products', attributes: ['id', 'name', 'slug', 'stock'] }],
    });
    res.json({ success: true, vendors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id, {
      include: [{ model: Product, as: 'products', attributes: ['id', 'name', 'slug', 'price', 'stock'] }],
    });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const data = { ...req.body };

    if (data.isActive !== undefined) {
      data.isActive = data.isActive === 'true' || data.isActive === true;
    }

    if (data.commissionRate) {
      data.commissionRate = parseFloat(data.commissionRate);
    }

    if (data.rating) {
      data.rating = parseFloat(data.rating);
    }

    if (data.address && typeof data.address === 'string') {
      try {
        data.address = JSON.parse(data.address);
      } catch (e) {
        data.address = {};
      }
    }

    const vendor = await Vendor.create(data);
    res.status(201).json({ success: true, vendor });
  } catch (err) {
    return handleDBError(err, res, 'vendor');
  }
};

const update = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    const data = { ...req.body };

    if (data.isActive !== undefined) {
      data.isActive = data.isActive === 'true' || data.isActive === true;
    }

    if (data.commissionRate !== undefined) {
      data.commissionRate = parseFloat(data.commissionRate);
    }

    if (data.rating !== undefined) {
      data.rating = parseFloat(data.rating);
    }

    if (data.address && typeof data.address === 'string') {
      try {
        data.address = JSON.parse(data.address);
      } catch (e) {
        // preserve existing if invalid JSON
      }
    }

    await vendor.update(data);
    res.json({ success: true, vendor });
  } catch (err) {
    return handleDBError(err, res, 'vendor');
  }
};

const remove = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    // Enforce check: Do not delete if products are linked
    const productsCount = await Product.count({ where: { vendorId: vendor.id } });
    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete vendor "${vendor.name}" because they have ${productsCount} products associated with them. Please delete or reassign the products first.`
      });
    }

    await vendor.destroy();
    res.json({ success: true, message: 'Vendor deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove };
