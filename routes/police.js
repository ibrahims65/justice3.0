const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/dashboard', checkRole(['Police']), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });

  const bookings = await prisma.booking.findMany({
    include: {
      person: true,
    },
    orderBy: {
      bookingDate: 'desc',
    },
    take: 5,
  });

  const cases = await prisma.case.findMany({
    orderBy: {
      booking: {
        bookingDate: 'desc',
      },
    },
    take: 5,
  });

  const warrants = await prisma.warrant.findMany({
    where: {
      status: 'Issued',
    },
    take: 5,
  });

  res.render('police/dashboard', {
    user,
    bookings,
    cases,
    warrants,
    page: '/police/dashboard',
  });
});

module.exports = router;
