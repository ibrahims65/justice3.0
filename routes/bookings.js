const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Step 1: Person Selection
router.get('/new/person', (req, res) => {
  res.render('bookings/person-step');
});

router.post('/new/person', async (req, res) => {
  const { name, email } = req.body;
  if (name && email) {
    const person = await prisma.person.create({
      data: {
        name,
        email,
        dob: new Date(),
      },
    });
    res.redirect(`/bookings/new/case?personId=${person.id}`);
  } else {
    const { personId } = req.body;
    if (personId) {
      res.redirect(`/bookings/new/case?personId=${personId}`);
    } else {
      res.redirect('/bookings/new/person');
    }
  }
});

// Step 2: Case Creation
router.get('/new/case', (req, res) => {
  res.render('bookings/case-step', { personId: req.query.personId });
});

router.post('/new/case', async (req, res) => {
  const { personId, caseNumber, status, policeStationId } = req.body;
  const booking = await prisma.booking.create({
    data: {
      personId: parseInt(personId),
      policeStationId: parseInt(policeStationId),
      bookingDate: new Date(),
      status: 'Open',
    },
  });
  const createdCase = await prisma.case.create({
    data: {
      bookingId: booking.id,
      caseNumber,
      status,
    },
  });
  await prisma.booking.update({
    where: { id: booking.id },
    data: { caseId: createdCase.id },
  });
  res.redirect(`/bookings/${booking.id}/edit`);
});

// Step 3: Tabbed Case-Details Editor
router.get('/:bookingId/edit', async (req, res) => {
  const bookingId = parseInt(req.params.bookingId, 10);
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      person: true,
      policeStation: true,
      case: {
        include: {
          victims: true,
          evidence: true,
          witnesses: true,
          hearings: true,
          prosecutorNotes: true, // etc.
        },
      },
      visitationLogs: true,
      remandRequests: true,
      disciplinaryActions: true,
      releaseRecord: true,
    },
  });
  // flatten for templates:
  const { case: crim, ...rest } = booking;
  const vm = { ...rest, ...crim };
  res.render('bookings/edit', { booking: vm });
});

module.exports = router;
