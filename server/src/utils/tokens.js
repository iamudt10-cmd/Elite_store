const jwt = require('jsonwebtoken');
const config = require('../config');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    config.jwtRefreshSecret,
    { expiresIn: '7d' }
  );
};

const generateOrderNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(100000 + Math.random() * 900000);
  return `ES-${year}${month}${day}-${random}`;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateOrderNumber,
};
