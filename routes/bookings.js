const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/', checkRole(['Police']), async (req, res) => {
  const bookings = await prisma.booking.findMany({
    include: {
      person: true,
    },
  });
  res.render('bookings/index', { bookings });
});

module.exports = router;
