'use strict';
const router = require('express').Router();
const { getAll, getByProduct, add, update, remove } = require('../controllers/variantController');
const { verifyAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getAll);
router.get('/product/:productId', getByProduct);
router.post('/add', verifyAdmin, upload.any(), add);
router.put('/update/:id', verifyAdmin, upload.any(), update);
router.delete('/:id', verifyAdmin, remove);

module.exports = router;
