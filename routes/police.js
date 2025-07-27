const express = require('express');
const router = express.Router();
const ensureAuthenticated = require('../middleware/auth');
const prisma = require('../lib/prisma'); // adjust path if needed

// GET /police/dashboard
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        officerId: req.user.id, // or remove filter if you want all bookings
      },
      orderBy: {
        date: 'desc',
      },
      take: 10, // limit to recent 10
    });

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
