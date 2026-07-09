'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  slug: { type: DataTypes.STRING(220), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
  shortDescription: { type: DataTypes.STRING(300) },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  comparePrice: { type: DataTypes.DECIMAL(10, 2) },
  currency: { type: DataTypes.STRING(5), defaultValue: 'INR' },
  sku: { type: DataTypes.STRING(80), unique: true },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  categoryId: { type: DataTypes.INTEGER, allowNull: false },
  vendorId: { type: DataTypes.INTEGER },
  images: { type: DataTypes.JSON, defaultValue: [] },         // array of image URLs
  // 360-degree spin image frames (array of ordered URLs)
  spin_images: { type: DataTypes.JSON, defaultValue: [] },
  // 3D model URL for AR/model-viewer (nullable — not all products have 3D models)
  model_3d_url: { type: DataTypes.STRING(500), allowNull: true },
  tags: { type: DataTypes.JSON, defaultValue: [] },
  attributes: { type: DataTypes.JSON, defaultValue: {} },     // color, size, fabric etc.
  isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
  isNewArrival: { type: DataTypes.BOOLEAN, defaultValue: false },
  isBestSeller: { type: DataTypes.BOOLEAN, defaultValue: false },
  rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 4.0 },
  reviewCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  weight: { type: DataTypes.DECIMAL(8, 2) },
  dimensions: { type: DataTypes.JSON },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  seoDescription: { type: DataTypes.STRING(300) },
  discountPercent: {
    type: DataTypes.VIRTUAL,
    get() {
      const price = parseFloat(this.getDataValue('price'));
      const comparePrice = parseFloat(this.getDataValue('comparePrice'));
      if (comparePrice && comparePrice > price) {
        return Math.round(((comparePrice - price) / comparePrice) * 100);
      }
      return 0;
    }
  },
});

Product.afterCreate(async (product, options) => {
  try {
    const { syncProductKeywords } = require('../services/searchSyncService');
    await syncProductKeywords(product);
  } catch (err) {
    console.error('[ProductHook] Error in afterCreate hook:', err.message);
  }
});

Product.afterUpdate(async (product, options) => {
  try {
    const { syncProductKeywords } = require('../services/searchSyncService');
    await syncProductKeywords(product);
  } catch (err) {
    console.error('[ProductHook] Error in afterUpdate hook:', err.message);
  }
});

module.exports = Product;
