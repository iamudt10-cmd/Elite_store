const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/auth.validator');

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/google', authLimiter, authController.googleLogin);
router.post('/logout', requireAuth, authController.logout);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
