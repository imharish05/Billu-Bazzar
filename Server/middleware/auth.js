'use strict';
const { verifyToken } = require('../config/jwt');
const { Customer, AdminUser } = require('../models');

/**
 * verifyCustomer — validates JWT from Authorization header for customer routes
 */
const verifyCustomer = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const customer = await Customer.findByPk(decoded.id);
    if (!customer || !customer.isActive)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    req.customer = customer;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * verifyAdmin — validates JWT for admin routes
 */
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const admin = await AdminUser.findByPk(decoded.id, { include: [{ association: 'role' }] });
    if (!admin || !admin.isActive)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports = { verifyCustomer, verifyAdmin };
