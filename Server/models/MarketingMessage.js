'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MarketingMessage = sequelize.define('MarketingMessage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  message: { type: DataTypes.STRING(500), allowNull: false },
  position: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

module.exports = MarketingMessage;
