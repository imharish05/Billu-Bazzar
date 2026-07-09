'use strict';

const syncProductKeywords = async (product) => {
  try {
    const { SearchKeyword, Category } = require('../models');
    const keywords = [];
    
    // Add product name
    if (product.name) {
      keywords.push({
        keyword: product.name.trim(),
        type: 'product',
        category_id: product.categoryId || null
      });
    }

    // Add tags
    if (product.tags && Array.isArray(product.tags)) {
      product.tags.forEach(t => {
        if (t && typeof t === 'string' && t.trim().length > 0) {
          keywords.push({
            keyword: t.trim(),
            type: 'product',
            category_id: product.categoryId || null
          });
        }
      });
    }

    // Add Category name if category is loaded or fetch it
    if (product.categoryId) {
      const category = await Category.findByPk(product.categoryId);
      if (category && category.name) {
        keywords.push({
          keyword: category.name.trim(),
          type: 'category',
          category_id: category.id
        });
      }
    }

    // Upsert keywords
    for (const kw of keywords) {
      const [record, created] = await SearchKeyword.findOrCreate({
        where: { keyword: kw.keyword },
        defaults: {
          type: kw.type,
          category_id: kw.category_id,
          last_searched_at: new Date()
        }
      });
      if (!created && kw.category_id && !record.category_id) {
        await record.update({ category_id: kw.category_id });
      }
    }
  } catch (err) {
    console.error('[SearchSync] Error syncing product keywords:', err.message);
  }
};

const syncAllExisting = async () => {
  try {
    const { Product, SearchKeyword } = require('../models');
    
    // Check if empty
    const count = await SearchKeyword.count();
    if (count > 0) return;

    // Get all active products
    const products = await Product.findAll({ where: { isActive: true } });
    console.log(`[SearchSync] Starting initial sync of ${products.length} products...`);
    
    for (const prod of products) {
      await syncProductKeywords(prod);
    }
    console.log('[SearchSync] Initial sync completed successfully');
  } catch (err) {
    console.error('[SearchSync] Error running initial sync:', err.message);
  }
};

module.exports = { syncProductKeywords, syncAllExisting };
