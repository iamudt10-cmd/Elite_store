const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

router.get('/wishlist', userController.getWishlist);
router.post('/wishlist/:productId', userController.addToWishlist);
router.delete('/wishlist/:productId', userController.removeFromWishlist);

router.get('/addresses', userController.getAddresses);
router.post('/addresses', userController.createAddress);
router.put('/addresses/:id', userController.updateAddress);
router.delete('/addresses/:id', userController.deleteAddress);

// Admin Customer Management
router.get('/admin/all', requireAdmin, userController.getAllUsersAdmin);
router.put('/admin/:id/block', requireAdmin, userController.toggleUserBlockAdmin);

module.exports = router;
