// routes/index.js
const express = require('express');
const router = express.Router();

// Import route modules
const policeDashboardRoutes = require('./police/dashboard.routes');
const searchRoutes = require('./api/search.routes'); // Optional, if you added search

const searchRoutes = require('./api/search.routes');
router.use('/api/search', searchRoutes);

// Register routes
router.use('/police', policeDashboardRoutes);
router.use('/api/search', searchRoutes); // Optional

module.exports = router;
