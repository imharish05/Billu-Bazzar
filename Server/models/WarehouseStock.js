'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const WarehouseStock = sequelize.define('WarehouseStock', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  warehouseId: { type: DataTypes.INTEGER, allowNull: false },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  reservedQty: { type: DataTypes.INTEGER, defaultValue: 0 },
  reorderLevel: { type: DataTypes.INTEGER, defaultValue: 10 },
});

module.exports = WarehouseStock;
