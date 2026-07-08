'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Wishlist = sequelize.define('Wishlist', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  productId: { type: DataTypes.INTEGER, allowNull: false },
}, {
  indexes: [{ unique: true, fields: ['customerId', 'productId'] }],
});

module.exports = Wishlist;
