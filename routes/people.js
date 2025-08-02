const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
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
    where: { id: parseInt(req.params.id) },
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

router.post('/:id/bookings', checkRole(['Police']), [
  check('charges').notEmpty().withMessage('Charges are required.'),
  check('policeStationId').notEmpty().withMessage('Police station is required.'),
  check('arrestingOfficerName').notEmpty().withMessage('Arresting officer name is required.'),
  check('arrestingOfficerRank').notEmpty().withMessage('Arresting officer rank is required.'),
], async (req, res) => {
  const errors = validationResult(req);
  const personId = parseInt(req.params.id);
  if (!errors.isEmpty()) {
    const policeStations = await prisma.policeStation.findMany();
    return res.status(400).render('bookings/new', {
      errors: errors.array(),
      personId,
      policeStations,
      ...req.body,
    });
  }

  const { status, charges, policeStationId, arrestingOfficerName, arrestingOfficerRank, incarcerationStartDate, custodyExpiresAt } = req.body;
  try {
    const newBooking = await prisma.booking.create({
      data: {
        personId,
        status: 'New Booking',
        charges,
        policeStationId: parseInt(policeStationId),
        arrestingOfficerName,
        arrestingOfficerRank,
        incarcerationStartDate: incarcerationStartDate ? new Date(incarcerationStartDate) : null,
        custodyExpiresAt: custodyExpiresAt ? new Date(custodyExpiresAt) : null,
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
        notes: `Person ID: ${personId}`,
      },
    });
    res.redirect(`/cases/${newCase.id}`);
  } catch (error) {
    res.redirect(`/people/${personId}`);
  }
});

router.get('/:id/remand/new', checkRole(['Police']), (req, res) => {
  res.render('remand/new', { bookingId: req.params.id });
});

router.get('/:id/release/new', checkRole(['Police']), (req, res) => {
  res.render('release/new', { bookingId: req.params.id });
});

router.get('/:id/cases', async (req, res) => {
  const cases = await prisma.case.findMany({
    where: {
      booking: {
        personId: parseInt(req.params.id),
      },
    },
    include: {
      booking: true,
    },
  });
  res.json(cases);
});

module.exports = router;
