'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderId: { type: DataTypes.INTEGER, allowNull: false },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  productName: { type: DataTypes.STRING(200), allowNull: false }, // snapshot at order time
  productImage: { type: DataTypes.STRING(500) },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  totalPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  selectedVariant: { type: DataTypes.JSON, defaultValue: {} },
  returnStatus: { type: DataTypes.ENUM('NONE', 'REQUESTED', 'APPROVED', 'COMPLETED'), defaultValue: 'NONE' },
});

module.exports = OrderItem;
