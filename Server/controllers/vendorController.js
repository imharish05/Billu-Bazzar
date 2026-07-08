'use strict';
const { Vendor, Product } = require('../models');

const getAll = async (req, res) => {
  try {
    const vendors = await Vendor.findAll({
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
    const vendor = await Vendor.create(req.body);
    res.status(201).json({ success: true, vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    await vendor.update(req.body);
    res.json({ success: true, vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    await vendor.update({ isActive: false });
    res.json({ success: true, message: 'Vendor deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove };
