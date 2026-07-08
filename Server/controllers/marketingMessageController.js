'use strict';
const { MarketingMessage } = require('../models');

const getAll = async (req, res) => {
  try {
    const { all } = req.query;
    const where = {};
    if (!all) where.isActive = true;
    const messages = await MarketingMessage.findAll({ where, order: [['position', 'ASC']] });
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const message = await MarketingMessage.create(req.body);
    res.status(201).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const message = await MarketingMessage.findByPk(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    await message.update(req.body);
    res.json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const message = await MarketingMessage.findByPk(req.params.id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
    await message.destroy();
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, create, update, remove };
