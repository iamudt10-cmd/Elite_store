const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

router.get('/stats', adminController.getStats);
router.get('/analytics', adminController.getAnalytics);

// Promo Code Management
router.get('/promo-codes', adminController.getAllPromoCodes);
router.post('/promo-codes', adminController.createPromoCode);
router.put('/promo-codes/:id', adminController.updatePromoCode);
router.delete('/promo-codes/:id', adminController.deletePromoCode);

// Review Moderation Management
router.get('/reviews', adminController.getAllReviews);
router.delete('/reviews/:id', adminController.deleteReview);

module.exports = router;
