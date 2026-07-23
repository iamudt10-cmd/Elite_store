const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config');
const { authenticate } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const userRoutes = require('./routes/user.routes');
const reviewRoutes = require('./routes/review.routes');
const checkoutRoutes = require('./routes/checkout.routes');
const searchRoutes = require('./routes/search.routes');
const settingsRoutes = require('./routes/settings.routes');
const adminRoutes = require('./routes/admin.routes');
const uploadRoutes = require('./routes/upload.routes');

const app = express();

// Express Configuration with dynamic CORS handling to prevent blocks across preview domains
const allowedOrigins = [
  'https://elite-style.vercel.app',
  'https://elite--style.vercel.app',
  'https://elite-style-tkw8.onrender.com',
  /^https:\/\/elite-.*\.vercel\.app$/,
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser requests
    const isAllowed = allowedOrigins.some((allowed) =>
      allowed instanceof RegExp ? allowed.test(origin) : allowed === origin
    );
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Explicit preflight handler — safety net
app.options('*', cors());

// COOP fix for Google Sign-In popup issue
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static Folder for local upload fallback
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Authenticate middleware (attaches user to req.user if JWT is valid)
app.use(authenticate);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/upload', uploadRoutes);

// Base route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Elite Style E-Commerce API is running smoothly' });
});

// 404 Route
app.use((req, res, next) => {
  const err = new Error('Resource not found');
  err.statusCode = 404;
  next(err);
});

// Centralized error handler
app.use(errorHandler);

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = config.port || 5000;
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`Elite Style Backend API listening on port ${PORT}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`Frontend URL: ${config.frontendUrl}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
