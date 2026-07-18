const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/:id', cartController.updateCartItem);
router.delete('/:id', cartController.removeCartItem);
router.delete('/', cartController.clearCart);

module.exports = router;
