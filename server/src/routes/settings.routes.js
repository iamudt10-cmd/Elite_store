const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { requireAdmin } = require('../middleware/auth');

router.get('/', settingsController.getSettings);
router.get('/:category', settingsController.getSettingsByCategory);
router.put('/:key', requireAdmin, settingsController.updateSetting);
router.post('/', requireAdmin, settingsController.createSetting);

module.exports = router;
