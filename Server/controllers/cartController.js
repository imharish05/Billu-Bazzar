'use strict';
const { Cart, CartItem, Product, ProductVariant } = require('../models');

// Helper to determine selector for Cart search based on customer or guest session
const getCartSelector = (req) => {
  if (req.customer && req.customer.id) {
    return { customerId: req.customer.id };
  }
  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'];
  if (!sessionId) return null;
  return { sessionId };
};

// Helper to resolve or create a Cart for a user/guest
const getOrCreateCart = async (req) => {
  if (req.customer && req.customer.id) {
    const [cart] = await Cart.findOrCreate({ where: { customerId: req.customer.id } });
    return cart;
  }
  const sessionId = req.cookies?.sessionId || req.headers['x-session-id'] || `sess_${Math.random().toString(36).substring(2, 15)}`;
  const [cart] = await Cart.findOrCreate({ where: { sessionId } });
  return cart;
};

// GET Cart with automatic stock-reduction audit
const getCart = async (req, res) => {
  try {
    const selector = getCartSelector(req);
    if (!selector) {
      return res.json({ success: true, cart: { items: [], subtotal: 0 }, sessionId: null });
    }

    const cart = await Cart.findOne({
      where: selector,
      include: [{
        model: CartItem,
        as: 'items',
        include: [
          { model: Product, as: 'product', attributes: ['id', 'name', 'price', 'images', 'stock', 'slug'] },
          { model: ProductVariant, as: 'variant', attributes: ['id', 'sku', 'price', 'stock', 'attributes'] }
        ]
      }],
    });

    if (!cart) {
      return res.json({ success: true, cart: { items: [], subtotal: 0 } });
    }

    const auditedItems = [];
    let cartAdjusted = false;
    const adjustments = [];

    // Audit each item's stock level against database truth
    for (const item of cart.items) {
      let physicalStock = 0;
      if (item.variantId) {
        if (item.variant) physicalStock = item.variant.stock;
      } else {
        if (item.product) physicalStock = item.product.stock;
      }

      let currentQty = item.quantity;
      let status = 'VALID';
      let msg = '';

      if (physicalStock <= 0) {
        // Case A: Product/Variant is completely out of stock
        status = 'OUT_OF_STOCK';
        currentQty = 0;
        if (item.quantity !== 0) {
          await item.update({ quantity: 0 });
          cartAdjusted = true;
          adjustments.push({ itemId: item.id, message: `"${item.product.name}" is now out of stock.` });
        }
      } else if (physicalStock < item.quantity) {
        // Case B: Stock is less than cart quantity. Auto-reduce quantity.
        status = 'QUANTITY_REDUCED';
        currentQty = physicalStock;
        await item.update({ quantity: physicalStock });
        cartAdjusted = true;
        adjustments.push({
          itemId: item.id,
          message: `Quantity of "${item.product.name}" reduced from ${item.quantity} to ${physicalStock} due to limited stock.`
        });
      }

      auditedItems.push({
        ...item.toJSON(),
        quantity: currentQty,
        stockStatus: status,
        availableStock: physicalStock
      });
    }

    // Recalculate subtotal excluding out of stock items
    const subtotal = auditedItems.reduce((sum, item) => {
      const price = item.variantId && item.variant?.price ? parseFloat(item.variant.price) : parseFloat(item.priceAtAdd);
      return sum + (price * item.quantity);
    }, 0);

    // Return audited cart
    res.json({
      success: true,
      cart: {
        id: cart.id,
        customerId: cart.customerId,
        sessionId: cart.sessionId,
        items: auditedItems,
        subtotal
      },
      cartAdjusted,
      adjustments
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add item to cart with strict stock validation
const addToCart = async (req, res) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;
    if (quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be positive' });
    }

    const product = await Product.findByPk(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found or inactive' });
    }

    let physicalStock = 0;
    let selectedVariantJson = {};
    let itemPrice = product.price;

    if (variantId) {
      const variant = await ProductVariant.findOne({ where: { id: variantId, productId } });
      if (!variant) return res.status(404).json({ success: false, message: 'Product variant not found' });
      physicalStock = variant.stock;
      selectedVariantJson = variant.attributes;
      if (variant.price) itemPrice = variant.price;
    } else {
      physicalStock = product.stock;
    }

    // Resolve cart details
    const cart = await getOrCreateCart(req);

    // Fetch existing cart quantity for this specific SKU
    const existingItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productId,
        ...(variantId ? { variantId } : { variantId: null })
      }
    });

    const currentCartQty = existingItem ? existingItem.quantity : 0;
    const totalRequestedQty = currentCartQty + quantity;

    // Strict stock check (including user's existing cart quantity)
    if (totalRequestedQty > physicalStock) {
      return res.status(409).json({
        success: false,
        code: 'INSUFFICIENT_STOCK',
        availableStock: Math.max(0, physicalStock - currentCartQty),
        cartQty: currentCartQty,
        requestedQty: quantity,
        message: `Only ${Math.max(0, physicalStock - currentCartQty)} items are available.`
      });
    }

    if (existingItem) {
      await existingItem.update({ quantity: totalRequestedQty });
    } else {
      await CartItem.create({
        cartId: cart.id,
        productId,
        variantId: variantId || null,
        quantity,
        priceAtAdd: itemPrice,
        selectedVariant: selectedVariantJson
      });
    }

    // If guest checkout, attach cookie sessionId to response for persistence
    if (!req.customer) {
      res.cookie('sessionId', cart.sessionId, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30 days
    }

    res.json({ success: true, message: 'Added to cart', sessionId: cart.sessionId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update cart item quantity with strict stock bounds checking
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await CartItem.findByPk(req.params.itemId, {
      include: [
        { model: Product, as: 'product' },
        { model: ProductVariant, as: 'variant' }
      ]
    });

    if (!item) return res.status(404).json({ success: false, message: 'Cart item not found' });

    if (quantity <= 0) {
      await item.destroy();
      return res.json({ success: true, message: 'Item removed from cart' });
    }

    // Validate stock levels
    let physicalStock = 0;
    if (item.variantId) {
      if (item.variant) physicalStock = item.variant.stock;
    } else {
      if (item.product) physicalStock = item.product.stock;
    }

    if (quantity > physicalStock) {
      // Exceeded current stock, auto-adjust to available maximum
      await item.update({ quantity: physicalStock });
      return res.status(409).json({
        success: false,
        code: 'INSUFFICIENT_STOCK',
        availableStock: physicalStock,
        cartQty: item.quantity,
        requestedQty: quantity,
        message: `Only ${physicalStock} items are available. Your cart was updated to the maximum quantity.`
      });
    }

    await item.update({ quantity });
    res.json({ success: true, message: 'Cart updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Remove single item from cart
const removeFromCart = async (req, res) => {
  try {
    const deletedCount = await CartItem.destroy({ where: { id: req.params.itemId } });
    if (!deletedCount) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }
    res.json({ success: true, message: 'Removed from cart' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    const selector = getCartSelector(req);
    if (!selector) {
      return res.status(400).json({ success: false, message: 'No active cart session' });
    }
    const cart = await Cart.findOne({ where: selector });
    if (cart) {
      await CartItem.destroy({ where: { cartId: cart.id } });
    }
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Sync local cart items from client to DB and audit stock
const syncCart = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Items must be an array' });
    }

    const cart = await getOrCreateCart(req);

    // Delete existing cart items to replace them with the current client cart snapshot
    await CartItem.destroy({ where: { cartId: cart.id } });

    const auditedItems = [];
    const adjustments = [];

    for (const item of items) {
      const productId = parseInt(item.productId, 10);
      const variantId = item.variantId ? parseInt(item.variantId, 10) : null;
      let quantity = parseInt(item.quantity, 10);

      if (isNaN(productId) || isNaN(quantity) || quantity <= 0) {
        continue; // skip invalid items
      }

      const product = await Product.findByPk(productId);
      if (!product || !product.isActive) {
        adjustments.push({ productId, message: `Product is unavailable.` });
        continue;
      }

      let physicalStock = 0;
      let selectedVariantJson = item.selectedVariant || {};
      let itemPrice = product.price;

      if (variantId) {
        const variant = await ProductVariant.findOne({ where: { id: variantId, productId } });
        if (variant) {
          physicalStock = variant.stock;
          selectedVariantJson = variant.attributes;
          if (variant.price) itemPrice = variant.price;
        }
      } else {
        physicalStock = product.stock;
      }

      let status = 'VALID';
      if (physicalStock <= 0) {
        status = 'OUT_OF_STOCK';
        quantity = 0;
        adjustments.push({ productId, message: `"${product.name}" is now out of stock.` });
      } else if (physicalStock < quantity) {
        status = 'QUANTITY_REDUCED';
        adjustments.push({
          productId,
          message: `Quantity of "${product.name}" reduced from ${quantity} to ${physicalStock} due to limited stock.`
        });
        quantity = physicalStock;
      }

      if (quantity > 0) {
        const createdItem = await CartItem.create({
          cartId: cart.id,
          productId,
          variantId,
          quantity,
          priceAtAdd: itemPrice,
          selectedVariant: selectedVariantJson
        });
        
        auditedItems.push({
          ...createdItem.toJSON(),
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            images: product.images,
            stock: product.stock,
            slug: product.slug
          },
          stockStatus: status,
          availableStock: physicalStock
        });
      }
    }

    // Recalculate subtotal
    const subtotal = auditedItems.reduce((sum, item) => sum + (parseFloat(item.priceAtAdd) * item.quantity), 0);

    res.json({
      success: true,
      cart: {
        id: cart.id,
        customerId: cart.customerId,
        sessionId: cart.sessionId,
        items: auditedItems,
        subtotal
      },
      adjustments
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart, syncCart };

