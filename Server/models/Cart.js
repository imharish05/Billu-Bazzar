'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Cart = sequelize.define('Cart', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerId: { type: DataTypes.INTEGER, allowNull: true, unique: true },
  sessionId: { type: DataTypes.STRING(100), allowNull: true },  // guest carts session token
  couponId: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'Carts',
  timestamps: true,
});

module.exports = Cart;
