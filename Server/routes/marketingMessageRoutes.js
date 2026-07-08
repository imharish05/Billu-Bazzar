'use strict';
const router = require('express').Router();
const { getAll, create, update, remove } = require('../controllers/marketingMessageController');
const { verifyAdmin } = require('../middleware/auth');

router.get('/', getAll);
router.post('/', verifyAdmin, create);
router.put('/:id', verifyAdmin, update);
router.delete('/:id', verifyAdmin, remove);

module.exports = router;
