'use strict';
require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/db');
const seedAll = require('./seeders');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const start = async () => {
  try {
    // 1. Authenticate DB connection
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // 2. Sync all models (safe — doesn't drop data)
    await sequelize.sync();
    console.log('✅ Models synced');

    // Run manual database alters for Banners table to support EXCLUSIVE_DEAL and optional title
    try {
      await sequelize.query("ALTER TABLE Banners MODIFY COLUMN type ENUM('HERO', 'PROMO', 'DEAL', 'EXCLUSIVE_DEAL', 'BRAND', 'COUNTDOWN') DEFAULT 'PROMO'");
      await sequelize.query("ALTER TABLE Banners MODIFY COLUMN title VARCHAR(200) NULL");
      console.log('✅ Banners table column definitions updated');
    } catch (alterErr) {
      console.log('⚠️ Manual alter note (already altered or table not synced yet):', alterErr.message);
    }

    // Run manual database alters for Orders table to support new OOS & Razorpay status flows
    try {
      await sequelize.query("ALTER TABLE Orders MODIFY COLUMN status ENUM('PENDING_PAYMENT', 'PAID', 'PAYMENT_RECEIVED_STOCK_FAILED', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED', 'EXPIRED') DEFAULT 'PENDING_PAYMENT'");
      console.log('✅ Orders table status column definition updated');
    } catch (alterErr) {
      console.log('⚠️ Manual alter note (status already updated):', alterErr.message);
    }

    try {
      await sequelize.query("ALTER TABLE Orders ADD COLUMN sessionId VARCHAR(100) NULL");
      await sequelize.query("ALTER TABLE Orders ADD COLUMN razorpay_payment_id VARCHAR(100) NULL UNIQUE");
      await sequelize.query("ALTER TABLE Orders ADD COLUMN razorpay_order_id VARCHAR(100) NULL UNIQUE");
      await sequelize.query("ALTER TABLE Orders ADD COLUMN razorpay_signature VARCHAR(255) NULL");
      await sequelize.query("ALTER TABLE Orders ADD COLUMN inventoryProcessed BOOLEAN NOT NULL DEFAULT FALSE");
      console.log('✅ Orders table Razorpay columns added');
    } catch (alterErr) {
      console.log('⚠️ Manual alter note (Orders columns already exist):', alterErr.message);
    }

    // Run manual database alters for CartItems and OrderItems to support variantId snapshot
    try {
      await sequelize.query("ALTER TABLE CartItems ADD COLUMN variantId INT NULL");
      console.log('✅ CartItems table variantId column added');
    } catch (alterErr) {
      console.log('⚠️ Manual alter note (CartItems columns already exist):', alterErr.message);
    }

    try {
      await sequelize.query("ALTER TABLE OrderItems ADD COLUMN variantId INT NULL");
      console.log('✅ OrderItems table variantId column added');
    } catch (alterErr) {
      console.log('⚠️ Manual alter note (OrderItems columns already exist):', alterErr.message);
    }

    // Run manual database alters for Carts table to allow guest checkout customerId relaxation
    try {
      await sequelize.query("ALTER TABLE Carts ADD COLUMN sessionId VARCHAR(100) NULL");
      await sequelize.query("ALTER TABLE Carts MODIFY COLUMN customerId INT NULL");
      console.log('✅ Carts table session columns updated');
    } catch (alterErr) {
      console.log('⚠️ Manual alter note (Carts columns already exist):', alterErr.message);
    }

    // Manual alter to add react-360-view materialized frame columns to existing Products tables
    try {
      await sequelize.query("ALTER TABLE Products ADD COLUMN spinImagePath VARCHAR(300) NULL");
      await sequelize.query("ALTER TABLE Products ADD COLUMN spinImageCount INT NOT NULL DEFAULT 0");
      await sequelize.query("ALTER TABLE Products ADD COLUMN spinImageExt VARCHAR(10) NOT NULL DEFAULT 'jpg'");
      console.log('✅ Products table spin-sequence columns added');
    } catch (alterErr) {
      console.log('⚠️ Manual alter note (already altered or table not synced yet):', alterErr.message);
    }

    // Manual alter to add subCategory and subSubCategory columns to Products table
    try {
      await sequelize.query("ALTER TABLE Products ADD COLUMN subCategoryId INT NULL");
      await sequelize.query("ALTER TABLE Products ADD COLUMN subSubCategoryId INT NULL");
      console.log('✅ Products table sub-category columns added');
    } catch (alterErr) {
      console.log('⚠️ Manual alter note (already altered or table not synced yet):', alterErr.message);
    }

    // Migrate any legacy 'DEAL' banners to 'EXCLUSIVE_DEAL'
    try {
      await sequelize.query("UPDATE Banners SET type = 'EXCLUSIVE_DEAL' WHERE type = 'DEAL'");
      console.log('✅ Migrated legacy DEAL banners to EXCLUSIVE_DEAL');
    } catch (migErr) {
      console.log('⚠️ Migration note (or already migrated):', migErr.message);
    }

    // 2.5 Run search keywords sync if empty
    const { syncAllExisting } = require('./services/searchSyncService');
    await syncAllExisting();

    // 2.6 Fix any empty or null product slugs in the database
    try {
      const { Op } = require('sequelize');
      const { Product } = require('./models');
      const productsWithEmptySlugs = await Product.findAll({
        where: {
          [Op.or]: [
            { slug: '' },
            { slug: { [Op.is]: null } }
          ]
        }
      });
      for (const p of productsWithEmptySlugs) {
        const generatedSlug = p.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        
        let finalSlug = generatedSlug;
        let count = 1;
        while (await Product.findOne({ where: { slug: finalSlug } })) {
          finalSlug = `${generatedSlug}-${count}`;
          count++;
        }
        
        await p.update({ slug: finalSlug });
        console.log(`✅ Fixed empty slug for product "${p.name}" -> "${finalSlug}"`);
      }
    } catch (slugErr) {
      console.log('⚠️ Failed to sync empty product slugs:', slugErr.message);
    }

    // 3. Run seeders if tables are empty
    await seedAll();

    // 3.5 Load background cron jobs
    require('./jobs/reminderJob');
    require('./jobs/searchJob');
    require('./jobs/orderExpiryJob');

    // 4. Start server
    app.listen(PORT, () => {
      console.log(`🚀 Billu Bazaar API running at http://localhost:${PORT}`);
      console.log(`   Client: ${process.env.CLIENT_URL}`);
      console.log(`   Admin:  ${process.env.ADMIN_URL}`);
    });
  } catch (err) {
    console.error('❌ Server startup failed:', err);
    process.exit(1);
  }
};

start();