const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkout.controller');
const { requireAuth } = require('../middleware/auth');

router.post('/create-order', requireAuth, checkoutController.createRazorpayOrder);
router.post('/verify-promo', requireAuth, checkoutController.verifyPromoCode);

module.exports = router;
