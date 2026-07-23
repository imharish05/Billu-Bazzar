'use strict';
const router = require('express').Router();
const {
  getGiftService,
  createGiftService,
  updateGiftService,
  deleteGiftService,
} = require('../controllers/giftServiceController');
const { verifyAdmin } = require('../middleware/auth');

router.get('/', getGiftService);
router.post('/', verifyAdmin, createGiftService);
router.put('/', verifyAdmin, updateGiftService);
router.delete('/', verifyAdmin, deleteGiftService);

module.exports = router;
