const express = require('express');
const router = express.Router();

const policeDashboardRoutes = require('./police/dashboard.routes');
const searchRoutes = require('./api/search.routes'); // ✅ Only once

router.use('/police', policeDashboardRoutes);
router.use('/api/search', searchRoutes);

module.exports = router;
