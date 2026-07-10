'use strict';
const { Affiliate, Order, Customer } = require('../models');
const fs = require('fs');
const path = require('path');

// Helper to delete local file
const deleteLocalFile = (imagePath) => {
  if (imagePath && imagePath.startsWith('/uploads/')) {
    const localPath = path.join(__dirname, '..', imagePath.substring(1)); // strip leading slash
    try {
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        console.log(`[Upload] Deleted local affiliate file: ${localPath}`);
      }
    } catch (err) {
      console.error(`[Upload] Error deleting local affiliate file: ${err.message}`);
    }
  }
};

const getAll = async (req, res) => {
  try {
    const affiliates = await Affiliate.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, affiliates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const affiliate = await Affiliate.findByPk(req.params.id, {
      include: [{ model: Order, as: 'orders', include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'email'] }] }],
    });
    if (!affiliate) return res.status(404).json({ success: false, message: 'Affiliate not found' });
    res.json({ success: true, affiliate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      const normalizedPath = req.file.path.replace(/\\/g, '/');
      const uploadsIndex = normalizedPath.indexOf('uploads');
      data.avatar = '/' + normalizedPath.substring(uploadsIndex);
    }
    if (data.isActive !== undefined) {
      data.isActive = data.isActive === 'true' || data.isActive === true;
    }
    if (data.commissionRate !== undefined) {
      data.commissionRate = parseFloat(data.commissionRate) || 5.0;
    }

    const affiliate = await Affiliate.create(data);
    res.status(201).json({ success: true, affiliate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const affiliate = await Affiliate.findByPk(req.params.id);
    if (!affiliate) return res.status(404).json({ success: false, message: 'Affiliate not found' });
    
    const data = { ...req.body };
    if (req.file) {
      deleteLocalFile(affiliate.avatar);
      const normalizedPath = req.file.path.replace(/\\/g, '/');
      const uploadsIndex = normalizedPath.indexOf('uploads');
      data.avatar = '/' + normalizedPath.substring(uploadsIndex);
    }
    if (data.isActive !== undefined) {
      data.isActive = data.isActive === 'true' || data.isActive === true;
    }
    if (data.commissionRate !== undefined) {
      data.commissionRate = parseFloat(data.commissionRate) || 5.0;
    }

    await affiliate.update(data);
    res.json({ success: true, affiliate });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const affiliate = await Affiliate.findByPk(req.params.id);
    if (!affiliate) return res.status(404).json({ success: false, message: 'Affiliate not found' });
    
    deleteLocalFile(affiliate.avatar);
    await affiliate.destroy();
    res.json({ success: true, message: 'Affiliate permanently deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { affiliateId: req.params.id },
      include: [{ model: Customer, as: 'customer', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
    });
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    res.json({ success: true, orders, totalRevenue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove, getOrders };
