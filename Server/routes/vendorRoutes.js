'use strict';
const router = require('express').Router();
const { getAll, getOne, create, update, remove } = require('../controllers/vendorController');
const { verifyAdmin } = require('../middleware/auth');

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', verifyAdmin, create);
router.put('/:id', verifyAdmin, update);
router.delete('/:id', verifyAdmin, remove);

module.exports = router;
