'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TrendingCache = sequelize.define('TrendingCache', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  data: { type: DataTypes.JSON, allowNull: false },
});

module.exports = TrendingCache;
