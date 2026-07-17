'use strict';
const router = require('express').Router();
const { getAll, create, update, remove, reorder } = require('../controllers/subSubCategoryController');
const { verifyAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getAll);
router.post('/', verifyAdmin, upload.single('image'), create);
router.patch('/reorder', verifyAdmin, reorder);
router.put('/:id', verifyAdmin, upload.single('image'), update);
router.delete('/:id', verifyAdmin, remove);

module.exports = router;
