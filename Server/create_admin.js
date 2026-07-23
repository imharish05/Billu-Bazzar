'use strict';
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { AdminUser, Role } = require('./models');
const sequelize = require('./config/db');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    let [role] = await Role.findOrCreate({
      where: { name: 'ADMIN' },
      defaults: { permissions: JSON.stringify({ all: true }) }
    });

    const email = 'admin@billubazzar.com';
    const rawPassword = 'admin@2026';
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    let admin = await AdminUser.findOne({ where: { email } });
    if (admin) {
      await admin.update({
        password: hashedPassword,
        roleId: role.id,
        isActive: true,
        name: 'Super Admin'
      });
      console.log('SUCCESS: Admin user admin@billubazzar.com updated with password admin@2026!');
    } else {
      admin = await AdminUser.create({
        name: 'Super Admin',
        email,
        password: hashedPassword,
        roleId: role.id,
        isActive: true
      });
      console.log('SUCCESS: Admin user admin@billubazzar.com created successfully with password admin@2026!');
    }
  } catch (error) {
    console.error('ERROR creating admin user:', error);
  } finally {
    process.exit();
  }
}

createAdmin();
