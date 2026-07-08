'use strict';
const { Op } = require('sequelize');
const { Warehouse, WarehouseStock, Product } = require('../models');

const stockInclude = [{ model: Product, as: 'product', attributes: ['id', 'name', 'slug', 'sku', 'stock', 'images'] }];

const getAll = async (req, res) => {
  try {
    const warehouses = await Warehouse.findAll({
      order: [['createdAt', 'DESC']],
      include: [{ model: WarehouseStock, as: 'stocks', include: stockInclude }],
    });
    res.json({ success: true, warehouses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByPk(req.params.id, {
      include: [{ model: WarehouseStock, as: 'stocks', include: stockInclude }],
    });
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.json({ success: true, warehouse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const warehouse = await Warehouse.create(req.body);
    res.status(201).json({ success: true, warehouse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByPk(req.params.id);
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    await warehouse.update(req.body);
    res.json({ success: true, warehouse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByPk(req.params.id);
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    await warehouse.update({ isActive: false });
    res.json({ success: true, message: 'Warehouse deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getStock = async (req, res) => {
  try {
    const where = { warehouseId: req.params.id };
    if (req.query.lowStock === 'true') where.quantity = { [Op.lte]: WarehouseStock.sequelize.col('reorderLevel') };
    const stocks = await WarehouseStock.findAll({ where, include: stockInclude, order: [['quantity', 'ASC']] });
    res.json({ success: true, stocks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const upsertStock = async (req, res) => {
  try {
    const { productId, quantity = 0, reservedQty = 0, reorderLevel = 10 } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'productId is required' });
    const [stock] = await WarehouseStock.findOrCreate({
      where: { warehouseId: req.params.id, productId },
      defaults: { warehouseId: req.params.id, productId, quantity, reservedQty, reorderLevel },
    });
    if (!stock.isNewRecord) await stock.update({ quantity, reservedQty, reorderLevel });
    res.json({ success: true, stock });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove, getStock, upsertStock };
