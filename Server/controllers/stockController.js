'use strict';
const { Product, ProductVariant, Cart, CartItem } = require('../models');

const getStockStatus = async (req, res) => {
  try {
    const productId = parseInt(req.query.productId, 10);
    const variantId = req.query.variantId ? parseInt(req.query.variantId, 10) : null;

    if (!productId || isNaN(productId)) {
      return res.status(400).json({ success: false, message: 'Valid productId is required' });
    }

    // 1. Determine Cart Owner (customer id or guest session token)
    let cartWhere = {};
    if (req.customer && req.customer.id) {
      cartWhere = { customerId: req.customer.id };
    } else {
      const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
      if (sessionId) {
        cartWhere = { sessionId };
      } else {
        // No session exists yet, cartQty is 0
        cartWhere = null;
      }
    }

    // 2. Fetch server-derived cart quantity for this specific product / variant
    let cartQty = 0;
    if (cartWhere) {
      const cart = await Cart.findOne({
        where: cartWhere,
        include: [{
          model: CartItem,
          as: 'items',
          where: { productId, ...(variantId && { variantId }) }
        }]
      });
      if (cart && cart.items && cart.items.length > 0) {
        cartQty = cart.items[0].quantity;
      }
    }

    // 3. Fetch current physical stock
    let stock = 0;
    if (variantId) {
      const variant = await ProductVariant.findByPk(variantId);
      if (variant) stock = variant.stock;
    } else {
      const product = await Product.findByPk(productId);
      if (product) stock = product.stock;
    }

    // 4. Calculate available stock and status flags
    const availableStock = Math.max(0, stock - cartQty);
    let stockStatus = 'IN_STOCK';
    let stockLabel = 'In Stock';
    let canAddToCart = true;
    let canBuyNow = true;

    if (stock <= 0) {
      stockStatus = 'OUT_OF_STOCK';
      stockLabel = 'Out of Stock';
      canAddToCart = false;
      canBuyNow = false;
    } else if (availableStock <= 0) {
      stockStatus = 'MAX_IN_CART';
      stockLabel = `Already in cart (${cartQty}/${stock})`;
      canAddToCart = false;
      canBuyNow = false;
    } else if (stock >= 1 && stock <= 5) {
      stockStatus = 'LOW_STOCK';
      stockLabel = `Only ${stock} left`;
    } else if (stock >= 6 && stock <= 10) {
      stockStatus = 'LOW_STOCK';
      stockLabel = 'Low Stock';
    }

    res.json({
      success: true,
      productId,
      variantId,
      stock,
      cartQty,
      availableStock,
      stockStatus,
      stockLabel,
      canAddToCart,
      canBuyNow
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getStockStatus };
