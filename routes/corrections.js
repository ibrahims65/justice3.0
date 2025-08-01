const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/', checkRole(['Corrections']), async (req, res) => {
  const { search, facility } = req.query;
  let where = {
    bookings: {
      some: {
        case: {
          status: 'Convicted',
        },
      },
    },
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { bookings: { some: { case: { caseNumber: { contains: search, mode: 'insensitive' } } } } },
    ];
  }

  if (facility) {
    where.bookings.some.facilityName = { contains: facility, mode: 'insensitive' };
  }

  const people = await prisma.person.findMany({
    where,
    include: {
      bookings: {
        include: {
          case: true,
        },
      },
    },
  });

  res.render('corrections/index', { people });
});

router.get('/inmates/:personId', checkRole(['Corrections']), async (req, res) => {
  const person = await prisma.person.findUnique({
    where: { id: parseInt(req.params.personId) },
    include: {
      bookings: {
        include: {
          case: {
            include: {
              hearings: true,
              lawyers: { include: { visits: true } },
            },
          },
          medicalRecords: { include: { medications: true } },
        },
      },
      nextOfKin: true,
    },
  });
  res.render('corrections/inmateProfile', { person });
});

router.get('/disciplinary/new/:bookingId', checkRole(['Corrections']), (req, res) => {
  res.render('corrections/disciplinary/new', { bookingId: req.params.bookingId });
});

router.post('/disciplinary/:bookingId', checkRole(['Corrections']), async (req, res) => {
  const { date, infraction, sanction, notes } = req.body;
  const bookingId = parseInt(req.params.bookingId);
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  await prisma.disciplinaryAction.create({
    data: {
      bookingId,
      date: new Date(date),
      infraction,
      sanction,
      notes,
    },
  });
  res.redirect(`/corrections/inmates/${booking.personId}`);
});

router.get('/visitation/new/:bookingId', checkRole(['Corrections']), (req, res) => {
  res.render('corrections/visitation/new', { bookingId: req.params.bookingId });
});

router.post('/visitation/:bookingId', checkRole(['Corrections']), async (req, res) => {
  const { date, visitorName, notes } = req.body;
  const bookingId = parseInt(req.params.bookingId);
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  await prisma.visitationLog.create({
    data: {
      bookingId,
      date: new Date(date),
      visitorName,
      notes,
    },
  });
  res.redirect(`/corrections/inmates/${booking.personId}`);
});

router.post('/inmates/:bookingId', checkRole(['Corrections']), async (req, res) => {
  const { incarcerationStartDate, facilityName, rehabilitationPrograms, releaseDate, paroleEligibility } = req.body;
  const bookingId = parseInt(req.params.bookingId);
  try {
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      include: { case: true },
      data: {
        incarcerationStartDate: new Date(incarcerationStartDate),
        facilityName,
        rehabilitationPrograms,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        paroleEligibility: paroleEligibility ? new Date(paroleEligibility) : null,
        releasedAt: releaseDate ? new Date(releaseDate) : null,
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

router.get('/dashboard', checkRole(['Corrections']), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });

  const inmates = await prisma.person.findMany({
    where: {
      bookings: {
        some: {
          status: 'In-Custody',
        },
      },
    },
    include: {
      bookings: true,
    },
  });

  // These are not yet implemented in the schema
  const transferRequests = [];
  const remandOutcomes = [];

  res.render('corrections/dashboard', {
    user,
    inmates,
    transferRequests,
    remandOutcomes,
    page: '/corrections/dashboard',
  });
});

module.exports = router;
