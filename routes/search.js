const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { checkRole } = require('../middleware/auth');

router.get('/', checkRole(['Police']), async (req, res) => {
  const { query } = req.query;
  let people = [];
  let cases = [];
  let warrants = [];

  if (query) {
    people = await prisma.person.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    cases = await prisma.case.findMany({
      where: {
        OR: [
          { caseNumber: { contains: query, mode: 'insensitive' } },
          { crimeSceneDetails: { contains: query, mode: 'insensitive' } },
          { interrogationLogs: { contains: query, mode: 'insensitive' } },
          { preliminaryFindings: { contains: query, mode: 'insensitive' } },
        ],
      },
    });

    warrants = await prisma.warrant.findMany({
      where: {
        details: { contains: query, mode: 'insensitive' },
      },
    });
  }

  res.render('search/index', {
    query,
    people,
    cases,
    warrants,
    user: req.user,
    page: '/search',
  });
});

module.exports = router;
