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

    // 2. Sync all models (alter: safe — doesn't drop data)
    await sequelize.sync({ alter: true });
    console.log('✅ Models synced');

    // 3. Run seeders if tables are empty
    await seedAll();

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
