'use strict';
const router = require('express').Router();
const {
  getProductReviews,
  getMyDeliveredItems,
  createReview,
  updateReview,
  deleteReview,
  getAllReviewsAdmin,
  updateReviewStatusAdmin,
} = require('../controllers/reviewController');
const { verifyCustomer, verifyAdmin, optionalCustomer } = require('../middleware/auth');

// Admin routes (must be before generic /:id routes)
router.get('/admin/all', verifyAdmin, getAllReviewsAdmin);
router.patch('/admin/:id/status', verifyAdmin, updateReviewStatusAdmin);
router.delete('/admin/:id', verifyAdmin, deleteReview);

// Customer routes
router.get('/product/:productId', optionalCustomer, getProductReviews);
router.get('/my-delivered-items', verifyCustomer, getMyDeliveredItems);
router.post('/', verifyCustomer, createReview);
router.put('/:id', verifyCustomer, updateReview);
router.delete('/:id', verifyCustomer, deleteReview);

module.exports = router;

