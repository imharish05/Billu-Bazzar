'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Banner = sequelize.define('Banner', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  subtitle: { type: DataTypes.STRING(300) },
  ctaText: { type: DataTypes.STRING(80) },
  ctaLink: { type: DataTypes.STRING(300) },
  image: { type: DataTypes.STRING(500), allowNull: false },
  mobileImage: { type: DataTypes.STRING(500) },
  type: { type: DataTypes.ENUM('HERO', 'PROMO', 'DEAL', 'BRAND', 'COUNTDOWN'), defaultValue: 'PROMO' },
  position: { type: DataTypes.INTEGER, defaultValue: 0 },
  badgeText: { type: DataTypes.STRING(50) },  // e.g. "40% OFF"
  countdown: { type: DataTypes.DATE },         // for countdown banners
  bgColor: { type: DataTypes.STRING(30) },
  textColor: { type: DataTypes.STRING(30) },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  validFrom: { type: DataTypes.DATE },
  validUntil: { type: DataTypes.DATE },
});

module.exports = Banner;
