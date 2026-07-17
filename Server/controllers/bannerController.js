'use strict';
const { Banner } = require('../models');
const fs = require('fs');
const path = require('path');

const handleDBError = (err, res, type = 'item') => {
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ success: false, message: `A ${type} with this name or slug already exists.` });
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ success: false, message: 'Foreign key constraint fails. Please verify that all parent links are valid.' });
  }
  if (err.name === 'SequelizeValidationError') {
    const msg = err.errors.map(e => e.message).join(', ');
    return res.status(400).json({ success: false, message: msg });
  }
  return res.status(500).json({ success: false, message: err.message });
};

// Helper to delete local file
const deleteLocalFile = (imagePath) => {
  if (imagePath && imagePath.startsWith('/uploads/')) {
    const localPath = path.join(__dirname, '..', imagePath.substring(1)); // strip leading slash
    try {
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        console.log(`[Upload] Deleted local file: ${localPath}`);
      }
    } catch (err) {
      console.error(`[Upload] Error deleting local file: ${err.message}`);
    }
  }
};

const getAll = async (req, res) => {
  try {
    const { type, all } = req.query;

    // Auto-deactivate expired countdown banners in the database
    const { Op } = require('sequelize');
    const now = new Date();
    const expiredBanners = await Banner.findAll({
      where: {
        isActive: true,
        countdown: {
          [Op.ne]: null,
          [Op.lt]: now
        }
      }
    });

    if (expiredBanners.length > 0) {
      for (const banner of expiredBanners) {
        banner.isActive = false;
        await banner.save();
        console.log(`[Banner Auto-deactivate] Deactivated expired banner ID ${banner.id} (type: ${banner.type}, countdown: ${banner.countdown})`);
      }
    }

    const where = {};
    if (!all) where.isActive = true;
    if (type) where.type = type;
    const banners = await Banner.findAll({ where, order: [['position', 'ASC']] });
    res.json({ success: true, banners });
  } catch (err) {
    return handleDBError(err, res, 'banner');
  }
};

const create = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.type === 'COUNTDOWN') {
      const existing = await Banner.findOne({ where: { type: 'COUNTDOWN' } });
      if (existing) {
        if (req.file) {
          try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
        return res.status(400).json({ success: false, message: 'A countdown banner already exists. Please edit the existing one instead.' });
      }
    }
    if (req.file) {
      const normalizedPath = req.file.path.replace(/\\/g, '/');
      const uploadsIndex = normalizedPath.indexOf('uploads');
      data.image = '/' + normalizedPath.substring(uploadsIndex);
    }
    const banner = await Banner.create(data);
    res.status(201).json({ success: true, banner });
  } catch (err) {
    return handleDBError(err, res, 'banner');
  }
};

const update = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) {
      if (req.file) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }
    const data = { ...req.body };
    if (data.type === 'COUNTDOWN' && banner.type !== 'COUNTDOWN') {
      const { Op } = require('sequelize');
      const existing = await Banner.findOne({ where: { type: 'COUNTDOWN', id: { [Op.ne]: banner.id } } });
      if (existing) {
        if (req.file) {
          try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
        return res.status(400).json({ success: false, message: 'A countdown banner already exists. Please edit the existing one instead.' });
      }
    }
    if (req.file) {
      deleteLocalFile(banner.image);
      const normalizedPath = req.file.path.replace(/\\/g, '/');
      const uploadsIndex = normalizedPath.indexOf('uploads');
      data.image = '/' + normalizedPath.substring(uploadsIndex);
    }
    await banner.update(data);
    res.json({ success: true, banner });
  } catch (err) {
    return handleDBError(err, res, 'banner');
  }
};

const remove = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    deleteLocalFile(banner.image);
    await banner.destroy();
    res.json({ success: true, message: 'Banner deleted' });
  } catch (err) {
    return handleDBError(err, res, 'banner');
  }
};

module.exports = { getAll, create, update, remove };
