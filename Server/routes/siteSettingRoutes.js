'use strict';
const router = require('express').Router();
const { getSetting, updateSetting } = require('../controllers/siteSettingController');
const { verifyAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/:key', getSetting);
router.post('/:key', verifyAdmin, upload.single('image'), updateSetting);

module.exports = router;
