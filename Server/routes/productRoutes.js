'use strict';
const router = require('express').Router();
const { getAll, getOne, create, update, remove, getFeatured, search, getPriceRange } = require('../controllers/productController');
const { verifyAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getAll);
router.get('/featured', getFeatured);
router.get('/search', search);
router.get('/price-range', getPriceRange);
router.get('/:slug', getOne);
router.post('/', verifyAdmin, upload.any(), create);
router.put('/:id', verifyAdmin, upload.any(), update);
router.delete('/:id', verifyAdmin, remove);

module.exports = router;
