'use strict';
const router = require('express').Router();
const { getStockStatus } = require('../controllers/stockController');
const { optionalCustomer } = require('../middleware/auth');

router.get('/', optionalCustomer, getStockStatus);

module.exports = router;
