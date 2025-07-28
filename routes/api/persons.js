const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  const { q } = req.query;
  const persons = await prisma.person.findMany({
    where: {
      name: {
        contains: q,
        mode: 'insensitive',
      },
    },
  });
  res.json(persons);
});

module.exports = router;
