'use strict';
/**
 * TypesenseService — local mock. Replace with real Typesense client before production.
 * Full-text search over products using in-memory filter for dev/staging.
 */
class TypesenseService {
  constructor() { this._index = []; }

  index(products) { this._index = products; }

  search(query, options = {}) {
    const q = query.toLowerCase();
    let results = this._index.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q))
    );
    if (options.categoryId) results = results.filter(p => p.categoryId === options.categoryId);
    if (options.minPrice) results = results.filter(p => p.price >= options.minPrice);
    if (options.maxPrice) results = results.filter(p => p.price <= options.maxPrice);
    return { hits: results.slice(0, options.limit || 20), found: results.length };
  }
}

module.exports = new TypesenseService();
