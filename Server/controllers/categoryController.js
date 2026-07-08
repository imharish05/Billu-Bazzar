'use strict';
const { Category } = require('../models');

const getTree = async (req, res) => {
  try {
    const all = await Category.findAll({ where: { isActive: true }, order: [['sortOrder', 'ASC']] });
    const tree = all.filter(c => !c.parentId).map(parent => ({
      ...parent.toJSON(),
      children: all.filter(c => c.parentId === parent.id).map(c => c.toJSON()),
    }));
    res.json({ success: true, categories: tree });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAll = async (req, res) => {
  try {
    const categories = await Category.findAll({ where: { isActive: true }, order: [['sortOrder', 'ASC']] });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    await category.update(req.body);
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    await category.update({ isActive: false });
    res.json({ success: true, message: 'Category deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTree, getAll, create, update, remove };
