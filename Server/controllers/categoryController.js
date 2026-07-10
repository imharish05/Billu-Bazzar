'use strict';
const { Category, Product, sequelize } = require('../models');
const fs = require('fs');
const path = require('path');

// Helper to delete local file
const deleteLocalFile = (imagePath) => {
  if (imagePath && imagePath.startsWith('/uploads/')) {
    const localPath = path.join(__dirname, '..', imagePath.substring(1)); // strip leading slash
    try {
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        console.log(`[Upload] Deleted local category file: ${localPath}`);
      }
    } catch (err) {
      console.error(`[Upload] Error deleting local category file: ${err.message}`);
    }
  }
};

const getTree = async (req, res) => {
  try {
    const { all } = req.query;
    const where = {};
    if (!all) where.isActive = true;
    const categoriesList = await Category.findAll({ where, order: [['sortOrder', 'ASC']] });
    const tree = categoriesList.filter(c => !c.parentId).map(parent => ({
      ...parent.toJSON(),
      children: categoriesList.filter(c => c.parentId === parent.id).map(c => c.toJSON()),
    }));
    res.json({ success: true, categories: tree });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAll = async (req, res) => {
  try {
    const { all } = req.query;
    const where = {};
    if (!all) where.isActive = true;
    const categories = await Category.findAll({
      where,
      attributes: { exclude: ['parentId', 'attributes', 'description'] },
      order: [['sortOrder', 'ASC']]
    });
    res.json({ success: true, categories });
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
      data.image = '/' + normalizedPath.substring(uploadsIndex);
    }
    // Cast parentId and isActive from FormData strings
    if (data.parentId === '' || data.parentId === 'null' || data.parentId === 'undefined') {
      data.parentId = null;
    }
    if (data.isActive !== undefined) {
      data.isActive = data.isActive === 'true' || data.isActive === true;
    }
    if (data.showHeader !== undefined) {
      data.showHeader = data.showHeader === 'true' || data.showHeader === true;
    }
    const category = await Category.create(data);
    res.status(201).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    
    const data = { ...req.body };
    if (req.file) {
      deleteLocalFile(category.image);
      const normalizedPath = req.file.path.replace(/\\/g, '/');
      const uploadsIndex = normalizedPath.indexOf('uploads');
      data.image = '/' + normalizedPath.substring(uploadsIndex);
    }
    // Cast parentId and isActive from FormData strings
    if (data.parentId === '' || data.parentId === 'null' || data.parentId === 'undefined') {
      data.parentId = null;
    }
    if (data.isActive !== undefined) {
      data.isActive = data.isActive === 'true' || data.isActive === true;
    }
    if (data.showHeader !== undefined) {
      data.showHeader = data.showHeader === 'true' || data.showHeader === true;
    }
    
    await category.update(data);
    res.json({ success: true, category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id, { transaction });
    if (!category) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // 1. Gather all categories to delete
    let categoryIdsToDelete = [category.id];
    let subCategoriesCount = 0;
    
    if (!category.parentId) {
      // It's a parent category: find all subcategories
      const subCategories = await Category.findAll({
        where: { parentId: category.id },
        attributes: ['id'],
        transaction
      });
      const subIds = subCategories.map(c => c.id);
      categoryIdsToDelete = [...categoryIdsToDelete, ...subIds];
      subCategoriesCount = subIds.length;
    }

    // 2. Gather all products to delete
    const products = await Product.findAll({
      where: { categoryId: categoryIdsToDelete },
      attributes: ['id', 'name'],
      transaction
    });
    const productIds = products.map(p => p.id);

    // 3. Perform the cascading deletion in database
    if (productIds.length > 0) {
      const { WarehouseStock, CartItem, Wishlist, Review, StockAlert, OrderItem } = require('../models');

      // Delete associated tables for products including order history
      await WarehouseStock.destroy({ where: { productId: productIds }, transaction });
      await CartItem.destroy({ where: { productId: productIds }, transaction });
      await Wishlist.destroy({ where: { productId: productIds }, transaction });
      await Review.destroy({ where: { productId: productIds }, transaction });
      await StockAlert.destroy({ where: { productId: productIds }, transaction });
      await OrderItem.destroy({ where: { productId: productIds }, transaction });

      // Delete products
      await Product.destroy({ where: { id: productIds }, transaction });
    }

    // Delete SearchKeyword entries referring to the categories
    const { SearchKeyword } = require('../models');
    await SearchKeyword.destroy({ where: { category_id: categoryIdsToDelete }, transaction });

    // Delete categories (child subcategories first, then the parent)
    if (subCategoriesCount > 0) {
      await Category.destroy({ where: { parentId: category.id }, transaction });
    }
    await Category.destroy({ where: { id: category.id }, transaction });

    await transaction.commit();

    const label = category.parentId ? 'Sub-category' : 'Category';
    res.json({
      success: true,
      message: `${label} and its associated items have been deleted successfully.`
    });

  } catch (err) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTree, getAll, create, update, remove };
