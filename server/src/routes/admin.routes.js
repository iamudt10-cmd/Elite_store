const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

router.get('/stats', adminController.getStats);
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
