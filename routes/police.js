const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const prisma = require('../lib/prisma');
const policeDashboardController = require('../controllers/police/dashboard.controller');

router.get('/dashboard', isAuthenticated, policeDashboardController.renderDashboard);

router.post('/search', async (req, res) => {
  const { query } = req.body;
  console.log('Search query:', query);
  const results = await prisma.booking.findMany({
    where: {
      OR: [
        { arrestingOfficerName: { contains: query, mode: 'insensitive' } },
        { person: { name: { contains: query, mode: 'insensitive' } } },
      ],
    },
    include: {
      person: true,
    },
  });
  console.log(results);
  res.render('police-dashboard', {
    officer: req.session.user,
    results,
    recentBookings: [],
    alerts: [],
    activityLog: [],
  });
});

module.exports = router;
