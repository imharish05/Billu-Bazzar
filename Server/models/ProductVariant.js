'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProductVariant = sequelize.define('ProductVariant', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Products', key: 'id' },
    onDelete: 'CASCADE'
  },
  sku: { type: DataTypes.STRING(80), unique: true, allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  stock: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
  attributes: { type: DataTypes.JSON, defaultValue: {} } // e.g. { "size": "M", "color": "Blue" }
}, {
  tableName: 'ProductVariants',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['productId', 'sku'] }
  ]
});

module.exports = ProductVariant;
