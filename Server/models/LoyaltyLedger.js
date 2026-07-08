'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const LoyaltyLedger = sequelize.define('LoyaltyLedger', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('EARN', 'REDEEM', 'EXPIRE', 'BONUS'), allowNull: false },
  points: { type: DataTypes.INTEGER, allowNull: false },
  balance: { type: DataTypes.INTEGER, allowNull: false },
  description: { type: DataTypes.STRING(200) },
  orderId: { type: DataTypes.INTEGER, allowNull: true },
  expiresAt: { type: DataTypes.DATE },
});

module.exports = LoyaltyLedger;
