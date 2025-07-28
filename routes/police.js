const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { isAuthenticated } = require('../middleware/auth');
const policeDashboardController = require('../controllers/police/dashboard.controller');

// Dashboard
router.get('/dashboard', isAuthenticated, policeDashboardController.renderDashboard);

// Person Selection/Creation
router.get('/person/new', isAuthenticated, (req, res) => {
  res.render('police/person-step');
});

router.post('/person/new', isAuthenticated, async (req, res) => {
  const { name, email } = req.body;
  if (name && email) {
    const person = await prisma.person.create({
      data: {
        name,
        email,
        dob: new Date(),
      },
    });
    res.redirect(`/police/case/new?personId=${person.id}`);
  } else {
    const { personId } = req.body;
    if (personId) {
      res.redirect(`/police/case/new?personId=${personId}`);
    } else {
      res.redirect('/police/person/new');
    }
  }
});

// Case Creation
router.get('/case/new', isAuthenticated, (req, res) => {
  res.render('police/case-step', { personId: req.query.personId });
});

router.post('/case/new', isAuthenticated, async (req, res) => {
    const { personId, caseNumber, status, policeStationId } = req.body;
    const booking = await prisma.booking.create({
        data: {
        personId: parseInt(personId),
        policeStationId: parseInt(policeStationId),
        bookingDate: new Date(),
        status: 'Open',
        arrestingOfficerId: req.session.user.id,
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
    res.redirect(`/police/booking/${booking.id}/edit`);
});

// Tabbed Case-Details Editor
router.get('/booking/:bookingId/edit', isAuthenticated, async (req, res) => {
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
          prosecutorNotes: true,
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
  res.render('police/edit', { booking: vm });
});

// Read-Only Case View
router.get('/booking/:bookingId', isAuthenticated, async (req, res) => {
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
                    prosecutorNotes: true,
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
    res.render('police/view', { booking: vm });
});

router.post('/search', isAuthenticated, async (req, res) => {
    const { query } = req.body;
    const officer = req.session.user;

    const results = await prisma.booking.findMany({
        where: {
            OR: [
                { person: { name: { contains: query, mode: 'insensitive' } } },
                { id: parseInt(query) || undefined }
            ],
        },
        include: {
            person: true,
        },
    });

    res.render('police/dashboard', {
        officer,
        results,
        recentBookings: [] // keep this for now
    });
});

module.exports = router;
