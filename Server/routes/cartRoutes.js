'use strict';
const router = require('express').Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart, syncCart } = require('../controllers/cartController');
const { optionalCustomer } = require('../middleware/auth');

router.get('/', optionalCustomer, getCart);
router.post('/add', optionalCustomer, addToCart);
router.post('/sync', optionalCustomer, syncCart);
router.put('/item/:itemId', optionalCustomer, updateCartItem);
router.delete('/item/:itemId', optionalCustomer, removeFromCart);
router.delete('/clear', optionalCustomer, clearCart);

module.exports = router;
