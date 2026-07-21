'use strict';
const { Op } = require('sequelize');
const { Warehouse, WarehouseStock, Product, ProductVariant, InventoryMovementLog } = require('../models');

// Include product and variant information in stock lookups
const stockInclude = [
  { model: Product, as: 'product', attributes: ['id', 'name', 'slug', 'sku', 'stock', 'images'] },
  { model: ProductVariant, as: 'variant', attributes: ['id', 'sku', 'price', 'stock', 'attributes'] }
];

// Helper to sync main product/variant stock with fulfillment warehouse stock
const syncStorefrontStock = async (productId, variantId) => {
  try {
    const fulfillmentWh = await Warehouse.findOne({ where: { isFulfillment: true, isActive: true } });
    if (!fulfillmentWh) return;

    // Get stock in primary fulfillment warehouse
    const ws = await WarehouseStock.findOne({
      where: { warehouseId: fulfillmentWh.id, productId, variantId: variantId || null }
    });
    const currentQty = ws ? ws.quantity : 0;

    if (variantId) {
      const variant = await ProductVariant.findByPk(variantId);
      if (variant) {
        await variant.update({ stock: currentQty });
        // Sync parent product total stock
        const allVars = await ProductVariant.findAll({ where: { productId } });
        const totalStock = allVars.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
        const product = await Product.findByPk(productId);
        if (product) await product.update({ stock: totalStock });
      }
    } else {
      const product = await Product.findByPk(productId);
      if (product) {
        await product.update({ stock: currentQty });
      }
    }
  } catch (err) {
    console.error('[syncStorefrontStock] Error:', err.message);
  }
};

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
  const transaction = await Warehouse.sequelize.transaction();
  try {
    const warehouse = await Warehouse.findByPk(req.params.id);
    if (!warehouse) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    // Hard delete related stock and logs to prevent FK constraint failures
    await WarehouseStock.destroy({ where: { warehouseId: warehouse.id }, transaction });
    await InventoryMovementLog.destroy({
      where: {
        [Op.or]: [
          { warehouseId: warehouse.id },
          { toWarehouseId: warehouse.id }
        ]
      },
      transaction
    });

    await warehouse.destroy({ transaction });
    await transaction.commit();
    res.json({ success: true, message: 'Warehouse deleted successfully from database' });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

const getStock = async (req, res) => {
  try {
    const where = { warehouseId: req.params.id };
    if (req.query.lowStock === 'true') {
      where.quantity = { [Op.lte]: WarehouseStock.sequelize.col('reorderLevel') };
    }
    const stocks = await WarehouseStock.findAll({
      where,
      include: stockInclude,
      order: [['quantity', 'ASC']]
    });
    res.json({ success: true, stocks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const upsertStock = async (req, res) => {
  const transaction = await WarehouseStock.sequelize.transaction();
  try {
    const { productId, variantId, quantity = 0, reservedQty = 0, reorderLevel = 10 } = req.body;
    const warehouseId = req.params.id;

    if (!productId) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'productId is required' });
    }

    const [stock, created] = await WarehouseStock.findOrCreate({
      where: { warehouseId, productId, variantId: variantId || null },
      defaults: { warehouseId, productId, variantId: variantId || null, quantity, reservedQty, reorderLevel },
      transaction
    });

    const oldQty = created ? 0 : stock.quantity;

    if (!created) {
      await stock.update({ quantity, reservedQty, reorderLevel }, { transaction });
    }

    // Log the movement
    await InventoryMovementLog.create({
      productId,
      variantId: variantId || null,
      warehouseId,
      quantity: quantity - oldQty,
      type: 'MANUAL_ADJUSTMENT',
      reason: 'Manual adjustment from warehouse stock admin panel',
    }, { transaction });

    await transaction.commit();

    // Sync storefront/catalog stock
    await syncStorefrontStock(productId, variantId);

    res.json({ success: true, stock });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/warehouses/transfer
const transferStock = async (req, res) => {
  const transaction = await WarehouseStock.sequelize.transaction();
  try {
    const { fromWarehouseId, toWarehouseId, productId, variantId, quantity } = req.body;

    if (!fromWarehouseId || !toWarehouseId || !productId || !quantity || quantity <= 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'fromWarehouseId, toWarehouseId, productId, and positive quantity are required' });
    }

    // Find source stock
    const sourceStock = await WarehouseStock.findOne({
      where: { warehouseId: fromWarehouseId, productId, variantId: variantId || null },
      transaction
    });

    if (!sourceStock || sourceStock.quantity < quantity) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: `Insufficient stock in source warehouse. Available: ${sourceStock ? sourceStock.quantity : 0}` });
    }

    // Deduct source stock
    await sourceStock.decrement('quantity', { by: quantity, transaction });

    // Add target stock
    const [targetStock] = await WarehouseStock.findOrCreate({
      where: { warehouseId: toWarehouseId, productId, variantId: variantId || null },
      defaults: { warehouseId: toWarehouseId, productId, variantId: variantId || null, quantity: 0 },
      transaction
    });
    await targetStock.increment('quantity', { by: quantity, transaction });

    // Log the movement
    await InventoryMovementLog.create({
      productId,
      variantId: variantId || null,
      warehouseId: fromWarehouseId,
      toWarehouseId,
      quantity,
      type: 'MANUAL_ADJUSTMENT', // Can represent transfer
      reason: `Stock transfer of ${quantity} units from warehouse #${fromWarehouseId} to warehouse #${toWarehouseId}`,
    }, { transaction });

    await transaction.commit();

    // Sync storefront stock for both warehouses (if either is fulfillment)
    await syncStorefrontStock(productId, variantId);

    res.json({ success: true, message: 'Stock transferred successfully' });
  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove, getStock, upsertStock, transferStock };
