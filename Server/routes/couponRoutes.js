'use strict';
const router = require('express').Router();
const { getAll, create, update, remove, validate } = require('../controllers/couponController');
const { verifyAdmin } = require('../middleware/auth');

router.get('/', getAll);
router.post('/', verifyAdmin, create);
router.put('/:id', verifyAdmin, update);
router.delete('/:id', verifyAdmin, remove);
router.post('/validate', validate);

module.exports = router;
