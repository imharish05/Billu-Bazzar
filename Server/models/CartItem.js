'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CartItem = sequelize.define('CartItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  cartId: { type: DataTypes.INTEGER, allowNull: false },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  variantId: { type: DataTypes.INTEGER, allowNull: true }, // links to ProductVariant if applicable
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  selectedVariant: { type: DataTypes.JSON, defaultValue: {} }, // { size, color } snapshot
  priceAtAdd: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
}, {
  tableName: 'CartItems',
  timestamps: true,
});

module.exports = CartItem;
