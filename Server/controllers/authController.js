'use strict';
const bcrypt = require('bcryptjs');
const { signToken } = require('../config/jwt');
const { Customer, AdminUser } = require('../models');
const { v4: uuidv4 } = require('uuid');

// ── Customer Auth ─────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email, and password are required' });

    const exists = await Customer.findOne({ where: { email } });
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const referralCode = uuidv4().slice(0, 8).toUpperCase();
    const customer = await Customer.create({ name, email, password: hashed, phone, referralCode });

    const token = signToken({ id: customer.id, type: 'customer' });
    res.status(201).json({ success: true, token, customer: { id: customer.id, name: customer.name, email: customer.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const customer = await Customer.findOne({ where: { email } });
    if (!customer || !await bcrypt.compare(password, customer.password))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    if (!customer.isActive) return res.status(403).json({ success: false, message: 'Account suspended' });

    const token = signToken({ id: customer.id, type: 'customer' });
    res.json({ success: true, token, customer: { id: customer.id, name: customer.name, email: customer.email, avatar: customer.avatar, loyaltyPoints: customer.loyaltyPoints } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getProfile = async (req, res) => {
  res.json({ success: true, customer: req.customer });
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, whatsappOptIn } = req.body;
    await req.customer.update({ name, phone, address, whatsappOptIn });
    res.json({ success: true, customer: req.customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin Auth ────────────────────────────────────────────────────────────────
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await AdminUser.findOne({ where: { email }, include: [{ association: 'role' }] });
    if (!admin || !await bcrypt.compare(password, admin.password))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!admin.isActive) return res.status(403).json({ success: false, message: 'Account suspended' });

    await admin.update({ lastLogin: new Date() });
    const token = signToken({ id: admin.id, type: 'admin', role: admin.role.name });
    res.json({ success: true, token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role.name } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, getProfile, updateProfile, adminLogin };
