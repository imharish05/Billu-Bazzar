'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Wishlist = sequelize.define('Wishlist', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  variantId: { type: DataTypes.INTEGER, allowNull: true },
  selectedVariant: { type: DataTypes.JSON, defaultValue: {} },
}, {
  indexes: [{ unique: true, fields: ['customerId', 'productId', 'variantId'] }],
});

module.exports = Wishlist;
