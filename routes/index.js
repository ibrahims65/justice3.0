const express = require('express');
const router = express.Router();

const searchRoutes = require('./api/search.routes'); // ✅ Only once

router.use('/api/search', searchRoutes);

module.exports = router;
