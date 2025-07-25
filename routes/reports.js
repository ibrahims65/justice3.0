const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/', checkRole(['Admin', 'SuperAdmin']), async (req, res) => {
  const totalCases = await prisma.case.count();
  const totalConvictions = await prisma.case.count({ where: { status: 'Convicted' } });

  const cases = await prisma.case.findMany({
    where: { status: 'Convicted' },
    include: { booking: true, hearings: true },
  });

  const turnaroundTimes = cases
    .filter(c => c.hearings.some(h => h.verdict === 'Guilty'))
    .map(c => {
      const bookingDate = new Date(c.booking.bookingDate);
      const convictionDate = new Date(c.hearings.find(h => h.verdict === 'Guilty').hearingDate);
      return (convictionDate - bookingDate) / (1000 * 60 * 60 * 24);
    });

  const averageTurnaroundTime = turnaroundTimes.reduce((a, b) => a + b, 0) / turnaroundTimes.length || 0;

  const caseStatusCounts = await prisma.case.groupBy({
    by: ['status'],
    _count: {
      status: true,
    },
  });

  const convictionRate = totalCases > 0 ? (totalConvictions / totalCases) * 100 : 0;

  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    include: { role: true },
  });

  const releasedBookings = await prisma.booking.findMany({
    where: { releasedAt: { not: null } },
    include: { person: true },
  });

  const reoffenders = releasedBookings.filter(b => b.person.rebookedAt && new Date(b.person.rebookedAt) > new Date(b.releasedAt));
  const recidivismRate = releasedBookings.length > 0 ? (reoffenders.length / releasedBookings.length) * 100 : 0;

  res.render('reports/index', {
    user,
    page: '/reports',
    breadcrumbs: [{ name: 'Reports', url: '/reports' }],
    totalCases,
    totalConvictions,
    averageTurnaroundTime: averageTurnaroundTime.toFixed(2),
    caseStatusCounts: caseStatusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {}),
    convictionRate,
    recidivismRate,
  });
});

router.post('/case-volume', checkRole(['Admin', 'SuperAdmin']), async (req, res) => {
  const { startDate, endDate } = req.body;
  const caseVolume = await prisma.case.count({
    where: {
      booking: {
        bookingDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    },
  });
  res.json({ caseVolume });
});

router.post('/conviction-rates', checkRole(['Admin', 'SuperAdmin']), async (req, res) => {
  const { startDate, endDate } = req.body;
  const convictedCases = await prisma.case.count({
    where: {
      status: 'Convicted',
      hearings: {
        some: {
          hearingDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      },
    },
  });
  const totalCases = await prisma.case.count({
    where: {
      hearings: {
        some: {
          hearingDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      },
    },
  });
  const convictionRate = totalCases > 0 ? (convictedCases / totalCases) * 100 : 0;
  res.json({ convictionRate });
});

module.exports = router;
