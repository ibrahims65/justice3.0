const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const prisma = require('../lib/prisma');
const policeDashboardController = require('../controllers/police/dashboard.controller');

router.get('/dashboard', isAuthenticated, policeDashboardController.renderDashboard);

router.post('/search', async (req, res) => {
  const { query } = req.body;
  const officer = req.session.user;

  const results = await prisma.booking.findMany({
    where: {
      OR: [
        { person: { name: { contains: query, mode: 'insensitive' } } },
        { person: { affiliations: { some: { organization: { contains: query, mode: 'insensitive' } } } } },
      ],
    },
    include: {
      person: true,
    },
  });

  res.render('police/dashboard', {
    officer,
    results,
    bookings: [], // optional: preload or skip
    alerts: [],
    activityLog: [],
  });
});

module.exports = router;
