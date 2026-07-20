'use strict';
const router = require('express').Router();
const { register, login, getProfile, updateProfile, adminLogin, refresh, getRefreshToken, getMe } = require('../controllers/authController');
const { verifyCustomer } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/refresh', refresh);
router.post('/get-refresh-token', getRefreshToken);
router.get('/getme', getMe);
router.get('/profile', verifyCustomer, getProfile);
router.put('/profile', verifyCustomer, updateProfile);

module.exports = router;
