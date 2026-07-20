'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const InventoryMovementLog = sequelize.define('InventoryMovementLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  variantId: { type: DataTypes.INTEGER, allowNull: true },
  orderId: { type: DataTypes.INTEGER, allowNull: true },
  quantity: { type: DataTypes.INTEGER, allowNull: false }, // Negative for sales/deductions, Positive for restock/returns
  type: {
    type: DataTypes.ENUM('ORDER_DEDUCTION', 'ORDER_CANCEL_RESTOCK', 'MANUAL_ADJUSTMENT', 'RETURN_RESTOCK', 'REFUND_OOS'),
    allowNull: false
  },
  reason: { type: DataTypes.TEXT },
  adminUserId: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'InventoryMovementLogs',
  timestamps: true,
  indexes: [
    { fields: ['productId'] },
    { fields: ['variantId'] },
    { fields: ['orderId'] }
  ]
});

module.exports = InventoryMovementLog;
