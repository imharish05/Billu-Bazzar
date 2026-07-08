'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Cart = sequelize.define('Cart', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  sessionId: { type: DataTypes.STRING(100) },  // guest carts
  couponId: { type: DataTypes.INTEGER, allowNull: true },
});

module.exports = Cart;
