'use strict';
const sequelize = require('../config/db');
const { Product, Category } = require('../models');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('DB Connection successful.');

    // Fetch a category to use
    const category = await Category.findOne();
    if (!category) {
      console.log('No categories found. Run seeders first.');
      return;
    }

    console.log(`Using category: ${category.name} (id: ${category.id})`);

    // Attempt to create a simple product
    const product = await Product.create({
      name: 'Test Product ' + Date.now(),
      description: 'Test Description',
      price: 99.99,
      categoryId: category.id,
      stock: 10,
      sku: 'TEST-' + Date.now(),
    });

    console.log('Product created successfully:', product.id, product.name, product.slug);
  } catch (error) {
    console.error('Error creating product:', error);
  } finally {
    await sequelize.close();
  }
}

test();
