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
        { id: parseInt(query) || undefined }
      ],
    },
    include: {
      person: true,
    },
  });

  res.render('police/dashboard', {
    officer,
    results,
    recentBookings: [] // keep this for now
  });
});

module.exports = router;
