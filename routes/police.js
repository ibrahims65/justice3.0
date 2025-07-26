const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/dashboard', checkRole(['Police']), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });

  const bookings = await prisma.booking.findMany({
    include: {
      person: true,
    },
    orderBy: {
      bookingDate: 'desc',
    },
    take: 5,
  });

  const cases = await prisma.case.findMany({
    orderBy: {
      booking: {
        bookingDate: 'desc',
      },
    },
    take: 5,
  });

  const warrants = await prisma.warrant.findMany({
    where: {
      status: 'Issued',
    },
    include: {
      case: {
        include: {
          booking: {
            include: {
              person: true,
            },
          },
        },
      },
    },
    take: 5,
  });

  const remandRequests = await prisma.remandRequest.findMany({
    where: {
      status: 'pending',
    },
    include: {
      booking: {
        include: {
          person: true,
        },
      },
    },
  });

  const people = await prisma.person.findMany();
  res.render('police/dashboard', {
    user,
    bookings,
    cases,
    warrants,
    remandRequests,
    people,
    page: '/police/dashboard',
  });
});

router.get('/people', checkRole(['Police']), async (req, res) => {
  const people = await prisma.person.findMany();
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });
  res.render('police/people', {
    user,
    people,
    page: '/police/people',
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

  res.render('police/bookings', {
    user,
    bookings,
    page: '/police/bookings',
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

  res.render('police/show', {
    user,
    person,
    page: '/police/people',
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

module.exports = router;
