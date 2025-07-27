const express = require('express');
const router = express.Router();
const controller = require('../../controllers/police/dashboard.controller');

router.get('/dashboard', controller.renderDashboard);

module.exports = router;
