'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AdminUser = sequelize.define('AdminUser', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(180), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  roleId: { type: DataTypes.INTEGER, allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  lastLogin: { type: DataTypes.DATE },
  avatar: { type: DataTypes.STRING(500) },
});

module.exports = AdminUser;
