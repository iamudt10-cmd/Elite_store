const config = require('../config');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message || err);
  
  if (err.stack && config.nodeEnv === 'development') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || null,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
