const express = require('express');
const router = express.Router();
const prisma = require('../../prisma/client');

router.get('/', async (req, res) => {
  const query = req.query.query;
  const results = await prisma.person.findMany({
    where: {
      name: { contains: query, mode: 'insensitive' }
    },
    take: 5
  });
  res.json({ results });
});

module.exports = router;
