'use strict';
const router = require('express').Router();
const { getAll, getOne, create, update, remove, getFeatured } = require('../controllers/productController');
const { verifyAdmin } = require('../middleware/auth');

router.get('/', getAll);
router.get('/featured', getFeatured);
router.get('/:slug', getOne);
router.post('/', verifyAdmin, create);
router.put('/:id', verifyAdmin, update);
router.delete('/:id', verifyAdmin, remove);

module.exports = router;
