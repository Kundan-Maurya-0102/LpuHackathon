const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { apiLimiter, authLimiter } = require('./src/middleware/rateLimiter');
const logger = require('./src/utils/logger');
const responseHelper = require('./src/utils/responseHelper');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply global API rate limit
app.use('/api/', apiLimiter);

// Basic health check route
app.get('/api/health', (req, res) => {
  responseHelper.success(res, 'API is running successfully', { status: 'UP', timestamp: new Date() });
});

// Routes
const authRoutes = require('./src/routes/authRoutes');
const marketRoutes = require('./src/routes/marketRoutes');
const salesRoutes = require('./src/routes/salesRoutes');

// Apply stricter rate limit to auth routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/market-prices', marketRoutes);
app.use('/api/sales', salesRoutes);

// Placeholder for missing routes
app.use((req, res, next) => {
  responseHelper.notFound(res, `Cannot ${req.method} ${req.url}`);
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack, url: req.url, method: req.method });
  responseHelper.error(res, err.message || 'Internal Server Error', 
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : null,
    err.status || 500
  );
});

module.exports = app;
