'use strict';
const router = require('express').Router();
const { autocomplete, trending, track } = require('../controllers/searchController');

router.get('/autocomplete', autocomplete);
router.get('/trending', trending);
router.post('/track', track);

module.exports = router;
