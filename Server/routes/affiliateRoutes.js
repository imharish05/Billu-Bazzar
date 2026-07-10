'use strict';
const router = require('express').Router();
const { getAll, getOne, create, update, remove, getOrders } = require('../controllers/affiliateController');
const { verifyAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', verifyAdmin, upload.single('avatar'), create);
router.put('/:id', verifyAdmin, upload.single('avatar'), update);
router.delete('/:id', verifyAdmin, remove);
router.get('/:id/orders', verifyAdmin, getOrders);

module.exports = router;
