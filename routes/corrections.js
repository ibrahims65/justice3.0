const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/inmates/:personId', checkRole(['Corrections']), async (req, res) => {
  const person = await prisma.person.findUnique({
    where: { id: parseInt(req.params.personId) },
    include: {
      bookings: {
        include: {
          case: true,
          lawyers: { include: { visits: true } },
          medicalRecords: { include: { medications: true } },
        },
      },
      nextOfKin: true,
    },
  });
  res.render('corrections/inmateProfile', { person });
});

router.post('/inmates/:bookingId', checkRole(['Corrections']), async (req, res) => {
  const { incarcerationStartDate, facilityName, rehabilitationPrograms, releaseDate, paroleEligibility } = req.body;
  const bookingId = parseInt(req.params.bookingId);
  try {
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        incarcerationStartDate: new Date(incarcerationStartDate),
        facilityName,
        rehabilitationPrograms,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        paroleEligibility: paroleEligibility ? new Date(paroleEligibility) : null,
      },
    });
    await prisma.actionHistory.create({
      data: {
        action: 'Inmate Status Updated',
        caseId: booking.case.id,
        userId: req.session.userId,
      },
    });
    res.redirect(`/corrections/inmates/${booking.personId}`);
  } catch (error) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    res.redirect(`/corrections/inmates/${booking.personId}`);
  }
});

module.exports = router;
