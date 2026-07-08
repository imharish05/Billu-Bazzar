'use strict';
const router = require('express').Router();
const { getTree, getAll, create, update, remove } = require('../controllers/categoryController');
const { verifyAdmin } = require('../middleware/auth');

router.get('/tree', getTree);
router.get('/', getAll);
router.post('/', verifyAdmin, create);
router.put('/:id', verifyAdmin, update);
router.delete('/:id', verifyAdmin, remove);

module.exports = router;
