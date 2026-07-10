'use strict';
const router = require('express').Router();
const { getAll, getOne, create, update, remove, getFeatured, search } = require('../controllers/productController');
const { verifyAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getAll);
router.get('/featured', getFeatured);
router.get('/search', search);
router.get('/:slug', getOne);
router.post('/', verifyAdmin, upload.fields([{ name: 'images' }, { name: 'spin_images' }]), create);
router.put('/:id', verifyAdmin, upload.fields([{ name: 'images' }, { name: 'spin_images' }]), update);
router.delete('/:id', verifyAdmin, remove);

module.exports = router;
