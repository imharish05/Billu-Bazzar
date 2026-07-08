'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');

const app = express();

// ── Security & Logging ────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [process.env.CLIENT_URL, process.env.ADMIN_URL],
  credentials: true,
}));

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static Uploads ─────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/authRoutes'));
app.use('/api/products',   require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/orders',     require('./routes/orderRoutes'));
app.use('/api/cart',       require('./routes/cartRoutes'));
app.use('/api/banners',    require('./routes/bannerRoutes'));
app.use('/api/customers',  require('./routes/customerRoutes'));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;
