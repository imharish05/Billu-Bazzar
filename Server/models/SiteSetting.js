'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SiteSetting = sequelize.define('SiteSetting', {
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    primaryKey: true,
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

module.exports = SiteSetting;
