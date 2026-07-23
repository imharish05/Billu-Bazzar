'use strict';
const { SiteSetting } = require('../models');

const SETTING_KEY = 'gift_service';

const getGiftService = async (req, res) => {
  try {
    const setting = await SiteSetting.findOne({ where: { key: SETTING_KEY } });
    if (!setting) {
      return res.json({ success: true, giftService: null });
    }
    return res.json({ success: true, giftService: JSON.parse(setting.value) });
  } catch (err) {
    console.error('Error fetching gift service:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch gift service setting' });
  }
};

const createGiftService = async (req, res) => {
  try {
    let setting = await SiteSetting.findOne({ where: { key: SETTING_KEY } });
    if (setting) {
      return res.status(400).json({ success: false, message: 'Gift service already exists. Please edit or delete the existing service.' });
    }

    const { label, amount, description, isActive } = req.body;
    if (!label || amount === undefined || amount === null) {
      return res.status(400).json({ success: false, message: 'Label and Amount are required' });
    }

    const data = {
      id: 'gift_wrap_1',
      label: label.trim(),
      amount: Number(amount) || 0,
      description: (description || '').trim(),
      isActive: isActive !== false,
      updatedAt: new Date().toISOString()
    };

    setting = await SiteSetting.create({ key: SETTING_KEY, value: JSON.stringify(data) });
    return res.json({ success: true, giftService: data });
  } catch (err) {
    console.error('Error creating gift service:', err);
    return res.status(500).json({ success: false, message: 'Failed to create gift service setting' });
  }
};

const updateGiftService = async (req, res) => {
  try {
    let setting = await SiteSetting.findOne({ where: { key: SETTING_KEY } });
    if (!setting) {
      return res.status(404).json({ success: false, message: 'Gift service not found' });
    }

    const { label, amount, description, isActive } = req.body;
    const currentData = JSON.parse(setting.value || '{}');

    const updatedData = {
      ...currentData,
      label: label !== undefined ? label.trim() : currentData.label,
      amount: amount !== undefined ? Number(amount) : currentData.amount,
      description: description !== undefined ? description.trim() : currentData.description,
      isActive: isActive !== undefined ? Boolean(isActive) : currentData.isActive,
      updatedAt: new Date().toISOString()
    };

    await setting.update({ value: JSON.stringify(updatedData) });
    return res.json({ success: true, giftService: updatedData });
  } catch (err) {
    console.error('Error updating gift service:', err);
    return res.status(500).json({ success: false, message: 'Failed to update gift service setting' });
  }
};

const deleteGiftService = async (req, res) => {
  try {
    const setting = await SiteSetting.findOne({ where: { key: SETTING_KEY } });
    if (setting) {
      await setting.destroy();
    }
    return res.json({ success: true, message: 'Gift service deleted successfully' });
  } catch (err) {
    console.error('Error deleting gift service:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete gift service setting' });
  }
};

module.exports = {
  getGiftService,
  createGiftService,
  updateGiftService,
  deleteGiftService,
};
