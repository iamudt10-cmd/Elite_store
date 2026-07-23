const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkout.controller');
const { requireAuth } = require('../middleware/auth');

router.post('/create-order', requireAuth, checkoutController.createRazorpayOrder);
router.post('/create-cod-order', requireAuth, checkoutController.createCODOrder);
router.post('/verify-promo', requireAuth, checkoutController.verifyPromoCode);
router.post('/webhook', checkoutController.handleRazorpayWebhook);
router.post('/shiprocket-webhook', checkoutController.handleShiprocketWebhook);

module.exports = router;
