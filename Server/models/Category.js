'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
  image: { type: DataTypes.STRING(500) },
  parentId: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
  // JSON field for dynamic category attributes (e.g. fabric, occasion, fit)
  attributes: { type: DataTypes.JSON, defaultValue: [] },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

module.exports = Category;
