'use strict';
const { Op } = require('sequelize');
const { Product, Category, SubCategory, SubSubCategory, Vendor, ProductVariant, Warehouse, WarehouseStock } = require('../models');
const { syncProductVariants, syncWarehouseStock } = require('./variantController');
const fs = require('fs');
const path = require('path');
const { materializeSpinSequence, deleteSpinSequence } = require('../services/spinSequenceService');

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

  // Cast values from FormData strings
  if (data.price !== undefined) data.price = data.price === '' ? null : parseFloat(data.price);
  if (data.comparePrice !== undefined) data.comparePrice = data.comparePrice === '' || data.comparePrice === 'null' ? null : parseFloat(data.comparePrice);
  if (data.stock !== undefined) data.stock = data.stock === '' ? 0 : parseInt(data.stock, 10);
  if (data.categoryId !== undefined) data.categoryId = data.categoryId === '' || data.categoryId === 'null' ? null : parseInt(data.categoryId, 10);
  if (data.subCategoryId !== undefined) data.subCategoryId = data.subCategoryId === '' || data.subCategoryId === 'null' ? null : parseInt(data.subCategoryId, 10);
  if (data.subSubCategoryId !== undefined) data.subSubCategoryId = data.subSubCategoryId === '' || data.subSubCategoryId === 'null' ? null : parseInt(data.subSubCategoryId, 10);
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
  const newSpinImages = [];

  if (req.files && Array.isArray(req.files)) {
    req.files.forEach(file => {
      const normalizedPath = file.path.replace(/\\/g, '/');
      const uploadsIndex = normalizedPath.indexOf('uploads');
      const pathString = '/' + normalizedPath.substring(uploadsIndex);

      if (file.fieldname === 'images') {
        newImages.push(pathString);
      } else if (file.fieldname === 'spin_images') {
        newSpinImages.push(pathString);
      }
    });
  }

  data.images = [...existingImages, ...newImages];
  delete data.existingImages;

  // Handle uploaded 360 spin images
  let existingSpinImages = [];
  if (data.existingSpinImages) {
    existingSpinImages = parseJsonField(data.existingSpinImages);
    if (!Array.isArray(existingSpinImages)) {
      existingSpinImages = typeof existingSpinImages === 'string' ? [existingSpinImages] : [];
    }
  } else if (data.spin_images) {
    existingSpinImages = parseJsonField(data.spin_images);
    if (!Array.isArray(existingSpinImages)) {
      existingSpinImages = [];
    }
  }

  data.spin_images = [...existingSpinImages, ...newSpinImages];
  delete data.existingSpinImages;

  return { data, existingImages, existingSpinImages };
};

const getAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, minPrice, maxPrice, sort = 'createdAt', order = 'DESC', featured, newArrival, bestSeller, vendorId, minDiscount, maxDiscount } = req.query;
    const where = { isActive: true };
    if (category) {
      if (isNaN(category)) {
        // Try Category
        let found = await Category.findOne({ where: { slug: category, isActive: true } });
        if (found) {
          where.categoryId = found.id;
        } else {
          // Try SubCategory
          found = await SubCategory.findOne({ where: { slug: category, isActive: true } });
          if (found) {
            where.subCategoryId = found.id;
          } else {
            // Try SubSubCategory
            found = await SubSubCategory.findOne({ where: { slug: category, isActive: true } });
            if (found) {
              where.subSubCategoryId = found.id;
            } else {
              where.categoryId = -1;
            }
          }
        }
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
    if (vendorId) where.vendorId = parseInt(vendorId, 10);

    if (minDiscount || maxDiscount) {
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push({
        comparePrice: { [Op.gt]: Product.sequelize.col('price') }
      });

      const discountFormula = Product.sequelize.literal('ROUND(((comparePrice - price) / comparePrice) * 100)');

      if (minDiscount) {
        where[Op.and].push(
          Product.sequelize.where(discountFormula, { [Op.gte]: parseInt(minDiscount, 10) })
        );
      }
      if (maxDiscount) {
        where[Op.and].push(
          Product.sequelize.where(discountFormula, { [Op.lte]: parseInt(maxDiscount, 10) })
        );
      }
    }

    const { count, rows } = await Product.findAndCountAll({
      where, limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit),
      order: [[sort, order]],
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: SubCategory, as: 'subcategory', attributes: ['id', 'name', 'slug'] },
        { model: SubSubCategory, as: 'subsubcategory', attributes: ['id', 'name', 'slug'] },
        { model: Vendor, as: 'vendor', attributes: ['id', 'name', 'logo'] },
        { model: ProductVariant, as: 'variants', attributes: ['id', 'sku', 'price', 'mrp', 'stock', 'attributes', 'image', 'images'] }
      ],
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
      include: [
        { model: Category, as: 'category' },
        { model: SubCategory, as: 'subcategory' },
        { model: SubSubCategory, as: 'subsubcategory' },
        { model: Vendor, as: 'vendor', attributes: ['id', 'name', 'rating'] },
        { model: ProductVariant, as: 'variants', attributes: ['id', 'sku', 'price', 'mrp', 'stock', 'attributes', 'image', 'images'] }
      ],
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

    const spinMeta = materializeSpinSequence(product.id, product.spin_images);
    await product.update(spinMeta);

    // Create variants if supplied in the request body
    if (req.body.variants) {
      let parsedVariants = [];
      try {
        parsedVariants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
      } catch (e) {
        parsedVariants = [];
      }

      if (Array.isArray(parsedVariants)) {
        for (let i = 0; i < parsedVariants.length; i++) {
          const v = parsedVariants[i];

          // Collect images uploaded for this variant
          const vGalleryFiles = req.files ? req.files.filter(f => f.fieldname === `variantGallery_${i}`) : [];
          const newGalleryPaths = vGalleryFiles.map(file => {
            const normalizedPath = file.path.replace(/\\/g, '/');
            const uploadsIndex = normalizedPath.indexOf('uploads');
            return '/' + normalizedPath.substring(uploadsIndex);
          });

          const mainVarImg = newGalleryPaths[0] || null;

          const variant = await ProductVariant.create({
            productId: product.id,
            sku: v.sku ? v.sku.trim() : `PV-${product.id}-${i}-${Date.now()}`,
            price: v.price === '' || v.price === undefined ? null : parseFloat(v.price),
            mrp: v.mrp === '' || v.mrp === undefined ? null : parseFloat(v.mrp),
            stock: v.stock === '' || v.stock === undefined ? 0 : parseInt(v.stock, 10),
            attributes: v.attributes || {},
            image: mainVarImg,
            images: newGalleryPaths,
          });

          // Sync stock to the primary fulfillment warehouse (India)
          await syncWarehouseStock(product.id, variant.id, variant.stock);
        }
        
        // Sync product stock and price with newly created variants
        await syncProductVariants(product.id);
      }
    } else {
      // If no variants are supplied, sync the product's own stock to the India Fulfillment Warehouse
      const primaryWh = await Warehouse.findOne({ where: { isFulfillment: true, isActive: true } });
      if (primaryWh) {
        const [ws, created] = await WarehouseStock.findOrCreate({
          where: { warehouseId: primaryWh.id, productId: product.id, variantId: null },
          defaults: { quantity: product.stock, reorderLevel: 10 }
        });
        if (!created) {
          await ws.update({ quantity: product.stock });
        }
      }
    }

    const freshProduct = await Product.findByPk(product.id, {
      include: [{ model: ProductVariant, as: 'variants' }]
    });

    res.status(201).json({ success: true, product: freshProduct });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const { data, existingImages, existingSpinImages } = processProductData(req);

    // Identify and delete removed files
    const oldImages = product.images || [];
    const removedImages = oldImages.filter(img => !existingImages.includes(img));
    removedImages.forEach(img => deleteLocalFile(img));

    // Identify and delete removed spin files
    const oldSpin = product.spin_images || [];
    const removedSpin = oldSpin.filter(img => !existingSpinImages.includes(img));
    removedSpin.forEach(img => deleteLocalFile(img));

    await product.update(data);

    const spinMeta = materializeSpinSequence(product.id, product.spin_images);
    await product.update(spinMeta);

    // Update variants if supplied
    if (req.body.variants) {
      let parsedVariants = [];
      try {
        parsedVariants = typeof req.body.variants === 'string' ? JSON.parse(req.body.variants) : req.body.variants;
      } catch (e) {
        parsedVariants = [];
      }

      if (Array.isArray(parsedVariants)) {
        const oldVariants = await ProductVariant.findAll({ where: { productId: product.id } });
        const oldVariantMap = new Map(oldVariants.map(v => [v.id, v]));
        const activeVariantIds = new Set();

        for (let i = 0; i < parsedVariants.length; i++) {
          const v = parsedVariants[i];
          
          // Process uploaded files for this variant
          const vGalleryFiles = req.files ? req.files.filter(f => f.fieldname === `variantGallery_${i}`) : [];
          const newGalleryPaths = vGalleryFiles.map(file => {
            const normalizedPath = file.path.replace(/\\/g, '/');
            const uploadsIndex = normalizedPath.indexOf('uploads');
            return '/' + normalizedPath.substring(uploadsIndex);
          });

          // Concat existing variant images and new uploads
          const existingGallery = v.images ? (typeof v.images === 'string' ? JSON.parse(v.images) : v.images) : [];
          const vImages = [...existingGallery, ...newGalleryPaths];
          const mainVarImg = v.image || vImages[0] || null;

          let existingVariant = null;
          if (v.id && oldVariantMap.has(parseInt(v.id, 10))) {
            existingVariant = oldVariantMap.get(parseInt(v.id, 10));
          }

          if (existingVariant) {
            await existingVariant.update({
              sku: v.sku ? v.sku.trim() : existingVariant.sku,
              price: v.price === '' || v.price === undefined ? null : parseFloat(v.price),
              mrp: v.mrp === '' || v.mrp === undefined ? null : parseFloat(v.mrp),
              stock: v.stock === '' || v.stock === undefined ? 0 : parseInt(v.stock, 10),
              attributes: v.attributes || {},
              image: mainVarImg,
              images: vImages,
            });
            activeVariantIds.add(existingVariant.id);
            await syncWarehouseStock(product.id, existingVariant.id, existingVariant.stock);
          } else {
            const newVar = await ProductVariant.create({
              productId: product.id,
              sku: v.sku ? v.sku.trim() : `PV-${product.id}-${i}-${Date.now()}`,
              price: v.price === '' || v.price === undefined ? null : parseFloat(v.price),
              mrp: v.mrp === '' || v.mrp === undefined ? null : parseFloat(v.mrp),
              stock: v.stock === '' || v.stock === undefined ? 0 : parseInt(v.stock, 10),
              attributes: v.attributes || {},
              image: mainVarImg,
              images: vImages,
            });
            activeVariantIds.add(newVar.id);
            await syncWarehouseStock(product.id, newVar.id, newVar.stock);
          }
        }

        // Delete variants that were removed
        const deletedVariants = oldVariants.filter(ov => !activeVariantIds.has(ov.id));
        for (const dv of deletedVariants) {
          await WarehouseStock.destroy({ where: { variantId: dv.id } });
          await dv.destroy();
        }

        // Sync parent product price and total stock
        await syncProductVariants(product.id);
      }
    } else {
      // If no variants are supplied, sync the product's own stock to the India Fulfillment Warehouse
      const primaryWh = await Warehouse.findOne({ where: { isFulfillment: true, isActive: true } });
      if (primaryWh) {
        const [ws, created] = await WarehouseStock.findOrCreate({
          where: { warehouseId: primaryWh.id, productId: product.id, variantId: null },
          defaults: { quantity: product.stock, reorderLevel: 10 }
        });
        if (!created) {
          await ws.update({ quantity: product.stock });
        }
      }
    }

    const freshProduct = await Product.findByPk(product.id, {
      include: [{ model: ProductVariant, as: 'variants' }]
    });

    res.json({ success: true, product: freshProduct });
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
    deleteSpinSequence(id);
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

const getPriceRange = async (req, res) => {
  try {
    const { sequelize } = require('../models');
    const [[result]] = await sequelize.query(
      'SELECT COALESCE(MIN(price), 0) AS minPrice, COALESCE(MAX(price), 50000) AS maxPrice FROM Products WHERE isActive = 1'
    );
    res.json({
      success: true,
      minPrice: Number(result.minPrice),
      maxPrice: Number(result.maxPrice),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove, getFeatured, search, getPriceRange };