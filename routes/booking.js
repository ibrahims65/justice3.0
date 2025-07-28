const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/:id', async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { person: true }, // enrich with person info
    });

    if (!booking) {
      return res.status(404).send('Booking not found');
    }

    res.render('booking/view', { booking });
  } catch (err) {
    console.error('Booking detail error:', err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
