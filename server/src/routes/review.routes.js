const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { requireAuth } = require('../middleware/auth');

router.get('/product/:productId', reviewController.getProductReviews);
router.post('/', requireAuth, reviewController.createReview);
router.delete('/:id', requireAuth, reviewController.deleteReview);

module.exports = router;
