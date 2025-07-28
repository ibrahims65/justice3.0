const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { isAuthenticated } = require('../../middleware/auth');

router.get('/search', isAuthenticated, async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.json([]);
  }

  try {
    const people = await prisma.person.findMany({
      where: {
        name: {
          contains: q,
          mode: 'insensitive',
        },
      },
      take: 5,
    });

    const cases = await prisma.case.findMany({
      where: {
        caseNumber: {
          contains: q,
          mode: 'insensitive',
        },
      },
      take: 5,
    });

    const results = [
      ...people.map(p => ({ label: `Person: ${p.name}`, url: `/police/person/${p.id}` })),
      ...cases.map(c => ({ label: `Case: ${c.caseNumber}`, url: `/police/booking/${c.bookingId}` })),
    ];

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
