const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

router.get('/', checkRole(['Police']), async (req, res) => {
  const { name, id, gender, age, registrationDate } = req.query;
  let where = {};
  if (name) {
    where.name = { contains: name, mode: 'insensitive' };
  }
  if (id) {
    where.id = parseInt(id);
  }
  if (gender) {
    where.gender = gender;
  }
  if (age) {
    const today = new Date();
    const birthDate = new Date(today.getFullYear() - age, today.getMonth(), today.getDate());
    where.dob = { lte: birthDate };
  }
  if (registrationDate) {
    where.createdAt = { gte: new Date(registrationDate) };
  }

  const people = await prisma.person.findMany({
    where,
    include: {
      bookings: true,
    },
  });
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });
  res.render('people/index', { people, user, page: '/people', breadcrumbs: [{ name: 'People', url: '/people' }] });
});

router.get('/new', checkRole(['Police']), (req, res) => {
  res.render('people/new');
});

router.get('/new-flow', checkRole(['Police']), async (req, res) => {
    const policeStations = await prisma.policeStation.findMany();
    const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
        include: { role: true },
    });
  res.render('people/new-flow', { step: 1, personId: null, policeStations: policeStations, error: null, user: user, page: '/people/new-flow' });
});

router.post('/new-flow', checkRole(['Police']), upload.single('photo'), async (req, res) => {
    const { name, dob, address, phone, email } = req.body;
    const { step } = req.query;
    const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
        include: { role: true },
    });

    if (step == 1) {
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
        const policeStations = await prisma.policeStation.findMany();
        res.render('people/new-flow', { step: 2, personId: newPerson.id, policeStations: policeStations, error: null, user: user, page: '/people/new-flow' });
      } catch (error) {
        const policeStations = await prisma.policeStation.findMany();
        res.render('people/new-flow', { step: 1, personId: null, policeStations: policeStations, error: 'Failed to create person.', user: user, page: '/people/new-flow' });
      }
    } else {
        const { charges, policeStationId, arrestingOfficerName, arrestingOfficerRank } = req.body;
        const personId = parseInt(req.body.personId);
        try {
            const newBooking = await prisma.booking.create({
              data: {
                personId,
                status: 'New Booking',
                charges,
                policeStationId: parseInt(policeStationId),
                arrestingOfficerName,
                arrestingOfficerRank,
                custodyExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
            res.redirect('/dashboard');
        } catch (error) {
            const policeStations = await prisma.policeStation.findMany();
            res.render('people/new-flow', { step: 2, personId: personId, policeStations: policeStations, error: 'Failed to create booking.', user: user, page: '/people/new-flow' });
        }
    }
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
        custodyExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
    res.redirect('/dashboard');
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

module.exports = router;
