// routes/api/search.routes.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
