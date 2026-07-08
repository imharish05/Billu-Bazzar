'use strict';
const router = require('express').Router();
const { getAll, getOne, getWishlist, toggleWishlist, getLoyalty, getTickets, createTicket } = require('../controllers/customerController');
const { verifyCustomer, verifyAdmin } = require('../middleware/auth');

// Customer self-service routes
router.get('/wishlist', verifyCustomer, getWishlist);
router.post('/wishlist', verifyCustomer, toggleWishlist);
router.get('/loyalty', verifyCustomer, getLoyalty);
router.get('/tickets', verifyCustomer, getTickets);
router.post('/tickets', verifyCustomer, createTicket);

// Admin-only routes
router.get('/', verifyAdmin, getAll);
router.get('/:id', verifyAdmin, getOne);

module.exports = router;
