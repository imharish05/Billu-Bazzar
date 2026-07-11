'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SubCategory = sequelize.define('SubCategory', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  categoryId:  { type: DataTypes.INTEGER, allowNull: false },
  name:        { type: DataTypes.STRING(100), allowNull: false },
  slug:        { type: DataTypes.STRING(120), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT },
  image:       { type: DataTypes.STRING(500) },
  sortOrder:   { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive:    { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'SubCategories' });

module.exports = SubCategory;
