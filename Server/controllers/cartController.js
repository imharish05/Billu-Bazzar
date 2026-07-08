'use strict';
const { Cart, CartItem, Product } = require('../models');

const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      where: { customerId: req.customer.id },
      include: [{ model: CartItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'price', 'images', 'stock', 'slug'] }] }],
    });
    if (!cart) return res.json({ success: true, cart: { items: [], subtotal: 0 } });

    const subtotal = cart.items.reduce((sum, item) => sum + item.priceAtAdd * item.quantity, 0);
    res.json({ success: true, cart: { ...cart.toJSON(), subtotal } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, selectedVariant = {} } = req.body;
    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    let [cart] = await Cart.findOrCreate({ where: { customerId: req.customer.id } });
    const existingItem = await CartItem.findOne({ where: { cartId: cart.id, productId } });

    if (existingItem) {
      await existingItem.update({ quantity: existingItem.quantity + quantity });
    } else {
      await CartItem.create({ cartId: cart.id, productId, quantity, priceAtAdd: product.price, selectedVariant });
    }

    res.json({ success: true, message: 'Added to cart' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const item = await CartItem.findByPk(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    if (req.body.quantity <= 0) {
      await item.destroy();
    } else {
      await item.update({ quantity: req.body.quantity });
    }
    res.json({ success: true, message: 'Cart updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    await CartItem.destroy({ where: { id: req.params.itemId } });
    res.json({ success: true, message: 'Removed from cart' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ where: { customerId: req.customer.id } });
    if (cart) await CartItem.destroy({ where: { cartId: cart.id } });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
