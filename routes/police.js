const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/dashboard/police', checkRole(['Police']), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });

  const bookingsToday = await prisma.booking.count({
    where: {
      bookingDate: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  });

  const overdueHolds = await prisma.booking.count({
    where: {
      bookingDate: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      status: 'New Arrest',
    },
  });

  const pendingSubmissions = await prisma.booking.count({
    where: {
      case: {
        status: 'New Arrest',
      },
    },
  });

  const inCustody = await prisma.booking.count({
    where: {
      status: 'In-Custody',
    },
  });

  const recentActivity = await prisma.actionHistory.findMany({
    where: {
      user: {
        role: {
          name: 'Police',
        },
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: 10,
    include: {
      case: true,
      user: true,
    },
  });

  const breadcrumbs = [
    { name: 'Dashboard', url: '/dashboard/police' }
  ];
  res.render('police/dashboard', {
    user,
    bookingsToday,
    overdueHolds,
    pendingSubmissions,
    inCustody,
    recentActivity,
    page: '/dashboard/police',
    breadcrumbs
  });
});

router.get('/people-redesigned', checkRole(['Police']), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });

  const { search, role, bookingStatus, caseStatus, gender, ageRange } = req.query;
  let where = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { id: { equals: parseInt(search) || 0 } },
      { bookings: { some: { id: { equals: parseInt(search) || 0 } } } },
      { bookings: { some: { case: { caseNumber: { contains: search, mode: 'insensitive' } } } } },
    ];
  }

  if (role) {
    // This requires a `roles` field on the `Person` model, which is not yet implemented.
  }

  if (bookingStatus) {
    where.bookings = {
      some: {
        status: bookingStatus,
      },
    };
  }

  if (caseStatus) {
    where.bookings = {
      some: {
        case: {
          status: caseStatus,
        },
      },
    };
  }

  if (gender) {
    where.gender = gender;
  }

  if (ageRange) {
    // This requires calculating the age from the `dob` field.
  }

  const people = await prisma.person.findMany({
    where: {
      ...where,
      bookings: {
        some: {},
      },
    },
    include: {
      bookings: {
        include: {
          case: true,
        },
      },
    },
    take: 20,
  });

  res.render('police/people-redesigned', {
    user,
    people,
    page: '/police/people-redesigned',
  });
});

router.get('/bookings', checkRole(['Police']), async (req, res) => {
  const bookings = await prisma.booking.findMany({
    include: {
      person: true,
      remandRequests: true,
    },
  });
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });

  const breadcrumbs = [
    { name: 'Dashboard', url: '/dashboard/police' },
    { name: 'Bookings', url: '/police/bookings' }
  ];

  res.render('police/bookings', {
    user,
    bookings,
    page: '/police/bookings',
    breadcrumbs
  });
});

router.get('/search', checkRole(['Police']), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });
  res.render('police/search', {
    user,
    page: '/police/search',
  });
});

router.get('/people/:id', checkRole(['Police']), async (req, res) => {
  const person = await prisma.person.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      bookings: {
        include: {
          case: true,
          remandRequests: true,
        },
      },
    },
  });
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });

  const breadcrumbs = [
    { name: 'Dashboard', url: '/dashboard/police' },
    { name: 'People', url: '/police/people' },
    { name: person.name, url: `/police/people/${person.id}` }
  ];

  res.render('police/show', {
    user,
    person,
    page: '/police/people',
    breadcrumbs
  });
});

router.get('/remands', checkRole(['Police']), async (req, res) => {
  const remandRequests = await prisma.remandRequest.findMany({
    include: {
      booking: {
        include: {
          person: true,
        },
      },
    },
  });
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });

  res.render('police/remands', {
    user,
    remandRequests,
    page: '/police/remands',
  });
});

router.get('/booking/:id', checkRole(['Police']), async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      person: true,
      case: true,
      remandRequests: true,
    },
  });
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });

  res.render('police/booking-detail', {
    user,
    booking,
    page: '/police/bookings',
  });
});


module.exports = router;
