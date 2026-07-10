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

    // 3. Run seeders if tables are empty
    await seedAll();

    // 3.5 Load background cron jobs
    require('./jobs/reminderJob');
    require('./jobs/searchJob');

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
