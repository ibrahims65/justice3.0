const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

router.get('/new', checkRole(['Police']), (req, res) => {
  res.render('people/new');
});

router.post('/', checkRole(['Police']), upload.single('photo'), async (req, res) => {
    const { name, dob, address, phone, email } = req.body;
      try {
        const newPerson = await prisma.person.create({
          data: {
            name,
            dob: new Date(dob),
            address,
            phone,
            email,
            photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
          },
        });
        res.redirect(`/people/${newPerson.id}`);
      } catch (error) {
        res.redirect('/people/new');
      }
});

router.get('/:id', async (req, res) => {
  const person = await prisma.person.findFirst({
    where: { id: parseInt(req.params.id), deletedAt: null },
    include: {
      bookings: {
        include: {
          case: {
            include: {
              lawyers: {
                include: {
                  visits: true,
                },
              },
              medicalRecords: {
                include: {
                  medications: true,
                },
              },
            },
          },
        },
      },
      nextOfKin: true,
    },
  });
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });
  res.render('people/show', { person, user });
});

router.post('/:id/delete', checkRole(['Police']), async (req, res) => {
  await prisma.person.update({
    where: { id: parseInt(req.params.id) },
    data: { deletedAt: new Date() },
  });
  res.redirect('/dashboard');
});

router.get('/:id/bookings/new', checkRole(['Police']), async (req, res) => {
  const policeStations = await prisma.policeStation.findMany();
  res.render('bookings/new', { personId: req.params.id, policeStations });
});

router.post('/:id/bookings', checkRole(['Police']), async (req, res) => {
  const { status, charges, policeStationId, arrestingOfficerName, arrestingOfficerRank } = req.body;
  const personId = parseInt(req.params.id);
  try {
    const newBooking = await prisma.booking.create({
      data: {
        personId,
        status: 'New Booking',
        charges,
        policeStationId: parseInt(policeStationId),
        arrestingOfficerName,
        arrestingOfficerRank,
      },
    });
    await prisma.person.update({
      where: { id: personId },
      data: { rebookedAt: new Date() },
    });
    const newCase = await prisma.case.create({
      data: {
        caseNumber: `CASE-${nanoid()}`,
        status: 'New Arrest',
        bookingId: newBooking.id,
      },
    });
    await prisma.actionHistory.create({
      data: {
        action: 'Case Created',
        caseId: newCase.id,
        userId: req.session.userId,
      },
    });
    res.redirect(`/cases/${newCase.id}`);
  } catch (error) {
    res.redirect(`/people/${personId}`);
  }
});

module.exports = router;
