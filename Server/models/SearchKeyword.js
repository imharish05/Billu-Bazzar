'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SearchKeyword = sequelize.define('SearchKeyword', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  keyword: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  search_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  search_count_today: { type: DataTypes.INTEGER, defaultValue: 0 },
  search_count_week: { type: DataTypes.INTEGER, defaultValue: 0 },
  trending_score: { type: DataTypes.FLOAT, defaultValue: 0.0 },
  last_searched_at: { type: DataTypes.DATE },
  category_id: { type: DataTypes.INTEGER, allowNull: true },
  type: { type: DataTypes.ENUM('product', 'category', 'brand'), defaultValue: 'product' },
  is_trending: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  indexes: [
    { unique: true, fields: ['keyword'] },
  ]
});

module.exports = SearchKeyword;
