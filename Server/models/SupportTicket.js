'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SupportTicket = sequelize.define('SupportTicket', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  orderId: { type: DataTypes.INTEGER, allowNull: true },
  subject: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  status: {
    type: DataTypes.ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'),
    defaultValue: 'OPEN',
  },
  priority: { type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'), defaultValue: 'MEDIUM' },
  category: { type: DataTypes.STRING(80) },
  messages: { type: DataTypes.JSON, defaultValue: [] }, // thread of messages
  assignedTo: { type: DataTypes.INTEGER, allowNull: true }, // AdminUser id
  resolvedAt: { type: DataTypes.DATE },
});

module.exports = SupportTicket;
