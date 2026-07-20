'use strict';
const router = require('express').Router();
const { getAll, getOne, getMyOrders, placeOrder, updateStatus, getDashboardStats } = require('../controllers/orderController');
const { verifyCustomer, verifyAdmin, optionalCustomer } = require('../middleware/auth');

router.get('/stats', verifyAdmin, getDashboardStats);
router.get('/my', verifyCustomer, getMyOrders);
router.post('/', optionalCustomer, placeOrder); // allow optional guest order placement
router.get('/', verifyAdmin, getAll);
router.get('/:id', verifyAdmin, getOne);
router.patch('/:id/status', verifyAdmin, updateStatus);

module.exports = router;
