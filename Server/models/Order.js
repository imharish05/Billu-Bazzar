'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderNumber: { type: DataTypes.STRING(30), unique: true, allowNull: false },
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  affiliateId: { type: DataTypes.INTEGER, allowNull: true },
  couponId: { type: DataTypes.INTEGER, allowNull: true },
  status: {
    type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'),
    defaultValue: 'PENDING',
  },
  paymentStatus: { type: DataTypes.ENUM('UNPAID', 'PAID', 'PARTIAL', 'REFUNDED'), defaultValue: 'UNPAID' },
  paymentMethod: { type: DataTypes.STRING(50) },
  paymentGatewayRef: { type: DataTypes.STRING(100) },
  subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  discountAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  shippingAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  taxAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  totalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  currency: { type: DataTypes.STRING(5), defaultValue: 'INR' },
  shippingAddress: { type: DataTypes.JSON, allowNull: false },
  billingAddress: { type: DataTypes.JSON },
  notes: { type: DataTypes.TEXT },
  trackingNumber: { type: DataTypes.STRING(80) },
  trackingUrl: { type: DataTypes.STRING(500) },
  shiprocketOrderId: { type: DataTypes.STRING(80) },
  estimatedDelivery: { type: DataTypes.DATE },
  deliveredAt: { type: DataTypes.DATE },
  isFraudFlagged: { type: DataTypes.BOOLEAN, defaultValue: false },
  invoicePath: { type: DataTypes.STRING(500) },
});

module.exports = Order;
