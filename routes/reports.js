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
    include: { courtEvents: true, arrests: true },
  });

  const turnaroundTimes = cases
    .filter(c => c.courtEvents.some(h => h.outcome === 'Guilty'))
    .map(c => {
      const arrestDate = new Date(c.arrests[0].arrestedAt); // Assuming first arrest
      const convictionDate = new Date(c.courtEvents.find(h => h.outcome === 'Guilty').dateTime);
      return (convictionDate - arrestDate) / (1000 * 60 * 60 * 24);
    });

  const averageTurnaroundTime = turnaroundTimes.reduce((a, b) => a + b, 0) / turnaroundTimes.length || 0;

  const caseStatusCounts = await prisma.case.groupBy({
    by: ['status'],
    _count: {
      status: true,
    },
  });

  const convictionRate = totalCases > 0 ? (totalConvictions / totalCases) * 100 : 0;

  // Recidivism calculation is no longer possible with the new schema as `rebookedAt` is gone.
  const recidivismRate = 0;

  res.render('reports/index', {
    user: req.session.user,
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
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
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
      updatedAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
  });
  const totalCases = await prisma.case.count({
    where: {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
  });
  const convictionRate = totalCases > 0 ? (convictedCases / totalCases) * 100 : 0;
  res.json({ convictionRate });
});

module.exports = router;
