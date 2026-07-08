'use strict';
const router = require('express').Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');
const { verifyCustomer } = require('../middleware/auth');

router.get('/', verifyCustomer, getCart);
router.post('/add', verifyCustomer, addToCart);
router.put('/item/:itemId', verifyCustomer, updateCartItem);
router.delete('/item/:itemId', verifyCustomer, removeFromCart);
router.delete('/clear', verifyCustomer, clearCart);

module.exports = router;
