'use strict';
const { Op } = require('sequelize');
const { Product, ProductVariant, Warehouse, WarehouseStock, InventoryMovementLog } = require('../models');

// Helper to generate a unique SKU if not provided
const generateSku = () => {
  return `PV-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
};

// Helper to normalize file paths
const buildImagePath = (file) => {
  if (!file) return null;
  return '/' + file.path.replace(/\\/g, '/').replace(/^.*uploads\//, 'uploads/');
};

// Helper to sync variant stock into India Fulfillment Warehouse
const syncWarehouseStock = async (productId, variantId, stockQty, reorderLevel = 10) => {
  try {
    const primaryWh = await Warehouse.findOne({ where: { isFulfillment: true, isActive: true } });
    if (!primaryWh) {
      console.warn('[SyncWarehouseStock] No primary fulfillment warehouse found');
      return;
    }

    const [ws, created] = await WarehouseStock.findOrCreate({
      where: { warehouseId: primaryWh.id, productId, variantId },
      defaults: { quantity: stockQty, reorderLevel },
    });

    if (!created) {
      await ws.update({ quantity: stockQty, reorderLevel });
    }

    // Log manual adjustment movement
    await InventoryMovementLog.create({
      productId,
      variantId,
      warehouseId: primaryWh.id,
      quantity: stockQty,
      type: 'MANUAL_ADJUSTMENT',
      reason: 'Sync from Variant CRUD',
    });
  } catch (err) {
    console.error('[SyncWarehouseStock] Error:', err.message);
  }
};

// Helper to sync variant details back to the main Product (price and total stock)
const syncProductVariants = async (productId) => {
  if (!productId) return;
  try {
    const product = await Product.findByPk(productId);
    if (!product) return;

    const variants = await ProductVariant.findAll({ where: { productId } });

    if (variants.length > 0) {
      // Find the lowest active price, or the first variant price
      const price = parseFloat(variants[0].price) || product.price;
      const stock = variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);

      await product.update({ price, stock });
    }
  } catch (err) {
    console.error('[syncProductVariants] Error:', err.message);
  }
};

// GET /api/variants
const getAll = async (req, res) => {
  try {
    const variants = await ProductVariant.findAll({
      include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'slug'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, variants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/variants/product/:productId
const getByProduct = async (req, res) => {
  try {
    const variants = await ProductVariant.findAll({
      where: { productId: req.params.productId },
      order: [['createdAt', 'ASC']],
    });
    res.json({ success: true, variants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/variants/add
const add = async (req, res) => {
  try {
    const { productId, sku, price, mrp, stock, attributes } = req.body;

    if (!productId) return res.status(400).json({ success: false, message: 'productId is required' });
    if (price !== undefined && Number(price) < 0) return res.status(400).json({ success: false, message: 'Price cannot be negative' });
    if (stock !== undefined && Number(stock) < 0) return res.status(400).json({ success: false, message: 'Stock cannot be negative' });

    const finalSku = sku ? sku.trim() : generateSku();

    // Check SKU conflicts
    const conflict = await ProductVariant.findOne({ where: { sku: finalSku } });
    if (conflict) {
      return res.status(400).json({ success: false, message: `SKU "${finalSku}" is already in use` });
    }

    // Process file uploads
    let mainVarImg = null;
    let galleryPaths = [];

    if (req.files) {
      const mainFile = req.files.image ? req.files.image[0] : (req.files[0] || null);
      mainVarImg = buildImagePath(mainFile);

      const galleryFiles = req.files.gallery || [];
      galleryPaths = galleryFiles.map(file => buildImagePath(file)).filter(Boolean);
    } else if (req.file) {
      mainVarImg = buildImagePath(req.file);
    }

    let parsedAttributes = attributes || {};
    if (typeof attributes === 'string') {
      try { parsedAttributes = JSON.parse(attributes); } catch (e) { parsedAttributes = {}; }
    }

    const variant = await ProductVariant.create({
      productId: parseInt(productId, 10),
      sku: finalSku,
      price: price === '' || price === undefined ? null : parseFloat(price),
      mrp: mrp === '' || mrp === undefined ? null : parseFloat(mrp),
      stock: stock === '' || stock === undefined ? 0 : parseInt(stock, 10),
      attributes: parsedAttributes,
      image: mainVarImg,
      images: galleryPaths,
    });

    // Sync warehouse stock at India warehouse level
    await syncWarehouseStock(variant.productId, variant.id, variant.stock);

    // Sync product price and stock
    await syncProductVariants(variant.productId);

    res.status(201).json({ success: true, variant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/variants/update/:id
const update = async (req, res) => {
  try {
    const variant = await ProductVariant.findByPk(req.params.id);
    if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });

    const { sku, price, mrp, stock, attributes } = req.body;

    if (price !== undefined && Number(price) < 0) return res.status(400).json({ success: false, message: 'Price cannot be negative' });
    if (stock !== undefined && Number(stock) < 0) return res.status(400).json({ success: false, message: 'Stock cannot be negative' });

    if (sku && sku.trim() !== variant.sku) {
      const conflict = await ProductVariant.findOne({ where: { sku: sku.trim(), id: { [Op.ne]: variant.id } } });
      if (conflict) {
        return res.status(400).json({ success: false, message: `SKU "${sku}" is already in use` });
      }
    }

    const updates = {
      ...(sku !== undefined && { sku: sku.trim() }),
      ...(price !== undefined && { price: price === '' ? null : parseFloat(price) }),
      ...(mrp !== undefined && { mrp: mrp === '' ? null : parseFloat(mrp) }),
      ...(stock !== undefined && { stock: stock === '' ? 0 : parseInt(stock, 10) }),
    };

    if (attributes !== undefined) {
      let parsedAttributes = attributes;
      if (typeof attributes === 'string') {
        try { parsedAttributes = JSON.parse(attributes); } catch (e) { parsedAttributes = {}; }
      }
      updates.attributes = parsedAttributes;
    }

    // Process file uploads
    if (req.files) {
      const mainFile = req.files.image ? req.files.image[0] : (req.files[0] || null);
      if (mainFile) {
        updates.image = buildImagePath(mainFile);
      }

      const galleryFiles = req.files.gallery || [];
      if (galleryFiles.length > 0) {
        updates.images = galleryFiles.map(file => buildImagePath(file)).filter(Boolean);
        if (!updates.image && updates.images.length > 0) {
          updates.image = updates.images[0];
        }
      }
    } else if (req.file) {
      updates.image = buildImagePath(req.file);
    }

    await variant.update(updates);

    if (stock !== undefined) {
      // Sync warehouse stock at India warehouse level
      await syncWarehouseStock(variant.productId, variant.id, variant.stock);
    }

    // Sync product price and stock
    await syncProductVariants(variant.productId);

    const fresh = await ProductVariant.findByPk(variant.id);
    res.json({ success: true, variant: fresh });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/variants/:id
const remove = async (req, res) => {
  try {
    const variant = await ProductVariant.findByPk(req.params.id);
    if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });

    const productId = variant.productId;

    // Destroy associated stock records
    await WarehouseStock.destroy({ where: { variantId: variant.id } });

    await variant.destroy();

    // Sync product price and stock
    await syncProductVariants(productId);

    res.json({ success: true, message: 'Variant deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getByProduct, add, update, remove, syncProductVariants, syncWarehouseStock };
