const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, avatar: true, isBlocked: true },
    });

    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    // If token is expired or invalid, let middleware continue but user is not set
    next();
  }
};

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (req.user.isBlocked) {
    return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact support.' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }
  next();
};

module.exports = {
  authenticate,
  requireAuth,
  requireAdmin,
};
