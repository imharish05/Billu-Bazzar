'use strict';
const { Banner } = require('../models');

const getAll = async (req, res) => {
  try {
    const { type } = req.query;
    const where = { isActive: true };
    if (type) where.type = type;
    const banners = await Banner.findAll({ where, order: [['position', 'ASC']] });
    res.json({ success: true, banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json({ success: true, banner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    await banner.update(req.body);
    res.json({ success: true, banner });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    await Banner.destroy({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Banner deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, create, update, remove };
