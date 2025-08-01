const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.post('/', checkRole(['Police']), async (req, res) => {
  const { bookingId, reason, notes } = req.body;
  const booking = await prisma.booking.update({
    where: { id: parseInt(bookingId) },
    include: { person: true },
    data: {
      status: 'Released',
      custodyExpiresAt: null,
    },
  });
  await prisma.releaseRecord.create({
    data: {
      bookingId: parseInt(bookingId),
      releasedBy: req.session.userId.toString(),
      releaseDate: new Date(),
      reason,
      notes,
    },
  });
  res.redirect(`/people/${booking.personId}`);
});

module.exports = router;
