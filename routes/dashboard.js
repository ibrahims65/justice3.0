const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/police', checkRole(['Police']), async (req, res) => {
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

router.get('/prosecutor', checkRole(['Prosecutor']), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });

  const cases = await prisma.case.findMany({
    where: {
      actions: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      booking: {
        include: {
          person: true,
        },
      },
    },
  });

  const remandRequests = await prisma.remandRequest.findMany({
    where: { status: 'pending' },
    include: {
      booking: {
        include: {
          person: true,
          case: true,
        },
      },
    },
  });

  const upcomingHearings = await prisma.hearing.findMany({
    where: {
      case: {
        actions: {
          some: {
            userId: user.id,
          },
        },
      },
      hearingDate: {
        gte: new Date(),
      },
    },
  });

  const breadcrumbs = [
    { name: 'Dashboard', url: '/dashboard/prosecutor' }
  ];

  res.render('prosecutor/dashboard', {
    user,
    cases,
    remandRequests,
    upcomingHearings,
    page: '/dashboard/prosecutor',
    breadcrumbs
  });
});

router.get('/court', checkRole(['Court']), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });

  const hearings = await prisma.hearing.findMany({
    include: {
      case: true,
      court: true,
    },
  });

  const casesToAssign = await prisma.case.findMany({
    where: {
      status: 'Submitted to Court',
      hearings: {
        none: {},
      },
    },
  });

  const warrantsToApprove = await prisma.warrant.findMany({
    where: {
      status: 'Issued',
    },
  });

  const breadcrumbs = [
    { name: 'Dashboard', url: '/dashboard/court' }
  ];

  res.render('court/dashboard', {
    user,
    hearings,
    casesToAssign,
    warrantsToApprove,
    page: '/dashboard/court',
    breadcrumbs
  });
});

module.exports = router;
