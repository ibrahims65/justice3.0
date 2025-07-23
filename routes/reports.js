const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/', checkRole(['Admin', 'SuperAdmin']), async (req, res) => {
  res.render('reports/index');
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
