const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/new/:personId', checkRole(['Police', 'Corrections']), (req, res) => {
  res.render('nextOfKin/new', { personId: req.params.personId });
});

router.post('/', checkRole(['Police', 'Corrections']), async (req, res) => {
  const { name, relationship, phone, address, personId } = req.body;
  try {
    await prisma.nextOfKin.create({
      data: {
        name,
        relationship,
        phone,
        address,
        personId: parseInt(personId),
      },
    });
    const person = await prisma.person.findUnique({ where: { id: parseInt(personId) } });
    // This is a bit of a hack, but we need a caseId to log the action
    const booking = await prisma.booking.findFirst({ where: { personId: parseInt(personId) } });
    if (booking) {
      const caseRecord = await prisma.case.findFirst({ where: { bookingId: booking.id } });
      if (caseRecord) {
        await prisma.actionHistory.create({
          data: {
            action: 'Next of Kin Added',
            caseId: caseRecord.id,
            userId: req.session.userId,
          },
        });
      }
    }
    res.redirect(`/people/${personId}`);
  } catch (error) {
    res.redirect(`/people/${personId}`);
  }
});

module.exports = router;
