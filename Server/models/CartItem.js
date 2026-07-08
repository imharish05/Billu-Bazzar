'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CartItem = sequelize.define('CartItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  cartId: { type: DataTypes.INTEGER, allowNull: false },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  selectedVariant: { type: DataTypes.JSON, defaultValue: {} }, // { size, color }
  priceAtAdd: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
});

module.exports = CartItem;
