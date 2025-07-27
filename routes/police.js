const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const prisma = require('../lib/prisma');

// GET /police/dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        officerId: req.user.id, // adjust or remove filter if needed
      },
      orderBy: {
        date: 'desc',
      },
      take: 10, // limit to recent 10
    });

    console.log('Dashboard accessed by:', req.user);

    res.render('police/dashboard', {
      user: req.user,
      bookings,
    });
  } catch (err) {
    console.error('Error loading police dashboard:', err);
    res.render('police/dashboard', {
      user: req.user,
      bookings: [],
    });
  }
});

module.exports = router;
